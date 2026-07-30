import { Scale } from "lucide-react";
import type { ToolMeta } from "@/config/tools";

/**
 * Metadata for the Baby Weight Tracker tool.
 * This is the single source of truth for everything the hub needs
 * to know about this tool: display info, routing, and auth config.
 */
export const metadata: ToolMeta = {
  id: "baby-weight-tracker",
  name: "Seguimiento de Peso",
  description:
    "Seguimiento del peso del bebé con soporte para múltiples básculas, márgenes y gráficos de velas.",
  icon: Scale,
  category: "Salud",
};
