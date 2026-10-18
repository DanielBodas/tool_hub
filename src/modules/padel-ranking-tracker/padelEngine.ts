import {
  Player,
  PlayerPointsEntry,
  Tournament,
  SeasonConfig,
  TournamentDefenseWeek,
} from "./types";

/**
 * Calculates official FIP points based on season rules (e.g. Top 22 best results for 2026).
 */
export function computeOfficialPoints(
  history: PlayerPointsEntry[],
  seasonConfig: SeasonConfig
): { officialPoints: number; contributingResults: PlayerPointsEntry[] } {
  const topCount = seasonConfig?.topBestResultsCount || 22;

  // Filter valid points in the 52-week window that are not expired
  const validEntries = (history || []).filter(
    (entry) => entry.status !== "vencido"
  );

  // Sort descending by points
  const sorted = [...validEntries].sort((a, b) => b.points - a.points);

  // Select top N best results (e.g., 22 for 2026)
  const contributingResults = sorted.slice(0, topCount);
  const officialPoints = contributingResults.reduce(
    (sum, item) => sum + item.points,
    0
  );

  return { officialPoints, contributingResults };
}

/**
 * Processes annual classification ("Clasificación anual calculada por la aplicación")
 * and calculates gaps ahead/behind.
 */
export function processAnnualRace(players: Player[]): Player[] {
  const sortedByRace = [...players].sort((a, b) => b.racePoints - a.racePoints);

  return sortedByRace.map((player, idx) => {
    const raceRanking = idx + 1;

    const playerAhead = idx > 0 ? sortedByRace[idx - 1] : null;
    const playerBehind =
      idx < sortedByRace.length - 1 ? sortedByRace[idx + 1] : null;

    const pointDiffAhead = playerAhead
      ? playerAhead.racePoints - player.racePoints
      : 0;
    const pointDiffBehind = playerBehind
      ? player.racePoints - playerBehind.racePoints
      : 0;

    return {
      ...player,
      raceRanking,
      pointDiffAhead,
      pointDiffBehind,
    };
  });
}

/**
 * Calculates points defense schedule and potential replacement balance.
 * Example: 600 (new) - 1000 (prev) = -400 pts variation.
 */
export function buildDefenseSchedule(
  players: Player[],
  tournaments: Tournament[]
): TournamentDefenseWeek[] {
  const schedule: TournamentDefenseWeek[] = [];

  tournaments.forEach((tourn) => {
    if (tourn.status === "upcoming") {
      players.forEach((player) => {
        const prevEntry = (player.pointsHistory || []).find(
          (h) => h.tournamentId === tourn.replacesTournamentId || h.tournamentId === tourn.id
        );

        if (prevEntry && prevEntry.points > 0) {
          const prevPoints = prevEntry.points;
          const maxPotential = tourn.pointsScale?.Winner || 1000;
          const potentialBalance = maxPotential - prevPoints;

          schedule.push({
            tournamentId: tourn.id,
            tournamentName: tourn.name,
            category: tourn.category,
            defenseWeek: tourn.defenseWeek || tourn.startDate,
            startDate: tourn.startDate,
            endDate: tourn.endDate,
            playerId: player.id,
            playerName: player.name,
            prevEditionPoints: prevPoints,
            newEditionPointsPotential: maxPotential,
            potentialBalance,
            estimatedImpact:
              potentialBalance >= 0
                ? `Puntuación máxima ganable: +${potentialBalance} pts`
                : `Puntuación pendiente de defender: -${prevPoints} pts`,
          });
        }
      });
    }
  });

  return schedule.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

/**
 * Re-derives Top N (22 best results) for a player in a tournament simulation scenario.
 */
export function simulatePlayerScore(
  player: Player,
  targetTournament: Tournament,
  projectedRound: string,
  seasonConfig: SeasonConfig
): { simOfficialPoints: number; netPointChange: number } {
  if (!targetTournament) {
    return {
      simOfficialPoints: player.officialPoints,
      netPointChange: 0,
    };
  }

  const scale = targetTournament.pointsScale;
  const newPoints =
    projectedRound in scale
      ? scale[projectedRound as keyof typeof scale] || 0
      : 0;

  // Filter existing history removing replaced tournament points if applicable
  const filteredHistory = (player.pointsHistory || []).filter(
    (h) =>
      h.tournamentId !== targetTournament.id &&
      h.tournamentId !== targetTournament.replacesTournamentId
  );

  // Add projected tournament result entry
  if (newPoints > 0) {
    filteredHistory.push({
      id: "sim-" + targetTournament.id,
      tournamentId: targetTournament.id,
      tournamentName: targetTournament.name,
      category: targetTournament.category,
      dateWon: targetTournament.endDate,
      expirationDate: "",
      defenseWeek: "",
      round: projectedRound,
      points: newPoints,
      isRacePoint: true,
      status: "vigente",
    });
  }

  const { officialPoints: simOfficialPoints } = computeOfficialPoints(
    filteredHistory,
    seasonConfig
  );

  const netPointChange = simOfficialPoints - player.officialPoints;

  return { simOfficialPoints, netPointChange };
}
