import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import {
  INITIAL_MALE_PLAYERS,
  INITIAL_FEMALE_PLAYERS,
  INITIAL_TOURNAMENTS,
  DEFAULT_API_CONFIG,
} from "@/modules/padel-ranking-tracker/initialData";

loadAllToolEnvs();

const TOOL_ID = "padel-ranking-tracker";

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
      process.env.PADEL_RANKING_TRACKER_DB_NAME || "padel-ranking-tracker"
    );

    let malePlayers = await db.collection("male_players").find({}).toArray();
    let femalePlayers = await db.collection("female_players").find({}).toArray();
    let tournaments = await db.collection("tournaments").find({}).toArray();
    let simulatedOutcomes = await db.collection("simulated_outcomes").find({}).toArray();
    let configDocs = await db.collection("config").find({}).toArray();

    // Auto-seed defaults if database collections are empty
    if (malePlayers.length === 0) {
      await replaceCollectionData(db, "male_players", INITIAL_MALE_PLAYERS);
      malePlayers = INITIAL_MALE_PLAYERS as any[];
    }

    if (femalePlayers.length === 0) {
      await replaceCollectionData(db, "female_players", INITIAL_FEMALE_PLAYERS);
      femalePlayers = INITIAL_FEMALE_PLAYERS as any[];
    }

    if (tournaments.length === 0) {
      await replaceCollectionData(db, "tournaments", INITIAL_TOURNAMENTS);
      tournaments = INITIAL_TOURNAMENTS as any[];
    }

    const cleanMale = malePlayers.map(({ _id, ...rest }: any) => rest);
    const cleanFemale = femalePlayers.map(({ _id, ...rest }: any) => rest);
    const cleanTournaments = tournaments.map(({ _id, ...rest }: any) => rest);
    const cleanSimulated = simulatedOutcomes.map(({ _id, ...rest }: any) => rest);
    const cleanConfig = configDocs.length > 0 ? configDocs[0] : DEFAULT_API_CONFIG;

    return NextResponse.json({
      malePlayers: cleanMale,
      femalePlayers: cleanFemale,
      tournaments: cleanTournaments,
      simulatedOutcomes: cleanSimulated,
      apiConfig: cleanConfig,
    });
  } catch (e) {
    console.error("GET padel-ranking-tracker error:", e);
    return NextResponse.json({
      malePlayers: INITIAL_MALE_PLAYERS,
      femalePlayers: INITIAL_FEMALE_PLAYERS,
      tournaments: INITIAL_TOURNAMENTS,
      simulatedOutcomes: [],
      apiConfig: DEFAULT_API_CONFIG,
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
      process.env.PADEL_RANKING_TRACKER_DB_NAME || "padel-ranking-tracker"
    );

    if (body.type === "full_sync") {
      if (Array.isArray(body.malePlayers)) {
        await replaceCollectionData(db, "male_players", body.malePlayers);
      }
      if (Array.isArray(body.femalePlayers)) {
        await replaceCollectionData(db, "female_players", body.femalePlayers);
      }
      if (Array.isArray(body.tournaments)) {
        await replaceCollectionData(db, "tournaments", body.tournaments);
      }
      if (Array.isArray(body.simulatedOutcomes)) {
        await replaceCollectionData(db, "simulated_outcomes", body.simulatedOutcomes);
      }
      if (body.apiConfig) {
        await replaceCollectionData(db, "config", [body.apiConfig]);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid sync action" }, { status: 400 });
  } catch (e) {
    console.error("POST padel-ranking-tracker error:", e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
