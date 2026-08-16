"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { signOut } from "next-auth/react";

interface SecurityContextType {
  unlockedTools: string[];
  unlock: (
    pin: string,
    toolId?: string,
    type?: "dashboard" | "tool",
  ) => Promise<boolean>;
  lock: (toolId?: string) => Promise<void>;
  isToolUnlocked: (toolId?: string) => boolean;
  hasSession: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined,
);

export function SecurityProvider({ 
  children,
  initialUnlockedTools = [],
  hasSession = false
}: { 
  children: React.ReactNode,
  initialUnlockedTools?: string[],
  hasSession?: boolean
}) {
  const [unlockedTools, setUnlockedTools] = useState<string[]>(initialUnlockedTools);

  useEffect(() => {
    const status = localStorage.getItem("unlocked_tools");
    let storedTools: string[] = [];
    if (status) {
      try {
        storedTools = JSON.parse(status);
      } catch (e) {
        console.error("Failed to parse unlocked tools", e);
      }
    }
    
    // Merge server cookies state with localStorage state
    const mergedTools = Array.from(new Set([...initialUnlockedTools, ...storedTools]));
    
    window.requestAnimationFrame(() => {
      setUnlockedTools(mergedTools);
      localStorage.setItem("unlocked_tools", JSON.stringify(mergedTools));
    });
  }, [initialUnlockedTools]);

  const isToolUnlocked = useCallback((toolId?: string) => {
    if (hasSession) return true;
    const id = toolId || "dashboard";
    return unlockedTools.includes(id);
  }, [hasSession, unlockedTools]);

  const unlock = useCallback(async (
    pin: string,
    toolId?: string,
    type: "dashboard" | "tool" = "tool",
  ) => {
    const id = toolId || "dashboard";
    try {
      const res = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, toolId, type }),
      });

      if (res.ok) {
        setUnlockedTools((prev) => {
          if (prev.includes(id)) return prev;
          const newTools = [...prev, id];
          localStorage.setItem("unlocked_tools", JSON.stringify(newTools));
          return newTools;
        });
        return true;
      }
    } catch (error) {
      console.error("Secondary auth failed", error);
    }
    return false;
  }, []);

  const lock = useCallback(async (toolId?: string) => {
    const id = toolId || "dashboard";

    // Clear server-side cookies
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Failed to clear server cookies", e);
    }

    // Clear client-side local storage
    if (!toolId || toolId === "dashboard") {
      localStorage.removeItem("unlocked_tools");
      setUnlockedTools([]);
    } else {
      setUnlockedTools((prev) => {
        const newTools = prev.filter((t) => t !== id);
        localStorage.setItem("unlocked_tools", JSON.stringify(newTools));
        return newTools;
      });
    }

    // Sign out from NextAuth if session exists
    if (hasSession) {
      await signOut({ redirect: false });
    }

    // Redirect to login
    window.location.href = "/login";
  }, [hasSession]);

  const contextValue = useMemo(() => ({
    unlockedTools,
    unlock,
    lock,
    isToolUnlocked,
    hasSession
  }), [unlockedTools, unlock, lock, isToolUnlocked, hasSession]);

  return (
    <SecurityContext.Provider value={contextValue}>
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
