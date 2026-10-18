import { calculateTeamSynergies } from "../engine/synergies";
import { scoreTeamComposition, generateOptimalTeams, findUnitSubstitutions } from "../engine/optimizer";
import { compareTeams } from "../engine/comparator";

describe("Kanto Tactics Core Engine Tests", () => {
  test("calculateTeamSynergies calculates unique species and dual types correctly", () => {
    // Bulbasaur (Grass/Poison), Abra (Psychic), Gastly (Ghost/Poison)
    const units: { pokemonId: string; stars: 1 | 2 | 3 }[] = [
      { pokemonId: "bulbasaur", stars: 2 },
      { pokemonId: "bulbasaur", stars: 1 }, // Duplicate copy! Should count ONCE
      { pokemonId: "abra", stars: 2 },
      { pokemonId: "gastly", stars: 2 },
    ];

    const analysis = calculateTeamSynergies(units);

    // Poison should have 2 unique species (bulbasaur, gastly) -> threshold 2 active!
    const poisonSyn = analysis.activeSynergies.find((s) => s.type === "Poison");
    expect(poisonSyn).toBeDefined();
    expect(poisonSyn?.count).toBe(2);
    expect(poisonSyn?.isActive).toBe(true);

    // Grass should have 1 unique species (bulbasaur) -> partial (needs 2)
    const grassSyn = analysis.partialSynergies.find((s) => s.type === "Grass");
    expect(grassSyn).toBeDefined();
    expect(grassSyn?.count).toBe(1);

    // Ghost should have 1 unique species (gastly) -> threshold 1 ACTIVE!
    const ghostSyn = analysis.activeSynergies.find((s) => s.type === "Ghost");
    expect(ghostSyn).toBeDefined();
    expect(ghostSyn?.count).toBe(1);
    expect(ghostSyn?.isActive).toBe(true);
  });

  test("Flying synergy excludes Gyarados (magikarp) and Dragonite (dratini)", () => {
    const units: { pokemonId: string; stars: 1 | 2 | 3 }[] = [
      { pokemonId: "magikarp", stars: 2 }, // Water / Flying (Exception)
      { pokemonId: "dratini", stars: 2 },  // Dragon / Flying (Exception)
      { pokemonId: "pidgey", stars: 2 },   // Normal / Flying (Valid)
    ];

    const analysis = calculateTeamSynergies(units);

    // Flying count should ONLY be 1 (pidgey) because Gyarados and Dragonite don't count for Flying synergy!
    const flyingPartial = analysis.partialSynergies.find((s) => s.type === "Flying");
    expect(flyingPartial?.count).toBe(1);
  });

  test("scoreTeamComposition generates higher scores for well-synergized teams", () => {
    const weakTeam: { pokemonId: string; stars: 1 | 2 | 3 }[] = [{ pokemonId: "caterpie", stars: 1 }];
    const strongTeam: { pokemonId: string; stars: 1 | 2 | 3 }[] = [
      { pokemonId: "bulbasaur", stars: 3 },
      { pokemonId: "abra", stars: 3 },
      { pokemonId: "gastly", stars: 3 },
      { pokemonId: "oddish", stars: 3 },
      { pokemonId: "voltorb", stars: 2 },
      { pokemonId: "exeggcute", stars: 2 },
      { pokemonId: "magnemite", stars: 1 },
    ];

    const scoreWeak = scoreTeamComposition(weakTeam);
    const scoreStrong = scoreTeamComposition(strongTeam);

    expect(scoreStrong).toBeGreaterThan(scoreWeak);
  });

  test("generateOptimalTeams respects constraints and mandatory units", () => {
    const candidates = generateOptimalTeams({
      boardSize: 6,
      mandatoryPokemonIds: ["bulbasaur"],
      excludedPokemonIds: ["caterpie"],
      priorityTypes: ["Grass"],
      playstyle: "Balanced",
    });

    expect(candidates.length).toBeGreaterThan(0);
    const topCandidate = candidates[0];

    // Check mandatory unit is included
    const hasMandatory = topCandidate.units.some((u) => u.pokemonId === "bulbasaur");
    expect(hasMandatory).toBe(true);

    // Check excluded unit is absent
    const hasExcluded = topCandidate.units.some((u) => u.pokemonId === "caterpie");
    expect(hasExcluded).toBe(false);

    // Check board size limit
    expect(topCandidate.units.length).toBeLessThanOrEqual(6);
  });

  test("findUnitSubstitutions ranks alternatives correctly", () => {
    const currentTeam: { pokemonId: string; stars: 1 | 2 | 3 }[] = [
      { pokemonId: "caterpie", stars: 2 },
      { pokemonId: "bulbasaur", stars: 2 },
    ];

    const substitutions = findUnitSubstitutions(currentTeam, "caterpie");
    expect(substitutions.length).toBeGreaterThan(0);

    // Top substitution should offer positive or highest relative score gain
    expect(substitutions[0].replacementUnit.id).not.toBe("caterpie");
  });

  test("compareTeams produces detailed side-by-side comparison", () => {
    const teamA: { pokemonId: string; stars: 1 | 2 | 3 }[] = [{ pokemonId: "bulbasaur", stars: 2 }, { pokemonId: "oddish", stars: 2 }];
    const teamB: { pokemonId: string; stars: 1 | 2 | 3 }[] = [{ pokemonId: "squirtle", stars: 2 }, { pokemonId: "psyduck", stars: 2 }];

    const summary = compareTeams([
      { id: "a", name: "Team Grass", units: teamA },
      { id: "b", name: "Team Water", units: teamB },
    ]);

    expect(summary.teams.length).toBe(2);
    expect(summary.bestScoreTeamId).toBeDefined();
    expect(summary.differences.synergyDiffs.length).toBeGreaterThan(0);
  });
});
