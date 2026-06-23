import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const { pin, toolId, type } = await request.json();

  let securePin = "";
  let cookieName = "";

  if (type === "dashboard") {
    securePin = process.env.ADMIN_CODE || "1234";
    cookieName = "auth_dashboard";
  } else if (type === "tool" && toolId) {
    const envVarName = `${toolId.replace(/-/g, "_").toUpperCase()}_PIN`;
    // If specific tool PIN is not set, use ADMIN_CODE or finally '1234'
    securePin = process.env[envVarName] || process.env.ADMIN_CODE || "1234";
    cookieName = `auth_tool_${toolId}`;
  }

  const session = await getServerSession(authOptions);
  const isAuthorized = (pin && pin === securePin) || session;

  if (isAuthorized) {
    const response = NextResponse.json({ success: true });

    (await cookies()).set(cookieName, "true", {
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
