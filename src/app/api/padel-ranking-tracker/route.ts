import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import {
  DEFAULT_API_CONFIG,
} from "@/modules/padel-ranking-tracker/initialData";

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

/**
 * Flexible JSON Normalizer to accept various Padel API response formats.
 */
function normalizeApiPayload(rawRankings: any, rawTournaments: any) {
  let malePlayers: any[] = [];
  let femalePlayers: any[] = [];
  let tournaments: any[] = [];

  if (rawRankings) {
    if (Array.isArray(rawRankings)) {
      malePlayers = rawRankings.filter((p: any) => p.gender === "male" || p.circuit === "male" || !p.gender);
      femalePlayers = rawRankings.filter((p: any) => p.gender === "female" || p.circuit === "female");
    } else if (typeof rawRankings === "object") {
      const list = rawRankings.malePlayers || rawRankings.male || rawRankings.rankings?.male || rawRankings.data || rawRankings.players || [];
      const femaleList = rawRankings.femalePlayers || rawRankings.female || rawRankings.rankings?.female || [];

      if (Array.isArray(list)) malePlayers = list;
      if (Array.isArray(femaleList)) femalePlayers = femaleList;
    }
  }

  if (rawTournaments) {
    if (Array.isArray(rawTournaments)) {
      tournaments = rawTournaments;
    } else if (typeof rawTournaments === "object") {
      tournaments = rawTournaments.tournaments || rawTournaments.data || rawTournaments.calendar || [];
    }
  }

  return { malePlayers, femalePlayers, tournaments };
}

