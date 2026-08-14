import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { INITIAL_LEAVE_DATA } from "@/modules/baby-leave-planner/initialData";

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

    let data = await db.collection("settings").findOne({ id: userId });

    if (!data) {
      if (userId !== "default_family") {
        data = await db.collection("settings").findOne({ id: "default_family" });
      }

      if (!data) {
        data = { ...INITIAL_LEAVE_DATA, updatedAt: new Date() };
        await db
          .collection("settings")
          .updateOne(
            { id: "default_family" },
            { $set: data },
            { upsert: true }
          );
      }
    }

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
