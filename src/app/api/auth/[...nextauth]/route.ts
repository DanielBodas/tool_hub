import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const nextAuthHandler = NextAuth(authOptions);

async function handleAuth(
  req: NextRequest,
  context: { params: Promise<{ nextauth?: string[] }> | { nextauth?: string[] } }
) {
  try {
    const rawParams = await context.params;
    let nextauth = rawParams?.nextauth || [];

    // Safely alias legacy or direct route calls
    if (nextauth.length === 1 && nextauth[0] === "google") {
      nextauth = ["signin", "google"];
    } else if (nextauth.length === 1 && nextauth[0] === "admin") {
      nextauth = ["signin", "credentials"];
    }

    const resolvedContext = {
      params: Promise.resolve({ nextauth }),
    };

    return await nextAuthHandler(req as any, resolvedContext as any);
  } catch (error) {
    console.error("[NextAuth Route Error]:", error);
    return NextResponse.json(
      {
        error: "Internal Auth Error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export { handleAuth as GET, handleAuth as POST };
