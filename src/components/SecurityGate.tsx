"use client";

import React, { useState } from "react";
import { useSecurity } from "./SecurityProvider";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * SecurityGate is the single entry point for the Dashboard.
 * It only requires ONE pin to enter.
 */
export function SecurityGate({ toolId }: { toolId?: string }) {
  const { unlock } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Always use "dashboard" type for this gate
    if (await unlock(pin, toolId, "dashboard")) {
      setLoading(false);
      router.refresh();
    } else {
      setError(true);
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card p-12 rounded-[3rem] shadow-2xl border border-border text-center">
        <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-200">
          <Lock size={48} />
        </div>
        <h2 className="text-4xl font-black text-card-foreground mb-3 tracking-tight">
          Entrar al Hub
        </h2>
        <p className="text-muted-foreground mb-12 text-lg">
          Introduce tu código de acceso único.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center">
            <input
              type="text"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={`block w-full px-4 py-6 bg-gray-100 dark:bg-gray-800 border-2 rounded-3xl focus:ring-4 focus:ring-blue-500/50 outline-none transition-all text-center text-5xl tracking-[0.5em] font-mono font-black ${
                error
                  ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 ring-2 ring-red-500"
                  : "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              }`}
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
              autoComplete="off"
            />
          </div>
          {error && <p className="text-red-500 font-bold">Acceso Denegado</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-primary text-primary-foreground rounded-[2rem] font-black text-xl hover:bg-primary/90 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Acceder ahora"}
          </button>
        </form>
      </div>
    </div>
  );
}
