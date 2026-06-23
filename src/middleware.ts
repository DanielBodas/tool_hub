import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Modern Next.js 16/15+ Middleware
 * Minimal implementation to allow PIN access to handle auth.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tools/:path*"],
};
