"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Calendar,
  Zap,
  TrendingDown,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  MapPin,
  Award,
  Users,
  AlertCircle,
  BarChart3,
  Globe,
  Sliders,
  Link2,
} from "lucide-react";

import {
  Gender,
  Player,
  Tournament,
  TournamentCategory,
  SimulatedTournamentOutcome,
  PadelApiConfig,
  PadelModuleData,
} from "./types";

import {
  DEFAULT_API_CONFIG,
  CATEGORY_POINTS_SCALES,
} from "./initialData";

const STORAGE_KEY = "padel_ranking_tracker_local_v1";

export function PadelRankingTrackerModule() {
  // Global States
  const [selectedGender, setSelectedGender] = useState<Gender>("male");
  const [activeTab, setActiveTab] = useState<
    "ranking" | "drops" | "simulator" | "tournaments" | "config"
  >("ranking");

  // Data States
  const [malePlayers, setMalePlayers] = useState<Player[]>([]);
  const [femalePlayers, setFemalePlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [simulatedOutcomes, setSimulatedOutcomes] = useState<
    SimulatedTournamentOutcome[]
  >([]);
  const [apiConfig, setApiConfig] = useState<PadelApiConfig>(DEFAULT_API_CONFIG);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rankingSubTab, setRankingSubTab] = useState<
    "official" | "race" | "comparison"
  >("official");
  const [dropDaysFilter, setDropDaysFilter] = useState<number>(60);
  const [selectedSimTournamentId, setSelectedSimTournamentId] =
    useState<string>("");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Auto-clear notification toast
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load Data from API on Mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/padel-ranking-tracker");
      if (res.ok) {
        const data = await res.json();
        setMalePlayers(data.malePlayers || []);
        setFemalePlayers(data.femalePlayers || []);
        setTournaments(data.tournaments || []);
        setSimulatedOutcomes(data.simulatedOutcomes || []);
        if (data.apiConfig) {
          setApiConfig(data.apiConfig);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch API data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save API Credentials and Simulation outcomes only
  const saveApiConfig = async (newConfig = apiConfig, newSim = simulatedOutcomes) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/padel-ranking-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "save_config",
          apiConfig: newConfig,
          simulatedOutcomes: newSim,
        }),
      });
      if (res.ok) {
        setStatusMessage({ text: "Configuración de API guardada en BD", type: "success" });
        await loadData();
      }
    } catch (e) {
      console.warn("Could not save API config", e);
      setStatusMessage({
        text: "Error al guardar la configuración de API",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Active Players according to active Gender
  const activePlayers = useMemo(() => {
    return selectedGender === "male" ? malePlayers : femalePlayers;
  }, [selectedGender, malePlayers, femalePlayers]);

  // Set default selected simulation tournament
  useEffect(() => {
    if (!selectedSimTournamentId && tournaments.length > 0) {
      const upcoming = tournaments.find((t) => t.status === "upcoming");
      if (upcoming) {
        setSelectedSimTournamentId(upcoming.id);
      } else {
        setSelectedSimTournamentId(tournaments[0].id);
      }
    }
  }, [tournaments, selectedSimTournamentId]);

  // Filtered Players by Search
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return activePlayers;
    const q = searchQuery.toLowerCase().trim();
    return activePlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.partnerName?.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
    );
  }, [activePlayers, searchQuery]);

  // Sorting Official Ranking vs RACE
  const sortedOfficialPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => b.officialPoints - a.officialPoints);
  }, [filteredPlayers]);

  const sortedRacePlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => b.racePoints - a.racePoints);
  }, [filteredPlayers]);

  // Calculation for Points Drop / Expiration
  const playerDropsData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() + dropDaysFilter);

    return activePlayers.map((player) => {
      const expiringEntries = (player.pointsHistory || []).filter((entry) => {
        if (!entry.expirationDate) return false;
        const expDate = new Date(entry.expirationDate);
        return dropDaysFilter === 0
          ? true
          : expDate >= now && expDate <= cutoffDate;
      });

      const totalPointsToLose = expiringEntries.reduce(
        (sum, entry) => sum + entry.points,
        0
      );
      const predictedOfficialPoints = Math.max(
        0,
        player.officialPoints - totalPointsToLose
      );

      return {
        player,
        expiringEntries,
        totalPointsToLose,
        predictedOfficialPoints,
      };
    }).sort((a, b) => b.totalPointsToLose - a.totalPointsToLose);
  }, [activePlayers, dropDaysFilter]);

  // Simulation Engine Calculations
  const targetSimTournament = useMemo(() => {
    return tournaments.find((t) => t.id === selectedSimTournamentId);
  }, [tournaments, selectedSimTournamentId]);

  const currentSimOutcome = useMemo(() => {
    return simulatedOutcomes.find(
      (s) =>
        s.tournamentId === selectedSimTournamentId &&
        s.gender === selectedGender
    );
  }, [simulatedOutcomes, selectedSimTournamentId, selectedGender]);

  const simulatedStandings = useMemo(() => {
    if (!targetSimTournament) return [];

    const scale = targetSimTournament.pointsScale;

    return activePlayers.map((player) => {
      const projectedRound =
        currentSimOutcome?.playerRoundAssignments?.[player.id] || "None";
      const projectedEarnedPoints =
        projectedRound in scale
          ? scale[projectedRound as keyof typeof scale] || 0
          : 0;

      let expiredPreviousPoints = 0;
      if (targetSimTournament.replacesTournamentId) {
        const prevEntry = (player.pointsHistory || []).find(
          (h) => h.tournamentId === targetSimTournament.replacesTournamentId
        );
        if (prevEntry) {
          expiredPreviousPoints = prevEntry.points;
        }
      }

      const simOfficialPoints = Math.max(
        0,
        player.officialPoints - expiredPreviousPoints + projectedEarnedPoints
      );

      const simRacePoints = player.racePoints + projectedEarnedPoints;

      return {
        player,
        projectedRound,
        projectedEarnedPoints,
        expiredPreviousPoints,
        simOfficialPoints,
        simRacePoints,
        netPointChange: projectedEarnedPoints - expiredPreviousPoints,
      };
    });
  }, [activePlayers, targetSimTournament, currentSimOutcome]);

  // Compute Rank Shift in Simulation
  const simulatedRankingsWithShifts = useMemo(() => {
    const originalSorted = [...activePlayers].sort(
      (a, b) => b.officialPoints - a.officialPoints
    );
    const originalRankMap = new Map<string, number>();
    originalSorted.forEach((p, idx) => originalRankMap.set(p.id, idx + 1));

    const simSorted = [...simulatedStandings].sort(
      (a, b) => b.simOfficialPoints - a.simOfficialPoints
    );

    return simSorted.map((item, newIdx) => {
      const newRank = newIdx + 1;
      const oldRank = originalRankMap.get(item.player.id) || newRank;
      const rankShift = oldRank - newRank;
      return {
        ...item,
        newRank,
        oldRank,
        rankShift,
      };
    });
  }, [activePlayers, simulatedStandings]);

  // Simulator Handler: Assign Round finish to player
  const handleAssignRound = (playerId: string, roundKey: string) => {
    if (!selectedSimTournamentId) return;

    setSimulatedOutcomes((prev) => {
      const existingIdx = prev.findIndex(
        (s) =>
          s.tournamentId === selectedSimTournamentId &&
          s.gender === selectedGender
      );

      let updatedAssignments: Record<string, string> = {};
      if (existingIdx >= 0) {
        updatedAssignments = {
          ...prev[existingIdx].playerRoundAssignments,
          [playerId]: roundKey,
        };
      } else {
        updatedAssignments = { [playerId]: roundKey };
      }

      const targetPlayer = activePlayers.find((p) => p.id === playerId);
      if (targetPlayer?.partnerName) {
        const partner = activePlayers.find(
          (p) => p.name === targetPlayer.partnerName
        );
        if (partner) {
          updatedAssignments[partner.id] = roundKey;
        }
      }

      const newOutcome: SimulatedTournamentOutcome = {
        tournamentId: selectedSimTournamentId,
        gender: selectedGender,
        playerRoundAssignments: updatedAssignments,
      };

      let newSims: SimulatedTournamentOutcome[] = [];
      if (existingIdx >= 0) {
        newSims = [...prev];
        newSims[existingIdx] = newOutcome;
      } else {
        newSims = [...prev, newOutcome];
      }

      saveApiConfig(apiConfig, newSims);
      return newSims;
    });
  };

  const handleResetSimulation = () => {
    const newSims = simulatedOutcomes.filter(
      (s) =>
        !(
          s.tournamentId === selectedSimTournamentId &&
          s.gender === selectedGender
        )
    );
    setSimulatedOutcomes(newSims);
    saveApiConfig(apiConfig, newSims);
    setStatusMessage({
      text: "Simulación restablecida para este torneo",
      type: "info",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 py-3 space-y-3 font-sans text-foreground">

      {/* -------------------- HEADER STATUS TOAST -------------------- */}
      {statusMessage && (
        <div
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : statusMessage.type === "error"
              ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
              : "bg-sky-500/15 border border-sky-500/30 text-sky-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} /> {statusMessage.text}
          </span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* -------------------- TOP BAR: BRAND & GENDER SELECTOR -------------------- */}
      <div className="bg-card/70 backdrop-blur-md border border-border/80 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Title */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Trophy size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-foreground flex items-center gap-1.5">
                Padel Ranking & RACE Tracker
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold">
                FIP / Premier Padel • Resta de puntos • Simulador
              </p>
            </div>
          </div>

          {/* Syncing Spinner Badge */}
          {isSaving && (
            <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <RefreshCw size={10} className="animate-spin" /> Conectando API...
            </span>
          )}
        </div>

        {/* Gender Toggle Pill */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 w-full sm:w-auto justify-stretch">
          <button
            onClick={() => setSelectedGender("male")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              selectedGender === "male"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span>👨</span> MASCULINO
          </button>
          <button
            onClick={() => setSelectedGender("female")}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              selectedGender === "female"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span>👩</span> FEMENINO
          </button>
        </div>

      </div>

      {/* -------------------- STICKY CAPSULE NAVIGATION BAR -------------------- */}
      <div className="sticky top-12 z-20 bg-card/90 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-md">
        <div className="grid grid-cols-5 gap-1 text-center">

          <button
            onClick={() => setActiveTab("ranking")}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === "ranking"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Trophy size={14} />
            <span className="truncate">Ranking</span>
          </button>

          <button
            onClick={() => setActiveTab("drops")}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === "drops"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <TrendingDown size={14} />
            <span className="truncate">Resta Puntos</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === "simulator"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Sparkles size={14} />
            <span className="truncate">Simulador</span>
          </button>

          <button
            onClick={() => setActiveTab("tournaments")}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === "tournaments"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Calendar size={14} />
            <span className="truncate">Torneos</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === "config"
                ? "bg-zinc-700 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Settings size={14} />
            <span className="truncate">Ajustes & API</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* EMPTY STATE IF NO PLAYERS LOADED FROM API */}
      {/* ========================================================================= */}
      {!isLoading && activePlayers.length === 0 && activeTab !== "config" && (
        <div className="bg-card p-6 rounded-2xl border border-dashed border-amber-500/40 text-center space-y-3 my-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Globe size={24} />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground">
              Sin datos de jugadores de la API de Pádel
            </h3>
            <p className="text-xs text-muted-foreground font-medium max-w-md mx-auto">
              Para ver el ranking, la RACE del año y simular resultados, debes configurar el **URL Endpoint** y **Token/Key** de tu API de pádel. En la base de datos solo se guardará tu clave y endpoint.
            </p>
          </div>

          <button
            onClick={() => setActiveTab("config")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            <Settings size={14} /> Configurar URL y Token de API
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: RANKING & RACE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "ranking" && activePlayers.length > 0 && (
        <div className="space-y-3">

          {/* Sub-toggle & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-card/40 p-2 rounded-xl border border-border/60">

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setRankingSubTab("official")}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  rankingSubTab === "official"
                    ? "bg-card text-primary shadow-2xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🏆 Ranking Oficial (52s)
              </button>
              <button
                onClick={() => setRankingSubTab("race")}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  rankingSubTab === "race"
                    ? "bg-card text-amber-500 shadow-2xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🔥 RACE del Año 2025
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar jugador, pareja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground font-bold"
                >
                  Limpiar
                </button>
              )}
            </div>

          </div>

          {/* STANDINGS LIST */}
          <div className="space-y-2">
            {(rankingSubTab === "official" ? sortedOfficialPlayers : sortedRacePlayers)
              .map((player, index) => {
                const rankNumber = index + 1;
                const isExpanded = expandedPlayerId === player.id;
                const points =
                  rankingSubTab === "official"
                    ? player.officialPoints
                    : player.racePoints;

                return (
                  <div
                    key={player.id}
                    className={`bg-card rounded-2xl border transition-all overflow-hidden ${
                      rankNumber <= 3
                        ? "border-amber-500/40 shadow-xs"
                        : "border-border/80 hover:border-primary/40"
                    }`}
                  >
                    {/* Compact Card Header */}
                    <div className="p-3 flex items-center justify-between gap-2">

                      {/* Left: Position & Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            rankNumber === 1
                              ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-xs"
                              : rankNumber === 2
                              ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950"
                              : rankNumber === 3
                              ? "bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          #{rankNumber}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-black text-foreground truncate">
                              {player.name}
                            </h3>
                            <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                              {player.country}
                            </span>
                          </div>
                          {player.partnerName && (
                            <p className="text-[10px] text-muted-foreground font-semibold truncate">
                              Pareja: <span className="text-foreground">{player.partnerName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Points Badge & Expand Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-primary font-mono">
                            {points.toLocaleString()} pts
                          </div>
                          <span className="text-[9px] text-muted-foreground uppercase font-extrabold block">
                            {rankingSubTab === "official" ? "Ranking Oficial" : "RACE 2025"}
                          </span>
                        </div>

                        <button
                          onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                          className="p-1.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg transition-all"
                          title="Ver desglose de torneos"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                    </div>

                    {/* EXPANDED DETAILS */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/20 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-muted-foreground">
                          <span>Historial de Torneos Contribuyentes</span>
                          <span>Expiración / Resta</span>
                        </div>

                        {player.pointsHistory && player.pointsHistory.length > 0 ? (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {player.pointsHistory.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 p-1.5 bg-card rounded-lg border border-border/60 text-[11px]"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-foreground truncate">
                                    {item.tournamentName}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                                    <span className="bg-primary/10 text-primary px-1 rounded font-bold">
                                      {item.category}
                                    </span>
                                    <span>• {item.round}</span>
                                    {item.isRacePoint && (
                                      <span className="bg-amber-500/10 text-amber-500 px-1 rounded font-extrabold">
                                        RACE
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-mono font-bold text-emerald-500">
                                    +{item.points} pts
                                  </div>
                                  <div className="text-[9px] text-rose-400 font-medium">
                                    Resta: {item.expirationDate || "N/A"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">
                            No hay desglose de torneos disponible.
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PUNTOS A RESTAR / EXPIRACIÓN POR FECHA */}
      {/* ========================================================================= */}
      {activeTab === "drops" && activePlayers.length > 0 && (
        <div className="space-y-3">

          <div className="flex items-center justify-between gap-2 bg-card/40 p-2 rounded-xl border border-border/60">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Filter size={12} /> Período de resta:
            </span>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {[30, 60, 90, 180, 0].map((days) => (
                <button
                  key={days}
                  onClick={() => setDropDaysFilter(days)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shrink-0 ${
                    dropDaysFilter === days
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {days === 0 ? "Todo el Año" : `${days} Días`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {playerDropsData.map(({ player, expiringEntries, totalPointsToLose, predictedOfficialPoints }) => (
              <div
                key={player.id}
                className="bg-card p-3 rounded-2xl border border-border/80 hover:border-rose-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-foreground truncate">
                      {player.name} ({player.country})
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Puntos Actuales: <span className="font-mono font-bold text-foreground">{player.officialPoints.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-rose-500 font-mono">
                      -{totalPointsToLose.toLocaleString()} pts
                    </div>
                    <div className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                      Predicción: {predictedOfficialPoints.toLocaleString()} pts
                    </div>
                  </div>
                </div>

                {expiringEntries.length > 0 ? (
                  <div className="pt-1 border-t border-border/40 space-y-1">
                    {expiringEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between text-[10px] bg-muted/30 px-2 py-1 rounded-lg"
                      >
                        <span className="font-bold text-foreground truncate">
                          {entry.tournamentName} ({entry.category})
                        </span>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-rose-400 font-bold">-{entry.points} pts</span>
                          <span className="text-muted-foreground text-[9px]">Fecha: {entry.expirationDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-muted-foreground italic pt-1">
                    Sin caídas de puntos en este período.
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SIMULADOR DE TORNEOS */}
      {/* ========================================================================= */}
      {activeTab === "simulator" && activePlayers.length > 0 && (
        <div className="space-y-3">

          <div className="bg-card p-3 rounded-2xl border border-purple-500/40 shadow-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Torneo a Simular:
              </span>
              <button
                onClick={handleResetSimulation}
                className="text-[10px] font-extrabold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20"
              >
                Restablecer Simulaciones
              </button>
            </div>

            <select
              value={selectedSimTournamentId}
              onChange={(e) => setSelectedSimTournamentId(e.target.value)}
              className="w-full bg-muted/60 border border-border/80 text-foreground text-xs font-bold rounded-xl p-2 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category}) • {t.location}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {simulatedRankingsWithShifts.map((item) => {
              const { player, projectedRound, simOfficialPoints, rankShift, newRank } = item;
              const scale = targetSimTournament?.pointsScale || CATEGORY_POINTS_SCALES["P1"];

              return (
                <div
                  key={player.id}
                  className="bg-card p-3 rounded-2xl border border-border/80 space-y-2 transition-all hover:border-purple-500/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex flex-col items-center justify-center shrink-0 w-8">
                        <span className="text-xs font-black text-foreground font-mono">
                          #{newRank}
                        </span>
                        {rankShift !== 0 ? (
                          <span
                            className={`text-[9px] font-black flex items-center ${
                              rankShift > 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {rankShift > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {Math.abs(rankShift)}
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground font-bold">
                            =
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-foreground truncate">
                          {player.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          Pareja: {player.partnerName || "Sin Pareja"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-purple-400 font-mono">
                        {simOfficialPoints.toLocaleString()} pts
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">
                        Original: {player.officialPoints.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {(["Winner", "Finalist", "SF", "QF", "R16", "R32", "None"] as const).map((rKey) => {
                      const isSelected = projectedRound === rKey;
                      const pts = rKey !== "None" ? scale[rKey as keyof typeof scale] || 0 : 0;

                      return (
                        <button
                          key={rKey}
                          onClick={() => handleAssignRound(player.id, rKey)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all shrink-0 ${
                            isSelected
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {rKey === "Winner" ? "🏆 Campeón" : rKey} (+{pts})
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TORNEOS Y RESULTADOS */}
      {/* ========================================================================= */}
      {activeTab === "tournaments" && tournaments.length > 0 && (
        <div className="space-y-2.5">
          {tournaments.map((tourn) => (
            <div
              key={tourn.id}
              className="bg-card p-3 rounded-2xl border border-border/80 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-md">
                      {tourn.category}
                    </span>
                    <h3 className="text-xs font-black text-foreground truncate">
                      {tourn.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {tourn.location} • <Calendar size={10} /> {tourn.startDate} al {tourn.endDate}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CONFIGURACIÓN & API */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="space-y-3">
          <div className="bg-card p-4 rounded-2xl border border-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-foreground">
              <Globe size={18} className="text-sky-400" /> Configuración de API de Pádel
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Introduce las credenciales de tu API de pádel. Solo la **URL** y el **Token de autorización** se guardarán en la base de datos de la plataforma.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                  URL Endpoint API Pádel:
                </label>
                <input
                  type="text"
                  value={apiConfig.apiUrl}
                  onChange={(e) => setApiConfig({ ...apiConfig, apiUrl: e.target.value })}
                  placeholder="https://api.padelfip.com/v1"
                  className="w-full bg-muted/50 border border-border/80 rounded-xl p-2.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                  API Key / Token Bearer de Acceso:
                </label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-muted/50 border border-border/80 rounded-xl p-2.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                onClick={() => saveApiConfig(apiConfig, simulatedOutcomes)}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} /> Guardar Credenciales y Cargar Datos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
