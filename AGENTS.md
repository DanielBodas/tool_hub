<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ToolHub Architectural Context for AI Agents & Jules

Before creating new tools, modifying authentication, or editing submodules, read **[FRAMEWORK.md](file:///c:/Users/dani/Documents/projects/tool_hub/FRAMEWORK.md)**.

Key principles to preserve:
1. **Module Isolation**: Every new mini-tool MUST live inside `src/modules/<tool-id>/` with its own `metadata.ts`, `.env`, and `<ToolName>Module.tsx`.
2. **Dynamic Discovery**: Never manually register tools in a hardcoded list; `src/config/tools.ts` automatically discovers them from `src/modules/`.
3. **Environment Loading**: `loadAllToolEnvs()` in `src/lib/env.ts` loads tool-specific `.env` files into `process.env`.
4. **Maximized UI Space**: Wrap tool pages in `ToolBaseLayout` and ensure `AppHeader`/`AppFooter` remain hidden on `/tools/*` routes for maximum workspace real estate.
5. **Three-Tier Access Control**: Every tool has three access tiers — (1) Admin always passes, (2) Google users in `<TOOL_ID_UPPER>_ALLOWED_USERS` get direct access, (3) everyone else must use the tool PIN (`<TOOL_ID_UPPER>_PIN`). Both variables live in `src/modules/<tool-id>/.env`. If `ALLOWED_USERS` is empty or undefined, any Google session can access the tool (retrocompatible). Use `isUserAllowedForTool()` from `src/lib/toolAccess.ts` in server page components to compute `userBlocked` and pass it to `<ToolSecurityGate>`.
6. **Access Unlock API**: The endpoint for granting tool/dashboard access cookies is `POST /api/auth/unlock` (NOT `/api/auth/secondary` — that old name no longer exists).
