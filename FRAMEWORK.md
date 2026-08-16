# ToolHub Agentic Architecture & Framework Guide

> **Context Document for AI Agents (Jules, Claude Code, Antigravity, etc.)**  
> Read this document to understand the architecture, conventions, authentication flow, and step-by-step workflow for adding new mini-tools to this repository.

---

## 1. Project Overview

**ToolHub** is a modular, scalable framework built with Next.js (App Router), React, TailwindCSS, NextAuth, and MongoDB. It allows rapid creation and deployment of independent mini-applications ("tools"), each isolated within its own module directory, under a unified master dashboard and security model.

---

## 2. Core Architectural Principles

### 📁 2.1 Module Isolation (`src/modules/<tool-id>/`)
Every mini-tool is an isolated entity residing in `src/modules/<tool-id>/`.  
A mini-tool directory **must** contain:
- `metadata.ts`: Exports tool display details and routing metadata.
- `.env` / `example.env`: Tool-specific environment variables (e.g. tool access PIN, MongoDB database/collection names).
- `<ToolName>Module.tsx`: The core React component representing the tool UI and business logic.
- Utility functions or helper files needed by the tool.

### 🔍 2.2 Dynamic Tool Discovery
Tools are automatically discovered by scanning `src/modules/` at server runtime via `src/config/tools.ts`.  
- **No manual tool registry edits are required.**
- Adding a valid module folder with a `metadata.ts` automatically generates a card on the `/dashboard` and routes to `/tools/<tool-id>`.

