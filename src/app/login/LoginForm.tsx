"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export function LoginForm() {
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminPin, setShowAdminPin] = useState(false);
  const router = useRouter();

  // Lock document root level scroll when login is active
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyHeight = body.style.height;

    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";

    return () => {
      html.style.overflow = originalHtmlOverflow;
      html.style.height = originalHtmlHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.height = originalBodyHeight;
    };
  }, []);

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
    <div className="flex-grow flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-20 bg-background overflow-hidden h-[calc(100vh-2.5rem)] max-h-[calc(100dvh-2.5rem)]">
      <div className="max-w-md w-full bg-card p-4 sm:p-5 rounded-2xl shadow-xl border border-border animate-fade-in max-h-full overflow-y-auto max-h-[82vh] sm:max-h-[88vh]">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <BrandLogo className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shadow-lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Bienvenido</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Inicia sesión para acceder a la plataforma
          </p>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-destructive/10 text-destructive rounded-xl text-xs font-semibold border border-destructive/20 animate-bounce-short">
            {error}
          </div>
        )}

        {/* Primary Entrance: Google Sign-In */}
        <div>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg rounded-xl font-bold transition-all active:scale-[0.98]"
          >
            <div className="bg-white p-1 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
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
            <span className="font-extrabold text-base sm:text-lg">Entrar con Google</span>
          </button>
        </div>

        {/* Administrator Options Divider & Toggle Button */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground bg-card px-3 font-bold">
            o acceso administrador
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAdminPin(!showAdminPin)}
            className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 focus:outline-none py-1.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer"
          >
            <span>{showAdminPin ? "Ocultar panel de administrador" : "🔑 Acceso con PIN de Admin"}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdminPin ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdminPin && (
          <form onSubmit={handleAdminLogin} className="mt-4 space-y-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-muted-foreground mb-1 text-center">
                Código PIN de Administrador
              </label>
              <input
                type="password"
                required
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition text-center text-xl tracking-[0.2em] font-mono font-bold"
                placeholder="••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/95 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verificando..." : "Acceder ahora"}
            </button>
          </form>
        )}

        {/* General Disclaimer Message */}
        <div className="mt-5 pt-3 border-t border-border/50 text-[10px] sm:text-[11px] text-muted-foreground/80 text-center leading-normal">
          <strong>Aviso Legal:</strong> Esta plataforma es de uso privado y restringido. Todo acceso o intento de acceso no autorizado queda registrado para seguridad del sistema.
        </div>
      </div>
    </div>
  );
}
