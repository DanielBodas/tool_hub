import { BoardUnitSelection, calculateTeamSynergies, TeamSynergyAnalysis } from "./synergies";
import { scoreTeamComposition } from "./optimizer";
import { POKEMON_CATALOG, PokemonUnit, UnitRole } from "../data/pokemon";
import { SYNERGIES_DATA } from "../data/typesAndSynergies";

export interface TeamComparisonColumn {
  id: string;
  name: string;
  units: BoardUnitSelection[];
  pokemonUnits: PokemonUnit[];
  score: number;
  totalCost: number;
  synergies: TeamSynergyAnalysis;
  roleCounts: Record<UnitRole, number>;
  keyAdvantages: string[];
  vulnerabilities: string[];
}

export interface ComparisonSummary {
  teams: TeamComparisonColumn[];
  bestScoreTeamId: string;
  bestEconomyTeamId: string;
  highestSynergiesTeamId: string;
  differences: {
    synergyDiffs: string[];
    roleDiffs: string[];
    costDiffs: string[];
  };
}

export function compareTeams(
  namedTeams: { id: string; name: string; units: BoardUnitSelection[] }[]
): ComparisonSummary {
  const columns: TeamComparisonColumn[] = namedTeams.map((t) => {
    const score = scoreTeamComposition(t.units);
    const synergies = calculateTeamSynergies(t.units);

    const pokemonUnits = t.units
      .map((u) => POKEMON_CATALOG.find((p) => p.id === u.pokemonId))
      .filter((p): p is PokemonUnit => p !== undefined);

    let totalCost = 0;
    const roleCounts: Record<UnitRole, number> = {
      Tanque: 0,
      "Carry Físico": 0,
      "Carry Mágico": 0,
      Soporte: 0,
      Control: 0,
      Asesino: 0,
      Luchador: 0,
    };

    pokemonUnits.forEach((p) => {
      totalCost += p.cost;
      roleCounts[p.role] = (roleCounts[p.role] || 0) + 1;
    });

    const keyAdvantages: string[] = [];
    if (synergies.activeSynergies.length >= 3) {
      keyAdvantages.push(`Gran diversidad: ${synergies.activeSynergies.length} sinergias activas`);
    }
    if (roleCounts["Tanque"] >= 2) {
      keyAdvantages.push("Primera línea muy sólida (2+ Tanques)");
    }
    if (roleCounts["Carry Físico"] + roleCounts["Carry Mágico"] >= 3) {
      keyAdvantages.push("Potencial de daño masivo (3+ Carries)");
    }

    const vulnerabilities: string[] = [];
    if (roleCounts["Tanque"] === 0) {
      vulnerabilities.push("Sin tanques frontales dedicados");
    }
    if (roleCounts["Soporte"] + roleCounts["Control"] === 0) {
      vulnerabilities.push("Sin utilidad o control de masas");
    }

    return {
      id: t.id,
      name: t.name,
      units: t.units,
      pokemonUnits,
      score,
      totalCost,
      synergies,
      roleCounts,
      keyAdvantages,
      vulnerabilities,
    };
  });

  // Find highlights
  let bestScoreTeamId = columns[0]?.id || "";
  let highestScore = -1;

  let bestEconomyTeamId = columns[0]?.id || "";
  let lowestCost = 999;

  let highestSynergiesTeamId = columns[0]?.id || "";
  let maxSynergies = -1;

  columns.forEach((col) => {
    if (col.score > highestScore) {
      highestScore = col.score;
      bestScoreTeamId = col.id;
    }
    if (col.totalCost < lowestCost) {
      lowestCost = col.totalCost;
      bestEconomyTeamId = col.id;
    }
    if (col.synergies.activeSynergies.length > maxSynergies) {
      maxSynergies = col.synergies.activeSynergies.length;
      highestSynergiesTeamId = col.id;
    }
  });

  // Highlight key differences
  const synergyDiffs: string[] = [];
  const roleDiffs: string[] = [];
  const costDiffs: string[] = [];

  if (columns.length >= 2) {
    const t1 = columns[0];
    const t2 = columns[1];

    costDiffs.push(
      `Diferencia de coste: ${t1.name} (${t1.totalCost} oro) vs ${t2.name} (${t2.totalCost} oro) -> ${Math.abs(t1.totalCost - t2.totalCost)} oro de diferencia.`
    );

    const t1Active = t1.synergies.activeSynergies.map((s) => SYNERGIES_DATA[s.type].nameEs);
    const t2Active = t2.synergies.activeSynergies.map((s) => SYNERGIES_DATA[s.type].nameEs);

    const uniqueToT1 = t1Active.filter((x) => !t2Active.includes(x));
    const uniqueToT2 = t2Active.filter((x) => !t1Active.includes(x));

    if (uniqueToT1.length > 0) {
      synergyDiffs.push(`${t1.name} activa exclusivamente: ${uniqueToT1.join(", ")}`);
    }
    if (uniqueToT2.length > 0) {
      synergyDiffs.push(`${t2.name} activa exclusivamente: ${uniqueToT2.join(", ")}`);
    }

    roleDiffs.push(
      `${t1.name}: ${t1.roleCounts["Tanque"]} Tanques, ${t1.roleCounts["Carry Físico"] + t1.roleCounts["Carry Mágico"]} Carries | ${t2.name}: ${t2.roleCounts["Tanque"]} Tanques, ${t2.roleCounts["Carry Físico"] + t2.roleCounts["Carry Mágico"]} Carries`
    );
  }

  return {
    teams: columns,
    bestScoreTeamId,
    bestEconomyTeamId,
    highestSynergiesTeamId,
    differences: {
      synergyDiffs,
      roleDiffs,
      costDiffs,
    },
  };
}
