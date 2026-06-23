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
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Validación Requerida</h2>
        <p className="text-gray-500 mb-8">
          Introduce el PIN de acceso para {toolName || "el Panel"}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center text-2xl tracking-widest ${
                  error ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="****"
                maxLength={4}
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2 font-medium">PIN incorrecto. Inténtalo de nuevo.</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Unlock size={20} /> {loading ? "Verificando..." : "Desbloquear Acceso"}
          </button>
        </form>
      </div>
    </div>
  );
}
