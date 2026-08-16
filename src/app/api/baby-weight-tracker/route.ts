import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import crypto from "crypto";

loadAllToolEnvs();

const BABY_ID = "default_baby";

interface DBWeightRecord {
  _id: string;
  userId: string;
  date: string;
  time: string;
  weight: number;      // Recorded raw weight (high of candle) in kg
  margin: number;      // Clothing margin in kg
  blanket: string;     // Blanket name
  blanketMargin: number; // Blanket margin in kg
  scale: string;
  clothes: string;
  notes: string;
  updatedAt: Date;
}

const DEFAULT_SITES = [
  "Báscula Casa (Bebé)",
  "Báscula Farmacia",
  "Consulta Pediatra",
  "Báscula Cocina"
];

const DEFAULT_CLOTHING = [
  { name: "Sin ropa", margin: 0.0, label: "Sin ropa (Desnudo)" },
  { name: "Pañal limpio", margin: 0.025, label: "Pañal limpio (+25g)" },
  { name: "Ropa ligera", margin: 0.100, label: "Ropa ligera (+100g)" },
  { name: "Ropa de abrigo", margin: 0.250, label: "Ropa de abrigo (+250g)" }
];

const DEFAULT_BLANKETS = [
  { name: "Ninguna", margin: 0.0, label: "Ninguna (0g)" },
  { name: "Toalla fina", margin: 0.100, label: "Toalla fina (+100g)" },
  { name: "Manta algodón", margin: 0.200, label: "Manta algodón (+200g)" }
];

async function isAuthorized(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session) {
    const isAllowed = isUserAllowedForTool(
      "baby-weight-tracker",
      session.user?.email,
      session.user?.role,
    );
    if (isAllowed) return true;
  }

  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-weight-tracker")?.value === "true" ||
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
      process.env.BABY_WEIGHT_TRACKER_DB_NAME || "baby-weight-tracker",
    );

    // Fetch common weight records (match default_baby or any legacy record)
    const weightsData = (await db
      .collection("weights")
      .find({})
      .toArray()) as unknown as DBWeightRecord[];

    // Fetch custom settings
    let settingsDoc = await db
      .collection("settings")
      .findOne({ userId: BABY_ID });

    if (!settingsDoc) {
      settingsDoc = await db.collection("settings").findOne({});
    }

    const sorted = weightsData.sort((a, b) => {
      const dateA = `${a.date}T${a.time || "00:00"}`;
      const dateB = `${b.date}T${b.time || "00:00"}`;
      return dateA.localeCompare(dateB);
    });

    const responseData = {
      weights: sorted,
      settings: settingsDoc || {
        userId: BABY_ID,
        sites: DEFAULT_SITES,
        clothing: DEFAULT_CLOTHING,
        blankets: DEFAULT_BLANKETS
      }
    };

    return NextResponse.json(responseData);
  } catch (e) {
    console.error("GET baby-weight-tracker error:", e);
    return NextResponse.json(
      { error: "Failed to fetch weight data" },
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

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(
      process.env.BABY_WEIGHT_TRACKER_DB_NAME || "baby-weight-tracker",
    );

    // Check if we are saving configurations
    if (body.type === "settings") {
      const cleanSettings = {
        userId: BABY_ID,
        sites: body.sites || DEFAULT_SITES,
        clothing: body.clothing || DEFAULT_CLOTHING,
        blankets: body.blankets || DEFAULT_BLANKETS,
        updatedAt: new Date()
      };

      await db
        .collection("settings")
        .updateOne(
          { userId: BABY_ID },
          { $set: cleanSettings },
          { upsert: true }
        );

      return NextResponse.json({ success: true, settings: cleanSettings });
    }

    // Otherwise, save a weight record
    const recordId = body.id || crypto.randomUUID();

    const weightRecord = {
      _id: recordId,
      userId: BABY_ID,
      date: body.date,
      time: body.time || "12:00",
      weight: parseFloat(body.weight),
      margin: parseFloat(body.margin || "0"),
      blanket: body.blanket || "Ninguna",
      blanketMargin: parseFloat(body.blanketMargin || "0"),
      scale: body.scale || "Principal",
      clothes: body.clothes || "Sin ropa",
      notes: body.notes || "",
      updatedAt: new Date(),
    };

    await db
      .collection("weights")
      .updateOne(
        { _id: recordId },
        { $set: weightRecord },
        { upsert: true },
      );

    return NextResponse.json({ success: true, record: { ...weightRecord, id: recordId } });
  } catch (e) {
    console.error("POST baby-weight-tracker error:", e);
    return NextResponse.json({ error: "Failed to save weight data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read ID from URL query parameters first, then try body
    const { searchParams } = new URL(request.url);
    let recordId = searchParams.get("id");

    if (!recordId) {
      try {
        const body = await request.json();
        recordId = body.id;
      } catch {
        // Body might be empty
      }
    }

    if (!recordId) {
      return NextResponse.json({ error: "Missing weight record ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.BABY_WEIGHT_TRACKER_DB_NAME || "baby-weight-tracker",
    );

    const result = await db
      .collection("weights")
      .deleteOne({ _id: recordId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE baby-weight-tracker error:", e);
    return NextResponse.json({ error: "Failed to delete weight data" }, { status: 500 });
  }
}
