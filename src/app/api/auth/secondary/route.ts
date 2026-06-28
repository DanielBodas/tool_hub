import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  const { pin, toolId, type } = await request.json();

  let securePin = "";
  let cookieName = "";

  if (type === "dashboard") {
    securePin = process.env.ADMIN_CODE || "1234";
    cookieName = "auth_dashboard";
  } else if (type === "tool" && toolId) {
    if (toolId === "birth-bet") {
      const client = await clientPromise;
      const db = client.db("birth-bet");
      const pinDoc = await db.collection("pins").findOne({ pin });

      if (pinDoc) {
        const response = NextResponse.json({ success: true });
        const cookieStore = await cookies();

        cookieStore.set("auth_tool_birth-bet", "true", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 2,
          path: "/",
        });

        const existingGroupsCookie = cookieStore.get("birth_bet_groups")?.value;
        let newGroups = pinDoc.groups;
        if (existingGroupsCookie) {
          try {
            const existingGroups = JSON.parse(existingGroupsCookie);
            newGroups = Array.from(new Set([...existingGroups, ...pinDoc.groups]));
          } catch (e) {
            console.error(e);
          }
        }

        cookieStore.set("birth_bet_groups", JSON.stringify(newGroups), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 2,
          path: "/",
        });

        return response;
      }
    }

    const envVarName = `${toolId.replace(/-/g, "_").toUpperCase()}_PIN`;
    securePin = process.env[envVarName] as string;

    // Si la herramienta no tiene un PIN configurado, bloquéala (no permitas 1234 por defecto)
    if (!securePin) {
      console.error(`Missing PIN for tool: ${toolId}. Please set ${envVarName} in the .env file.`);
      return NextResponse.json({ success: false, error: "Tool PIN not configured." }, { status: 500 });
    }
    cookieName = `auth_tool_${toolId}`;
  }

  const session = await getServerSession(authOptions);
  const isAuthorized = (pin && pin === securePin) || session;

  if (isAuthorized) {
    const response = NextResponse.json({ success: true });
    const cookieStore = await cookies();

    if (cookieName) {
      cookieStore.set(cookieName, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 2, // 2 hours
        path: "/",
      });
    }

    // Special case for session access to birth-bet: give access to all groups if admin?
    // Or just require PIN for everyone for now to ensure group isolation as requested.
    if (toolId === "birth-bet" && !pin && session) {
        // If they access via session, we might want to give them all groups if they are admin
        // or just let them enter but they'll see nothing until they enter a PIN.
        // Given the user's request, let's keep it strictly PIN-based for group access.
    }

    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
