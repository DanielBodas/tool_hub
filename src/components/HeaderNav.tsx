"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSecurity } from "./SecurityProvider";
import { ShieldCheck, ShieldAlert, LogOut, LogIn, Download, Share, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function HeaderNav() {
  const { isToolUnlocked, lock } = useSecurity();
  const { data: session } = useSession();
  const pathname = usePathname();
  const isUnlocked = isToolUnlocked("dashboard");

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isStandalone] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        !!(window.navigator as unknown as { standalone?: boolean }).standalone
      );
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      });
    } else {
      setShowIosInstructions(true);
    }
  };

  // Completely hide header navigation items on the login screen
  if (pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    await lock();
  };

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Discreet PWA Install Icon Button in Top Header Nav */}
        {!isStandalone && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition active:scale-95 cursor-pointer"
            title="Instalar App en inicio"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        )}

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

      {/* iOS Instructions Modal */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Share size={16} className="text-primary" /> Instalar en tu iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIosInstructions(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Toca el botón <span className="font-bold text-foreground">Compartir <Share size={12} className="inline text-primary" /></span> en Safari.</li>
              <li>Desplázate y selecciona <span className="font-bold text-foreground">&quot;Añadir a la pantalla de inicio&quot;</span>.</li>
              <li>Abre ToolHub como App nativa.</li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
