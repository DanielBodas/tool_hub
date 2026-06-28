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

    const dbGroups = await db
      .collection("groups")
      .find({ id: { $in: accessibleGroupIds } })
      .toArray();

    // Map accessible IDs to a name, prioritizing DB but falling back to formatted ID
    const groups = accessibleGroupIds.map((id: string) => {
      const dbGroup = dbGroups.find((g) => g.id === id);
      if (dbGroup) return dbGroup;

      // Format ID to Name (e.g. colleagues -> Colleagues)
      return {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
      };
    });

    return NextResponse.json(groups);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 },
    );
  }
}
