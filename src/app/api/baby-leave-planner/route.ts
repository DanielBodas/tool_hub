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

  // Fallback to a tool-specific cookie or dashboard cookie if unlocked via PIN
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-leave-planner")?.value === "true" ||
    cookieStore.get("auth_dashboard")?.value === "true";

  if (isUnlocked) {
    return cookieStore.get("planner_id")?.value || "default_family";
  }

  return null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.BABY_LEAVE_PLANNER_DB_NAME || "baby-leave-planner",
    );

    const settings = (await db.collection("settings").findOne({ id: userId })) || {};
    const eventsDocs = await db.collection("events").find({ userId }).toArray();

    const events = eventsDocs.map((doc: any) => ({
      date: doc.date,
      person: doc.person,
      type: doc.type,
    }));

    const mergedData = {
      ...settings,
      events: events.length > 0 ? events : (settings.events || []),
    };

    return NextResponse.json(mergedData);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
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
    const { events = [], ...settingsData } = body;

    const client = await clientPromise;
    const db = client.db(
      process.env.BABY_LEAVE_PLANNER_DB_NAME || "baby-leave-planner",
    );

    // Save settings (keeping events inside settings for backwards compatibility)
    await db
      .collection("settings")
      .updateOne(
        { id: userId },
        { $set: { ...settingsData, events, id: userId, updatedAt: new Date() } },
        { upsert: true },
      );

    // Save individual event records into dedicated 'events' collection
    await db.collection("events").deleteMany({ userId });

    if (Array.isArray(events) && events.length > 0) {
      const eventDocs = events.map((evt: { date: string; person: string; type: string }) => ({
        userId,
        date: evt.date,
        person: evt.person,
        type: evt.type,
        updatedAt: new Date(),
      }));
      await db.collection("events").insertMany(eventDocs);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
