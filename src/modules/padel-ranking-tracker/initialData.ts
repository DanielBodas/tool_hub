import {
  Player,
  Tournament,
  PadelApiConfig,
  PointsScale,
  SeasonConfig,
} from "./types";

export const CATEGORY_POINTS_SCALES: Record<string, PointsScale> = {
  Major: { Winner: 2000, Finalist: 1200, SF: 720, QF: 360, R16: 180, R32: 90, R64: 35 },
  P1: { Winner: 1000, Finalist: 600, SF: 360, QF: 180, R16: 90, R32: 45, R64: 22 },
  P2: { Winner: 600, Finalist: 360, SF: 180, QF: 90, R16: 45, R32: 22 },
  "Tour Finals": { Winner: 1500, Finalist: 900, SF: 600, QF: 270, R16: 0, R32: 0 },
  "FIP Platinum": { Winner: 300, Finalist: 180, SF: 90, QF: 50, R16: 25, R32: 14 },
  "FIP Gold": { Winner: 150, Finalist: 90, SF: 50, QF: 25, R16: 14, R32: 8 },
  "FIP Silver": { Winner: 80, Finalist: 45, SF: 25, QF: 14, R16: 8, R32: 5 },
  "FIP Bronze": { Winner: 40, Finalist: 22, SF: 14, QF: 8, R16: 5, R32: 3 },
};

export const DEFAULT_SEASON_CONFIG: SeasonConfig = {
  seasonYear: 2026,
  topBestResultsCount: 22,
  rulesVersion: "FIP Normativa Temporada 2026 (22 mejores resultados)",
};

export const DEFAULT_API_CONFIG: PadelApiConfig = {
  apiUrl: process.env.PADEL_API_URL || "https://padelapi.org/api",
  apiKey: process.env.PADEL_API_KEY || "",
  seasonConfig: DEFAULT_SEASON_CONFIG,
  autoSync: true,
  lastSyncedAt: null,
};

// Lists are fetched dynamically from padelapi.org API (GET /api/seasons, /api/rankings, /api/tournaments)
// No default/hardcoded players or tournaments are stored in memory or seeded.
export const INITIAL_TOURNAMENTS: Tournament[] = [];
export const INITIAL_MALE_PLAYERS: Player[] = [];
export const INITIAL_FEMALE_PLAYERS: Player[] = [];
