import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import crypto from "crypto";

loadAllToolEnvs();

interface DBWeightRecord {
  _id: string;
  userId: string;
  date: string;
  time: string;
  weight: number;
  margin: number;
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

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }

  // Fallback to a tool-specific cookie or dashboard cookie if unlocked via PIN
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_baby-weight-tracker")?.value === "true" ||
    cookieStore.get("auth_dashboard")?.value === "true";

  if (isUnlocked) {
    return cookieStore.get("weight_tracker_id")?.value || "default_baby";
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
      process.env.BABY_WEIGHT_TRACKER_DB_NAME || "baby-weight-tracker",
    );

    // Fetch weight records
    const weightsData = (await db
      .collection("weights")
      .find({ userId })
      .toArray()) as unknown as DBWeightRecord[];

    // Fetch custom settings
    const settingsDoc = await db
      .collection("settings")
      .findOne({ userId });

    const sorted = weightsData.sort((a, b) => {
      const dateA = `${a.date}T${a.time || "00:00"}`;
      const dateB = `${b.date}T${b.time || "00:00"}`;
      return dateA.localeCompare(dateB);
    });

    const responseData = {
      weights: sorted,
      settings: settingsDoc || {
        userId,
        sites: DEFAULT_SITES,
        clothing: DEFAULT_CLOTHING
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
    const userId = await getUserId();
    if (!userId) {
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
        userId,
        sites: body.sites || DEFAULT_SITES,
        clothing: body.clothing || DEFAULT_CLOTHING,
        updatedAt: new Date()
      };

      await db
        .collection("settings")
        .updateOne(
          { userId },
          { $set: cleanSettings },
          { upsert: true }
        );

      return NextResponse.json({ success: true, settings: cleanSettings });
    }

    // Otherwise, save a weight record
    const recordId = body.id || crypto.randomUUID();

    const weightRecord = {
      _id: recordId, // Use this as the unique document ID
      userId,
      date: body.date,
      time: body.time || "12:00",
      weight: parseFloat(body.weight),
      margin: parseFloat(body.margin || "0"),
      scale: body.scale || "Principal",
      clothes: body.clothes || "Sin ropa",
      notes: body.notes || "",
      updatedAt: new Date(),
    };

    await db
      .collection("weights")
      .updateOne(
        { _id: recordId, userId },
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
    const userId = await getUserId();
    if (!userId) {
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
      .deleteOne({ _id: recordId, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE baby-weight-tracker error:", e);
    return NextResponse.json({ error: "Failed to delete weight data" }, { status: 500 });
  }
}
