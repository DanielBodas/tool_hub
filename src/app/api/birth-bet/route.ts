import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }

  // Fallback to a tool-specific cookie if unlocked via PIN
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_birth-bet")?.value === "true";

  if (isUnlocked) {
    // For the birth bet tool, we want everyone who uses the same PIN
    // to see the same data, so we return a shared ID.
    return "shared_birth_bet";
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
    const db = client.db("birth-bet");

    const data = await db.collection("bets").find({}).toArray();

    return NextResponse.json(data || []);
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

    const body = await request.json(); // { date: "2026-07-15", name: "User" }
    const { date, name } = body;

    if (!date || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("birth-bet");

    // We store multiple bets per date, but maybe one name per person?
    // For now, let's just add the bet.
    const result = await db.collection("bets").insertOne({
      date,
      name,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
      const userId = await getUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db("birth-bet");

      await db.collection("bets").deleteOne({ _id: new ObjectId(id) });

      return NextResponse.json({ success: true });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
    }
  }
