import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";

loadAllToolEnvs();

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }

  // Fallback to tool-specific cookie or dashboard cookie if unlocked via PIN
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_storage-organizer")?.value === "true" ||
    cookieStore.get("auth_dashboard")?.value === "true";

  if (isUnlocked) {
    return cookieStore.get("storage_organizer_id")?.value || "default_trastero";
  }

  return null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try connecting to MongoDB. If it fails, let the client know so they can fall back to local storage
    let client;
    try {
      client = await clientPromise;
    } catch (err) {
      console.warn("MongoDB connection failed, indicating offline mode.", err);
      return NextResponse.json({
        offline: true,
        message: "MongoDB offline. Using browser storage.",
        data: null
      });
    }

    const db = client.db(
      process.env.STORAGE_ORGANIZER_DB_NAME || "storage-organizer"
    );

    const data = await db.collection("trastero-data").findOne({ id: userId });

    return NextResponse.json(data || { id: userId, shelves: [], items: [] });
  } catch (e) {
    console.error("GET API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch data", details: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    let client;
    try {
      client = await clientPromise;
    } catch (err) {
      console.warn("MongoDB connection failed on POST. Data not saved to database.", err);
      return NextResponse.json({
        offline: true,
        message: "MongoDB offline. Saved locally only."
      }, { status: 503 });
    }

    const db = client.db(
      process.env.STORAGE_ORGANIZER_DB_NAME || "storage-organizer"
    );

    // Save/Upsert trastero data
    await db
      .collection("trastero-data")
      .updateOne(
        { id: userId },
        { $set: { ...body, id: userId, updatedAt: new Date() } },
        { upsert: true }
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST API error:", e);
    return NextResponse.json(
      { error: "Failed to save data", details: String(e) },
      { status: 500 }
    );
  }
}
