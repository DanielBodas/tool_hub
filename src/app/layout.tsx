import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { SecurityProvider } from "@/components/SecurityProvider";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090d16",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ToolHub Platform",
  description: "Plataforma modular para herramientas de desarrollo rápido",
  manifest: "/manifest.json",
  icons: {
    apple: [{ url: "/toolhub-icon", sizes: "512x512", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ToolHub",
    startupImage: [{
      url: "/ios-launch-image",
      media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
    }],
  },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialUnlockedTools: string[] = [];

  for (const cookie of cookieStore.getAll()) {
    if (cookie.name === "auth_dashboard" && cookie.value === "true") {
      initialUnlockedTools.push("dashboard");
    } else if (cookie.name.startsWith("auth_tool_") && cookie.value === "true") {
      initialUnlockedTools.push(cookie.name.replace("auth_tool_", ""));
    }
  }

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}
      >
        <AuthProvider>
          <SecurityProvider initialUnlockedTools={initialUnlockedTools}>
            <AppHeader />
            <main className="flex-grow flex flex-col">{children}</main>
            <AppFooter />
          </SecurityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
