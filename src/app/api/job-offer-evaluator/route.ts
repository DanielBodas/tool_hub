import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import {
  DEFAULT_OFFERS,
  DEFAULT_CONCEPTS,
  DEFAULT_GROUPS,
} from "@/modules/job-offer-evaluator/initialData";

loadAllToolEnvs();

const TOOL_ID = "job-offer-evaluator";

async function replaceCollectionData(db: any, collectionName: string, items: any[]) {
  try {
    const col = db.collection(collectionName);
    if (typeof col.deleteMany === "function") {
      await col.deleteMany({});
    } else if (typeof col.deleteOne === "function") {
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
          const idKey = item._id || item.id || crypto.randomUUID();
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
      process.env.JOB_OFFER_EVALUATOR_DB_NAME || "job-offer-evaluator"
    );

    let offers = await db.collection("offers").find({}).toArray();
    let concepts = await db.collection("concepts").find({}).toArray();
    let groups = await db.collection("groups").find({}).toArray();

    // Auto-seed defaults if database collections are empty
    if (offers.length === 0) {
      await replaceCollectionData(db, "offers", DEFAULT_OFFERS);
      offers = DEFAULT_OFFERS as any[];
    }

    if (concepts.length === 0) {
      await replaceCollectionData(db, "concepts", DEFAULT_CONCEPTS);
      concepts = DEFAULT_CONCEPTS as any[];
    }

    if (groups.length === 0) {
      await replaceCollectionData(db, "groups", DEFAULT_GROUPS);
      groups = DEFAULT_GROUPS as any[];
    }

    // Sanitize MongoDB `_id` objects for JSON serialization
    const cleanOffers = offers.map((doc: any) => {
      const { _id, ...rest } = doc;
      return rest;
    });
    const cleanConcepts = concepts.map((doc: any) => {
      const { _id, ...rest } = doc;
      return rest;
    });
    const cleanGroups = groups.map((doc: any) => {
      const { _id, ...rest } = doc;
      return rest;
    });

    return NextResponse.json({
      offers: cleanOffers,
      concepts: cleanConcepts,
      groups: cleanGroups,
    });
  } catch (e) {
    console.error("GET job-offer-evaluator error:", e);
    // Return fallback defaults on database error
    return NextResponse.json({
      offers: DEFAULT_OFFERS,
      concepts: DEFAULT_CONCEPTS,
      groups: DEFAULT_GROUPS,
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
      process.env.JOB_OFFER_EVALUATOR_DB_NAME || "job-offer-evaluator"
    );

    const { type, payload } = body;

    if (type === "offers" && Array.isArray(payload)) {
      await replaceCollectionData(db, "offers", payload);
      return NextResponse.json({ success: true });
    }

    if (type === "concepts" && Array.isArray(payload)) {
      await replaceCollectionData(db, "concepts", payload);
      return NextResponse.json({ success: true });
    }

    if (type === "groups" && Array.isArray(payload)) {
      await replaceCollectionData(db, "groups", payload);
      return NextResponse.json({ success: true });
    }

    if (type === "full_sync") {
      if (Array.isArray(body.offers)) {
        await replaceCollectionData(db, "offers", body.offers);
      }
      if (Array.isArray(body.concepts)) {
        await replaceCollectionData(db, "concepts", body.concepts);
      }
      if (Array.isArray(body.groups)) {
        await replaceCollectionData(db, "groups", body.groups);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (e) {
    console.error("POST job-offer-evaluator error:", e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get("id");

    if (!offerId) {
      return NextResponse.json({ error: "Missing offer ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.JOB_OFFER_EVALUATOR_DB_NAME || "job-offer-evaluator"
    );

    await db.collection("offers").deleteOne({ id: offerId });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE job-offer-evaluator error:", e);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
