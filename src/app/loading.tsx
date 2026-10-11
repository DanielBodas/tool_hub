import React from "react";
import { BrandLogo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#090d16] text-white select-none transition-opacity duration-300">
      <div className="relative flex flex-col items-center gap-6 p-6 text-center">
        {/* Glowing background ring behind logo */}
        <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 blur-2xl animate-pulse" />

        {/* Animated Brand Logo */}
        <div className="relative transition-transform duration-300 hover:scale-105">
          <BrandLogo className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)] animate-pulse" />
        </div>

        <div className="relative flex flex-col items-center gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400">
            ToolHub
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 animate-pulse">
            Cargando aplicación...
          </p>
        </div>

        {/* Animated Loading Bar */}
        <div className="relative w-40 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-1 border border-slate-700/50">
          <div className="absolute inset-y-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
