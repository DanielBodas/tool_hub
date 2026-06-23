"use client";

import React, { useState } from "react";
import { useSecurity } from "./SecurityProvider";
import { ShieldAlert, Lock, Unlock } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

interface ToolSecurityGateProps {
  children: React.ReactNode;
  toolId: string;
  toolName: string;
}

export function ToolSecurityGate({ children, toolId, toolName }: ToolSecurityGateProps) {
  const { data: session } = useSession();
  const { isToolUnlocked, unlock } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"choice" | "pin">("choice");

  if (session || isToolUnlocked(toolId)) {
    return <>{children}</>;
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    if (await unlock(pin, toolId)) {
      setLoading(false);
    } else {
      setError(true);
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Acceso a {toolName}</h2>
        <p className="text-gray-500 mb-10">Esta herramienta requiere autenticación individual.</p>

        {mode === "choice" ? (
          <div className="space-y-4">
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
              </svg>
              Entrar con Google
            </button>
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400 bg-white px-4">o con código</div>
            </div>
            <button
              onClick={() => setMode("pin")}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition"
            >
              Acceso por PIN
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`block w-full px-4 py-4 border rounded-2xl focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center text-3xl tracking-widest ${
                  error ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                placeholder="****"
                maxLength={4}
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-3 font-medium">Código incorrecto</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("choice")}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Verificar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
