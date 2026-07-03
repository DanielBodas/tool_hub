import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }

  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_tool_birth-bet")?.value === "true";

  if (isUnlocked) {
    return "shared_birth_bet";
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("birth-bet");

    const bets = await db.collection("bets").find({ groupId }).toArray();

    return NextResponse.json(bets);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, name, date, time } = body;

    if (!groupId || !name || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("birth-bet");

    const result = await db.collection("bets").insertOne({
      groupId,
      name,
      date,
      time,
      userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
