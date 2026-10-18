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
  INITIAL_MALE_PLAYERS,
  INITIAL_FEMALE_PLAYERS,
  INITIAL_TOURNAMENTS,
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
  const [malePlayers, setMalePlayers] = useState<Player[]>(INITIAL_MALE_PLAYERS);
  const [femalePlayers, setFemalePlayers] = useState<Player[]>(INITIAL_FEMALE_PLAYERS);
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
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

  // Modals States
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [showTournamentModal, setShowTournamentModal] = useState<boolean>(false);
  const [editingTournament, setEditingTournament] =
    useState<Partial<Tournament> | null>(null);

  // Auto-clear notification toast
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load Data from API / localStorage on Mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/padel-ranking-tracker");
        if (res.ok) {
          const data = await res.json();
          if (data.malePlayers && data.malePlayers.length > 0) {
            setMalePlayers(data.malePlayers);
          }
          if (data.femalePlayers && data.femalePlayers.length > 0) {
            setFemalePlayers(data.femalePlayers);
          }
          if (data.tournaments && data.tournaments.length > 0) {
            setTournaments(data.tournaments);
          }
          if (data.simulatedOutcomes) {
            setSimulatedOutcomes(data.simulatedOutcomes);
          }
          if (data.apiConfig) {
            setApiConfig(data.apiConfig);
          }
        } else {
          loadFromLocalStorage();
        }
      } catch (e) {
        console.warn("Failed to fetch API, falling back to local storage", e);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed: PadelModuleData = JSON.parse(local);
        if (parsed.malePlayers) setMalePlayers(parsed.malePlayers);
        if (parsed.femalePlayers) setFemalePlayers(parsed.femalePlayers);
        if (parsed.tournaments) setTournaments(parsed.tournaments);
        if (parsed.simulatedOutcomes) setSimulatedOutcomes(parsed.simulatedOutcomes);
        if (parsed.apiConfig) setApiConfig(parsed.apiConfig);
      }
    } catch (err) {
      console.error("Error parsing local storage", err);
    }
  };

  // Sync / Save Data
  const saveData = async (
    newMale = malePlayers,
    newFemale = femalePlayers,
    newTournaments = tournaments,
    newSim = simulatedOutcomes,
    newConfig = apiConfig
  ) => {
    setIsSaving(true);
    const payload: PadelModuleData = {
      malePlayers: newMale,
      femalePlayers: newFemale,
      tournaments: newTournaments,
      simulatedOutcomes: newSim,
      apiConfig: newConfig,
    };

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }

    // Save to API Backend
    try {
      const res = await fetch("/api/padel-ranking-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "full_sync", ...payload }),
      });
      if (res.ok) {
        setStatusMessage({ text: "Datos guardados correctamente", type: "success" });
      }
    } catch (e) {
      console.warn("Could not save to remote API, saved locally", e);
      setStatusMessage({
        text: "Guardado localmente (sin conexión)",
        type: "info",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Active Players according to active Gender
  const activePlayers = useMemo(() => {
    return selectedGender === "male" ? malePlayers : femalePlayers;
  }, [selectedGender, malePlayers, femalePlayers]);

  // Set default selected simulation tournament when switching to simulator tab
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
        p.partnerName.toLowerCase().includes(q) ||
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
      const expiringEntries = player.pointsHistory.filter((entry) => {
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
      // Find projected round
      const projectedRound =
        currentSimOutcome?.playerRoundAssignments?.[player.id] || "None";
      const projectedEarnedPoints =
        projectedRound in scale
          ? scale[projectedRound as keyof typeof scale] || 0
          : 0;

      // Check if this tournament replaces a previous edition tournament
      let expiredPreviousPoints = 0;
      if (targetSimTournament.replacesTournamentId) {
        const prevEntry = player.pointsHistory.find(
          (h) => h.tournamentId === targetSimTournament.replacesTournamentId
        );
        if (prevEntry) {
          expiredPreviousPoints = prevEntry.points;
        }
      }

      // Calculate net simulated official points
      const simOfficialPoints = Math.max(
        0,
        player.officialPoints - expiredPreviousPoints + projectedEarnedPoints
      );

      // Calculate net simulated RACE points
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
    // Original official ranks
    const originalSorted = [...activePlayers].sort(
      (a, b) => b.officialPoints - a.officialPoints
    );
    const originalRankMap = new Map<string, number>();
    originalSorted.forEach((p, idx) => originalRankMap.set(p.id, idx + 1));

    // Simulated sorted
    const simSorted = [...simulatedStandings].sort(
      (a, b) => b.simOfficialPoints - a.simOfficialPoints
    );

    return simSorted.map((item, newIdx) => {
      const newRank = newIdx + 1;
      const oldRank = originalRankMap.get(item.player.id) || newRank;
      const rankShift = oldRank - newRank; // positive = moved up, negative = moved down
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

      // Also assign to partner if found
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

      saveData(
        malePlayers,
        femalePlayers,
        tournaments,
        newSims,
        apiConfig
      );
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
    saveData(malePlayers, femalePlayers, tournaments, newSims, apiConfig);
    setStatusMessage({
      text: "Simulación restablecida para este torneo",
      type: "info",
    });
  };

  // Add / Edit Player Handlers
  const handleOpenAddPlayer = () => {
    setEditingPlayer({
      id: "p-" + Date.now(),
      name: "",
      country: "ESP 🇪🇸",
      gender: selectedGender,
      partnerName: "",
      officialRanking: activePlayers.length + 1,
      officialPoints: 1000,
      raceRanking: activePlayers.length + 1,
      racePoints: 500,
      pointsHistory: [],
    });
    setShowPlayerModal(true);
  };

  const handleSavePlayer = () => {
    if (!editingPlayer || !editingPlayer.name?.trim()) {
      alert("Por favor introduce el nombre del jugador");
      return;
    }

    const updatedPlayer: Player = {
      id: editingPlayer.id || "p-" + Date.now(),
      name: editingPlayer.name.trim(),
      country: editingPlayer.country || "ESP 🇪🇸",
      gender: selectedGender,
      partnerName: editingPlayer.partnerName || "",
      officialRanking: editingPlayer.officialRanking || 1,
      officialPoints: Number(editingPlayer.officialPoints) || 0,
      raceRanking: editingPlayer.raceRanking || 1,
      racePoints: Number(editingPlayer.racePoints) || 0,
      pointsHistory: editingPlayer.pointsHistory || [],
    };

    let newMale = malePlayers;
    let newFemale = femalePlayers;

    if (selectedGender === "male") {
      const exists = malePlayers.some((p) => p.id === updatedPlayer.id);
      if (exists) {
        newMale = malePlayers.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p
        );
      } else {
        newMale = [...malePlayers, updatedPlayer];
      }
      setMalePlayers(newMale);
    } else {
      const exists = femalePlayers.some((p) => p.id === updatedPlayer.id);
      if (exists) {
        newFemale = femalePlayers.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p
        );
      } else {
        newFemale = [...femalePlayers, updatedPlayer];
      }
      setFemalePlayers(newFemale);
    }

    setShowPlayerModal(false);
    setEditingPlayer(null);
    saveData(newMale, newFemale, tournaments, simulatedOutcomes, apiConfig);
    setStatusMessage({
      text: `Jugador ${updatedPlayer.name} guardado con éxito`,
      type: "success",
    });
  };

  const handleDeletePlayer = (playerId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este jugador?")) return;

    let newMale = malePlayers;
    let newFemale = femalePlayers;

    if (selectedGender === "male") {
      newMale = malePlayers.filter((p) => p.id !== playerId);
      setMalePlayers(newMale);
    } else {
      newFemale = femalePlayers.filter((p) => p.id !== playerId);
      setFemalePlayers(newFemale);
    }

    saveData(newMale, newFemale, tournaments, simulatedOutcomes, apiConfig);
    setStatusMessage({ text: "Jugador eliminado", type: "info" });
  };

  // Add / Edit Tournament Handlers
  const handleOpenAddTournament = () => {
    setEditingTournament({
      id: "tourn-" + Date.now(),
      name: "",
      category: "P1",
      location: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      gender: "both",
      status: "upcoming",
      edition: "2025",
      pointsScale: CATEGORY_POINTS_SCALES["P1"],
      results: [],
    });
    setShowTournamentModal(true);
  };

  const handleSaveTournament = () => {
    if (!editingTournament || !editingTournament.name?.trim()) {
      alert("Por favor introduce el nombre del torneo");
      return;
    }

    const cat = editingTournament.category || "P1";
    const scale = CATEGORY_POINTS_SCALES[cat] || CATEGORY_POINTS_SCALES["P1"];

    const updatedTourn: Tournament = {
      id: editingTournament.id || "tourn-" + Date.now(),
      name: editingTournament.name.trim(),
      category: cat as TournamentCategory,
      location: editingTournament.location || "Por determinar",
      startDate: editingTournament.startDate || "",
      endDate: editingTournament.endDate || "",
      gender: editingTournament.gender || "both",
      status: editingTournament.status || "upcoming",
      edition: editingTournament.edition || "2025",
      pointsScale: scale,
      results: editingTournament.results || [],
    };

    const exists = tournaments.some((t) => t.id === updatedTourn.id);
    let newTournaments = [];
    if (exists) {
      newTournaments = tournaments.map((t) =>
        t.id === updatedTourn.id ? updatedTourn : t
      );
    } else {
      newTournaments = [...tournaments, updatedTourn];
    }

    setTournaments(newTournaments);
    setShowTournamentModal(false);
    setEditingTournament(null);
    saveData(
      malePlayers,
      femalePlayers,
      newTournaments,
      simulatedOutcomes,
      apiConfig
    );
    setStatusMessage({
      text: `Torneo ${updatedTourn.name} guardado con éxito`,
      type: "success",
    });
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const data: PadelModuleData = {
      malePlayers,
      femalePlayers,
      tournaments,
      simulatedOutcomes,
      apiConfig,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `padel_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.malePlayers && parsed.femalePlayers) {
          setMalePlayers(parsed.malePlayers);
          setFemalePlayers(parsed.femalePlayers);
          setTournaments(parsed.tournaments || INITIAL_TOURNAMENTS);
          setSimulatedOutcomes(parsed.simulatedOutcomes || []);
          if (parsed.apiConfig) setApiConfig(parsed.apiConfig);

          saveData(
            parsed.malePlayers,
            parsed.femalePlayers,
            parsed.tournaments || INITIAL_TOURNAMENTS,
            parsed.simulatedOutcomes || [],
            parsed.apiConfig || DEFAULT_API_CONFIG
          );
          setStatusMessage({
            text: "Copia de seguridad importada con éxito",
            type: "success",
          });
        } else {
          alert("El archivo JSON no tiene el formato válido de Padel Tracker");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON");
      }
    };
    reader.readAsText(file);
  };

  // Reset Data to Initial Defaults
  const handleResetAllData = () => {
    if (
      confirm(
        "¿Estás seguro de que deseas restablecer los datos a los valores de fábrica?"
      )
    ) {
      setMalePlayers(INITIAL_MALE_PLAYERS);
      setFemalePlayers(INITIAL_FEMALE_PLAYERS);
      setTournaments(INITIAL_TOURNAMENTS);
      setSimulatedOutcomes([]);
      setApiConfig(DEFAULT_API_CONFIG);

      saveData(
        INITIAL_MALE_PLAYERS,
        INITIAL_FEMALE_PLAYERS,
        INITIAL_TOURNAMENTS,
        [],
        DEFAULT_API_CONFIG
      );
      setStatusMessage({
        text: "Datos restablecidos a los valores iniciales",
        type: "info",
      });
    }
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
              <RefreshCw size={10} className="animate-spin" /> Guardando...
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
      {/* TAB 1: RANKING & RACE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "ranking" && (
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

                    {/* EXPANDED DETAILS: HISTORIAL Y CAÍDAS */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/20 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-muted-foreground">
                          <span>Historial de Torneos Contribuyentes</span>
                          <span>Expiración / Resta</span>
                        </div>

                        {player.pointsHistory.length > 0 ? (
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
                            No hay torneos registrados para este jugador.
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
      {activeTab === "drops" && (
        <div className="space-y-3">

          {/* Days Filter Pills */}
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

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-card p-2.5 rounded-xl border border-rose-500/30">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                Total Puntos a Restar
              </span>
              <span className="text-sm font-black text-rose-500 font-mono">
                -
                {playerDropsData
                  .reduce((sum, p) => sum + p.totalPointsToLose, 0)
                  .toLocaleString()}{" "}
                pts
              </span>
            </div>

            <div className="bg-card p-2.5 rounded-xl border border-amber-500/30">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                Mayor Caída de Puntos
              </span>
              <span className="text-xs font-black text-foreground truncate block">
                {playerDropsData[0]?.player.name || "Ninguno"}
              </span>
              <span className="text-[10px] font-bold text-rose-400 font-mono">
                -{playerDropsData[0]?.totalPointsToLose.toLocaleString()} pts
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-card p-2.5 rounded-xl border border-border/80">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">
                Período Seleccionado
              </span>
              <span className="text-xs font-black text-primary block">
                {dropDaysFilter === 0
                  ? "Próximos 12 Meses"
                  : `Próximos ${dropDaysFilter} Días`}
              </span>
            </div>
          </div>

          {/* PLAYER DROPS BREAKDOWN LIST */}
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

                {/* Expiring Tournaments Timeline */}
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
      {activeTab === "simulator" && (
        <div className="space-y-3">

          {/* Target Tournament Selector */}
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
                  {t.name} ({t.category}) • {t.location} • {t.status === "completed" ? "Finalizado" : "Próximo"}
                </option>
              ))}
            </select>

            {targetSimTournament && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                <span>Fechas: {targetSimTournament.startDate} al {targetSimTournament.endDate}</span>
                <span className="text-purple-400 font-extrabold">Categoría: {targetSimTournament.category} (Ganador: +{targetSimTournament.pointsScale.Winner} pts)</span>
              </div>
            )}
          </div>

          {/* SIMULATOR STANDINGS TABLE */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider px-1">
              Clasificación Simulada en Tiempo Real:
            </div>

            {simulatedRankingsWithShifts.map((item) => {
              const { player, projectedRound, projectedEarnedPoints, expiredPreviousPoints, simOfficialPoints, rankShift, newRank } = item;
              const scale = targetSimTournament?.pointsScale || CATEGORY_POINTS_SCALES["P1"];

              return (
                <div
                  key={player.id}
                  className="bg-card p-3 rounded-2xl border border-border/80 space-y-2 transition-all hover:border-purple-500/40"
                >
                  <div className="flex items-center justify-between gap-2">

                    {/* Left Rank & Name */}
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

                    {/* Right Simulated Points */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-purple-400 font-mono">
                        {simOfficialPoints.toLocaleString()} pts
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">
                        Original: {player.officialPoints.toLocaleString()}
                      </span>
                    </div>

                  </div>

                  {/* Projected Round Selector Buttons */}
                  <div className="pt-2 border-t border-border/50 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 mr-1">
                      Resultado Proyectado:
                    </span>

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
      {activeTab === "tournaments" && (
        <div className="space-y-3">

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-muted-foreground uppercase">
              Calendario Premier Padel 2024/2025 ({tournaments.length})
            </span>

            <button
              onClick={handleOpenAddTournament}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
            >
              <Plus size={12} /> Nuevo Torneo
            </button>
          </div>

          <div className="space-y-2.5">
            {tournaments.map((tourn) => (
              <div
                key={tourn.id}
                className="bg-card p-3 rounded-2xl border border-border/80 space-y-2 hover:border-amber-500/40 transition-all"
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

                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      tourn.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                    }`}
                  >
                    {tourn.status === "completed" ? "✅ Finalizado" : "📅 Próximo"}
                  </span>
                </div>

                {/* Points Scale Breakdown */}
                <div className="pt-2 border-t border-border/50 text-[10px] grid grid-cols-3 sm:grid-cols-6 gap-1 text-center font-mono bg-muted/20 p-2 rounded-xl">
                  <div>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold block">Campeón</span>
                    <span className="text-amber-400 font-bold">+{tourn.pointsScale.Winner}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold block">Finalista</span>
                    <span className="text-slate-300 font-bold">+{tourn.pointsScale.Finalist}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold block">Semis</span>
                    <span className="text-foreground font-bold">+{tourn.pointsScale.SF}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold block">Cuartos</span>
                    <span className="text-foreground font-bold">+{tourn.pointsScale.QF}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold block">1/16</span>
                    <span className="text-foreground font-bold">+{tourn.pointsScale.R16}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-muted-foreground uppercase font-bold block">1/32</span>
                    <span className="text-foreground font-bold">+{tourn.pointsScale.R32}</span>
                  </div>
                </div>

                {/* Results list if completed */}
                {tourn.results && tourn.results.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] font-extrabold uppercase text-muted-foreground">Resultados Destacados:</span>
                    {tourn.results.map((res, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] bg-muted/40 p-1.5 rounded-lg">
                        <span className="font-bold text-foreground truncate">
                          {res.player1Name} & {res.player2Name}
                        </span>
                        <span className="font-mono font-extrabold text-amber-400 shrink-0">
                          {res.round}: +{res.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CONFIGURACIÓN & API */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="space-y-3">

          {/* API STATUS & CONNECTIVITY CARD */}
          <div className="bg-card p-3 rounded-2xl border border-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-foreground">
              <Globe size={16} className="text-sky-400" /> API de Pádel y Sincronización
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                  URL Endpoint API Pádel:
                </label>
                <input
                  type="text"
                  value={apiConfig.apiUrl}
                  onChange={(e) => setApiConfig({ ...apiConfig, apiUrl: e.target.value })}
                  placeholder="https://api.padelfip.com/v1"
                  className="w-full bg-muted/50 border border-border/80 rounded-xl p-2 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                  API Key / Token de Acceso:
                </label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-muted/50 border border-border/80 rounded-xl p-2 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                onClick={() => saveData(malePlayers, femalePlayers, tournaments, simulatedOutcomes, apiConfig)}
                className="w-full py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} /> Guardar Ajustes de API
              </button>
            </div>
          </div>

          {/* PLAYER & DATA MANAGEMENT ACTIONS */}
          <div className="bg-card p-3 rounded-2xl border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Users size={14} className="text-amber-500" /> Gestión de Jugadores ({activePlayers.length})
              </span>
              <button
                onClick={handleOpenAddPlayer}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1"
              >
                <Plus size={11} /> Añadir Jugador/a
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-xl border border-border/50 text-xs"
                >
                  <span className="font-bold text-foreground truncate">
                    {player.name} ({player.country})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 rounded"
                      title="Eliminar Jugador"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BACKUP EXPORT & IMPORT */}
          <div className="bg-card p-3 rounded-2xl border border-border/80 space-y-2">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Download size={14} className="text-emerald-400" /> Copia de Seguridad JSON
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="py-2 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Download size={12} /> Exportar JSON
              </button>

              <label className="py-2 bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer">
                <Upload size={12} /> Importar JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={handleResetAllData}
              className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold text-[10px] rounded-xl border border-rose-500/20 transition-all flex items-center justify-center gap-1"
            >
              <Trash2 size={11} /> Restablecer Todos los Datos de Fábrica
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT / ADD PLAYER */}
      {/* ========================================================================= */}
      {showPlayerModal && editingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-foreground">
              {editingPlayer.id ? "Editar Jugador/a" : "Añadir Jugador/a"}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  value={editingPlayer.name || ""}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  placeholder="Ej: Arturo Coello"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    País / Bandera:
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.country || ""}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, country: e.target.value })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                    placeholder="ESP 🇪🇸"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Pareja Actual:
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.partnerName || ""}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, partnerName: e.target.value })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                    placeholder="Agustín Tapia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Puntos Oficiales:
                  </label>
                  <input
                    type="number"
                    value={editingPlayer.officialPoints || 0}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, officialPoints: Number(e.target.value) })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Puntos RACE 2025:
                  </label>
                  <input
                    type="number"
                    value={editingPlayer.racePoints || 0}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, racePoints: Number(e.target.value) })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPlayerModal(false)}
                className="px-3 py-1.5 bg-muted text-muted-foreground font-extrabold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlayer}
                className="px-4 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-xs"
              >
                Guardar Jugador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT / ADD TOURNAMENT */}
      {/* ========================================================================= */}
      {showTournamentModal && editingTournament && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-md space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-foreground">
              {editingTournament.id ? "Editar Torneo" : "Añadir Torneo"}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                  Nombre del Torneo:
                </label>
                <input
                  type="text"
                  value={editingTournament.name || ""}
                  onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                  className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  placeholder="Ej: Madrid P1 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Categoría:
                  </label>
                  <select
                    value={editingTournament.category || "P1"}
                    onChange={(e) => setEditingTournament({ ...editingTournament, category: e.target.value as TournamentCategory })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  >
                    {Object.keys(CATEGORY_POINTS_SCALES).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Ubicación:
                  </label>
                  <input
                    type="text"
                    value={editingTournament.location || ""}
                    onChange={(e) => setEditingTournament({ ...editingTournament, location: e.target.value })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                    placeholder="Madrid, España"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Fecha Inicio:
                  </label>
                  <input
                    type="date"
                    value={editingTournament.startDate || ""}
                    onChange={(e) => setEditingTournament({ ...editingTournament, startDate: e.target.value })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-0.5">
                    Fecha Fin:
                  </label>
                  <input
                    type="date"
                    value={editingTournament.endDate || ""}
                    onChange={(e) => setEditingTournament({ ...editingTournament, endDate: e.target.value })}
                    className="w-full bg-muted/60 border border-border rounded-xl p-2 font-bold text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTournamentModal(false)}
                className="px-3 py-1.5 bg-muted text-muted-foreground font-extrabold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTournament}
                className="px-4 py-1.5 bg-amber-600 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Guardar Torneo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
