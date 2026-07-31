"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { useSecurity } from "./SecurityProvider";
import { BrandLogo } from "./BrandLogo";

interface ToolBaseLayoutProps {
  children: React.ReactNode;
  toolName: string;
}

/**
 * ToolBaseLayout provides a 36px (h-9) mobile-first compact topbar.
 */
export function ToolBaseLayout({
  children,
  toolName,
}: ToolBaseLayoutProps) {
  const { lock } = useSecurity();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* Mobile-optimized 36px (h-9) Top Bar */}
      <header className="h-9 border-b border-border/50 bg-card/90 backdrop-blur-xs sticky top-0 z-50 px-2 sm:px-4 flex items-center justify-between gap-2 select-none">
        {/* Left: Exit to Dashboard */}
        <div className="flex items-center shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-95"
            title="Volver al panel principal"
          >
            <ArrowLeft size={13} />
            <span className="inline">Panel</span>
          </Link>
        </div>

        {/* Center: Tool Name (Truncates safely on small screens) */}
        <div className="flex items-center gap-1.5 shrink min-w-0 overflow-hidden text-center px-1">
          <BrandLogo className="w-3.5 h-3.5 rounded-xs shrink-0 shadow-xs" />
          <span className="text-[11px] font-extrabold tracking-tight text-foreground uppercase truncate">
            {toolName}
          </span>
        </div>

        {/* Right: Quick Exit */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => lock()}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition active:scale-95 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Mobile-Responsive Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}
