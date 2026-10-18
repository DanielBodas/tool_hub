"use client";

import React, { useState } from "react";
import { TeamSynergyAnalysis, ComputedSynergyState } from "../engine/synergies";
import { POKEMON_CATALOG } from "../data/pokemon";
import { Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";

interface SynergyPanelProps {
  analysis: TeamSynergyAnalysis;
  onSelectTypeFilter?: (type: string) => void;
}

export default function SynergyPanel({ analysis, onSelectTypeFilter }: SynergyPanelProps) {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const toggleExpand = (type: string) => {
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Sinergias Activas ({analysis.totalActiveBonusesCount})
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          Auto-calculado
        </span>
      </div>

      {/* ACTIVE SYNERGIES LIST */}
      {analysis.activeSynergies.length > 0 ? (
        <div className="space-y-2">
          {analysis.activeSynergies.map((s) => (
            <SynergyCard
              key={s.type}
              synergy={s}
              isExpanded={expandedType === s.type}
              onToggle={() => toggleExpand(s.type)}
              onSelectTypeFilter={onSelectTypeFilter}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 px-3 bg-muted/20 rounded-xl border border-dashed border-border/60">
          <p className="text-xs font-semibold text-muted-foreground">
            Añade Pokémon al tablero para activar sinergias de tipo.
          </p>
        </div>
      )}

      {/* PARTIAL SYNERGIES */}
      {analysis.partialSynergies.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
            En progreso / Siguiente Umbral ({analysis.partialSynergies.length})
          </span>
          <div className="space-y-1.5">
            {analysis.partialSynergies.map((s) => (
              <SynergyCard
                key={s.type}
                synergy={s}
                isExpanded={expandedType === s.type}
                onToggle={() => toggleExpand(s.type)}
                onSelectTypeFilter={onSelectTypeFilter}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SynergyCard({
  synergy,
  isExpanded,
  onToggle,
  onSelectTypeFilter,
}: {
  synergy: ComputedSynergyState;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectTypeFilter?: (type: string) => void;
}) {
  const { definition, count, activeThreshold, nextThreshold, isActive, contributingPokemonIds } = synergy;

  const maxCount = nextThreshold ? nextThreshold.count : (activeThreshold?.count || 1);
  const progressPercent = Math.min(100, Math.round((count / maxCount) * 100));

  const contributingUnits = contributingPokemonIds
    .map((id) => POKEMON_CATALOG.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isActive
          ? "bg-card border-primary/40 shadow-2xs"
          : "bg-card/40 border-border/60 hover:border-border"
      }`}
    >
      <div
        onClick={onToggle}
        className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base shrink-0">{definition.icon}</span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-foreground">{definition.nameEs}</span>

              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${definition.badgeBg}`}
              >
                {count} {isActive ? "ACTIVO" : "UNIDADES"}
              </span>

              {nextThreshold && (
                <span className="text-[9px] font-bold text-muted-foreground">
                  Faltan {synergy.unitsNeededForNext} para {nextThreshold.count}
                </span>
              )}
            </div>

            {/* BONUS DESCRIPTION */}
            <p className="text-[10px] font-semibold text-emerald-400 mt-0.5 truncate">
              {synergy.activeBonusText}
            </p>
          </div>
        </div>

        {/* PROGRESS & TOGGLE */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 bg-muted/60 h-1.5 rounded-full overflow-hidden hidden sm:block">
            <div
              className={`h-full transition-all ${
                isActive ? "bg-emerald-500" : "bg-primary/60"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button className="text-muted-foreground hover:text-foreground p-0.5">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div className="px-3 py-2 bg-muted/30 border-t border-border/50 text-xs space-y-2">
          <p className="text-[11px] text-muted-foreground">{definition.description}</p>

          {definition.specialNote && (
            <div className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg flex items-center gap-1">
              <Info size={12} /> {definition.specialNote}
            </div>
          )}

          {/* THRESHOLDS ROADMAP */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] font-bold text-muted-foreground">Umbrales:</span>
            {definition.thresholds.map((t) => {
              const reached = count >= t.count;
              return (
                <span
                  key={t.count}
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                    reached
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-muted text-muted-foreground border-border/60"
                  }`}
                >
                  {t.count}: {t.bonus}
                </span>
              );
            })}
          </div>

          {/* CONTRIBUTING UNITS */}
          {contributingUnits.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                Aportan a esta sinergia:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {contributingUnits.map((u) => (
                  <div
                    key={u!.id}
                    className="flex items-center gap-1 bg-card border border-border px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-foreground"
                  >
                    <img src={u!.sprite} alt={u!.nameEs} className="w-4 h-4 object-contain" />
                    <span>{u!.nameEs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onSelectTypeFilter && (
            <div className="pt-1 text-right">
              <button
                onClick={() => onSelectTypeFilter(definition.type)}
                className="text-[10px] font-black text-primary hover:underline"
              >
                Filtrar catálogo por {definition.nameEs} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
