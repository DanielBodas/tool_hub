import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Delete all hub authentication and tool cookies
  for (const cookie of cookieStore.getAll()) {
    if (
      cookie.name === "auth_dashboard" ||
      cookie.name.startsWith("auth_tool_") ||
      cookie.name.startsWith("next-auth") ||
      cookie.name.startsWith("__Secure-next-auth") ||
      cookie.name.startsWith("__Host-next-auth")
    ) {
      cookieStore.delete(cookie.name);
    }
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  return POST();
}