### 🔐 2.3 Modular Environment Variables (`src/lib/env.ts`)
- **Global `.env`**: Located at the project root. Contains shared infrastructure keys like `MONGODB_URI`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_CODE`.
- **Tool `.env`**: Located inside `src/modules/<tool-id>/.env`. Contains tool-specific variables (e.g. `FINANCE_TRACKER_PIN=4444`, `BABY_LEAVE_PLANNER_DB_NAME=baby_leave`).
- **Automatic Loading**: `loadAllToolEnvs()` in `src/lib/env.ts` scans all module directories and injects tool `.env` values into `process.env` dynamically without modifying root config.

### 🛡️ 2.4 Unified Authentication & Access Control (Three-Tier Model)

Access to every tool is controlled by three ordered tiers:

1. **Admin Access** (unrestricted):
   - Logged in via Admin Code (`ADMIN_CODE` in root `.env`) or Google OAuth with role `admin`.
   - Bypasses all tool-level access restrictions.
   - Session duration: **30 days** (JWT).

2. **Per-Tool User Whitelist** (`<TOOL_ID_UPPER>_ALLOWED_USERS`):
   - A comma-separated list of Google email addresses stored in the tool's `.env`.
   - If the variable is **not defined or empty** → any Google session can access the tool (retrocompatible).
   - If the variable **is defined** → only listed emails get direct access.
   - Users with a valid Google session who are **NOT** on the whitelist are shown the PIN gate with a "no tienes acceso" message (`userBlocked=true`).
   - Logic lives in `src/lib/toolAccess.ts` → `isUserAllowedForTool(toolId, email, role)`.

3. **Emergency PIN Access** (`<TOOL_ID_UPPER>_PIN`):
   - Any user (with or without a session) can enter the tool using its PIN.
   - Sets a 30-day persistent cookie (`auth_tool_<toolId>`) and updates `localStorage`.
   - API endpoint: `POST /api/auth/unlock` (formerly `secondary`).

4. **Unified Logout (`/api/auth/logout`)**:
   - Calling `lock()` or `/api/auth/logout` clears all server HTTP cookies (`auth_dashboard`, `auth_tool_*`, NextAuth tokens) and client `localStorage`, then redirects to `/login`.

### 🎨 2.5 Maximized Full-Viewport UX (`ToolBaseLayout`)
- Global headers (`AppHeader`) and footers (`AppFooter`) automatically **hide** when visiting any tool route (`/tools/*`).
- Tools are wrapped in `ToolBaseLayout` which renders a compact 48px top-bar (`← Salir al Dashboard`, Tool Title, Logout) and gives **95%+ of the screen height and width** to the mini-tool workspace.

---

## 3. Step-by-Step Guide: How to Add a New Mini-Tool

Follow these exact steps when asked to create a new tool `<tool-id>` (e.g., `invoice-generator`):

### Step 1: Create the Module Folder
Create `src/modules/<tool-id>/`.

### Step 2: Create `metadata.ts`
Create `src/modules/<tool-id>/metadata.ts`:
```typescript
import { FileText } from "lucide-react"; // Choose a suitable Lucide icon
import type { ToolMeta } from "@/config/tools";

export const metadata: ToolMeta = {
  id: "invoice-generator",
  name: "Generador de Facturas",
  description: "Crea y exporta facturas profesionales rápidamente.",
  icon: FileText,
  category: "Finanzas",
};
```

### Step 3: Create `example.env` and `.env`
Create `src/modules/<tool-id>/example.env`:
```env
# PIN de acceso exclusivo para la herramienta
INVOICE_GENERATOR_PIN=1234
# Configuración de base de datos específica (opcional)
INVOICE_GENERATOR_DB_NAME=invoices
# Lista de emails de Google con acceso directo (separados por comas).
# Si no se define o está vacío, cualquier sesión Google puede acceder.
INVOICE_GENERATOR_ALLOWED_USERS=usuario1@gmail.com,usuario2@gmail.com
```
Also create `src/modules/<tool-id>/.env` with local default values (set `ALLOWED_USERS=` empty to allow all sessions during development).

### Step 4: Create the Module Component
Create `src/modules/<tool-id>/InvoiceGeneratorModule.tsx`:
```tsx
"use client";

import React from "react";

export function InvoiceGeneratorModule() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Generador de Facturas</h1>
      <p className="text-muted-foreground">Tu espacio de trabajo para facturación.</p>
    </div>
  );
}
```

### Step 5: Create the App Router Page
Create `src/app/tools/<tool-id>/page.tsx`:
```tsx
import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { InvoiceGeneratorModule } from "@/modules/invoice-generator/InvoiceGeneratorModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function InvoiceGeneratorPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_tool_invoice-generator")?.value === "true";

  if (!session && !isUnlocked) {
    return (
      <ToolSecurityGate
        toolId="invoice-generator"
        toolName="Generador de Facturas"
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Generador de Facturas">
      <InvoiceGeneratorModule />
    </ToolBaseLayout>
  );
}
```

### Step 6 (Optional): Add API Backend Route
If the tool requires MongoDB persistence, create `src/app/api/<tool-id>/route.ts`:
```typescript
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";

loadAllToolEnvs();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = await cookies();
    const isUnlocked = cookieStore.get("auth_tool_invoice-generator")?.value === "true" || cookieStore.get("auth_dashboard")?.value === "true";

    if (!session && !isUnlocked) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.INVOICE_GENERATOR_DB_NAME || "invoices");
    const items = await db.collection("records").find({}).toArray();

    return NextResponse.json(items);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
```

---

## 4. Key Directory Map

```txt
tool_hub/
├── example.env                       # Global template environment variables
├── FRAMEWORK.md                      # This architectural guide for AI agents
├── src/
│   ├── app/                          # Next.js App Router (pages & API routes)
│   │   ├── api/                      # Backend endpoints (auth, logout, tools)
│   │   ├── dashboard/                # Main tool switcher card grid
│   │   ├── login/                    # Unified authentication portal
│   │   └── tools/[toolId]/           # Dynamic tool container pages
│   ├── components/                   # Shared UI components
│   │   ├── AppHeader.tsx             # Global header (hides on /tools/*)
│   │   ├── AppFooter.tsx             # Global footer (hides on /tools/*)
│   │   ├── HeaderNav.tsx             # Unified header status & logout control
│   │   ├── SecurityProvider.tsx      # Security context & localStorage manager
│   │   ├── ToolBaseLayout.tsx        # Compact 48px top-bar container for tools
│   │   └── ToolSecurityGate.tsx      # Tool-specific PIN unlock screen
│   ├── config/
│   │   └── tools.ts                  # Auto-discovery scanner for src/modules/
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── env.ts                    # Dynamic .env loader for submodules
│   │   ├── mongodb.ts                # Shared MongoDB MongoClient promise
│   │   └── toolAccess.ts             # Per-tool user whitelist checker (isUserAllowedForTool)
│   └── modules/                      # Isolated mini-tool packages
│       ├── baby-leave-planner/
│       └── finance-tracker/
```

---

## 5. Verification Checklist for Agents

When making updates to the framework:
1. Run `npm run lint` to ensure zero TypeScript and ESLint warnings.
2. Run `npm run build` to confirm static page generation and route compilation pass cleanly.