export async function GET() {
  try {

    const client = await clientPromise;
    const db = client.db(
      process.env.PADEL_RANKING_TRACKER_DB_NAME || "padel-ranking-tracker"
    );

    const configDocs = await db.collection("config").find({}).toArray();
    const simDocs = await db.collection("simulated_outcomes").find({}).toArray();
    const customDocs = await db.collection("custom_data").find({}).toArray();

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
    let lastDiagnostic: any = null;

    // Check if custom / demo data was manually saved in DB
    if (customDocs.length > 0) {
      const custom = customDocs[0];
      if (Array.isArray(custom.malePlayers) && custom.malePlayers.length > 0) {
        malePlayers = custom.malePlayers;
      }
      if (Array.isArray(custom.femalePlayers) && custom.femalePlayers.length > 0) {
        femalePlayers = custom.femalePlayers;
      }
      if (Array.isArray(custom.tournaments) && custom.tournaments.length > 0) {
        tournaments = custom.tournaments;
      }
    }

    // Proxy request to PadelAPI.org when credentials are provided
    if (apiConfig.apiUrl && apiConfig.apiKey && malePlayers.length === 0 && femalePlayers.length === 0) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiConfig.apiKey.trim()}`,
        };

        const baseUrl = apiConfig.apiUrl.replace(/\/$/, "");

        const [rankingsRes, tournamentsRes] = await Promise.allSettled([
          fetch(`${baseUrl}/rankings`, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) }),
          fetch(`${baseUrl}/tournaments`, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) }),
        ]);

        let rawRankingsData = null;
        let rawTournamentsData = null;
        let httpStatus = rankingsRes.status === "fulfilled" ? rankingsRes.value.status : 502;

        if (rankingsRes.status === "fulfilled") {
          if (rankingsRes.value.ok) {
            rawRankingsData = await rankingsRes.value.json();
          }
        }

        if (tournamentsRes.status === "fulfilled" && tournamentsRes.value.ok) {
          rawTournamentsData = await tournamentsRes.value.json();
        }

        const normalized = normalizeApiPayload(rawRankingsData, rawTournamentsData);
        malePlayers = normalized.malePlayers;
        femalePlayers = normalized.femalePlayers;
        tournaments = normalized.tournaments;

        lastDiagnostic = {
          success: rankingsRes.status === "fulfilled" && rankingsRes.value.ok,
          httpStatus,
          message: rankingsRes.status === "fulfilled" && rankingsRes.value.ok ? "Conexión exitosa con PadelAPI.org" : `No se pudo consultar el ranking (HTTP ${httpStatus})`,
        };
      } catch (err: any) {
        console.warn("PadelAPI.org fetch error:", err);
        lastDiagnostic = {
          success: false,
          httpStatus: 500,
          message: err.message || "Error al conectar con la API de Pádel",
        };
      }
    }

    // No token or failed API: keep the module usable with empty data. Never label demo data as official.
    if (!apiConfig.apiKey) {
      lastDiagnostic = {
        success: false,
        httpStatus: 0,
        message: "API pendiente de configuración. Puedes consultar la fuente oficial de Premier Padel y volver cuando tengas el token.",
      };
    }

    return NextResponse.json({
      malePlayers,
      femalePlayers,
      tournaments,
      simulatedOutcomes: cleanSimulated,
      apiConfig: { ...apiConfig, apiKey: "" },
      hasApiKey: Boolean(apiConfig.apiKey),
      lastDiagnostic,
    });
  } catch (e) {
    console.error("GET padel-ranking-tracker error:", e);
    return NextResponse.json({
      malePlayers: [],
      femalePlayers: [],
      tournaments: [],
      simulatedOutcomes: [],
      apiConfig: { ...DEFAULT_API_CONFIG, apiKey: "" },
      hasApiKey: Boolean(process.env.PADEL_API_KEY),
      lastDiagnostic: { success: false, httpStatus: 500, message: "No se ha podido cargar la conexión. La herramienta sigue disponible." },
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

    // ACTION 1: Test API Connection Diagnostic
    if (body.type === "test_connection") {
      const apiUrl = (body.apiUrl || process.env.PADEL_API_URL || "https://padelapi.org/api").replace(/\/$/, "");
      const savedConfig = await db.collection("config").findOne({});
      const apiKey = (body.apiKey || process.env.PADEL_API_KEY || savedConfig?.apiKey || "").trim();

      if (!apiKey) {
        return NextResponse.json({
          success: false,
          httpStatus: 400,
          message: "Falta introducir el Token Bearer de la API",
          maleCount: 0,
          femaleCount: 0,
          tournamentCount: 0,
        });
      }

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };

        const rankingsUrl = `${apiUrl}/rankings`;
        const tournamentsUrl = `${apiUrl}/tournaments`;

        const [rankingsRes, tournamentsRes] = await Promise.allSettled([
          fetch(rankingsUrl, { headers, cache: "no-store" }),
          fetch(tournamentsUrl, { headers, cache: "no-store" }),
        ]);

        let httpStatus = 200;
        let errorMessage = "";
        let rawRankings = null;
        let rawTournaments = null;

        if (rankingsRes.status === "fulfilled") {
          httpStatus = rankingsRes.value.status;
          if (rankingsRes.value.ok) {
            rawRankings = await rankingsRes.value.json();
          } else {
            errorMessage = `Error HTTP ${rankingsRes.value.status} en ${rankingsUrl}: ${rankingsRes.value.statusText}`;
          }
        } else {
          errorMessage = `Error de conexión red/CORS a ${rankingsUrl}: ${rankingsRes.reason?.message || "Fallo de red"}`;
        }

        if (tournamentsRes.status === "fulfilled" && tournamentsRes.value.ok) {
          rawTournaments = await tournamentsRes.value.json();
        }

        const normalized = normalizeApiPayload(rawRankings, rawTournaments);

        const success = httpStatus >= 200 && httpStatus < 300;

        return NextResponse.json({
          success,
          httpStatus,
          message: success
            ? `✅ Conexión exitosa a PadelAPI.org (HTTP ${httpStatus})`
            : `❌ ${errorMessage || `Error HTTP ${httpStatus}`}`,
          maleCount: normalized.malePlayers.length,
          femaleCount: normalized.femalePlayers.length,
          tournamentCount: normalized.tournaments.length,
          malePlayers: normalized.malePlayers,
          femalePlayers: normalized.femalePlayers,
          tournaments: normalized.tournaments,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          httpStatus: 500,
          message: `❌ Error de conexión: ${err.message || "No se pudo conectar a la API"}`,
          maleCount: 0,
          femaleCount: 0,
          tournamentCount: 0,
        });
      }
    }

    // ACTION 2: Save API Config
    if (body.type === "save_config" && body.apiConfig) {
      const existingConfig = await db.collection("config").findOne({});
      await db.collection("config").deleteMany({});
      const cleanConfig = { ...body.apiConfig };
      if (!cleanConfig.apiKey && existingConfig?.apiKey) cleanConfig.apiKey = existingConfig.apiKey;
      delete cleanConfig._id;
      await db.collection("config").insertOne(cleanConfig);
      return NextResponse.json({ success: true });
    }

    // ACTION 3: Load Demo Seed Data into custom_data
    if (body.type === "load_demo_data") {
      await db.collection("custom_data").deleteMany({});
      await db.collection("custom_data").insertOne({
        malePlayers: INITIAL_MALE_PLAYERS,
        femalePlayers: INITIAL_FEMALE_PLAYERS,
        tournaments: INITIAL_TOURNAMENTS,
        savedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        success: true,
        malePlayers: INITIAL_MALE_PLAYERS,
        femalePlayers: INITIAL_FEMALE_PLAYERS,
        tournaments: INITIAL_TOURNAMENTS,
      });
    }

    // ACTION 4: Clear custom demo data
    if (body.type === "clear_custom_data") {
      await db.collection("custom_data").deleteMany({});
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("POST padel-ranking-tracker error:", e);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
