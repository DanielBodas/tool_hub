export interface ItemComponent {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  stats: string;
}

export interface CompletedItem {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  recipe: [string, string];
  effect: string;
  bestRoles: string[];
}

export const ITEM_COMPONENTS: Record<string, ItemComponent> = {
  "hp-up": { id: "hp-up", name: "HP Up", nameEs: "Más PS", icon: "🧪", stats: "+10% PS máx" },
  protein: { id: "protein", name: "Protein", nameEs: "Proteína", icon: "🍖", stats: "+12% Ataque" },
  calcium: { id: "calcium", name: "Calcium", nameEs: "Calcio", icon: "🥛", stats: "+12% Atq. Especial" },
  carbos: { id: "carbos", name: "Carbos", nameEs: "Carburante", icon: "💊", stats: "+8% Vel. Ataque" },
};

export const COMPLETED_ITEMS: CompletedItem[] = [
  {
    id: "leftovers",
    name: "Leftovers",
    nameEs: "Restos",
    icon: "🍎",
    recipe: ["hp-up", "hp-up"],
    effect: "+10% PS x2 · Regenera 1% de PS máx por segundo",
    bestRoles: ["Tanque", "Soporte"],
  },
  {
    id: "rocky-helmet",
    name: "Rocky Helmet",
    nameEs: "Casco Dentado",
    icon: "🪖",
    recipe: ["hp-up", "protein"],
    effect: "+10% PS · +12% Atq · Devuelve el 18% del daño de ataques básicos recibidos",
    bestRoles: ["Tanque", "Luchador"],
  },
  {
    id: "shell-bell",
    name: "Shell Bell",
    nameEs: "Campana Alivio",
    icon: "🔔",
    recipe: ["hp-up", "calcium"],
    effect: "+10% PS · +12% Atq. Sp · Drenaje: cura un 15% del daño infligido",
    bestRoles: ["Daño Mágico", "Soporte"],
  },
  {
    id: "focus-sash",
    name: "Focus Sash",
    nameEs: "Banda Focus",
    icon: "🎗️",
    recipe: ["hp-up", "carbos"],
    effect: "+10% PS · +8% Vel. Atq · Sobrevive a un golpe letal con 1 PS (inmune 1.5s y gana escudo del 10%)",
    bestRoles: ["Carry", "Cualquiera"],
  },
  {
    id: "choice-band",
    name: "Choice Band",
    nameEs: "Cinta Elección",
    icon: "🎀",
    recipe: ["protein", "protein"],
    effect: "+45% Ataque",
    bestRoles: ["Carry Físico", "Asesino"],
  },
  {
    id: "life-orb",
    name: "Life Orb",
    nameEs: "Vidasfera",
    icon: "🔮",
    recipe: ["protein", "calcium"],
    effect: "+12% Atq · +12% Atq. Sp · +24% Daño total infligido; pierde 2% PS por ataque",
    bestRoles: ["Carry Mixto", "Daño explosivo"],
  },
  {
    id: "scope-lens",
    name: "Scope Lens",
    nameEs: "Periscopio",
    icon: "🔍",
    recipe: ["protein", "carbos"],
    effect: "+12% Atq · +8% Vel. Atq · +25% Prob. Crítico en ataques básicos (daño x1.9)",
    bestRoles: ["Carry Físico"],
  },
  {
    id: "choice-specs",
    name: "Choice Specs",
    nameEs: "Gafas Elegidas",
    icon: "👓",
    recipe: ["calcium", "calcium"],
    effect: "+45% Ataque Especial",
    bestRoles: ["Carry Mágico", "Habilidad"],
  },
  {
    id: "quick-claw",
    name: "Quick Claw",
    nameEs: "Garra Rápida",
    icon: "🦅",
    recipe: ["calcium", "carbos"],
    effect: "+12% Atq. Sp · +8% Vel. Atq · Comienza con 20% energía y recupera 8% al usar habilidad",
    bestRoles: ["Carry Mágico", "Habilidad acelerada"],
  },
  {
    id: "choice-scarf",
    name: "Choice Scarf",
    nameEs: "Pañuelo Elección",
    icon: "🧣",
    recipe: ["carbos", "carbos"],
    effect: "+35% Velocidad de Ataque",
    bestRoles: ["Carry Físico", "Ataque rápido"],
  },
];
