"use client";

import Link from "next/link";
import { SecurityStatus } from "./SecurityStatus";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function MobileHeader() {
  const { data: session } = useSession();

  return (
    <header className="md:hidden border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-blue-600 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <span className="text-xl">T</span>
          </div>
          <span className="sr-only sm:not-sr-only">ToolPlatform</span>
        </Link>

        <div className="flex items-center gap-3">
          <SecurityStatus />

          {session ? (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <User size={16} />
                </div>
                <button
                    onClick={() => signOut()}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <LogOut size={18} />
                </button>
            </div>
          ) : (
            <Link
                href="/login"
                className="text-xs font-bold px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition shadow-sm"
            >
                Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
