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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <header className="border-b bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="font-bold text-xl">ToolPlatform</Link>
              <nav className="flex gap-4">
                <Link href="/dashboard" className="text-sm font-medium hover:underline">Panel</Link>
                <Link href="/login" className="text-sm font-medium hover:underline">Entrar</Link>
              </nav>
            </div>
          </header>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="border-t py-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} ToolPlatform. Todos los derechos reservados.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
