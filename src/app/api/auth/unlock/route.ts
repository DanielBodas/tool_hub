import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

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

    if (!securePin) {
      console.error(`Missing PIN for tool: ${toolId}. Please set ${envVarName} in the .env file.`);
      return NextResponse.json({ success: false, error: "Tool PIN not configured." }, { status: 500 });
    }
    cookieName = `auth_tool_${toolId}`;
  } else {
    return NextResponse.json({ success: false, error: "Invalid unlock request." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  // CASE 1: The user provided a PIN
  // PIN MUST match the configured securePin exactly. Having a Google session does NOT bypass a wrong PIN!
  if (pin) {
    if (pin.trim() !== securePin.trim()) {
      return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 });
    }

    // Correct PIN entered!
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

  // CASE 2: No PIN provided — checking session-based access
  if (session) {
    if (type === "dashboard") {
      const response = NextResponse.json({ success: true });
      (await cookies()).set(cookieName, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }

    if (type === "tool" && toolId) {
      const allowed = isUserAllowedForTool(
        toolId,
        session.user?.email,
        session.user?.role,
      );

      if (allowed) {
        const response = NextResponse.json({ success: true });
        (await cookies()).set(cookieName, "true", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
        return response;
      } else {
        return NextResponse.json(
          { success: false, reason: "not_allowed" },
          { status: 403 },
        );
      }
    }
  }

  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
