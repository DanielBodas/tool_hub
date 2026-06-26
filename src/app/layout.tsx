import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SecurityProvider } from "@/components/SecurityProvider";
import Link from "next/link";
import { SecurityStatus } from "@/components/SecurityStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tool Switcher Platform",
  description: "Una plataforma escalable para tus herramientas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <AuthProvider>
          <SecurityProvider>
            <header className="border-b dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link href="/" className="font-bold text-xl">ToolPlatform</Link>
                  <nav className="hidden md:flex gap-4">
                    <Link href="/dashboard" className="text-sm font-medium hover:underline">Panel</Link>
                  </nav>
                </div>
                <div className="flex items-center gap-4">
                  <SecurityStatus />
                  <Link href="/login" className="text-sm font-medium px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">Entrar</Link>
                </div>
              </div>
            </header>
            <main className="flex-grow">
              {children}
            </main>
            <footer className="border-t dark:border-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} ToolPlatform. Todos los derechos reservados.
            </footer>
          </SecurityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
