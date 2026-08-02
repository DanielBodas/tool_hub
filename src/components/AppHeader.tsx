"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderNav } from "./HeaderNav";
import { BrandLogo } from "./BrandLogo";

export function AppHeader() {
  const pathname = usePathname();

  // Completely hide global header inside tool routes for 100% space
  if (pathname?.startsWith("/tools/")) {
    return null;
  }

  return (
    <header className="border-b border-border/50 bg-card/90 backdrop-blur-xs sticky top-0 z-50 transition-all">
      <div className="container mx-auto px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-black text-sm tracking-tight text-foreground hover:opacity-90 transition"
          >
            <BrandLogo className="w-6 h-6 rounded-md shadow-xs" />
            <span>ToolHub</span>
          </Link>
        </div>
        <HeaderNav />
      </div>
    </header>
  );
}
