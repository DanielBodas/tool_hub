"use client";

import Link from "next/link";
import { useSecurity } from "./SecurityProvider";
import { ShieldCheck, ShieldAlert, LogOut, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";

export function HeaderNav() {
  const { isToolUnlocked, lock } = useSecurity();
  const { data: session } = useSession();
  const isUnlocked = isToolUnlocked("dashboard");

  const handleLogout = async () => {
    await lock();
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {isUnlocked ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full border border-green-200/60 dark:border-green-900/40">
            <ShieldCheck size={12} />
            <span className="text-[10px] font-extrabold uppercase tracking-tight hidden sm:inline">
              Verificado
            </span>
          </div>

          {session?.user?.name && (
            <span className="text-[11px] font-semibold text-muted-foreground hidden md:inline-block max-w-[100px] truncate">
              {session.user.name}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition active:scale-95 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut size={12} />
            <span>Salir</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/40">
            <ShieldAlert size={12} />
            <span className="text-[10px] font-extrabold uppercase tracking-tight hidden sm:inline">
              Bloqueado
            </span>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition active:scale-95"
          >
            <LogIn size={12} />
            <span>Entrar</span>
          </Link>
        </div>
      )}
    </div>
  );
}
