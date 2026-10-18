import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import { DEFAULT_API_CONFIG } from "@/modules/padel-ranking-tracker/initialData";

loadAllToolEnvs();

const TOOL_ID = "padel-ranking-tracker";

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

    // Retrieve saved API credentials (padelapi.org) and simulations
    const configDocs = await db.collection("config").find({}).toArray();
    const simDocs = await db.collection("simulated_outcomes").find({}).toArray();

    let apiConfig = configDocs.length > 0 ? configDocs[0] : DEFAULT_API_CONFIG;
    if (apiConfig._id) delete apiConfig._id;

    if (!apiConfig.apiUrl) {
      apiConfig.apiUrl = process.env.PADEL_API_URL || "https://padelapi.org/api";
    }
    if (!apiConfig.apiKey && process.env.PADEL_API_KEY) {
      apiConfig.apiKey = process.env.PADEL_API_KEY;
    }

    const cleanSimulated = simDocs.map(({ _id, ...rest }: any) => rest);

    let malePlayers: any[] = [];
    let femalePlayers: any[] = [];
    let tournaments: any[] = [];

    // Proxy request to PadelAPI.org when API Key / Bearer token is provided
    if (apiConfig.apiUrl && apiConfig.apiKey) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiConfig.apiKey}`,
        };

        const baseUrl = apiConfig.apiUrl.replace(/\/$/, "");

        const [rankingsRes, tournamentsRes] = await Promise.allSettled([
          fetch(`${baseUrl}/rankings`, { headers, cache: "no-store" }),
          fetch(`${baseUrl}/tournaments`, { headers, cache: "no-store" }),
        ]);

        if (rankingsRes.status === "fulfilled" && rankingsRes.value.ok) {
          const rankingsData = await rankingsRes.value.json();
          malePlayers = rankingsData.malePlayers || rankingsData.male || [];
          femalePlayers = rankingsData.femalePlayers || rankingsData.female || [];
        }

        if (tournamentsRes.status === "fulfilled" && tournamentsRes.value.ok) {
          const tournData = await tournamentsRes.value.json();
          tournaments = Array.isArray(tournData) ? tournData : tournData.tournaments || [];
        }

        // Save historical query log snapshot for data traceability
        await db.collection("snapshots").insertOne({
          queriedAt: new Date().toISOString(),
          source: baseUrl,
          seasonYear: apiConfig.seasonConfig?.seasonYear || 2026,
          maleCount: malePlayers.length,
          femaleCount: femalePlayers.length,
          tournamentCount: tournaments.length,
        });
      } catch (err) {
        console.warn("PadelAPI.org fetch warning:", err);
      }
    }

    return NextResponse.json({
      malePlayers,
      femalePlayers,
      tournaments,
      simulatedOutcomes: cleanSimulated,
      apiConfig,
    });
  } catch (e) {
    console.error("GET padel-ranking-tracker error:", e);
    return NextResponse.json({
      malePlayers: [],
      femalePlayers: [],
      tournaments: [],
      simulatedOutcomes: [],
      apiConfig: DEFAULT_API_CONFIG,
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

    if (body.apiConfig) {
      await db.collection("config").deleteMany({});
      const cleanConfig = { ...body.apiConfig };
      delete cleanConfig._id;
      await db.collection("config").insertOne(cleanConfig);
    }

    if (Array.isArray(body.simulatedOutcomes)) {
      await db.collection("simulated_outcomes").deleteMany({});
      if (body.simulatedOutcomes.length > 0) {
        await db.collection("simulated_outcomes").insertMany(body.simulatedOutcomes);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST padel-ranking-tracker error:", e);
    return NextResponse.json({ error: "Failed to save API credentials" }, { status: 500 });
  }
}
