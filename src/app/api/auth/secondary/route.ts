import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { pin } = await request.json();
  const securePin = process.env.ADMIN_PIN || "1234";

  if (pin === securePin) {
    const response = NextResponse.json({ success: true });

    // Set a secure, httpOnly cookie to mark the session as secondary-validated
    (await cookies()).set("secondary_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
