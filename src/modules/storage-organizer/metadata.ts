import { Boxes } from "lucide-react";
import type { ToolMeta } from "@/config/tools";

/**
 * Metadata for the Storage Organizer tool.
 * This is the single source of truth for everything the hub needs
 * to know about this tool.
 */
export const metadata: ToolMeta = {
  id: "storage-organizer",
  name: "Organizador de Trastero",
  description:
    "Organiza las estanterías, baldas y cajas de tu trastero de forma ultra compacta y visual.",
  icon: Boxes,
  category: "Productividad",
};
