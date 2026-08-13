"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export function LoginForm() {
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminPin, setShowAdminPin] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Log in via Credentials Provider using Admin Code
    const result = await signIn("credentials", {
      code: adminCode,
      redirect: false,
    });

    if (result?.error) {
      setError("Código de acceso incorrecto");
      setLoading(false);
    } else {
      // Also unlock the secondary dashboard cookie just in case (for compatibility)
      try {
        await fetch("/api/auth/secondary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: adminCode, type: "dashboard" }),
        });
      } catch (err) {
        console.error("Secondary unlock failed", err);
      }
      
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-border animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <BrandLogo className="w-20 h-20 rounded-3xl shadow-lg" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Bienvenido</h1>
          <p className="text-muted-foreground mt-2">
            Inicia sesión para acceder a la plataforma
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold border border-destructive/20 animate-bounce-short">
            {error}
          </div>
        )}

        {/* Primary Entrance: Google Sign-In */}
        <div className="space-y-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg rounded-2xl font-bold transition-all active:scale-[0.98]"
          >
            <div className="bg-white p-1 rounded-full flex items-center justify-center">
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
            </div>
            <span className="font-extrabold text-lg">Entrar con Google</span>
          </button>
        </div>

        {/* Administrator Options Divider & Toggle Button */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground bg-card px-3 font-bold">
            o acceso administrador
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAdminPin(!showAdminPin)}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 focus:outline-none py-2 px-4 rounded-xl hover:bg-muted/50 cursor-pointer"
          >
            <span>{showAdminPin ? "Ocultar panel de administrador" : "🔑 Acceso con PIN de Admin"}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showAdminPin ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdminPin && (
          <form onSubmit={handleAdminLogin} className="mt-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Código PIN de Administrador
              </label>
              <input
                type="password"
                required
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="block w-full px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-border rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition text-center text-2xl tracking-[0.2em] font-mono font-bold"
                placeholder="••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/95 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verificando..." : "Acceder ahora"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
