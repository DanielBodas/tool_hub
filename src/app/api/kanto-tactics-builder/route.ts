import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

const TOOL_ID = "kanto-tactics-builder";

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
      process.env.KANTO_TACTICS_DB_NAME || "kanto-tactics-builder"
    );

    let savedTeams = await db.collection("teams").find({}).toArray();

    // Sanitize MongoDB `_id` objects for JSON serialization
    const cleanTeams = savedTeams.map((doc: any) => {
      const { _id, ...rest } = doc;
      return rest;
    });

    return NextResponse.json({
      teams: cleanTeams,
    });
  } catch (e) {
    console.error("GET kanto-tactics-builder error:", e);
    return NextResponse.json({
      teams: [],
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
      process.env.KANTO_TACTICS_DB_NAME || "kanto-tactics-builder"
    );

    const { type, payload } = body;

    if (type === "teams" && Array.isArray(payload)) {
      await replaceCollectionData(db, "teams", payload);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (e) {
    console.error("POST kanto-tactics-builder error:", e);
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
    const teamId = searchParams.get("id");

    if (!teamId) {
      return NextResponse.json({ error: "Missing team ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.KANTO_TACTICS_DB_NAME || "kanto-tactics-builder"
    );

    await db.collection("teams").deleteOne({ id: teamId });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE kanto-tactics-builder error:", e);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
