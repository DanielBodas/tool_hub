import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions, isToolAllowedForUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";

loadAllToolEnvs();

const TOOL_ID = "baby-leave-planner";

async function getUserId() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlockedByCookie =
    cookieStore.get(`auth_tool_${TOOL_ID}`)?.value === "true" ||
    cookieStore.get("auth_dashboard")?.value === "true";

  if (session?.user) {
    // If user has session, check if they are authorized for this tool
    if (isToolAllowedForUser(session, TOOL_ID) || isUnlockedByCookie) {
      return session.user.email || "session_user";
    }
    return null;
  }

  // Fallback to a tool-specific cookie or dashboard cookie if unlocked via PIN
  if (isUnlockedByCookie) {
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

    const data = await db.collection("settings").findOne({ id: userId });

    return NextResponse.json(data || {});
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
    const client = await clientPromise;
    const db = client.db(
      process.env.BABY_LEAVE_PLANNER_DB_NAME || "baby-leave-planner",
    );

    await db
      .collection("settings")
      .updateOne(
        { id: userId },
        { $set: { ...body, id: userId, updatedAt: new Date() } },
        { upsert: true },
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
