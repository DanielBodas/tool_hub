import { LucideIcon, Calculator, Globe } from "lucide-react";

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
