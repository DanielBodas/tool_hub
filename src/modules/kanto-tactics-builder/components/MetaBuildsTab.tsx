"use client";

import React, { useState } from "react";
import { META_BUILDS, MetaBuildItem } from "../data/metaBuilds";
import { BoardUnitSelection } from "../engine/synergies";
import { POKEMON_CATALOG } from "../data/pokemon";
import { SYNERGIES_DATA } from "../data/typesAndSynergies";
import { Trophy, ArrowRight, ExternalLink, ShieldAlert, Sparkles, Filter } from "lucide-react";

interface MetaBuildsTabProps {
  onLoadMetaTeam: (units: BoardUnitSelection[], boardLevel: number) => void;
}

export default function MetaBuildsTab({ onLoadMetaTeam }: MetaBuildsTabProps) {
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("ALL");

  const filteredBuilds = META_BUILDS.filter((b) => {
    if (selectedTierFilter !== "ALL" && b.tier !== selectedTierFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-2 flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Base de Datos del Meta (Meta Builds)
          </h3>

          <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
            Datos Verificados · Build v32 (17 Oct 2026)
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Composiciones probadas en más de 5,400,000 combates automatizados. Carga cualquiera de estas composiciones directamente en tu Team Builder para modificarla libremente.
        </p>

        {/* TIER FILTER PILLS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {["ALL", "S", "A", "B", "C", "D"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTierFilter(t)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all shrink-0 ${
                selectedTierFilter === t
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border/80 text-foreground hover:bg-muted"
              }`}
            >
              {t === "ALL" ? "Todos los Tiers" : `Tier ${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* META BUILDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredBuilds.map((build) => (
          <div
            key={build.id}
            className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              {/* CARD HEADER */}
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        build.tier === "S"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : build.tier === "A"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                    >
                      Tier {build.tier}
                    </span>

                    <h4 className="text-xs font-black text-foreground">{build.name}</h4>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Nivel recomendado {build.level} · {build.description}
                  </p>
                </div>

                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shrink-0">
                  {build.winRate}% Vic.
                </span>
              </div>

              {/* ACTIVE UNITS & STARS ROW */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Unidades del Tablero:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {build.units.map((u, i) => {
                    const p = POKEMON_CATALOG.find((item) => item.id === u.pokemonId);
                    if (!p) return null;
                    return (
                      <div
                        key={i}
                        className="bg-muted/30 border border-border px-1.5 py-1 rounded-xl flex items-center gap-1"
                      >
                        <img src={p.sprite} alt={p.nameEs} className="w-5 h-5 object-contain" />
                        <span className="text-[10px] font-bold text-foreground">{p.nameEs}</span>
                        <span className="text-[9px] font-black text-amber-400">
                          {"★".repeat(u.stars)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE SYNERGIES */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Sinergias Clave:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {build.activeSynergies.map((s) => {
                    const def = SYNERGIES_DATA[s.type as keyof typeof SYNERGIES_DATA];
                    if (!def) return null;
                    return (
                      <span
                        key={s.type}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${def.badgeBg}`}
                      >
                        {def.icon} {def.nameEs} ({s.count})
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* STRATEGY & CONDITIONS */}
              <div className="p-2 bg-muted/20 border border-border/50 rounded-xl space-y-1 text-[10px] text-muted-foreground">
                <p>
                  <strong className="text-foreground">Estrategia:</strong> {build.strategy}
                </p>
                <p>
                  <strong className="text-amber-400">Requisitos:</strong> {build.conditions}
                </p>
              </div>
            </div>

            {/* CARD FOOTER & LOAD BUTTON */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
              <span className="text-[9px] text-muted-foreground">
                Fuente: {build.source}
              </span>

              <button
                onClick={() => {
                  const convertedUnits: BoardUnitSelection[] = build.units.map((u) => ({
                    pokemonId: u.pokemonId,
                    stars: u.stars,
                    items: u.items || [],
                  }));
                  onLoadMetaTeam(convertedUnits, build.level);
                }}
                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1"
              >
                Cargar en Team Builder <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
