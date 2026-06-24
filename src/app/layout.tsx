import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SecurityProvider } from "@/components/SecurityProvider";
import Link from "next/link";
import { SecurityStatus } from "@/components/SecurityStatus";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50/50`}>
        <AuthProvider>
          <SecurityProvider>
            <div className="flex min-h-screen">
              {/* Sidebar: Only visible on desktop */}
              <Sidebar />

              <div className="flex-1 flex flex-col min-w-0">
                {/* Header: Visible only on mobile */}
                <MobileHeader />

                <main className="flex-grow">
                  {children}
                </main>

                <footer className="border-t py-6 text-center text-sm text-gray-500 bg-white">
                  © {new Date().getFullYear()} ToolPlatform. Todos los derechos reservados.
                </footer>
              </div>
            </div>
          </SecurityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
