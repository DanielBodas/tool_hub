"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import TeamBoard from "./components/TeamBoard";
import SynergyPanel from "./components/SynergyPanel";
import PokemonCatalog from "./components/PokemonCatalog";
import OptimizerTab from "./components/OptimizerTab";
import MetaBuildsTab from "./components/MetaBuildsTab";
import CompareTab from "./components/CompareTab";
import RulesAndItemsTab from "./components/RulesAndItemsTab";

import { BoardUnitSelection, calculateTeamSynergies } from "./engine/synergies";
import { scoreTeamComposition } from "./engine/optimizer";
import { POKEMON_CATALOG } from "./data/pokemon";
import { SYNERGIES_DATA } from "./data/typesAndSynergies";

import {
  Swords,
  Bot,
  Trophy,
  Scale,
  Search,
  BookOpen,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Layers,
} from "lucide-react";

export type KantoTab = "builder" | "optimizer" | "metabuilds" | "compare" | "pokedex" | "rules";

const DEFAULT_INITIAL_UNITS: BoardUnitSelection[] = [
  { pokemonId: "bulbasaur", stars: 3, items: ["leftovers", "focus-sash"] },
  { pokemonId: "abra", stars: 3, items: ["choice-specs", "shell-bell"] },
  { pokemonId: "gastly", stars: 3, items: [] },
  { pokemonId: "oddish", stars: 3, items: [] },
  { pokemonId: "voltorb", stars: 2, items: [] },
  { pokemonId: "exeggcute", stars: 2, items: ["shell-bell"] },
  { pokemonId: "magnemite", stars: 1, items: [] },
];

