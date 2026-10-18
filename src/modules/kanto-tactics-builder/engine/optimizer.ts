import { BoardUnitSelection, calculateTeamSynergies } from "./synergies";
import { POKEMON_CATALOG, PokemonUnit, UnitRole } from "../data/pokemon";
import { PokemonType, SYNERGIES_DATA } from "../data/typesAndSynergies";

export type PlaystyleFocus = "Balanced" | "Damage" | "Survivability" | "Control" | "Economy" | "MetaOnly";

export interface OptimizationConstraints {
  boardSize: number; // 1 to 10 (default 8)
  mandatoryPokemonIds: string[];
  excludedPokemonIds: string[];
  priorityTypes: PokemonType[];
  playstyle: PlaystyleFocus;
  onlyMetaBuilds?: boolean;
}

export interface OptimizationCandidate {
  id: string;
  units: BoardUnitSelection[];
  score: number;
  activeSynergiesCount: number;
  rolesBreakdown: Record<UnitRole, number>;
  totalCost: number;
  whyItWorks: {
    keySynergies: string[];
    dualTypeChampions: string[];
    rolesCoverage: string;
    strengths: string[];
    tradeoffs: string[];
  };
}

export interface SubstitutionOption {
  replacementUnit: PokemonUnit;
  scoreDifference: number;
  newScore: number;
  synergiesMaintained: string[];
  synergiesGained: string[];
  synergiesLost: string[];
  reason: string;
}

/**
 * Centralized heuristic scoring function for a team composition.
 */
export function scoreTeamComposition(
  units: BoardUnitSelection[],
  constraints?: Partial<OptimizationConstraints>
): number {
  if (units.length === 0) return 0;

  const synergyAnalysis = calculateTeamSynergies(units);
  let score = 0;

  // 1. Synergy Threshold Values
  synergyAnalysis.activeSynergies.forEach((s) => {
    if (s.activeThreshold) {
      // Base points for active synergy count
      score += s.activeThreshold.count * 15;
      // Bonus points based on threshold tier level
      if (s.count >= 6) score += 35;
      else if (s.count >= 4) score += 20;
      else if (s.count >= 2) score += 10;

      // Extra bonus if user prioritized this type
      if (constraints?.priorityTypes?.includes(s.type)) {
        score += 25;
      }
    }
  });

  // 2. Dual-type Efficiency
  const uniqueIds = Array.from(new Set(units.map((u) => u.pokemonId)));
  uniqueIds.forEach((id) => {
    const p = POKEMON_CATALOG.find((item) => item.id === id);
    if (p && p.primaryType && p.secondaryType) {
      score += 8; // Dual-type bonus
    }
  });

  // 3. Unit Tier Quality
  uniqueIds.forEach((id) => {
    const p = POKEMON_CATALOG.find((item) => item.id === id);
    if (p) {
      if (p.tier === "S") score += 20;
      else if (p.tier === "A") score += 14;
      else if (p.tier === "B") score += 8;
      else if (p.tier === "C") score += 4;
    }
  });

  // 4. Role Complementarity Balance
  const roleCounts: Record<string, number> = {};
  uniqueIds.forEach((id) => {
    const p = POKEMON_CATALOG.find((item) => item.id === id);
    if (p) {
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    }
  });

  const hasTank = (roleCounts["Tanque"] || 0) > 0;
  const hasCarry = (roleCounts["Carry Físico"] || 0) + (roleCounts["Carry Mágico"] || 0) > 0;
  const hasSupport = (roleCounts["Soporte"] || 0) + (roleCounts["Control"] || 0) > 0;

  if (hasTank && hasCarry) score += 15; // Essential Frontline + Backline core
  if (hasSupport) score += 10;

  // Playstyle adjustments
  if (constraints?.playstyle === "Damage") {
    score += ((roleCounts["Carry Físico"] || 0) + (roleCounts["Carry Mágico"] || 0)) * 10;
  } else if (constraints?.playstyle === "Survivability") {
    score += ((roleCounts["Tanque"] || 0) + (roleCounts["Soporte"] || 0)) * 10;
  } else if (constraints?.playstyle === "Economy") {
    const avgCost = units.reduce((acc, u) => {
      const p = POKEMON_CATALOG.find((item) => item.id === u.pokemonId);
      return acc + (p?.cost || 1);
    }, 0) / (units.length || 1);
    if (avgCost <= 2.5) score += 20;
  }

  return Math.round(score);
}

