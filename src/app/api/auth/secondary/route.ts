import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { pin, toolId } = await request.json();

  // Logic to determine which PIN to check
  let securePin = "";
  if (!toolId) {
    // Global Dashboard access
    securePin = process.env.ADMIN_PIN || "1234";
  } else {
    // Tool specific access
    // Example: FINANCE_TRACKER_PIN, TOOL_ONE_PIN, etc.
    const envVarName = `${toolId.replace(/-/g, "_").toUpperCase()}_PIN`;
    securePin = process.env[envVarName] || "1234";
  }

  if (pin === securePin) {
    const response = NextResponse.json({ success: true });
    const cookieName = toolId ? `auth_tool_${toolId}` : "auth_dashboard";

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
