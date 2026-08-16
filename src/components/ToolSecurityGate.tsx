"use client";

import React, { useState } from "react";
import { useSecurity } from "./SecurityProvider";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * ToolSecurityGate is the individual login for EACH tool.
 * Rendered by the server component when the tool is locked.
 *
 * Props:
 *  - userBlocked: true when the user has a Google session but is NOT in the
 *    tool's ALLOWED_USERS whitelist. Shows PIN mode with an explanation.
 */
export function ToolSecurityGate({
  toolId,
  toolName,
  userBlocked = false,
}: {
  toolId: string;
  toolName: string;
  userBlocked?: boolean;
}) {
  const { data: session } = useSession();
  const { unlock } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"choice" | "pin">(userBlocked ? "pin" : "choice");
  const [isBlocked, setIsBlocked] = useState(userBlocked);
  const router = useRouter();

  const handleSessionAccess = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "", toolId, type: "tool" }),
    });

    if (res.ok) {
      setLoading(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (res.status === 403 && data?.reason === "not_allowed") {
        setIsBlocked(true);
        setMode("pin");
      }
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    if (await unlock(pin, toolId, "tool")) {
      setLoading(false);
      router.refresh();
    } else {
      setError(true);
      setPin("");
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-border text-center">
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
            isBlocked
              ? "bg-amber-500/10 text-amber-500"
              : "bg-blue-500/10 text-blue-500"
          }`}
        >
          {isBlocked ? <ShieldAlert size={36} /> : <Lock size={36} />}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-card-foreground mb-2 tracking-tight">
          {toolName}
        </h2>

        <p className="text-muted-foreground text-sm mb-8">
          {isBlocked ? (
            <>
              Tu cuenta ({session?.user?.email || "Google"}) no tiene acceso directo. Introduce el PIN de la herramienta para entrar:
            </>
          ) : (
            "Inicia sesión para usar esta herramienta."
          )}
        </p>

        {mode === "choice" ? (
          <div className="space-y-4">
            {session ? (
              <button
                onClick={handleSessionAccess}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-500/10 border-2 border-blue-500/20 rounded-2xl font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                Acceder como {session.user?.name || "Usuario"}
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-border rounded-2xl font-bold text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  />
                </svg>
                Continuar con Google
              </button>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-muted-foreground bg-card px-3 font-bold">
                o acceso por pin
              </div>
            </div>

            <button
              onClick={() => setMode("pin")}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              Acceso por PIN
            </button>

            <button
              onClick={handleBackToDashboard}
              className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Volver al Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`block w-full px-4 py-4 bg-muted/50 border-2 rounded-2xl focus:ring-4 focus:ring-primary/40 outline-none transition-all text-center text-3xl tracking-[0.4em] font-mono font-black ${
                  error
                    ? "border-destructive text-destructive bg-destructive/10 ring-2 ring-destructive/40"
                    : "border-border text-foreground"
                }`}
                placeholder="****"
                maxLength={6}
                autoFocus
                disabled={loading}
                autoComplete="off"
              />
              {error && (
                <p className="text-destructive text-sm mt-3 font-bold">
                  PIN incorrecto. Inténtalo de nuevo.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={isBlocked ? handleBackToDashboard : () => setMode("choice")}
                className="flex-1 py-3.5 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-all flex items-center justify-center gap-1.5 text-sm cursor-pointer"
              >
                <ArrowLeft size={16} /> {isBlocked ? "Dashboard" : "Atrás"}
              </button>

              <button
                type="submit"
                disabled={loading || !pin}
                className="flex-[2] py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Verificar PIN"}
              </button>
            </div>

            {isBlocked && (
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                Si no conoces el PIN, pulsa en Dashboard para salir.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
