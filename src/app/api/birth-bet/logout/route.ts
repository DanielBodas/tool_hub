import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_tool_birth-bet");
  cookieStore.delete("birth_bet_groups");
  return NextResponse.json({ success: true });
}
