"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SecurityContextType {
  unlockedTools: string[];
  unlock: (pin: string, toolId?: string, type?: "dashboard" | "tool") => Promise<boolean>;
  lock: (toolId?: string) => void;
  isToolUnlocked: (toolId?: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [unlockedTools, setUnlockedTools] = useState<string[]>([]);

  useEffect(() => {
    const status = sessionStorage.getItem("unlocked_tools");
    if (status) {
      try {
        const tools = JSON.parse(status);
        window.requestAnimationFrame(() => {
          setUnlockedTools(tools);
        });
      } catch (e) {
        console.error("Failed to parse unlocked tools", e);
      }
    }
  }, []);

  const isToolUnlocked = (toolId?: string) => {
    const id = toolId || "dashboard";
    return unlockedTools.includes(id);
  };

  const unlock = async (pin: string, toolId?: string, type: "dashboard" | "tool" = "tool") => {
    const id = toolId || "dashboard";
    try {
      const res = await fetch("/api/auth/secondary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, toolId, type }),
      });

      if (res.ok) {
        setUnlockedTools(prev => {
          if (prev.includes(id)) return prev;
          const newTools = [...prev, id];
          sessionStorage.setItem("unlocked_tools", JSON.stringify(newTools));
          return newTools;
        });
        return true;
      }
    } catch (error) {
      console.error("Secondary auth failed", error);
    }
    return false;
  };

  const lock = (toolId?: string) => {
    const id = toolId || "dashboard";
    setUnlockedTools(prev => {
      const newTools = prev.filter(t => t !== id);
      sessionStorage.setItem("unlocked_tools", JSON.stringify(newTools));
      return newTools;
    });
  };

  return (
    <SecurityContext.Provider value={{ unlockedTools, unlock, lock, isToolUnlocked }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
