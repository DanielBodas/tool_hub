"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SecurityContextType {
  isUnlocked: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // We could check if the cookie exists here, but usually,
    // the server will handle the redirection if the cookie is missing.
    // For UI purposes, we'll use a session storage flag as well.
    const status = sessionStorage.getItem("security_unlocked");
    if (status === "true") {
      window.requestAnimationFrame(() => {
        setIsUnlocked(true);
      });
    }
  }, []);

  const unlock = async (pin: string) => {
    try {
      const res = await fetch("/api/auth/secondary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        setIsUnlocked(true);
        sessionStorage.setItem("security_unlocked", "true");
        return true;
      }
    } catch (error) {
      console.error("Secondary auth failed", error);
    }
    return false;
  };

  const lock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("security_unlocked");
    // In a full implementation, we'd also call an API to clear the cookie
  };

  return (
    <SecurityContext.Provider value={{ isUnlocked, unlock, lock }}>
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
