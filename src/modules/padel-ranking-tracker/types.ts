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
  edition: string; // e.g. "2024" or "2025"
  pointsScale: PointsScale;
  results: TournamentResult[];
  replacesTournamentId?: string; // Previous edition tournament ID whose points drop when this tournament is played
}

export interface PlayerPointsEntry {
  id: string;
  tournamentId: string;
  tournamentName: string;
  category: TournamentCategory;
  dateWon: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD when points expire/drop
  round: string;
  points: number;
  isRacePoint: boolean; // earned in current calendar year (e.g., 2025)
}

export interface Player {
  id: string;
  name: string;
  country: string;
  gender: Gender;
  partnerName: string;
  photo?: string;
  officialRanking: number;
  officialPoints: number;
  raceRanking: number;
  racePoints: number;
  pointsHistory: PlayerPointsEntry[];
}

export interface SimulatedTournamentOutcome {
  tournamentId: string;
  gender: Gender;
  playerRoundAssignments: Record<string, string>; // playerId -> round key (e.g. "Winner", "Finalist", "SF", "QF", "R16", "R32")
}

export interface PadelApiConfig {
  apiUrl: string;
  apiKey: string;
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
