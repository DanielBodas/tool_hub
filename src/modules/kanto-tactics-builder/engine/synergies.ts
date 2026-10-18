import { PokemonUnit, POKEMON_CATALOG } from "../data/pokemon";
import { PokemonType, SYNERGIES_DATA, SynergyDefinition, SynergyThreshold } from "../data/typesAndSynergies";

export interface BoardUnitSelection {
  pokemonId: string;
  stars: 1 | 2 | 3;
  items?: string[]; // item ids
}

export interface ComputedSynergyState {
  type: PokemonType;
  definition: SynergyDefinition;
  count: number;
  contributingPokemonIds: string[];
  activeThreshold: SynergyThreshold | null;
  nextThreshold: SynergyThreshold | null;
  unitsNeededForNext: number;
  isActive: boolean;
  activeBonusText: string;
}

export interface TeamSynergyAnalysis {
  activeSynergies: ComputedSynergyState[];
  partialSynergies: ComputedSynergyState[];
  inactiveSynergies: ComputedSynergyState[];
  totalActiveBonusesCount: number;
  /** Summary list of all active bonus texts for quick dashboard rendering */
  activeBonusSummaries: { type: PokemonType; bonus: string; count: number }[];
}

/**
 * Calculates unique units and active synergies on the board.
 * Rules:
 * - Duplicate copies of the same Pokémon count ONLY ONCE toward type synergies.
 * - Dual-type Pokémon contribute to both types.
 * - Exception: Gyarados and Dragonite do NOT contribute to Flying synergy.
 */
export function calculateTeamSynergies(
  selectedUnits: BoardUnitSelection[]
): TeamSynergyAnalysis {
  // Get unique species present on board
  const uniquePokemonIds = Array.from(new Set(selectedUnits.map((u) => u.pokemonId)));
  const uniqueUnits: PokemonUnit[] = uniquePokemonIds
    .map((id) => POKEMON_CATALOG.find((p) => p.id === id))
    .filter((p): p is PokemonUnit => p !== undefined);

  // Map to hold unit count and contributing IDs per type
  const typeCounts: Record<PokemonType, { count: number; ids: string[] }> = {
    Normal: { count: 0, ids: [] },
    Fire: { count: 0, ids: [] },
    Water: { count: 0, ids: [] },
    Grass: { count: 0, ids: [] },
    Electric: { count: 0, ids: [] },
    Ice: { count: 0, ids: [] },
    Fighting: { count: 0, ids: [] },
    Poison: { count: 0, ids: [] },
    Ground: { count: 0, ids: [] },
    Flying: { count: 0, ids: [] },
    Psychic: { count: 0, ids: [] },
    Bug: { count: 0, ids: [] },
    Rock: { count: 0, ids: [] },
    Ghost: { count: 0, ids: [] },
    Dragon: { count: 0, ids: [] },
  };

  for (const unit of uniqueUnits) {
    // Primary Type
    if (unit.primaryType) {
      if (
        unit.primaryType !== "Flying" ||
        (unit.id !== "magikarp" && unit.id !== "dratini")
      ) {
        typeCounts[unit.primaryType].count += 1;
        typeCounts[unit.primaryType].ids.push(unit.id);
      }
    }

    // Secondary Type
    if (unit.secondaryType) {
      if (
        unit.secondaryType !== "Flying" ||
        (unit.id !== "magikarp" && unit.id !== "dratini")
      ) {
        typeCounts[unit.secondaryType].count += 1;
        typeCounts[unit.secondaryType].ids.push(unit.id);
      }
    }
  }

  const activeSynergies: ComputedSynergyState[] = [];
  const partialSynergies: ComputedSynergyState[] = [];
  const inactiveSynergies: ComputedSynergyState[] = [];
  const activeBonusSummaries: { type: PokemonType; bonus: string; count: number }[] = [];

  const typesList = Object.keys(SYNERGIES_DATA) as PokemonType[];

  for (const type of typesList) {
    const def = SYNERGIES_DATA[type];
    const currentCount = typeCounts[type].count;
    const contributingIds = typeCounts[type].ids;

    let activeThreshold: SynergyThreshold | null = null;
    let nextThreshold: SynergyThreshold | null = null;

    for (const t of def.thresholds) {
      if (currentCount >= t.count) {
        activeThreshold = t;
      } else if (!nextThreshold) {
        nextThreshold = t;
      }
    }

    const isActive = activeThreshold !== null;
    const unitsNeededForNext = nextThreshold ? nextThreshold.count - currentCount : 0;
    const activeBonusText = activeThreshold ? activeThreshold.bonus : "Ninguna bonificación activa";

    const state: ComputedSynergyState = {
      type,
      definition: def,
      count: currentCount,
      contributingPokemonIds: contributingIds,
      activeThreshold,
      nextThreshold,
      unitsNeededForNext,
      isActive,
      activeBonusText,
    };

    if (isActive) {
      activeSynergies.push(state);
      activeBonusSummaries.push({
        type,
        bonus: activeThreshold!.bonus,
        count: currentCount,
      });
    } else if (currentCount > 0) {
      partialSynergies.push(state);
    } else {
      inactiveSynergies.push(state);
    }
  }

  // Sort active synergies by count descending
  activeSynergies.sort((a, b) => b.count - a.count);
  partialSynergies.sort((a, b) => b.count - a.count);

  return {
    activeSynergies,
    partialSynergies,
    inactiveSynergies,
    totalActiveBonusesCount: activeSynergies.length,
    activeBonusSummaries,
  };
}

/**
 * Computes difference in active synergies if a unit is added or removed.
 */
export function analyzeUnitImpact(
  currentUnits: BoardUnitSelection[],
  candidatePokemonId: string,
  mode: "add" | "remove"
): {
  synergiesGained: string[];
  synergiesLost: string[];
  synergiesImproved: string[];
} {
  const currentAnalysis = calculateTeamSynergies(currentUnits);

  let newUnits: BoardUnitSelection[];
  if (mode === "add") {
    newUnits = [...currentUnits, { pokemonId: candidatePokemonId, stars: 2 }];
  } else {
    newUnits = currentUnits.filter((u) => u.pokemonId !== candidatePokemonId);
  }

  const newAnalysis = calculateTeamSynergies(newUnits);

  const currentTypes = new Map(currentAnalysis.activeSynergies.map((s) => [s.type, s]));
  const newTypes = new Map(newAnalysis.activeSynergies.map((s) => [s.type, s]));

  const synergiesGained: string[] = [];
  const synergiesLost: string[] = [];
  const synergiesImproved: string[] = [];

  newTypes.forEach((newState, type) => {
    const currentState = currentTypes.get(type);
    if (!currentState) {
      synergiesGained.push(`${SYNERGIES_DATA[type].nameEs} (${newState.count})`);
    } else if (newState.activeThreshold && currentState.activeThreshold && newState.activeThreshold.count > currentState.activeThreshold.count) {
      synergiesImproved.push(`${SYNERGIES_DATA[type].nameEs} (${currentState.activeThreshold.count} -> ${newState.activeThreshold.count})`);
    }
  });

  currentTypes.forEach((currentState, type) => {
    if (!newTypes.has(type)) {
      synergiesLost.push(`${SYNERGIES_DATA[type].nameEs}`);
    }
  });

  return { synergiesGained, synergiesLost, synergiesImproved };
}
