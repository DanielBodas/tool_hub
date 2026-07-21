"use client";

import { usePathname } from "next/navigation";

export function AppFooter() {
  const pathname = usePathname();

  // Hide footer inside tools for maximum workspace space
  if (pathname?.startsWith("/tools/")) {
    return null;
  }

  return (
    <footer className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground bg-card/30">
      © {new Date().getFullYear()} ToolHub Platform. Todos los derechos reservados.
    </footer>
  );
}
