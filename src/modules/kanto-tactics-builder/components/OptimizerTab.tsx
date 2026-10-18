"use client";

import React, { useState, useMemo } from "react";
import { BoardUnitSelection } from "../engine/synergies";
import {
  generateOptimalTeams,
  findUnitSubstitutions,
  OptimizationConstraints,
  OptimizationCandidate,
  PlaystyleFocus,
  SubstitutionOption,
} from "../engine/optimizer";
import { POKEMON_CATALOG, PokemonUnit } from "../data/pokemon";
import { SYNERGIES_DATA, PokemonType } from "../data/typesAndSynergies";
import {
  Bot,
  Sparkles,
  Zap,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  ListPlus,
  Sliders,
} from "lucide-react";

interface OptimizerTabProps {
  currentUnits: BoardUnitSelection[];
  boardSize: number;
  onApplyTeam: (units: BoardUnitSelection[]) => void;
}

export default function OptimizerTab({
  currentUnits,
  boardSize,
  onApplyTeam,
}: OptimizerTabProps) {
  const [playstyle, setPlaystyle] = useState<PlaystyleFocus>("Balanced");
  const [mandatoryIds, setMandatoryIds] = useState<string[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [priorityTypes, setPriorityTypes] = useState<PokemonType[]>([]);
  const [results, setResults] = useState<OptimizationCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Substitution state
  const [selectedSubstitutionTarget, setSelectedSubstitutionTarget] = useState<string | null>(
    currentUnits[0]?.pokemonId || null
  );

  const typesList = Object.keys(SYNERGIES_DATA) as PokemonType[];

  // Run Optimization
  const handleRunOptimizer = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const constraints: OptimizationConstraints = {
        boardSize,
        mandatoryPokemonIds: mandatoryIds,
        excludedPokemonIds: excludedIds,
        priorityTypes,
        playstyle,
      };
      const candidateList = generateOptimalTeams(constraints);
      setResults(candidateList);
      setIsGenerating(false);
    }, 200);
  };

  // Toggle Mandatory
  const toggleMandatory = (id: string) => {
    if (mandatoryIds.includes(id)) {
      setMandatoryIds(mandatoryIds.filter((item) => item !== id));
    } else {
      setMandatoryIds([...mandatoryIds, id]);
      setExcludedIds(excludedIds.filter((item) => item !== id));
    }
  };

  // Toggle Excluded
  const toggleExcluded = (id: string) => {
    if (excludedIds.includes(id)) {
      setExcludedIds(excludedIds.filter((item) => item !== id));
    } else {
      setExcludedIds([...excludedIds, id]);
      setMandatoryIds(mandatoryIds.filter((item) => item !== id));
    }
  };

  // Toggle Priority Type
  const togglePriorityType = (type: PokemonType) => {
    if (priorityTypes.includes(type)) {
      setPriorityTypes(priorityTypes.filter((t) => t !== type));
    } else {
      setPriorityTypes([...priorityTypes, type]);
    }
  };

  // Substitution options for active team target
  const substitutionOptions = useMemo(() => {
    if (!selectedSubstitutionTarget || currentUnits.length === 0) return [];
    return findUnitSubstitutions(currentUnits, selectedSubstitutionTarget);
  }, [currentUnits, selectedSubstitutionTarget]);

  return (
    <div className="space-y-4">
      {/* SECTION 1: OPTIMIZATION CONSTRAINTS FORM */}
      <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-2 flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-primary" /> Motor de Optimización Automática
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
            Heurística Evaluativa Avanzada
          </span>
        </div>

        {/* PLAYSTYLE SELECTOR */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
            Estilo de Juego u Objetivo Principal:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {(
              [
                ["Balanced", "⚖️ Equilibrado"],
                ["Damage", "⚔️ Daño Máximo"],
                ["Survivability", "🛡️ Supervivencia"],
                ["Control", "❄️ Control de Masas"],
                ["Economy", "🪙 Reroll / Economía"],
                ["MetaOnly", "🏆 Solo Meta"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPlaystyle(key as PlaystyleFocus)}
                className={`p-2 rounded-xl text-xs font-extrabold border transition-all ${
                  playstyle === key
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card border-border/80 text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* PRIORITY TYPES SELECTION */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
            Sinergias Prioritarias (Opcional):
          </label>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
            {typesList.map((t) => {
              const def = SYNERGIES_DATA[t];
              const isSelected = priorityTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => togglePriorityType(t)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border ${
                    isSelected
                      ? `${def.badgeBg} shadow-2xs`
                      : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {def.icon} {def.nameEs}
                </button>
              );
            })}
          </div>
        </div>

        {/* RESTRICTION TOGGLES FOR POKEMON (OBLIGATORIOS Y EXCLUIDOS) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
            Restricciones de Unidades (Obligatorios o Evitar):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* OBLIGATORIOS */}
            <div className="bg-muted/20 border border-border/60 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-400 block">
                Obligatorios en el Equipo ({mandatoryIds.length}):
              </span>
              <div className="flex items-center gap-1 flex-wrap max-h-20 overflow-y-auto">
                {mandatoryIds.map((id) => {
                  const p = POKEMON_CATALOG.find((item) => item.id === id);
                  return (
                    <span
                      key={id}
                      onClick={() => toggleMandatory(id)}
                      className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-[10px] font-bold cursor-pointer hover:line-through"
                    >
                      {p?.nameEs} ✕
                    </span>
                  );
                })}
                {mandatoryIds.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">
                    Ninguno seleccionado (haz clic abajo para añadir)
                  </span>
                )}
              </div>
            </div>

            {/* EVITAR */}
            <div className="bg-muted/20 border border-border/60 rounded-xl p-2 space-y-1">
              <span className="text-[10px] font-extrabold text-rose-400 block">
                Evitar / Excluir del Equipo ({excludedIds.length}):
              </span>
              <div className="flex items-center gap-1 flex-wrap max-h-20 overflow-y-auto">
                {excludedIds.map((id) => {
                  const p = POKEMON_CATALOG.find((item) => item.id === id);
                  return (
                    <span
                      key={id}
                      onClick={() => toggleExcluded(id)}
                      className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-md text-[10px] font-bold cursor-pointer hover:line-through"
                    >
                      {p?.nameEs} ✕
                    </span>
                  );
                })}
                {excludedIds.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">
                    Ninguno excluido
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleRunOptimizer}
            disabled={isGenerating}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Generando Variantes Óptimas...
              </>
            ) : (
              <>
                <Zap size={14} fill="currentColor" /> Generar Composiciones Óptimas para Nivel {boardSize}
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 2: CANDIDATE RESULTS */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" /> Resultados Recomendados
          </h3>

          <div className="space-y-3">
            {results.map((cand, idx) => (
              <div
                key={cand.id}
                className="bg-card/80 backdrop-blur-md rounded-2xl border border-primary/40 p-3.5 space-y-2.5 shadow-sm"
              >
                {/* CANDIDATE HEADER */}
                <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shadow-2xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-foreground">
                        Composición Óptima #{idx + 1}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        Coste total: {cand.totalCost} oro · Cobertura: {cand.whyItWorks.rolesCoverage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                      Puntuación: {cand.score} pts
                    </span>

                    <button
                      onClick={() => onApplyTeam(cand.units)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
                    >
                      Cargar en Tablero <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* UNITS SPRITES ROW */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cand.units.map((u) => {
                    const p = POKEMON_CATALOG.find((item) => item.id === u.pokemonId);
                    if (!p) return null;
                    return (
                      <div
                        key={p.id}
                        className="bg-muted/30 border border-border px-2 py-1 rounded-xl flex items-center gap-1.5"
                      >
                        <img src={p.sprite} alt={p.nameEs} className="w-6 h-6 object-contain" />
                        <span className="text-[10px] font-bold text-foreground">{p.nameEs}</span>
                      </div>
                    );
                  })}
                </div>

                {/* "WHY IT WORKS" EXPLANATION CARD */}
                <div className="p-2.5 bg-muted/20 border border-border/60 rounded-xl space-y-1.5 text-xs">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> ¿Por qué funciona? (Análisis del Optimizador)
                  </h5>

                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    {cand.whyItWorks.keySynergies.map((syn, i) => (
                      <p key={i}>• {syn}</p>
                    ))}
                    {cand.whyItWorks.strengths.map((str, i) => (
                      <p key={i} className="text-emerald-300 font-medium">
                        ✓ {str}
                      </p>
                    ))}
                    {cand.whyItWorks.tradeoffs.map((trd, i) => (
                      <p key={i} className="text-amber-300 font-medium">
                        ⚠️ {trd}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: UNIT SUBSTITUTION TOOL */}
      {currentUnits.length > 0 && (
        <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-primary" /> Herramienta de Sustitución de Unidades
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground">
              Analizar reemplazos paso a paso
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
              Selecciona una unidad de tu equipo actual para buscar sustitutos:
            </label>

            {/* ACTIVE UNITS PICKER */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {currentUnits.map((u) => {
                const p = POKEMON_CATALOG.find((item) => item.id === u.pokemonId);
                if (!p) return null;
                const isSelected = selectedSubstitutionTarget === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedSubstitutionTarget(p.id)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <img src={p.sprite} alt={p.nameEs} className="w-5 h-5 object-contain" />
                    <span>{p.nameEs}</span>
                  </button>
                );
              })}
            </div>

            {/* SUBSTITUTION OPTIONS LIST */}
            {substitutionOptions.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Mejores alternativas para reemplazar a{" "}
                  {POKEMON_CATALOG.find((p) => p.id === selectedSubstitutionTarget)?.nameEs}:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {substitutionOptions.map((opt) => (
                    <div
                      key={opt.replacementUnit.id}
                      className="p-2.5 bg-card/60 border border-border/80 rounded-xl space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={opt.replacementUnit.sprite}
                            alt={opt.replacementUnit.nameEs}
                            className="w-6 h-6 object-contain"
                          />
                          <div>
                            <h5 className="text-xs font-black text-foreground">
                              {opt.replacementUnit.nameEs}
                            </h5>
                            <span className="text-[9px] text-muted-foreground">
                              Coste {opt.replacementUnit.cost} 🪙 · {opt.replacementUnit.role}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            opt.scoreDifference > 0
                              ? "bg-emerald-500/20 text-emerald-300"
                              : opt.scoreDifference < 0
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {opt.scoreDifference > 0 ? `+${opt.scoreDifference}` : opt.scoreDifference} pts
                        </span>
                      </div>

                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {opt.reason}
                      </p>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40 text-[9px] font-bold">
                        <div className="flex items-center gap-1 flex-wrap">
                          {opt.synergiesGained.length > 0 && (
                            <span className="text-emerald-400">
                              + Gana: {opt.synergiesGained.join(", ")}
                            </span>
                          )}
                          {opt.synergiesLost.length > 0 && (
                            <span className="text-rose-400">
                              - Pierde: {opt.synergiesLost.join(", ")}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            const updated = currentUnits.map((u) =>
                              u.pokemonId === selectedSubstitutionTarget
                                ? { pokemonId: opt.replacementUnit.id, stars: u.stars }
                                : u
                            );
                            onApplyTeam(updated);
                            setSelectedSubstitutionTarget(opt.replacementUnit.id);
                          }}
                          className="px-2 py-0.5 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 rounded-md text-[9px] font-black"
                        >
                          Sustituir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
