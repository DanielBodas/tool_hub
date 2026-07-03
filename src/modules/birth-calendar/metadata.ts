import { Calendar } from "lucide-react";
import type { ToolMeta } from "@/config/tools";

/**
 * Metadata for the Birth Calendar tool.
 */
export const metadata: ToolMeta = {
  id: "birth-calendar",
  name: "Calendario de Nacimiento",
  description: "Tabla de referencia para fechas probables de parto y concepción.",
  icon: Calendar,
  category: "Salud",
};
