"use client";

import React, { useState } from "react";
import { useSecurity } from "./SecurityProvider";
import { Lock } from "lucide-react";
import { useSession } from "next-auth/react";

interface SecurityGateProps {
  children: React.ReactNode;
  toolId?: string;
}

/**
 * SecurityGate is the single entry point for the Dashboard.
 * It only requires ONE pin to enter.
 */
export function SecurityGate({ children, toolId }: SecurityGateProps) {
  const { data: session } = useSession();
  const { isToolUnlocked, unlock } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (session || isToolUnlocked(toolId)) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Always use "dashboard" type for this gate
    if (await unlock(pin, toolId, "dashboard")) {
      setLoading(false);
    } else {
      setError(true);
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gray-50/50">
      <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center">
        <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-200">
          <Lock size={48} />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Entrar al Hub</h2>
        <p className="text-gray-500 mb-12 text-lg">
          Introduce tu código de acceso único.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center">
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={`block w-full px-4 py-6 bg-gray-100 border-none rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none transition-all text-center text-5xl tracking-[0.8em] font-mono ${
                error ? "bg-red-50 text-red-600 ring-2 ring-red-200" : "text-gray-900"
              }`}
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 font-bold">Acceso Denegado</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Acceder ahora"}
          </button>
        </form>
      </div>
    </div>
  );
}
