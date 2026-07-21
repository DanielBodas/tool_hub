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
