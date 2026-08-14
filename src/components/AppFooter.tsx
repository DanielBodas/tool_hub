"use client";

import { usePathname } from "next/navigation";

export function AppFooter() {
  const pathname = usePathname();

  // Hide footer inside tools and login page for maximum workspace space and zero mobile scroll
  if (pathname?.startsWith("/tools/") || pathname === "/login") {
    return null;
  }

  return (
    <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground bg-card/30">
      © {new Date().getFullYear()} ToolHub Platform. Todos los derechos reservados.
    </footer>
  );
}