/**
 * Runs beam-search / greedy optimization algorithm to recommend top candidate compositions.
 */
export function generateOptimalTeams(
  constraints: OptimizationConstraints
): OptimizationCandidate[] {
  const {
    boardSize,
    mandatoryPokemonIds,
    excludedPokemonIds,
    priorityTypes,
    playstyle,
  } = constraints;

  // Filter available candidate pool
  let availablePool = POKEMON_CATALOG.filter(
    (p) => !excludedPokemonIds.includes(p.id)
  );

  if (priorityTypes.length > 0) {
    // Sort pool to favor priority types first
    availablePool.sort((a, b) => {
      const aPriority =
        (priorityTypes.includes(a.primaryType) ? 1 : 0) +
        (a.secondaryType && priorityTypes.includes(a.secondaryType) ? 1 : 0);
      const bPriority =
        (priorityTypes.includes(b.primaryType) ? 1 : 0) +
        (b.secondaryType && priorityTypes.includes(b.secondaryType) ? 1 : 0);
      return bPriority - aPriority;
    });
  }

  // Mandatory starting set
  const initialSet: BoardUnitSelection[] = mandatoryPokemonIds.map((id) => ({
    pokemonId: id,
    stars: 2,
  }));

  // Beam Search
  const BEAM_WIDTH = 12;
  let candidates: BoardUnitSelection[][] = [initialSet];

  for (let step = initialSet.length; step < boardSize; step++) {
    const nextCandidates: BoardUnitSelection[][] = [];

    for (const team of candidates) {
      const currentIds = team.map((u) => u.pokemonId);

      for (const poolUnit of availablePool) {
        if (currentIds.includes(poolUnit.id)) continue; // No duplicates on board

        const newTeam = [...team, { pokemonId: poolUnit.id, stars: 2 as const }];
        nextCandidates.push(newTeam);
      }
    }

    if (nextCandidates.length === 0) break;

    // Rank candidates by score and prune to BEAM_WIDTH
    nextCandidates.sort(
      (a, b) => scoreTeamComposition(b, constraints) - scoreTeamComposition(a, constraints)
    );

    // Keep unique best combinations
    const seenCombos = new Set<string>();
    candidates = [];
    for (const cand of nextCandidates) {
      const key = cand
        .map((u) => u.pokemonId)
        .sort()
        .join(",");
      if (!seenCombos.has(key)) {
        seenCombos.add(key);
        candidates.push(cand);
        if (candidates.length >= BEAM_WIDTH) break;
      }
    }
  }

  // Format final ranked results
  const results: OptimizationCandidate[] = candidates.slice(0, 5).map((teamUnits, index) => {
    const score = scoreTeamComposition(teamUnits, constraints);
    const synergyAnalysis = calculateTeamSynergies(teamUnits);

    const rolesBreakdown: Record<UnitRole, number> = {
      Tanque: 0,
      "Carry Físico": 0,
      "Carry Mágico": 0,
      Soporte: 0,
      Control: 0,
      Asesino: 0,
      Luchador: 0,
    };

    let totalCost = 0;
    const dualTypeNames: string[] = [];

    teamUnits.forEach((u) => {
      const p = POKEMON_CATALOG.find((item) => item.id === u.pokemonId);
      if (p) {
        rolesBreakdown[p.role] = (rolesBreakdown[p.role] || 0) + 1;
        totalCost += p.cost;
        if (p.primaryType && p.secondaryType) {
          dualTypeNames.push(`${p.nameEs} (${SYNERGIES_DATA[p.primaryType].nameEs}/${SYNERGIES_DATA[p.secondaryType].nameEs})`);
        }
      }
    });

    const keySynergies = synergyAnalysis.activeSynergies.map(
      (s) => `${s.definition.icon} ${s.definition.nameEs} (${s.count}): ${s.activeBonusText}`
    );

    const strengths: string[] = [];
    if (rolesBreakdown["Tanque"] > 0 && (rolesBreakdown["Carry Físico"] > 0 || rolesBreakdown["Carry Mágico"] > 0)) {
      strengths.push("Núcleo equilibrado con tanque frontal y carries traseros.");
    }
    if (synergyAnalysis.activeSynergies.length >= 3) {
      strengths.push("Alta densidad de sinergias activas simultáneas.");
    }
    if (dualTypeNames.length >= 2) {
      strengths.push("Eficiencia maximizada por unidades de doble tipo.");
    }

    const tradeoffs: string[] = [];
    if (rolesBreakdown["Tanque"] === 0) {
      tradeoffs.push("Carece de tanque dedicado en primera línea.");
    }
    if (totalCost > boardSize * 3.5) {
      tradeoffs.push("Coste de oro elevado; requiere buena economía para armarse.");
    }

    return {
      id: `candidate-${index + 1}`,
      units: teamUnits,
      score,
      activeSynergiesCount: synergyAnalysis.activeSynergies.length,
      rolesBreakdown,
      totalCost,
      whyItWorks: {
        keySynergies,
        dualTypeChampions: dualTypeNames,
        rolesCoverage: `${rolesBreakdown["Tanque"] || 0} Tanques, ${(rolesBreakdown["Carry Físico"] || 0) + (rolesBreakdown["Carry Mágico"] || 0)} Carries, ${(rolesBreakdown["Soporte"] || 0) + (rolesBreakdown["Control"] || 0)} Soporte/Control`,
        strengths,
        tradeoffs,
      },
    };
  });

  return results;
}