export default function KantoTacticsModule() {
  const [activeTab, setActiveTab] = useState<KantoTab>("builder");
  const [boardSize, setBoardSize] = useState<number>(8);
  const [units, setUnits] = useState<BoardUnitSelection[]>(DEFAULT_INITIAL_UNITS);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<BoardUnitSelection[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Saved teams list
  const [savedTeams, setSavedTeams] = useState<
    { id: string; name: string; units: BoardUnitSelection[] }[]
  >([]);

  const [typeFilterOverride, setTypeFilterOverride] = useState<string | null>(null);

  // Load state from localStorage on mount, then try API
  useEffect(() => {
    try {
      const storedUnits = localStorage.getItem("kanto_active_units");
      if (storedUnits) {
        const parsed = JSON.parse(storedUnits);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUnits(parsed);
          setHistory([parsed]);
          setHistoryIndex(0);
        }
      } else {
        setHistory([DEFAULT_INITIAL_UNITS]);
        setHistoryIndex(0);
      }

      const storedSize = localStorage.getItem("kanto_board_size");
      if (storedSize) setBoardSize(parseInt(storedSize));

      const storedTeams = localStorage.getItem("kanto_saved_teams");
      if (storedTeams) setSavedTeams(JSON.parse(storedTeams));
    } catch (e) {
      console.warn("LocalStorage load error:", e);
    }

    // Fetch saved teams from MongoDB API as secondary source
    fetch("/api/kanto-tactics-builder")
      .then((res) => res.json())
      .then((data) => {
        if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
          setSavedTeams(data.teams);
          localStorage.setItem("kanto_saved_teams", JSON.stringify(data.teams));
        }
      })
      .catch((err) => console.warn("API fetch warning:", err));
  }, []);

  // Update units state with history tracking
  const updateUnitsState = useCallback(
    (newUnits: BoardUnitSelection[]) => {
      setUnits(newUnits);
      try {
        localStorage.setItem("kanto_active_units", JSON.stringify(newUnits));
      } catch (e) {
        console.error(e);
      }

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newUnits);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setUnits(prev);
      localStorage.setItem("kanto_active_units", JSON.stringify(prev));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setUnits(next);
      localStorage.setItem("kanto_active_units", JSON.stringify(next));
    }
  };

  const handleClearBoard = () => {
    updateUnitsState([]);
  };

  const handleAddUnit = (pokemonId: string) => {
    if (units.length >= boardSize) {
      alert(`Límite del tablero alcanzado (Nivel ${boardSize}). Aumenta el nivel para añadir más plazas.`);
      return;
    }
    updateUnitsState([...units, { pokemonId, stars: 2 }]);
  };

  const handleChangeBoardSize = (newSize: number) => {
    setBoardSize(newSize);
    localStorage.setItem("kanto_board_size", newSize.toString());
  };

  // Save team
  const handleSaveTeam = async (name: string) => {
    const newTeam = { id: crypto.randomUUID(), name, units };
    const updated = [...savedTeams, newTeam];
    setSavedTeams(updated);
    localStorage.setItem("kanto_saved_teams", JSON.stringify(updated));

    // Sync to API
    try {
      await fetch("/api/kanto-tactics-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "teams", payload: updated }),
      });
    } catch (e) {
      console.warn("API Save error:", e);
    }
  };

  const handleDeleteSavedTeam = async (id: string) => {
    const updated = savedTeams.filter((t) => t.id !== id);
    setSavedTeams(updated);
    localStorage.setItem("kanto_saved_teams", JSON.stringify(updated));

    try {
      await fetch(`/api/kanto-tactics-builder?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("API Delete error:", e);
    }
  };

  // Synergy Analysis
  const synergyAnalysis = useMemo(() => {
    return calculateTeamSynergies(units);
  }, [units]);

  // Score Heuristic
  const calculatedScore = useMemo(() => {
    return scoreTeamComposition(units, { boardSize });
  }, [units, boardSize]);

  // Improvement Suggestions
  const improvementSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (units.length < boardSize) {
      suggestions.push(`Añade ${boardSize - units.length} unidad(es) más para aprovechar todo el tablero.`);
    }

    if (synergyAnalysis.partialSynergies.length > 0) {
      const topPartial = synergyAnalysis.partialSynergies[0];
      suggestions.push(
        `Añade 1 Pokémon de tipo ${topPartial.definition.nameEs} para activar el siguiente umbral (${topPartial.nextThreshold?.count}).`
      );
    }

    const uniqueIds = Array.from(new Set(units.map((u) => u.pokemonId)));
    const hasTank = uniqueIds.some((id) => POKEMON_CATALOG.find((p) => p.id === id)?.role === "Tanque");
    if (!hasTank && units.length > 0) {
      suggestions.push("Considera incorporar un Tanque (ej. Bulbasaur, Slowbro, Rhydon) para la primera línea.");
    }

    return suggestions;
  }, [units, boardSize, synergyAnalysis]);

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-10">
      {/* -------------------- MAIN SCREEN LIVE OVERVIEW DASHBOARD BANNER -------------------- */}
      <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
              <Swords size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                Kanto Tactics Team Builder & Optimizer
              </h2>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Análisis dinámico en tiempo real · Versión 32
              </p>
            </div>
          </div>

          {/* KPI BADGES */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-muted/30 border border-border/60 px-2.5 py-1 rounded-xl text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Plazas Tablero
              </span>
              <span className="text-xs font-black text-foreground">
                {units.length} / {boardSize}
              </span>
            </div>

            <div className="bg-muted/30 border border-border/60 px-2.5 py-1 rounded-xl text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Sinergias Activas
              </span>
              <span className="text-xs font-black text-emerald-400">
                {synergyAnalysis.totalActiveBonusesCount} Activas
              </span>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                Puntuación
              </span>
              <span className="text-xs font-black text-emerald-300">
                {calculatedScore} pts
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE SYNERGIES PILLS QUICK PREVIEW */}
        {synergyAnalysis.activeSynergies.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Bonos Activos:
            </span>
            {synergyAnalysis.activeSynergies.map((s) => (
              <span
                key={s.type}
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg border ${s.definition.badgeBg}`}
              >
                {s.definition.icon} {s.definition.nameEs} ({s.count}): {s.activeBonusText}
              </span>
            ))}
          </div>
        )}

        {/* IMPROVEMENT SUGGESTIONS BANNER */}
        {improvementSuggestions.length > 0 && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-amber-300 block">
                Sugerencias de Mejora Directa:
              </span>
              <p className="text-[11px] font-semibold text-muted-foreground">
                • {improvementSuggestions.join(" • ")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- STICKY NAVIGATION CAPSULE BAR -------------------- */}
      <div className="sticky top-12 z-30 bg-card/90 backdrop-blur-md rounded-2xl border border-border/80 p-1.5 shadow-md">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-center">
          <button
            onClick={() => setActiveTab("builder")}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === "builder"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Swords size={13} /> Team Builder
          </button>

          <button
            onClick={() => setActiveTab("optimizer")}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === "optimizer"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Bot size={13} /> Optimizador
          </button>

          <button
            onClick={() => setActiveTab("metabuilds")}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === "metabuilds"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Trophy size={13} /> Meta Builds
          </button>

          <button
            onClick={() => setActiveTab("compare")}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === "compare"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Scale size={13} /> Comparador
          </button>

          <button
            onClick={() => setActiveTab("pokedex")}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === "pokedex"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Search size={13} /> Pokédex
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === "rules"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <BookOpen size={13} /> Reglas
          </button>
        </div>
      </div>

      {/* -------------------- TAB CONTENT VIEWS -------------------- */}

      {/* 1. MAIN TAB: TEAM BUILDER VIEW */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT / TOP: TEAM BOARD & SYNERGIES */}
          <div className="lg:col-span-7 space-y-3.5">
            <TeamBoard
              units={units}
              boardSize={boardSize}
              onUpdateUnits={updateUnitsState}
              onChangeBoardSize={handleChangeBoardSize}
              onClearBoard={handleClearBoard}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onSaveTeam={handleSaveTeam}
              savedTeams={savedTeams}
              onLoadTeam={(loadedUnits) => updateUnitsState(loadedUnits)}
              onDeleteSavedTeam={handleDeleteSavedTeam}
            />

            <SynergyPanel
              analysis={synergyAnalysis}
              onSelectTypeFilter={(t) => {
                setTypeFilterOverride(t);
                setActiveTab("pokedex");
              }}
            />
          </div>

          {/* RIGHT / BOTTOM: POKEMON CATALOG */}
          <div className="lg:col-span-5">
            <PokemonCatalog
              selectedPokemonIds={units.map((u) => u.pokemonId)}
              onAddUnit={handleAddUnit}
              maxSlotsReached={units.length >= boardSize}
              typeFilterOverride={typeFilterOverride}
              onClearTypeOverride={() => setTypeFilterOverride(null)}
            />
          </div>
        </div>
      )}

      {/* 2. TAB: OPTIMIZER */}
      {activeTab === "optimizer" && (
        <OptimizerTab
          currentUnits={units}
          boardSize={boardSize}
          onApplyTeam={(newUnits) => {
            updateUnitsState(newUnits);
            setActiveTab("builder");
          }}
        />
      )}

      {/* 3. TAB: META BUILDS */}
      {activeTab === "metabuilds" && (
        <MetaBuildsTab
          onLoadMetaTeam={(metaUnits, level) => {
            handleChangeBoardSize(level);
            updateUnitsState(metaUnits);
            setActiveTab("builder");
          }}
        />
      )}

      {/* 4. TAB: COMPARATOR */}
      {activeTab === "compare" && (
        <CompareTab currentUnits={units} savedTeams={savedTeams} />
      )}

      {/* 5. TAB: POKEDEX & CATALOG EXCLUSIVE VIEW */}
      {activeTab === "pokedex" && (
        <PokemonCatalog
          selectedPokemonIds={units.map((u) => u.pokemonId)}
          onAddUnit={handleAddUnit}
          maxSlotsReached={units.length >= boardSize}
          typeFilterOverride={typeFilterOverride}
          onClearTypeOverride={() => setTypeFilterOverride(null)}
        />
      )}

      {/* 6. TAB: RULES & DATA */}
      {activeTab === "rules" && <RulesAndItemsTab />}
    </div>
  );
}
