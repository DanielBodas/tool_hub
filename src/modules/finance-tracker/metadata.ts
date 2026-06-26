import { PiggyBank } from "lucide-react";
import type { ToolMeta } from "@/config/tools";

/**
 * Metadata for the Finance Tracker tool.
 * This is the single source of truth for everything the hub needs
 * to know about this tool: display info, routing, and auth config.
 *
 * To register this tool in the hub, add one import line to src/config/tools.ts.
 * PIN env var: FINANCE_TRACKER_PIN (see example.env in this folder — create if missing)
 */
export const metadata: ToolMeta = {
  id: "finance-tracker",
  name: "Gestor Financiero",
  description:
    "Seguimiento de ahorros, inversiones y préstamos en un solo lugar.",
  icon: PiggyBank,
  category: "Finanzas",
};
