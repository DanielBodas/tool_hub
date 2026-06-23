import { LucideIcon, Calculator, Globe, PiggyBank } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: string;
}

export const tools: Tool[] = [
  {
    id: "finance-tracker",
    name: "Gestor Financiero",
    description: "Seguimiento de ahorros, inversiones y préstamos en un solo lugar.",
    icon: PiggyBank,
    href: "/tools/finance-tracker",
    category: "Finanzas",
  },
  {
    id: "tool-one",
    name: "Herramienta Uno",
    description: "Una descripción breve de lo que hace la herramienta uno.",
    icon: Calculator,
    href: "/tools/tool-one",
    category: "Productividad",
  },
  {
    id: "tool-two",
    name: "Herramienta Dos",
    description: "Una descripción breve de lo que hace la herramienta dos.",
    icon: Globe,
    href: "/tools/tool-two",
    category: "Web",
  },
];
