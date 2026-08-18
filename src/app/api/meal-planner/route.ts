import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

const FAMILY_ID = "default_family";

async function isAuthorized(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session) {
    const isAllowed = isUserAllowedForTool(
      "meal-planner",
      session.user?.email,
      session.user?.role,
    );
    if (isAllowed) return true;
  }

  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_meal-planner")?.value === "true" ||
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
      process.env.MEAL_PLANNER_DB_NAME || "meal-planner",
    );

    let doc = await db.collection("planner_data").findOne({ id: FAMILY_ID });

    if (!doc) {
      doc = await db.collection("planner_data").findOne({});
    }

    return NextResponse.json({
      menu: doc?.menu || {},
      shoppingList: doc?.shoppingList || [],
      dishes: doc?.dishes || [],
    });
  } catch (e) {
    console.error("GET meal-planner error:", e);
    return NextResponse.json(
      { error: "Failed to fetch meal planner data" },
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
      process.env.MEAL_PLANNER_DB_NAME || "meal-planner",
    );

    const updateDoc = {
      id: FAMILY_ID,
      ...(body.menu !== undefined && { menu: body.menu }),
      ...(body.shoppingList !== undefined && { shoppingList: body.shoppingList }),
      ...(body.dishes !== undefined && { dishes: body.dishes }),
      updatedAt: new Date(),
    };

    await db
      .collection("planner_data")
      .updateOne(
        { id: FAMILY_ID },
        { $set: updateDoc },
        { upsert: true }
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST meal-planner error:", e);
    return NextResponse.json(
      { error: "Failed to save meal planner data" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.MEAL_PLANNER_DB_NAME || "meal-planner",
    );

    await db.collection("planner_data").deleteOne({ id: FAMILY_ID });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE meal-planner error:", e);
    return NextResponse.json(
      { error: "Failed to reset meal planner data" },
      { status: 500 },
    );
  }
}