/**
 * Evaluates unit replacement options for a selected unit in the current team.
 */
export function findUnitSubstitutions(
  currentTeam: BoardUnitSelection[],
  targetPokemonId: string
): SubstitutionOption[] {
  const currentScore = scoreTeamComposition(currentTeam);
  const currentSynergyAnalysis = calculateTeamSynergies(currentTeam);
  const currentActiveTypes = new Set(currentSynergyAnalysis.activeSynergies.map((s) => s.type));

  const teamWithoutTarget = currentTeam.filter((u) => u.pokemonId !== targetPokemonId);
  const existingIds = new Set(teamWithoutTarget.map((u) => u.pokemonId));

  const replacements = POKEMON_CATALOG.filter(
    (p) => p.id !== targetPokemonId && !existingIds.has(p.id)
  );

  const options: SubstitutionOption[] = replacements.map((rep) => {
    const testTeam: BoardUnitSelection[] = [
      ...teamWithoutTarget,
      { pokemonId: rep.id, stars: 2 },
    ];

    const newScore = scoreTeamComposition(testTeam);
    const scoreDifference = newScore - currentScore;
    const newSynergyAnalysis = calculateTeamSynergies(testTeam);
    const newActiveTypes = new Set(newSynergyAnalysis.activeSynergies.map((s) => s.type));

    const synergiesMaintained: string[] = [];
    const synergiesGained: string[] = [];
    const synergiesLost: string[] = [];

    newActiveTypes.forEach((t) => {
      if (currentActiveTypes.has(t)) {
        synergiesMaintained.push(SYNERGIES_DATA[t].nameEs);
      } else {
        synergiesGained.push(SYNERGIES_DATA[t].nameEs);
      }
    });

    currentActiveTypes.forEach((t) => {
      if (!newActiveTypes.has(t)) {
        synergiesLost.push(SYNERGIES_DATA[t].nameEs);
      }
    });

    let reason = "Mantiene el balance de equipo.";
    if (scoreDifference > 0) {
      reason = `Mejora la puntuación global (+${scoreDifference} pts) y optimiza sinergias.`;
    } else if (scoreDifference < 0) {
      reason = `Reduce ligeramente la puntuación (${scoreDifference} pts), pero ofrece cobertura alternativa.`;
    }

    return {
      replacementUnit: rep,
      scoreDifference,
      newScore,
      synergiesMaintained,
      synergiesGained,
      synergiesLost,
      reason,
    };
  });

  // Sort by highest score difference
  options.sort((a, b) => b.scoreDifference - a.scoreDifference);

  return options.slice(0, 8); // Top 8 alternatives
}
