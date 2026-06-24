"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolSecurityGate } from "./ToolSecurityGate";
import { useSession } from "next-auth/react";
import { useSecurity } from "./SecurityProvider";

interface ToolBaseLayoutProps {
  children: React.ReactNode;
  toolId: string;
  toolName: string;
}

/**
 * ToolBaseLayout defines the shared UI and CSS guides for all tools.
 * It enforces visual inheritance and provides common navigation.
 */
export function ToolBaseLayout({ children, toolId, toolName }: ToolBaseLayoutProps) {
  const { data: session } = useSession();
  const { isToolUnlocked } = useSecurity();

  if (!session && !isToolUnlocked(toolId)) {
    return <ToolSecurityGate toolId={toolId} toolName={toolName} />;
  }

  return (
    <div className="min-h-screen pb-20">
        {/* Tool Breadcrumb/Nav: Visible only on mobile */}
        <div className="md:hidden bg-white border-b mb-8">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition"
            >
              <ArrowLeft size={16} /> Volver al Panel de Control
            </Link>
          </div>
        </div>

        {/* Main Content with common padding and width constraints */}
        <div className="container mx-auto px-4 pt-8 md:pt-12">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-12">
            {children}
          </div>
        </div>
    </div>
  );
}
