"use client";

import { useSecurity } from "./SecurityProvider";
import { ShieldCheck, ShieldX } from "lucide-react";

export function SecurityStatus() {
  const { isToolUnlocked, lock } = useSecurity();
  const unlocked = isToolUnlocked(); // Check dashboard status

  if (!unlocked) {
    return (
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/30">
        <ShieldX size={16} />
        <span className="text-xs font-bold uppercase tracking-tight text-[10px] md:text-xs">
          Dashboard Bloqueado
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/30 group relative cursor-pointer"
      onClick={() => lock()}
    >
      <ShieldCheck size={16} />
      <span className="text-xs font-bold uppercase tracking-tight text-[10px] md:text-xs">
        Dashboard Verificado
      </span>
      <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-popover border border-border shadow-lg p-2 rounded text-[10px] whitespace-nowrap text-popover-foreground">
        Clic para bloquear
      </div>
    </div>
  );
}
