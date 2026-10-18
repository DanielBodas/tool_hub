export interface MetaBuildItem {
  id: string;
  name: string;
  tier: "S" | "A" | "B" | "C" | "D";
  level: number;
  winRate: number;
  description: string;
  strategy: string;
  conditions: string;
  units: {
    pokemonId: string;
    stars: 1 | 2 | 3;
    items?: string[];
  }[];
  activeSynergies: {
    type: string;
    count: number;
  }[];
  source: string;
  updatedAt: string;
}

export const META_BUILDS: MetaBuildItem[] = [
  {
    id: "grass-kadabra-reroll",
    name: "Grass Kadabra Reroll",
    tier: "S",
    level: 7,
    winRate: 73,
    description: "Composición Reroll Nivel 7 enfocada en llevar a 3★ a Venusaur, Electrode y Gengar.",
    strategy: "Mantén economía baja de nivel 6 a 7 para buscar Kadabra 3★ y Venusaur 3★. Kadabra y Venusaur hacen el grueso del daño y tanqueo mientras las sinergias de Planta y Veneno regeneran el equipo.",
    conditions: "Requiere conseguir copias tempranas de Bulbasaur/Abra y objetos de AP/Defensa (Choice Specs, Focus Sash, Leftovers).",
    units: [
      { pokemonId: "bulbasaur", stars: 3, items: ["leftovers", "focus-sash"] },
      { pokemonId: "abra", stars: 3, items: ["life-orb", "focus-sash", "focus-sash"] },
      { pokemonId: "gastly", stars: 3, items: [] },
      { pokemonId: "oddish", stars: 3, items: [] },
      { pokemonId: "voltorb", stars: 2, items: [] },
      { pokemonId: "exeggcute", stars: 2, items: ["shell-bell"] },
      { pokemonId: "magnemite", stars: 1, items: [] },
    ],
    activeSynergies: [
      { type: "Grass", count: 3 },
      { type: "Poison", count: 3 },
      { type: "Psychic", count: 2 },
      { type: "Electric", count: 2 },
      { type: "Ghost", count: 1 },
    ],
    source: "KantoTactics.org (Build v32)",
    updatedAt: "17 Oct 2026",
  },
  {
    id: "water-vaporeon-reroll",
    name: "Water Vaporeon Reroll",
    tier: "S",
    level: 7,
    winRate: 70,
    description: "Composición de Agua Nivel 7 orientada a Reroll a 3★ (Golduck, Blastoise, Vaporeon).",
    strategy: "Aprovecha la ganancia masiva de Energía extra por ataque de la sinergia de Agua (6 Agua = +30 energía/ataque) para castear habilidades sin cesar con Vaporeon y Golduck.",
    conditions: "Requiere acumular componentes de Calcio para equipar a Vaporeon con Múltiples Choice Specs o Quick Claw.",
    units: [
      { pokemonId: "squirtle", stars: 3, items: [] },
      { pokemonId: "psyduck", stars: 3, items: ["focus-sash"] },
      { pokemonId: "vaporeon", stars: 3, items: ["choice-specs", "choice-specs", "choice-specs"] },
      { pokemonId: "jynx", stars: 2, items: [] },
      { pokemonId: "seel", stars: 2, items: [] },
      { pokemonId: "slowpoke", stars: 2, items: ["leftovers", "leftovers"] },
      { pokemonId: "staryu", stars: 1, items: [] },
    ],
    activeSynergies: [
      { type: "Water", count: 6 },
      { type: "Psychic", count: 3 },
      { type: "Ice", count: 2 },
    ],
    source: "KantoTactics.org (Build v32)",
    updatedAt: "17 Oct 2026",
  },
  {
    id: "electric-raichu-reroll",
    name: "Electric Raichu Reroll",
    tier: "B",
    level: 7,
    winRate: 53,
    description: "Composición hiper-rápida de Eléctricos con Raichu, Electrode y Gengar.",
    strategy: "Proporciona energía inicial a todo el equipo al activar Eléctrico (4). Raichu destroza al equipo enemigo con críticos masivos de Scope Lens mientras Electrode hace de señuelo y control.",
    conditions: "Priorizar Scope Lens y Focus Sash en Pikachu/Raichu.",
    units: [
      { pokemonId: "gastly", stars: 3, items: [] },
      { pokemonId: "jolteon", stars: 3, items: [] },
      { pokemonId: "pikachu", stars: 3, items: ["scope-lens", "scope-lens", "focus-sash"] },
      { pokemonId: "voltorb", stars: 2, items: [] },
      { pokemonId: "electabuzz", stars: 2, items: ["leftovers", "leftovers"] },
      { pokemonId: "exeggcute", stars: 2, items: ["choice-specs"] },
      { pokemonId: "jynx", stars: 1, items: [] },
    ],
    activeSynergies: [
      { type: "Electric", count: 4 },
      { type: "Psychic", count: 2 },
      { type: "Ghost", count: 1 },
    ],
    source: "KantoTactics.org (Build v32)",
    updatedAt: "17 Oct 2026",
  },
  {
    id: "psychic-starmie",
    name: "Psychic Starmie Carry",
    tier: "S",
    level: 8,
    winRate: 69,
    description: "Composición de Nivel 8 con Starmie de Coste 4 como Carry Mágico principal.",
    strategy: "Alcanza 5 Psíquicos (+140% daño de habilidades) y 4 Agua. Starmie devasta la línea enemiga protegida por la tremenda resiliencia de Rhydon y Slowbro.",
    conditions: "Equipar a Starmie con Focus Sash y Choice Specs. Mantener línea frontal resistente.",
    units: [
      { pokemonId: "squirtle", stars: 2, items: [] },
      { pokemonId: "abra", stars: 2, items: ["focus-sash"] },
      { pokemonId: "psyduck", stars: 2, items: [] },
      { pokemonId: "exeggcute", stars: 2, items: [] },
      { pokemonId: "jynx", stars: 2, items: [] },
      { pokemonId: "slowpoke", stars: 2, items: [] },
      { pokemonId: "rhyhorn", stars: 2, items: ["leftovers", "focus-sash"] },
      { pokemonId: "staryu", stars: 2, items: ["focus-sash", "focus-sash", "focus-sash"] },
    ],
    activeSynergies: [
      { type: "Psychic", count: 5 },
      { type: "Water", count: 4 },
    ],
    source: "KantoTactics.org (Build v32)",
    updatedAt: "17 Oct 2026",
  },
  {
    id: "ground-aerodactyl",
    name: "Ground Aerodactyl",
    tier: "B",
    level: 8,
    winRate: 52,
    description: "Composición pesada de Tierra/Roca Nivel 8 con Aerodactyl de Carry Físico.",
    strategy: "Aprovecha la reducción de daño de Tierra (4 Tierra = -19% daño) y Roca para sostener el combate mientras Aerodactyl asesta impactos críticos con Scope Lens.",
    conditions: "Acumular Protein + Carbos para armar múltiples Scope Lens en Aerodactyl.",
    units: [
      { pokemonId: "geodude", stars: 2, items: [] },
      { pokemonId: "nidoran", stars: 2, items: [] },
      { pokemonId: "ekans", stars: 2, items: [] },
      { pokemonId: "gastly", stars: 2, items: ["focus-sash"] },
      { pokemonId: "jynx", stars: 2, items: [] },
      { pokemonId: "onix", stars: 2, items: [] },
      { pokemonId: "aerodactyl", stars: 2, items: ["scope-lens", "scope-lens", "scope-lens"] },
      { pokemonId: "rhyhorn", stars: 2, items: ["leftovers", "leftovers"] },
    ],
    activeSynergies: [
      { type: "Ground", count: 4 },
      { type: "Rock", count: 4 },
      { type: "Poison", count: 3 },
      { type: "Ghost", count: 1 },
    ],
    source: "KantoTactics.org (Build v32)",
    updatedAt: "17 Oct 2026",
  },
];
