export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Grass"
  | "Electric"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon";

export interface SynergyThreshold {
  count: number;
  bonus: string;
}

export interface SynergyDefinition {
  type: PokemonType;
  nameEs: string;
  color: string;
  badgeBg: string;
  icon: string;
  thresholds: SynergyThreshold[];
  description: string;
  /** Special rules or exceptions (e.g. Gyarados & Dragonite non-flying synergy) */
  specialNote?: string;
}

export const SYNERGIES_DATA: Record<PokemonType, SynergyDefinition> = {
  Normal: {
    type: "Normal",
    nameEs: "Normal",
    color: "#A8A878",
    badgeBg: "bg-stone-500/20 text-stone-300 border-stone-500/30",
    icon: "⚪",
    thresholds: [
      { count: 2, bonus: "+18% Daño y Velocidad de Ataque" },
      { count: 4, bonus: "+32% Daño y Velocidad de Ataque" },
      { count: 6, bonus: "+50% Daño y Velocidad de Ataque" },
    ],
    description: "Los tipo Normal ganan bonificación de daño y velocidad de ataque.",
  },
  Fire: {
    type: "Fire",
    nameEs: "Fuego",
    color: "#F08030",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "🔥",
    thresholds: [
      { count: 2, bonus: "Quemadura de 60 daño/s durante 3s" },
      { count: 4, bonus: "Quemadura de 160 daño/s durante 3s" },
      { count: 5, bonus: "Quemadura de 240 daño/s durante 3s" },
    ],
    description: "Los ataques de tipo Fuego queman al objetivo haciendo daño continuo.",
  },
  Water: {
    type: "Water",
    nameEs: "Agua",
    color: "#6890F0",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "💧",
    thresholds: [
      { count: 2, bonus: "+6 Energía extra por ataque" },
      { count: 4, bonus: "+24 Energía extra por ataque" },
      { count: 6, bonus: "+30 Energía extra por ataque" },
    ],
    description: "Los tipo Agua ganan energía extra con cada ataque básico.",
  },
  Grass: {
    type: "Grass",
    nameEs: "Planta",
    color: "#78C850",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "🌿",
    thresholds: [
      { count: 2, bonus: "Regenera 4% de PS máx por segundo" },
      { count: 3, bonus: "Regenera 8% de PS máx por segundo" },
    ],
    description: "Los tipo Planta regeneran vida por segundo constantemente.",
  },
  Electric: {
    type: "Electric",
    nameEs: "Eléctrico",
    color: "#F8D030",
    badgeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    icon: "⚡",
    thresholds: [
      { count: 2, bonus: "Equipo +25 Energía inicial + Rayo adyacente al usar habilidad" },
      { count: 4, bonus: "Equipo +45 Energía inicial + Rayo adyacente al usar habilidad" },
    ],
    description: "Todo el equipo comienza con energía inicial extra. Los tipo Eléctrico ademá electrocutan a enemigos adyacentes (-40% vel. ataque por 3s).",
  },
  Ice: {
    type: "Ice",
    nameEs: "Hielo",
    color: "#98D8D8",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: "❄️",
    thresholds: [
      { count: 2, bonus: "Ralentiza al objetivo un 55% durante 2s" },
      { count: 4, bonus: "Ralentiza al objetivo un 95% durante 2s" },
    ],
    description: "Los ataques tipo Hielo reducen severamente la velocidad del objetivo.",
  },
  Fighting: {
    type: "Fighting",
    nameEs: "Lucha",
    color: "#C03028",
    badgeBg: "bg-rose-700/20 text-rose-300 border-rose-600/30",
    icon: "🥊",
    thresholds: [
      { count: 2, bonus: "+80% Daño con ataques + Drain (cura 20% del daño)" },
      { count: 4, bonus: "+160% Daño con ataques + Drain (cura 20% del daño)" },
    ],
    description: "Los tipo Lucha asestan golpes devastadores y roban salud al infligir daño.",
  },
  Poison: {
    type: "Poison",
    nameEs: "Veneno",
    color: "#A040A0",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: "☠️",
    thresholds: [
      { count: 2, bonus: "Veneno de 20 daño/s durante 4s (-50% curación enemiga)" },
      { count: 3, bonus: "Veneno de 70 daño/s durante 4s (-50% curación enemiga)" },
      { count: 5, bonus: "Veneno de 130 daño/s durante 4s (-50% curación enemiga)" },
    ],
    description: "Los ataques tipo Veneno envenenan y reducen la curación enemiga a la mitad.",
  },
  Ground: {
    type: "Ground",
    nameEs: "Tierra",
    color: "#E0C068",
    badgeBg: "bg-amber-700/20 text-amber-200 border-amber-600/30",
    icon: "🏔️",
    thresholds: [
      { count: 2, bonus: "Recibe 12% menos de daño" },
      { count: 3, bonus: "Recibe 19% menos de daño" },
      { count: 5, bonus: "Recibe 30% menos de daño" },
    ],
    description: "Los tipo Tierra obtienen reducción de daño porcentual recibida.",
  },
  Flying: {
    type: "Flying",
    nameEs: "Volador",
    color: "#A890F0",
    badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    icon: "🦅",
    thresholds: [
      { count: 2, bonus: "Esquiva 10% de ataques básicos" },
      { count: 4, bonus: "Esquiva 25% de ataques básicos" },
      { count: 6, bonus: "Esquiva 40% de ataques básicos" },
    ],
    description: "Los tipo Volador esquivan ataques básicos con una probabilidad fija.",
    specialNote: "Gyarados y Dragonite no cuentan para la sinergia Volador (solo especies voladoras de origen).",
  },
  Psychic: {
    type: "Psychic",
    nameEs: "Psíquico",
    color: "#F85888",
    badgeBg: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    icon: "🔮",
    thresholds: [
      { count: 2, bonus: "Habilidades infligen +40% de daño" },
      { count: 4, bonus: "Habilidades infligen +85% de daño" },
      { count: 5, bonus: "Habilidades infligen +140% de daño" },
    ],
    description: "Las habilidades de las unidades de tipo Psíquico potencian drásticamente su daño.",
  },
  Bug: {
    type: "Bug",
    nameEs: "Bicho",
    color: "#A8B820",
    badgeBg: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    icon: "🐛",
    thresholds: [
      { count: 2, bonus: "+42% Velocidad de Ataque" },
      { count: 3, bonus: "+82% Velocidad de Ataque" },
    ],
    description: "Los tipo Bicho atacan mucho más rápido.",
  },
  Rock: {
    type: "Rock",
    nameEs: "Roca",
    color: "#B8A038",
    badgeBg: "bg-stone-600/20 text-amber-100 border-stone-500/30",
    icon: "🪨",
    thresholds: [
      { count: 2, bonus: "Escudo inicial del 7% de PS máx" },
      { count: 4, bonus: "Escudo inicial del 13% de PS máx" },
    ],
    description: "Los tipo Roca inician el combate protegidos con un escudo protector.",
  },
  Ghost: {
    type: "Ghost",
    nameEs: "Fantasma",
    color: "#705898",
    badgeBg: "bg-purple-700/20 text-purple-200 border-purple-600/30",
    icon: "👻",
    thresholds: [
      { count: 1, bonus: "Mal de Ojo: Todos los enemigos pierden 12% de Defensa y Def. Sp" },
    ],
    description: "Al inicio del combate, reduce las defensas de todos los Pokémon rivales.",
  },
  Dragon: {
    type: "Dragon",
    nameEs: "Dragón",
    color: "#7038F8",
    badgeBg: "bg-violet-600/20 text-violet-300 border-violet-500/30",
    icon: "🐉",
    thresholds: [
      { count: 1, bonus: "Danza Dragón: Todo el equipo gana +8% Atq, Atq Sp y Vel. Atq" },
    ],
    description: "Inspira a todo el equipo aumentando estadísticas ofensivas globales.",
  },
};
