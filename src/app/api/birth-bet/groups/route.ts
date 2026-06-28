import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const groupsCookie = cookieStore.get("birth_bet_groups")?.value;

    if (!groupsCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessibleGroupIds = JSON.parse(groupsCookie);

    const client = await clientPromise;
    const db = client.db("birth-bet");

    const groups = await db
      .collection("groups")
      .find({ id: { $in: accessibleGroupIds } })
      .toArray();

    return NextResponse.json(groups);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 },
    );
  }
}
