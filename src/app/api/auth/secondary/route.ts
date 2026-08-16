import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions, isToolAllowedForUser } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";

export async function POST(request: Request) {
  loadAllToolEnvs();
  const { pin, toolId, type } = await request.json();

  let securePin = "";
  let cookieName = "";

  if (type === "dashboard") {
    securePin = process.env.ADMIN_CODE || "1234";
    cookieName = "auth_dashboard";
  } else if (type === "tool" && toolId) {
    const envVarName = `${toolId.replace(/-/g, "_").toUpperCase()}_PIN`;
    securePin = process.env[envVarName] as string;
    
    // Check if session user is allowed or PIN matches
    cookieName = `auth_tool_${toolId}`;
  }

  const session = await getServerSession(authOptions);

  let isAuthorized = false;
  if (type === "dashboard") {
    isAuthorized = Boolean((pin && pin === securePin) || session);
  } else if (type === "tool" && toolId) {
    const pinMatches = Boolean(securePin && pin && pin === securePin);
    const sessionAllowed = isToolAllowedForUser(session, toolId);
    isAuthorized = pinMatches || sessionAllowed;
    if (!isAuthorized && !securePin) {
      const envVarName = `${toolId.replace(/-/g, "_").toUpperCase()}_PIN`;
      console.error(`Missing PIN for tool: ${toolId}. Please set ${envVarName} in the .env file.`);
      return NextResponse.json({ success: false, error: "Tool PIN not configured." }, { status: 500 });
    }
  }


  if (isAuthorized) {
    const response = NextResponse.json({ success: true });

    (await cookies()).set(cookieName, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
