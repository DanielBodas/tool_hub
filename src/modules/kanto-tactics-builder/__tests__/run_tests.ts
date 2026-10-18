import { calculateTeamSynergies } from "../engine/synergies";
import { scoreTeamComposition, generateOptimalTeams, findUnitSubstitutions } from "../engine/optimizer";
import { compareTeams } from "../engine/comparator";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log("\n--- RUNNING KANTO TACTICS CORE ENGINE TESTS ---\n");

// Test 1: Unique species & dual types
{
  const units: { pokemonId: string; stars: 1 | 2 | 3 }[] = [
    { pokemonId: "bulbasaur", stars: 2 },
    { pokemonId: "bulbasaur", stars: 1 }, // Duplicate copy! Should count ONCE
    { pokemonId: "abra", stars: 2 },
    { pokemonId: "gastly", stars: 2 },
  ];

  const analysis = calculateTeamSynergies(units);
  const poisonSyn = analysis.activeSynergies.find((s) => s.type === "Poison");
  assert(poisonSyn !== undefined && poisonSyn.count === 2 && poisonSyn.isActive, "Poison synergy active with 2 unique species (Bulbasaur + Gastly)");

  const ghostSyn = analysis.activeSynergies.find((s) => s.type === "Ghost");
  assert(ghostSyn !== undefined && ghostSyn.count === 1 && ghostSyn.isActive, "Ghost synergy active at threshold 1 (Gastly)");
}

// Test 2: Flying synergy exceptions
{
  const units: { pokemonId: string; stars: 1 | 2 | 3 }[] = [
    { pokemonId: "magikarp", stars: 2 }, // Gyarados (Exception)
    { pokemonId: "dratini", stars: 2 },  // Dragonite (Exception)
    { pokemonId: "pidgey", stars: 2 },   // Pidgey (Valid)
  ];

  const analysis = calculateTeamSynergies(units);
  const flyingPartial = analysis.partialSynergies.find((s) => s.type === "Flying");
  assert(flyingPartial?.count === 1, "Flying synergy excludes Gyarados and Dragonite (count = 1)");
}

// Test 3: Scoring function
{
  const weakTeam = [{ pokemonId: "caterpie", stars: 1 as const }];
  const strongTeam = [
    { pokemonId: "bulbasaur", stars: 3 as const },
    { pokemonId: "abra", stars: 3 as const },
    { pokemonId: "gastly", stars: 3 as const },
    { pokemonId: "oddish", stars: 3 as const },
    { pokemonId: "voltorb", stars: 2 as const },
    { pokemonId: "exeggcute", stars: 2 as const },
  ];

  const scoreWeak = scoreTeamComposition(weakTeam);
  const scoreStrong = scoreTeamComposition(strongTeam);
  assert(scoreStrong > scoreWeak, `Strong team score (${scoreStrong}) is higher than weak team score (${scoreWeak})`);
}

// Test 4: Optimization generator
{
  const candidates = generateOptimalTeams({
    boardSize: 6,
    mandatoryPokemonIds: ["bulbasaur"],
    excludedPokemonIds: ["caterpie"],
    priorityTypes: ["Grass"],
    playstyle: "Balanced",
  });

  assert(candidates.length > 0, "Optimizer generated candidate team compositions");
  const top = candidates[0];
  const hasMandatory = top.units.some((u) => u.pokemonId === "bulbasaur");
  const hasExcluded = top.units.some((u) => u.pokemonId === "caterpie");
  assert(hasMandatory && !hasExcluded, "Optimizer respected mandatory ('bulbasaur') and excluded ('caterpie') rules");
}

// Test 5: Substitutions
{
  const currentTeam = [
    { pokemonId: "caterpie", stars: 2 as const },
    { pokemonId: "bulbasaur", stars: 2 as const },
  ];

  const substitutions = findUnitSubstitutions(currentTeam, "caterpie");
  assert(substitutions.length > 0 && substitutions[0].replacementUnit.id !== "caterpie", "Unit substitution engine generated alternative replacements");
}

// Test 6: Team Comparator
{
  const teamA = [{ pokemonId: "bulbasaur", stars: 2 as const }, { pokemonId: "oddish", stars: 2 as const }];
  const teamB = [{ pokemonId: "squirtle", stars: 2 as const }, { pokemonId: "psyduck", stars: 2 as const }];

  const summary = compareTeams([
    { id: "a", name: "Team Grass", units: teamA },
    { id: "b", name: "Team Water", units: teamB },
  ]);

  assert(summary.teams.length === 2 && summary.bestScoreTeamId !== "", "Team comparator produced side-by-side comparison summary");
}

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
