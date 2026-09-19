import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import {
  INITIAL_SUPERMARKETS,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_PRICE_RECORDS,
} from "@/modules/supermarket-price-tracker/initialData";

loadAllToolEnvs();

const TOOL_ID = "supermarket-price-tracker";

async function replaceCollectionData(db: unknown, collectionName: string, items: unknown[]) {
  try {
    const mongoDb = db as { collection: (name: string) => unknown };
    const col = mongoDb.collection(collectionName) as {
      deleteMany?: (filter: object) => Promise<unknown>;
      deleteOne?: (filter: object) => Promise<unknown>;
      find?: (filter: object) => { toArray: () => Promise<Array<{ _id?: unknown; id?: unknown }>> };
      insertMany?: (docs: unknown[]) => Promise<unknown>;
      updateOne?: (filter: object, update: object, options: object) => Promise<unknown>;
    };

    if (typeof col.deleteMany === "function") {
      await col.deleteMany({});
    } else if (typeof col.deleteOne === "function" && typeof col.find === "function") {
      const existing = await col.find({}).toArray();
      for (const doc of existing) {
        if (doc._id) await col.deleteOne({ _id: doc._id });
        else if (doc.id) await col.deleteOne({ id: doc.id });
      }
    }

    if (items && items.length > 0) {
      if (typeof col.insertMany === "function") {
        await col.insertMany(items);
      } else if (typeof col.updateOne === "function") {
        for (const item of items) {
          const docItem = item as { _id?: unknown; id?: unknown };
          const idKey = docItem._id || docItem.id || crypto.randomUUID();
          await col.updateOne({ id: idKey }, { $set: item }, { upsert: true });
        }
      }
    }
  } catch (err) {
    console.warn(`replaceCollectionData warning for ${collectionName}:`, err);
  }
}

async function isAuthorized(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session) {
    const isAllowed = isUserAllowedForTool(
      TOOL_ID,
      session.user?.email,
      session.user?.role
    );
    if (isAllowed) return true;
  }

  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get(`auth_tool_${TOOL_ID}`)?.value === "true" ||
    cookieStore.get("auth_dashboard")?.value === "true";

  return isUnlocked;
}

export async function GET() {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.SUPERMARKET_PRICE_TRACKER_DB_NAME || "supermarket-price-tracker"
    );

    let supermarkets = await db.collection("supermarkets").find({}).toArray();
    let brands = await db.collection("brands").find({}).toArray();
    let products = await db.collection("products").find({}).toArray();
    let priceRecords = await db.collection("price_records").find({}).toArray();

    // Auto-seed defaults if database collections are empty
    if (supermarkets.length === 0) {
      await replaceCollectionData(db, "supermarkets", INITIAL_SUPERMARKETS);
      supermarkets = INITIAL_SUPERMARKETS as typeof supermarkets;
    }

    if (brands.length === 0) {
      await replaceCollectionData(db, "brands", INITIAL_BRANDS);
      brands = INITIAL_BRANDS as typeof brands;
    }

    if (products.length === 0) {
      await replaceCollectionData(db, "products", INITIAL_PRODUCTS);
      products = INITIAL_PRODUCTS as typeof products;
    }

    if (priceRecords.length === 0) {
      await replaceCollectionData(db, "price_records", INITIAL_PRICE_RECORDS);
      priceRecords = INITIAL_PRICE_RECORDS as typeof priceRecords;
    }

    // Sanitize MongoDB `_id` objects
    const cleanSupermarkets = supermarkets.map((doc: Record<string, unknown>) => {
      const clean = { ...doc };
      delete clean._id;
      return clean;
    });
    const cleanBrands = brands.map((doc: Record<string, unknown>) => {
      const clean = { ...doc };
      delete clean._id;
      return clean;
    });
    const cleanProducts = products.map((doc: Record<string, unknown>) => {
      const clean = { ...doc };
      delete clean._id;
      return clean;
    });
    const cleanRecords = priceRecords.map((doc: Record<string, unknown>) => {
      const clean = { ...doc };
      delete clean._id;
      return clean;
    });

    return NextResponse.json({
      supermarkets: cleanSupermarkets,
      brands: cleanBrands,
      products: cleanProducts,
      priceRecords: cleanRecords,
    });
  } catch (e) {
    console.error("GET supermarket-price-tracker error:", e);
    return NextResponse.json({
      supermarkets: INITIAL_SUPERMARKETS,
      brands: INITIAL_BRANDS,
      products: INITIAL_PRODUCTS,
      priceRecords: INITIAL_PRICE_RECORDS,
      isFallback: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(
      process.env.SUPERMARKET_PRICE_TRACKER_DB_NAME || "supermarket-price-tracker"
    );

    const { type } = body;

    if (type === "full_sync") {
      if (Array.isArray(body.supermarkets)) {
        await replaceCollectionData(db, "supermarkets", body.supermarkets);
      }
      if (Array.isArray(body.brands)) {
        await replaceCollectionData(db, "brands", body.brands);
      }
      if (Array.isArray(body.products)) {
        await replaceCollectionData(db, "products", body.products);
      }
      if (Array.isArray(body.priceRecords)) {
        await replaceCollectionData(db, "price_records", body.priceRecords);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (e) {
    console.error("POST supermarket-price-tracker error:", e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
