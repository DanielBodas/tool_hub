"use client";

import React, { useState } from "react";
import { useSecurity } from "./SecurityProvider";
import { ShieldAlert, Lock, Unlock } from "lucide-react";

interface SecurityGateProps {
  children: React.ReactNode;
  toolId?: string;
  toolName?: string;
}

export function SecurityGate({ children, toolId, toolName }: SecurityGateProps) {
  const { isToolUnlocked, unlock } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isToolUnlocked(toolId)) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50/50">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center">
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Lock size={40} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Acceso al Panel</h2>
        <p className="text-gray-500 mb-10">
          Introduce tu código de acceso para desbloquear el Dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-4">
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={`block w-full px-6 py-5 bg-gray-50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-center text-4xl tracking-[1em] font-mono ${
                error ? "border-red-400 bg-red-50 text-red-600" : "border-gray-100"
              }`}
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold animate-shake">Código incorrecto. Reinténtalo.</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? "Verificando..." : "Desbloquear Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
