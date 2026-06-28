import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Link from "next/link";

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

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}
      >
        <AuthProvider>
          <header className="border-b border-border bg-card sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-bold text-xl">
                  ToolPlatform
                </Link>
                <nav className="hidden md:flex gap-4">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium hover:underline"
                  >
                    Panel
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                {session ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground hidden md:inline-block">
                      {session.user?.name}
                    </span>
                    <Link
                      href="/api/auth/signout"
                      className="text-sm font-medium px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition"
                    >
                      Salir
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-medium px-4 py-2 bg-muted rounded-lg hover:opacity-80 transition"
                  >
                    Entrar
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main className="flex-grow">{children}</main>
          <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ToolPlatform. Todos los derechos
            reservados.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
