"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Calendar,
  Settings,
  Search,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Globe,
  Shield,
  Info,
  Flame,
  AlertTriangle,
  Zap,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";

import {
  Gender,
  Player,
  Tournament,
  SimulatedTournamentOutcome,
  PadelApiConfig,
} from "./types";

import {
  DEFAULT_API_CONFIG,
  CATEGORY_POINTS_SCALES,
} from "./initialData";

import {
  computeOfficialPoints,
  processAnnualRace,
  buildDefenseSchedule,
  simulatePlayerScore,
} from "./padelEngine";

export function PadelRankingTrackerModule() {
  // Global States
  const [selectedGender, setSelectedGender] = useState<Gender>("male");
  const [activeTab, setActiveTab] = useState<
    "ranking" | "race" | "drops" | "simulator" | "calendar" | "config"
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
  const [isTestingApi, setIsTestingApi] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Connection Diagnostic Result State
  const [testResult, setTestResult] = useState<{
    success: boolean;
    httpStatus?: number;
    message: string;
    maleCount: number;
    femaleCount: number;
    tournamentCount: number;
  } | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSimTournamentId, setSelectedSimTournamentId] =
    useState<string>("");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Auto-clear notification toast
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
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
        if (data.lastDiagnostic) {
          setTestResult(data.lastDiagnostic);
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

  // Save API Credentials
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
        setStatusMessage({ text: "Credenciales de API guardadas en la base de datos", type: "success" });
        await loadData();
      }
    } catch (e) {
      console.warn("Could not save API config", e);
      setStatusMessage({
        text: "Error al guardar la configuración de la API",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test API Connection Action
  const handleTestApiConnection = async () => {
    setIsTestingApi(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/padel-ranking-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test_connection",
          apiUrl: apiConfig.apiUrl,
          apiKey: apiConfig.apiKey,
        }),
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        httpStatus: data.httpStatus,
        message: data.message,
        maleCount: data.maleCount || 0,
        femaleCount: data.femaleCount || 0,
        tournamentCount: data.tournamentCount || 0,
      });

      if (data.success) {
        if (Array.isArray(data.malePlayers) && data.malePlayers.length > 0) {
          setMalePlayers(data.malePlayers);
        }
        if (Array.isArray(data.femalePlayers) && data.femalePlayers.length > 0) {
          setFemalePlayers(data.femalePlayers);
        }
        if (Array.isArray(data.tournaments) && data.tournaments.length > 0) {
          setTournaments(data.tournaments);
        }
        setStatusMessage({ text: "Conexión con PadelAPI.org probada y confirmada con éxito", type: "success" });
      } else {
        setStatusMessage({ text: data.message || "Fallo en la prueba de conexión de API", type: "error" });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error de red: ${err.message || "No se pudo realizar la prueba"}`,
        maleCount: 0,
        femaleCount: 0,
        tournamentCount: 0,
      });
      setStatusMessage({ text: "Error al realizar el test de API", type: "error" });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Load Demo Data Action
  const handleLoadDemoData = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/padel-ranking-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "load_demo_data" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMalePlayers(data.malePlayers || []);
        setFemalePlayers(data.femalePlayers || []);
        setTournaments(data.tournaments || []);
        setStatusMessage({ text: "Datos de demostración cargados correctamente", type: "success" });
      }
    } catch (e) {
      console.error("Failed to load demo data", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Demo Data Action
  const handleClearDemoData = async () => {
    try {
      await fetch("/api/padel-ranking-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clear_custom_data" }),
      });
      setMalePlayers([]);
      setFemalePlayers([]);
      setTournaments([]);
      setStatusMessage({ text: "Datos de demostración eliminados", type: "info" });
    } catch (e) {
      console.error("Error clearing custom data", e);
    }
  };

  // Active Players according to active Gender
  const rawActivePlayers = useMemo(() => {
    return selectedGender === "male" ? malePlayers : femalePlayers;
  }, [selectedGender, malePlayers, femalePlayers]);

  // Compute Official Rankings with Season Top N Rules (22 best results for 2026)
  const activePlayers = useMemo(() => {
    const seasonConfig = apiConfig.seasonConfig || {
      seasonYear: 2026,
      topBestResultsCount: 22,
      rulesVersion: "2026 FIP 22 Best Results",
    };

    const evaluated = rawActivePlayers.map((player) => {
      const { officialPoints, contributingResults } = computeOfficialPoints(
        player.pointsHistory || [],
        seasonConfig
      );

      const pointsDefendedUpcoming = (player.pointsHistory || [])
        .filter((h) => h.status === "proximo_vencer")
        .reduce((sum, h) => sum + h.points, 0);

      return {
        ...player,
        officialPoints: player.officialPoints || officialPoints,
        contributingResults,
        pointsDefendedUpcoming,
      };
    });

    return processAnnualRace(evaluated);
  }, [rawActivePlayers, apiConfig]);

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

  // Defense Schedule Calendar
  const defenseSchedule = useMemo(() => {
    return buildDefenseSchedule(activePlayers, tournaments);
  }, [activePlayers, tournaments]);

  // Simulation Calculations
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

  const simulatedRankingsWithShifts = useMemo(() => {
    if (!targetSimTournament) return [];

    const seasonConfig = apiConfig.seasonConfig || {
      seasonYear: 2026,
      topBestResultsCount: 22,
      rulesVersion: "FIP 2026",
    };

    const simulatedList = activePlayers.map((player) => {
      const projectedRound =
        currentSimOutcome?.playerRoundAssignments?.[player.id] || "None";

      const { simOfficialPoints, netPointChange } = simulatePlayerScore(
        player,
        targetSimTournament,
        projectedRound,
        seasonConfig
      );

      return {
        player,
        projectedRound,
        simOfficialPoints,
        netPointChange,
      };
    });

    const originalRankMap = new Map<string, number>();
    sortedOfficialPlayers.forEach((p, idx) => originalRankMap.set(p.id, idx + 1));

    const sortedSim = [...simulatedList].sort(
      (a, b) => b.simOfficialPoints - a.simOfficialPoints
    );

    return sortedSim.map((item, newIdx) => {
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
  }, [activePlayers, targetSimTournament, currentSimOutcome, sortedOfficialPlayers, apiConfig]);

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
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-3 space-y-3 font-sans text-foreground">

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
                FIP • Regla {apiConfig.seasonConfig?.topBestResultsCount || 22} mejores resultados ({apiConfig.seasonConfig?.seasonYear || 2026})
              </p>
            </div>
          </div>

          {isSaving && (
            <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <RefreshCw size={10} className="animate-spin" /> Conectando PadelAPI.org...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Gender Toggle Pill */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 flex-1 sm:flex-initial">
            <button
              onClick={() => setSelectedGender("male")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                selectedGender === "male"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span>👨</span> MASCULINO
            </button>
            <button
              onClick={() => setSelectedGender("female")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                selectedGender === "female"
                  ? "bg-pink-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span>👩</span> FEMENINO
            </button>
          </div>

          {/* Top-Right Settings Gear Icon Button (Rueda Dentada) */}
          <button
            onClick={() => setActiveTab("config")}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "config"
                ? "bg-zinc-800 text-amber-400 border-amber-500/50 shadow-xs"
                : "bg-muted/60 hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground"
            }`}
            title="Ajustes y Configuración de API (Rueda Dentada)"
          >
            <Settings size={18} className={activeTab === "config" ? "animate-spin-slow text-amber-400" : ""} />
            <span className="text-xs font-bold hidden xs:inline">Ajustes</span>
          </button>
        </div>

      </div>

      {/* -------------------- STICKY CAPSULE NAVIGATION BAR -------------------- */}
      <div className="hidden sm:block sticky top-12 z-20 bg-card/90 backdrop-blur-md p-1.5 rounded-2xl border border-border/80 shadow-md">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none whitespace-nowrap">

          <button
            onClick={() => setActiveTab("ranking")}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "ranking"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Trophy size={13} />
            <span>Ranking FIP</span>
          </button>

          <button
            onClick={() => setActiveTab("race")}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "race"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Flame size={13} />
            <span>Anual (RACE)</span>
          </button>

          <button
            onClick={() => setActiveTab("drops")}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "drops"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Shield size={13} />
            <span>Defensa Puntos</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "simulator"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Sparkles size={13} />
            <span>Proyección</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "calendar"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Calendar size={13} />
            <span>Calendario</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "config"
                ? "bg-zinc-700 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Settings size={13} />
            <span>Ajustes & API</span>
          </button>

        </div>
      </div>

      <nav aria-label="Secciones de ranking" className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-xl px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-6 gap-0.5 max-w-xl mx-auto">
          <button onClick={() => setActiveTab("ranking")} className={"min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl " + (activeTab === "ranking" ? "text-primary bg-primary/10" : "text-muted-foreground")}><Trophy size={18}/><span className="text-[9px] font-extrabold">FIP</span></button>
          <button onClick={() => setActiveTab("race")} className={"min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl " + (activeTab === "race" ? "text-primary bg-primary/10" : "text-muted-foreground")}><Flame size={18}/><span className="text-[9px] font-extrabold">RACE</span></button>
          <button onClick={() => setActiveTab("drops")} className={"min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl " + (activeTab === "drops" ? "text-primary bg-primary/10" : "text-muted-foreground")}><Shield size={18}/><span className="text-[9px] font-extrabold">Defensa</span></button>
          <button onClick={() => setActiveTab("simulator")} className={"min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl " + (activeTab === "simulator" ? "text-primary bg-primary/10" : "text-muted-foreground")}><Sparkles size={18}/><span className="text-[9px] font-extrabold">Simular</span></button>
          <button onClick={() => setActiveTab("calendar")} className={"min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl " + (activeTab === "calendar" ? "text-primary bg-primary/10" : "text-muted-foreground")}><Calendar size={18}/><span className="text-[9px] font-extrabold">Fechas</span></button>
          <button onClick={() => setActiveTab("config")} className={"min-w-0 min-h-12 flex flex-col items-center justify-center gap-1 rounded-xl " + (activeTab === "config" ? "text-primary bg-primary/10" : "text-muted-foreground")}><Settings size={18}/><span className="text-[9px] font-extrabold">Ajustes</span></button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* EMPTY STATE IF NO PLAYERS FROM PADELAPI.ORG */}
      {/* ========================================================================= */}
      {!isLoading && activePlayers.length === 0 && activeTab !== "config" && (
        <div className="bg-card p-6 rounded-2xl border border-dashed border-amber-500/40 text-center space-y-3 my-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Globe size={24} />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground">
              Sin datos de PadelAPI.org
            </h3>
            <p className="text-xs text-muted-foreground font-medium max-w-md mx-auto">
              Para consultar el ranking FIP oficial, la clasificación anual calculada y simular proyecciones, introduce tu token Bearer de **https://padelapi.org/api**. Solo se guardarán tu endpoint y token.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <button
              onClick={() => setActiveTab("config")}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
            >
              <Settings size={14} /> Configurar URL y Token
            </button>

            <button
              onClick={handleLoadDemoData}
              className="px-4 py-2 bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-400 font-extrabold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
            >
              <Zap size={14} /> Cargar Datos de Demostración (Offline)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: RANKING OFICIAL FIP (Regla 22 Mejores Resultados 2026) */}
      {/* ========================================================================= */}
      {activeTab === "ranking" && activePlayers.length > 0 && (
        <div className="space-y-3">

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-card/40 p-2 rounded-xl border border-border/60">
            <div className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" /> Ranking Oficial FIP (52 Semanas)
              <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">
                {apiConfig.seasonConfig?.rulesVersion || "Normativa 2026 (22 Mejores)"}
              </span>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar jugador, pareja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            {sortedOfficialPlayers.map((player, index) => {
              const rankNumber = index + 1;
              const isExpanded = expandedPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className={`bg-card rounded-2xl border transition-all overflow-hidden ${
                    rankNumber <= 3
                      ? "border-amber-500/40 shadow-xs"
                      : "border-border/80 hover:border-primary/40"
                  }`}
                >
                  <div className="p-3 flex items-center justify-between gap-2">

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

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-black text-primary font-mono">
                          {player.officialPoints.toLocaleString()} pts
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase font-extrabold block">
                          FIP Oficial ({player.contributingResults?.length || 0}/22)
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                        className="p-1.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg transition-all"
                        title="Ver 22 mejores resultados computables"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/20 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-muted-foreground">
                        <span>Resultados Computables (Top {apiConfig.seasonConfig?.topBestResultsCount || 22})</span>
                        <span>Expiración FIP</span>
                      </div>

                      {player.contributingResults && player.contributingResults.length > 0 ? (
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {player.contributingResults.map((item) => (
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
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-mono font-bold text-emerald-500">
                                  +{item.points} pts
                                </div>
                                <div className="text-[9px] text-rose-400 font-medium">
                                  Vence: {item.expirationDate || "Ciclo 52 semanas"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">
                          Sin desglose de resultados disponible.
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
      {/* TAB 2: CLASIFICACIÓN ANUAL (Calculada por la Aplicación) */}
      {/* ========================================================================= */}
      {activeTab === "race" && activePlayers.length > 0 && (
        <div className="space-y-3">

          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs flex items-start gap-2">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-500 block">
                FIP Race 2026 · Top 22 de la temporada
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Clasificación oficial de temporada: suma los 22 mejores resultados de 2026 en Premier Padel y CUPRA FIP Tour. Se muestra el dato de Race recibido de la fuente; no es el ranking FIP móvil de 52 semanas.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {sortedRacePlayers.map((player) => (
              <div
                key={player.id}
                className="bg-card p-3 rounded-2xl border border-border/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 bg-amber-500/15 text-amber-500 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                    #{player.raceRanking}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-foreground truncate">
                      {player.name} ({player.country})
                    </h3>
                    <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                      <span>Torneos Disputados: <strong className="text-foreground">{player.tournamentsPlayed || 0}</strong></span>
                      {player.pointDiffAhead ? (
                        <span className="text-rose-400">-{player.pointDiffAhead} pts del anterior</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-amber-500 font-mono">
                    {player.racePoints.toLocaleString()} pts
                  </div>
                  <span className="text-[9px] uppercase font-extrabold text-muted-foreground block">
                    Temporada {apiConfig.seasonConfig?.seasonYear || 2026}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEFENSA DE PUNTOS & VARIACIONES */}
      {/* ========================================================================= */}
      {activeTab === "drops" && activePlayers.length > 0 && (
        <div className="space-y-3">

          <div className="bg-card p-3 rounded-2xl border border-border/80 space-y-2 text-xs">
            <h3 className="font-black text-foreground flex items-center gap-1.5">
              <Shield size={14} className="text-rose-500" /> Puntos Ganados vs. Puntos a Defender
            </h3>
            <p className="text-muted-foreground text-[11px] font-medium">
              Los puntos a defender son puntuaciones de la temporada anterior que caducan al cumplirse las 52 semanas. La variación real depende del resultado en la nueva edición: <strong className="text-foreground">Ejemplo: 600 (nuevo) - 1.000 (previo) = -400 pts</strong>.
            </p>
          </div>

          <div className="space-y-2">
            {activePlayers.map((player) => (
              <div
                key={player.id}
                className="bg-card p-3 rounded-2xl border border-border/80 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-foreground truncate">
                      {player.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Puntos Oficiales: <span className="font-mono font-bold text-foreground">{player.officialPoints.toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-rose-500 font-mono">
                      -{player.pointsDefendedUpcoming.toLocaleString()} pts a defender
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Próximas Semanas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROYECCIONALES & ESCENARIOS (Simulador) */}
      {/* ========================================================================= */}
      {activeTab === "simulator" && activePlayers.length > 0 && (
        <div className="space-y-3">

          <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
            <span className="text-purple-400 font-bold flex items-center gap-1">
              <Sparkles size={14} /> Escenarios Proyectados (Estimación Hipotética)
            </span>
            <button
              onClick={handleResetSimulation}
              className="text-[10px] font-extrabold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded-lg"
            >
              Restablecer Escenarios
            </button>
          </div>

          <div className="bg-card p-3 rounded-2xl border border-purple-500/40 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
              Seleccionar Torneo a Simular:
            </label>
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
                        <span className="text-[9px] font-extrabold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded-md">
                          Proyección Hipotética
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-purple-400 font-mono">
                        {simOfficialPoints.toLocaleString()} pts
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">
                        Oficial: {player.officialPoints.toLocaleString()}
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
      {/* TAB 5: CALENDARIO DE DEFENSA DE PUNTOS */}
      {/* ========================================================================= */}
      {activeTab === "calendar" && (
        <div className="space-y-3">
          <div className="text-xs font-black text-foreground flex items-center gap-1.5">
            <Calendar size={14} className="text-sky-400" /> Calendario de Vencimientos y Defensa
          </div>

          <div className="space-y-2">
            {defenseSchedule.length > 0 ? (
              defenseSchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-card p-3 rounded-2xl border border-border/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-md">
                      {item.defenseWeek}
                    </span>
                    <h3 className="text-xs font-black text-foreground truncate mt-0.5">
                      {item.playerName} • {item.tournamentName}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Puntos edición previa: <strong className="text-rose-400">-{item.prevEditionPoints} pts</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs font-black font-mono ${item.potentialBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.potentialBalance >= 0 ? `+${item.potentialBalance}` : item.potentialBalance} pts max
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic text-center p-4 bg-card rounded-2xl border border-dashed border-border/60">
                No hay semanas de defensa registradas en el calendario.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CONFIGURACIÓN & API DIAGNOSTIC */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="space-y-3">

          {/* DIAGNOSTIC CONNECTION FEEDBACK CARD */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all ${
                testResult.success
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-300"
              }`}
            >
              <div className="font-black text-sm flex items-center gap-1.5">
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {testResult.message}
              </div>

              {testResult.success ? (
                <p className="text-[11px] font-bold opacity-90">
                  Respuesta recibida: {testResult.maleCount} Jugadores Masculinos, {testResult.femaleCount} Femeninos, {testResult.tournamentCount} Torneos.
                </p>
              ) : (
                <p className="text-[11px] font-medium opacity-90">
                  Si estás usando un token en pruebas o sin servidor activo, puedes pulsar abajo en <strong>«Cargar Datos de Demostración (Offline)»</strong> para verificar todas las pestañas de la aplicación.
                </p>
              )}
            </div>
          )}

          <div className="bg-card p-4 rounded-2xl border border-border/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-black text-foreground">
                <Globe size={18} className="text-sky-400" /> Configuración de PadelAPI.org
              </span>

              {/* Status Badge */}
              {isTestingApi ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Probando...
                </span>
              ) : testResult?.success ? (
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> API Conectada ({testResult.maleCount + testResult.femaleCount} jug.)
                </span>
              ) : testResult ? (
                <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} /> Error de API
                </span>
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  Sin verificar
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Introduce tus credenciales Bearer para PadelAPI.org. Solamente el **URL Endpoint** y **Token Bearer** se almacenan en MongoDB.
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
                  placeholder="https://padelapi.org/api"
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
                  placeholder="Introduce un token nuevo (vacío mantiene el guardado)"
                  className="w-full bg-muted/50 border border-border/80 rounded-xl p-2.5 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                    Año de Temporada:
                  </label>
                  <input
                    type="number"
                    value={apiConfig.seasonConfig?.seasonYear || 2026}
                    onChange={(e) => setApiConfig({
                      ...apiConfig,
                      seasonConfig: {
                        ...(apiConfig.seasonConfig || { rulesVersion: "FIP 2026", topBestResultsCount: 22, seasonYear: 2026 }),
                        seasonYear: Number(e.target.value),
                      }
                    })}
                    className="w-full bg-muted/50 border border-border/80 rounded-xl p-2 font-mono text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                    Nº Mejores Resultados (FIP):
                  </label>
                  <input
                    type="number"
                    value={apiConfig.seasonConfig?.topBestResultsCount || 22}
                    onChange={(e) => setApiConfig({
                      ...apiConfig,
                      seasonConfig: {
                        ...(apiConfig.seasonConfig || { rulesVersion: "FIP 2026", topBestResultsCount: 22, seasonYear: 2026 }),
                        topBestResultsCount: Number(e.target.value),
                      }
                    })}
                    className="w-full bg-muted/50 border border-border/80 rounded-xl p-2 font-mono text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleTestApiConnection}
                  disabled={isTestingApi}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} className={isTestingApi ? "animate-spin" : ""} /> Probar Conexión de API
                </button>

                <button
                  onClick={() => saveApiConfig(apiConfig, simulatedOutcomes)}
                  className="py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Globe size={14} /> Guardar Credenciales BD
                </button>
              </div>
            </div>
          </div>

          {/* DEMO / FALLBACK DATA CONTROL CARD */}
          <div className="bg-card p-4 rounded-2xl border border-border/80 space-y-2">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" /> Cargar / Limpiar Datos de Prueba
            </span>
            <p className="text-[11px] text-muted-foreground font-medium">
              Si tu API key aún está pendiente de activación o deseas probar offline el circuito Premier Padel con datos verificados, puedes cargar o limpiar datos de demostración en un clic.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleLoadDemoData}
                className="py-2 bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 text-amber-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Zap size={12} /> Cargar Datos Demo
              </button>

              <button
                onClick={handleClearDemoData}
                className="py-2 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Trash2 size={12} /> Limpiar Datos
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
