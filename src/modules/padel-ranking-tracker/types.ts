export type Gender = "male" | "female";

export type TournamentCategory =
  | "Major"
  | "P1"
  | "P2"
  | "Tour Finals"
  | "FIP Platinum"
  | "FIP Gold"
  | "FIP Star";

export type TournamentStatus = "completed" | "upcoming" | "ongoing";

export interface PointsScale {
  Winner: number;
  Finalist: number;
  SF: number;
  QF: number;
  R16: number;
  R32: number;
  R64?: number;
}

export interface SeasonConfig {
  seasonYear: number; // e.g. 2026
  topBestResultsCount: number; // e.g. 22 best results according to FIP 2026 rules
  rulesVersion: string;
}

export interface TournamentResult {
  id?: string;
  player1Name: string;
  player2Name: string;
  round: string;
  points: number;
}

export interface Tournament {
  id: string;
  name: string;
  category: TournamentCategory;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  gender: Gender | "both";
  status: TournamentStatus;
  edition: string; // e.g. "2025" or "2026"
  defenseWeek?: string; // e.g. "Semana 12 (24-30 Mar)"
  pointsScale: PointsScale;
  results: TournamentResult[];
  replacesTournamentId?: string; // Previous edition tournament ID
}

export type PointStatus = "vigente" | "proximo_vencer" | "vencido";

export interface PlayerPointsEntry {
  id: string;
  tournamentId: string;
  tournamentName: string;
  category: TournamentCategory;
  dateWon: string; // YYYY-MM-DD
  expirationDate: string; // Official expiration date according to FIP week rules
  defenseWeek: string;
  round: string;
  points: number;
  isRacePoint: boolean; // earned in current competitive season
  status: PointStatus;
  previousEditionPoints?: number;
  currentEditionPoints?: number;
  replacementVariation?: number; // e.g. 600 - 1000 = -400
}

export interface Player {
  id: string;
  name: string;
  country: string;
  gender: Gender;
  partnerName: string;
  officialRanking: number;
  officialPoints: number;
  officialLastUpdated?: string;
  rankVariation?: number; // +2, -1
  pointsVariation?: number;
  raceRanking: number;
  racePoints: number;
  tournamentsPlayed: number;
  pointDiffAhead?: number; // points behind player ahead
  pointDiffBehind?: number; // points ahead of player behind
  pointsHistory: PlayerPointsEntry[];
  contributingResults: PlayerPointsEntry[]; // Set of Top N best results (e.g. 22 for 2026)
  pointsDefendedUpcoming: number;
}

export interface TournamentDefenseWeek {
  tournamentId: string;
  tournamentName: string;
  category: TournamentCategory;
  defenseWeek: string;
  startDate: string;
  endDate: string;
  playerId: string;
  playerName: string;
  prevEditionPoints: number;
  newEditionPointsPotential: number;
  potentialBalance: number; // e.g. +200, -400, -1000
  estimatedImpact: string;
}

export interface SimulatedTournamentOutcome {
  tournamentId: string;
  gender: Gender;
  playerRoundAssignments: Record<string, string>; // playerId -> round (Winner, Finalist, SF, QF, R16, R32)
}

export interface PadelApiConfig {
  apiUrl: string; // e.g. https://padelapi.org/api
  apiKey: string; // Bearer token
  seasonConfig: SeasonConfig;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export interface PadelModuleData {
  malePlayers: Player[];
  femalePlayers: Player[];
  tournaments: Tournament[];
  simulatedOutcomes: SimulatedTournamentOutcome[];
  apiConfig: PadelApiConfig;
}
