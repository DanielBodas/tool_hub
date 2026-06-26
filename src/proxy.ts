import { NextResponse } from "next/server";

/**
 * Next.js 16+ Proxy (formerly "middleware")
 * Minimal implementation to allow PIN-based cookie auth to handle protection.
 * Actual auth checks are done in each server component (dashboard, tool pages).
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tools/:path*"],
};
