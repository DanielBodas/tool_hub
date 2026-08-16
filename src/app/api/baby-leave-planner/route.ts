import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

const FAMILY_ID = "default_family";
const DEFAULT_DB_NAME = "baby-leave-planner";

/**
 * Returns the configured MongoDB database name from the environment variable,
 * falling back to the hardcoded default "baby-leave-planner" if missing or empty.
 */
function getDbName(): string {
  const envValue = process.env.BABY_LEAVE_PLANNER_DB_NAME;
  if (envValue && envValue.trim() !== "") {
    return envValue.trim();
  }
  return DEFAULT_DB_NAME;
}

interface DBEvent {
  _id?: unknown;
  userId?: string;
  date: string;
  person: string;
  type: string;
  updatedAt?: Date;
}

async function isAuthorized(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session) {
    const isAllowed = isUserAllowedForTool(
      "baby-leave-planner",
      session.user?.email,
      session.user?.role,
    );
    if (isAllowed) return true;
  }

  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-leave-planner")?.value === "true" ||
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
    const db = client.db(getDbName());

    // 1. Fetch all events from the dedicated 'events' collection
    const eventsDocs = (await db
      .collection("events")
      .find({})
      .toArray()) as unknown as DBEvent[];

    const events = eventsDocs.map((doc) => ({
      date: doc.date,
      person: doc.person,
      type: doc.type,
    }));

    // 2. Fetch settings (look for document with configured balances or birthDate, or id: "admin@example.com", or default_family)
    let settingsDoc = await db.collection("settings").findOne({
      $or: [
        { balances: { $exists: true, $not: { $size: 0 } } },
        { allowances: { $exists: true, $not: { $size: 0 } } },
        { id: "admin@example.com" },
        { id: FAMILY_ID },
      ],
    });

    if (!settingsDoc) {
      settingsDoc = await db.collection("settings").findOne({}, { sort: { updatedAt: -1 } });
    }

    // Map holidays array to festivos format if holidays exists
    let festivos = Array.isArray(settingsDoc?.festivos) && settingsDoc.festivos.length > 0
      ? settingsDoc.festivos
      : [];

    if (festivos.length === 0 && Array.isArray(settingsDoc?.holidays) && settingsDoc.holidays.length > 0) {
      festivos = settingsDoc.holidays.map((h: string | { date: string; nombre?: string }) =>
        typeof h === "string" ? { date: h, nombre: "Festivo" } : { date: h.date, nombre: h.nombre || "Festivo" }
      );
    }

    // Map allowances to balances if balances is missing/empty
    let balances = Array.isArray(settingsDoc?.balances) && settingsDoc.balances.length > 0
      ? settingsDoc.balances
      : [];

    if (balances.length === 0 && Array.isArray(settingsDoc?.allowances) && settingsDoc.allowances.length > 0) {
      balances = settingsDoc.allowances.map((a: { parent?: string; name?: string; totalDays?: number | string; consumptionMode?: string }) => ({
        person: a.parent === "mother" ? "Madre" : "Padre",
        type: a.name || "Permiso",
        total: Number(a.totalDays) || 0,
        frecuencia: a.consumptionMode === "weeks" ? "Semanal" : "Diario",
      }));
    }

    // If events collection was empty but settings had legacy events, fallback gracefully
    const finalEvents =
      events.length > 0
        ? events
        : Array.isArray(settingsDoc?.events)
        ? settingsDoc.events
        : [];

    return NextResponse.json({
      birthDate: settingsDoc?.birthDate || null,
      balances: balances,
      festivos: festivos,
      events: finalEvents,
    });
  } catch (e) {
    console.error("GET baby-leave-planner error:", e);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.email || "admin@example.com";

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(getDbName());

    // 1. Save general settings (birthDate, balances, festivos)
    const { birthDate, balances, festivos, events } = body;

    // Update all matching settings documents or upsert
    await db.collection("settings").updateMany(
      {},
      {
        $set: {
          birthDate: birthDate || null,
          balances: balances || [],
          festivos: festivos || [],
          updatedAt: new Date(),
        },
      },
    );

    // Also ensure default_family exists
    await db.collection("settings").updateOne(
      { id: FAMILY_ID },
      {
        $set: {
          id: FAMILY_ID,
          birthDate: birthDate || null,
          balances: balances || [],
          festivos: festivos || [],
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    // 2. Sync events in the 'events' collection
    if (Array.isArray(events)) {
      await db.collection("events").deleteMany({});

      if (events.length > 0) {
        const eventDocs = events.map((e: { date: string; person: string; type: string }) => ({
          userId: currentUserId,
          date: e.date,
          person: e.person,
          type: e.type,
          updatedAt: new Date(),
        }));

        await db.collection("events").insertMany(eventDocs);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST baby-leave-planner error:", e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
