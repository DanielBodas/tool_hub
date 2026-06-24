"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tools } from "@/config/tools";
import { LayoutDashboard, Home, LogOut } from "lucide-react";
import { SecurityStatus } from "./SecurityStatus";
import { useSession, signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Panel", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 bg-white border-r h-screen sticky top-0 overflow-y-auto shrink-0">
      <div className="p-8">
        <Link href="/" className="font-bold text-2xl text-blue-600 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <span className="text-xl">T</span>
          </div>
          ToolPlatform
        </Link>
      </div>

      <nav className="flex-1 px-6 space-y-10">
        <div>
          <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
            Navegación
          </h3>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
            Mis Herramientas
          </h3>
          <div className="space-y-1">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = pathname.startsWith(tool.href);
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {tool.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-6 border-t bg-gray-50/50 space-y-4">
        <div className="px-2">
            <SecurityStatus />
        </div>

        {session ? (
            <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-gray-900 truncate">{session.user?.name}</span>
                    <span className="text-[10px] text-gray-400 truncate">{session.user?.email}</span>
                </div>
                <button
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Cerrar sesión"
                >
                    <LogOut size={16} />
                </button>
            </div>
        ) : (
            <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
                Entrar
            </Link>
        )}
      </div>
    </aside>
  );
}
