"use client";

import React, { useState } from "react";
import { useSecurity } from "./SecurityProvider";
import { Lock } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * ToolSecurityGate is the individual login for EACH tool.
 * Note: rendered only by the server component when the auth cookie is absent.
 */
export function ToolSecurityGate({
  toolId,
  toolName,
}: {
  toolId: string;
  toolName: string;
}) {
  const { data: session } = useSession();
  const { unlock } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"choice" | "pin">("choice");
  const router = useRouter();

  const handleSessionAccess = async () => {
    setLoading(true);
    // Passing empty pin but toolId and type 'tool'
    // The server will check for session
    if (await unlock("", toolId, "tool")) {
      setLoading(false);
      router.refresh();
    } else {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Type is "tool" for this specific utility
    if (await unlock(pin, toolId, "tool")) {
      setLoading(false);
      router.refresh();
    } else {
      setError(true);
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-10 rounded-[2.5rem] shadow-xl border border-border text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Lock size={40} />
        </div>
        <h2 className="text-3xl font-extrabold text-card-foreground mb-2 tracking-tight">
          {toolName}
        </h2>
        <p className="text-muted-foreground mb-10">
          Inicia sesión para usar esta herramienta.
        </p>

        {mode === "choice" ? (
          <div className="space-y-4">
            {session ? (
              <button
                onClick={handleSessionAccess}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl font-bold text-blue-700 hover:bg-blue-100 transition-all"
              >
                Acceder como {session.user?.name || "Usuario"}
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-border rounded-2xl font-bold text-foreground hover:bg-muted transition-all"
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
                o acceso directo
              </div>
            </div>
            <button
              onClick={() => setMode("pin")}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg"
            >
              Acceso por PIN
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
                className={`block w-full px-4 py-5 bg-gray-100 dark:bg-gray-800 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/50 outline-none transition-all text-center text-4xl tracking-[0.5em] font-mono font-black ${
                  error
                    ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 ring-2 ring-red-500"
                    : "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                }`}
                placeholder="****"
                maxLength={4}
                autoFocus
                disabled={loading}
                autoComplete="off"
              />
              {error && (
                <p className="text-red-500 text-sm mt-4 font-bold">
                  Código incorrecto
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMode("choice")}
                className="flex-1 py-4 bg-muted text-foreground rounded-2xl font-bold hover:opacity-80 transition-all"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-lg"
              >
                {loading ? "Entrando..." : "Verificar PIN"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
