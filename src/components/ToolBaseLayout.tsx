"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ToolBaseLayoutProps {
  children: React.ReactNode;
  toolId: string;
  toolName: string;
}

/**
 * ToolBaseLayout defines the shared UI and CSS guides for all tools.
 * It enforces visual inheritance and provides common navigation.
 */
export function ToolBaseLayout({
  children,
  toolId,
  toolName,
}: ToolBaseLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
      {/* Tool Breadcrumb/Nav */}
      <div className="bg-card border-b border-border mb-8">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft size={16} /> Volver al Panel de Control
          </Link>
        </div>
      </div>

      {/* Main Content with common padding and width constraints */}
      <div className="container mx-auto md:px-4">
        <div className="bg-card md:rounded-3xl md:border border-border md:shadow-sm md:p-10 text-card-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
