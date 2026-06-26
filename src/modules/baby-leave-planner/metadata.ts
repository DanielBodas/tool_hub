import { Baby } from "lucide-react";
import type { ToolMeta } from "@/config/tools";

/**
 * Metadata for the Baby Leave Planner tool.
 * This is the single source of truth for everything the hub needs
 * to know about this tool: display info, routing, and auth config.
 *
 * To register this tool in the hub, add one import line to src/config/tools.ts.
 * PIN env var: BABY_LEAVE_PLANNER_PIN (see example.env in this folder)
 */
export const metadata: ToolMeta = {
  id: "baby-leave-planner",
  name: "Permiso de Nacimiento",
  description:
    "Planifica los días de permiso por nacimiento para madre y padre en España.",
  icon: Baby,
  category: "Productividad",
};
