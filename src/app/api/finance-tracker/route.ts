import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

const TOOL_ID = "finance-tracker";
const DEFAULT_DB_NAME = "finance-tracker";
const DATA_DOC_ID = "finance_store_v1";

function getDbName(): string {
  const envValue = process.env.FINANCE_TRACKER_DB_NAME;
  if (envValue && envValue.trim() !== "") {
    return envValue.trim();
  }
  return DEFAULT_DB_NAME;
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
    const db = client.db(getDbName());

    const doc = await db.collection("data").findOne({ id: DATA_DOC_ID });

    if (!doc) {
      return NextResponse.json({
        liquidAccounts: [],
        airbusPackages: [],
        otherInvestments: [],
        settings: {
          targetInvestmentRatio: 60,
          taxRate: 19,
        },
      });
    }

    return NextResponse.json({
      liquidAccounts: doc.liquidAccounts || [],
      airbusPackages: doc.airbusPackages || [],
      otherInvestments: doc.otherInvestments || [],
      settings: doc.settings || {
        targetInvestmentRatio: 60,
        taxRate: 19,
      },
    });
  } catch (e) {
    console.error("GET /api/finance-tracker error:", e);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
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
    const { liquidAccounts, airbusPackages, otherInvestments, settings } = body;

    const client = await clientPromise;
    const db = client.db(getDbName());

    const payload = {
      id: DATA_DOC_ID,
      liquidAccounts: Array.isArray(liquidAccounts) ? liquidAccounts : [],
      airbusPackages: Array.isArray(airbusPackages) ? airbusPackages : [],
      otherInvestments: Array.isArray(otherInvestments) ? otherInvestments : [],
      settings: settings || { targetInvestmentRatio: 60, taxRate: 19 },
      updatedAt: new Date(),
    };

    await db.collection("data").updateOne(
      { id: DATA_DOC_ID },
      { $set: payload },
      { upsert: true }
    );

    return NextResponse.json({ success: true, payload });
  } catch (e) {
    console.error("POST /api/finance-tracker error:", e);
    return NextResponse.json(
      { error: "Failed to save financial data" },
      { status: 500 }
    );
  }
}
