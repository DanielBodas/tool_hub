/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const balancesDocs = await db.collection("balances").find({ userId }).toArray();
    const festivosDocs = await db.collection("festivos").find({ userId }).toArray();

    const events = eventsDocs.map((doc: any) => ({
      date: doc.date,
      person: doc.person,
      type: doc.type,
    }));

    const balances = balancesDocs.map((doc: any) => ({
      person: doc.person,
      type: doc.type,
      total: doc.total,
      frecuencia: doc.frecuencia,
    }));

    const festivos = festivosDocs.map((doc: any) => ({
      date: doc.date,
      nombre: doc.nombre,
    }));

    const mergedData = {
      ...settings,
      events: events.length > 0 ? events : (settings.events || []),
      balances: balances.length > 0 ? balances : (settings.balances || []),
      festivos: festivos.length > 0 ? festivos : (settings.festivos || []),
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
    const { events = [], balances = [], festivos = [], ...settingsData } = body;

    const client = await clientPromise;
    const db = client.db(
      process.env.BABY_LEAVE_PLANNER_DB_NAME || "baby-leave-planner",
    );

    // Save general settings
    await db
      .collection("settings")
      .updateOne(
        { id: userId },
        { $set: { ...settingsData, events, balances, festivos, id: userId, updatedAt: new Date() } },
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

    // Save permit balance configs into dedicated 'balances' collection
    await db.collection("balances").deleteMany({ userId });
    if (Array.isArray(balances) && balances.length > 0) {
      const balanceDocs = balances.map((bal: { person: string; type: string; total: number; frecuencia: string }) => ({
        userId,
        person: bal.person,
        type: bal.type,
        total: bal.total,
        frecuencia: bal.frecuencia,
        updatedAt: new Date(),
      }));
      await db.collection("balances").insertMany(balanceDocs);
    }

    // Save holiday configs into dedicated 'festivos' collection
    await db.collection("festivos").deleteMany({ userId });
    if (Array.isArray(festivos) && festivos.length > 0) {
      const festivoDocs = festivos.map((f: { date: string; nombre: string }) => ({
        userId,
        date: f.date,
        nombre: f.nombre,
        updatedAt: new Date(),
      }));
      await db.collection("festivos").insertMany(festivoDocs);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
