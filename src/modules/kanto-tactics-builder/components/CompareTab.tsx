"use client";

import React, { useState } from "react";
import { BoardUnitSelection } from "../engine/synergies";
import { compareTeams, ComparisonSummary } from "../engine/comparator";
import { META_BUILDS } from "../data/metaBuilds";
import { POKEMON_CATALOG } from "../data/pokemon";
import { SYNERGIES_DATA } from "../data/typesAndSynergies";
import { Scale, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface CompareTabProps {
  currentUnits: BoardUnitSelection[];
  savedTeams: { id: string; name: string; units: BoardUnitSelection[] }[];
}

export default function CompareTab({ currentUnits, savedTeams }: CompareTabProps) {
  // Preset candidates to pick from
  const allAvailableTeams = [
    { id: "current-team", name: "Equipo Actual en Tablero", units: currentUnits },
    ...savedTeams,
    ...META_BUILDS.map((m) => ({
      id: `meta-${m.id}`,
      name: `[Meta] ${m.name}`,
      units: m.units.map((u) => ({ pokemonId: u.pokemonId, stars: u.stars })),
    })),
  ];

  const [team1Id, setTeam1Id] = useState<string>("current-team");
  const [team2Id, setTeam2Id] = useState<string>(
    allAvailableTeams[1]?.id || "meta-grass-kadabra-reroll"
  );
  const [team3Id, setTeam3Id] = useState<string>("none");

  const selectedTeams = React.useMemo(() => {
    const list = [];
    const t1 = allAvailableTeams.find((t) => t.id === team1Id);
    if (t1) list.push(t1);

    const t2 = allAvailableTeams.find((t) => t.id === team2Id);
    if (t2) list.push(t2);

    if (team3Id !== "none") {
      const t3 = allAvailableTeams.find((t) => t.id === team3Id);
      if (t3) list.push(t3);
    }

    return list;
  }, [team1Id, team2Id, team3Id, currentUnits, savedTeams]);

  const comparison: ComparisonSummary = React.useMemo(() => {
    return compareTeams(selectedTeams);
  }, [selectedTeams]);

  return (
    <div className="space-y-4">
      {/* SELECTION HEADER BAR */}
      <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-2 flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-primary" /> Comparador Simultáneo de Equipos
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground">
            Compara hasta 3 composiciones
          </span>
        </div>

        {/* SELECTORS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Equipo #1:
            </label>
            <select
              value={team1Id}
              onChange={(e) => setTeam1Id(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2 text-foreground font-extrabold focus:outline-hidden"
            >
              {allAvailableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.units.length} un.)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Equipo #2:
            </label>
            <select
              value={team2Id}
              onChange={(e) => setTeam2Id(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2 text-foreground font-extrabold focus:outline-hidden"
            >
              {allAvailableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.units.length} un.)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Equipo #3 (Opcional):
            </label>
            <select
              value={team3Id}
              onChange={(e) => setTeam3Id(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2 text-foreground font-extrabold focus:outline-hidden"
            >
              <option value="none">-- Ninguno --</option>
              {allAvailableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.units.length} un.)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* COMPARISON COLUMNS GRID */}
      {comparison.teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {comparison.teams.map((col) => {
            const isBestScore = col.id === comparison.bestScoreTeamId;
            const isBestEconomy = col.id === comparison.bestEconomyTeamId;

            return (
              <div
                key={col.id}
                className={`bg-card/80 backdrop-blur-md rounded-2xl border p-4 space-y-3 shadow-sm ${
                  isBestScore
                    ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
                    : "border-border/80"
                }`}
              >
                {/* COLUMN HEADER */}
                <div className="border-b border-border/60 pb-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-foreground truncate">{col.name}</h4>
                    {isBestScore && (
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-md">
                        ★ Mejor Puntuación
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <span className="text-emerald-400">Puntuación: {col.score} pts</span>
                    <span className="text-amber-400">Coste: {col.totalCost} oro</span>
                  </div>
                </div>

                {/* POKEMON UNITS LIST */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    Composición ({col.units.length} Unidades):
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {col.pokemonUnits.map((p) => (
                      <div
                        key={p.id}
                        className="bg-muted/30 border border-border px-1.5 py-1 rounded-xl flex items-center gap-1 text-[10px] font-bold"
                      >
                        <img src={p.sprite} alt={p.nameEs} className="w-5 h-5 object-contain" />
                        <span>{p.nameEs}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTIVE SYNERGIES */}
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    Sinergias Activas ({col.synergies.activeSynergies.length}):
                  </span>
                  <div className="space-y-1">
                    {col.synergies.activeSynergies.map((s) => {
                      const def = SYNERGIES_DATA[s.type];
                      return (
                        <div
                          key={s.type}
                          className="text-[10px] font-bold p-1 bg-muted/20 border border-border/50 rounded-lg flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1">
                            {def.icon} {def.nameEs} ({s.count})
                          </span>
                          <span className="text-emerald-400 text-[9px] truncate max-w-[150px]">
                            {s.activeBonusText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STRENGTHS & VULNERABILITIES */}
                <div className="p-2.5 bg-muted/20 border border-border/50 rounded-xl space-y-1.5 text-[10px]">
                  {col.keyAdvantages.length > 0 && (
                    <div>
                      <span className="font-extrabold text-emerald-400 block mb-0.5">
                        Ventajas Clave:
                      </span>
                      {col.keyAdvantages.map((adv, i) => (
                        <p key={i} className="text-muted-foreground">• {adv}</p>
                      ))}
                    </div>
                  )}

                  {col.vulnerabilities.length > 0 && (
                    <div>
                      <span className="font-extrabold text-amber-400 block mb-0.5">
                        Puntos Débiles:
                      </span>
                      {col.vulnerabilities.map((vul, i) => (
                        <p key={i} className="text-muted-foreground">• {vul}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIFFERENCES SUMMARY CARD */}
      {comparison.differences.synergyDiffs.length > 0 && (
        <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-2 shadow-xs text-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" /> Resumen de Diferencias Directas
          </h4>
          <div className="space-y-1 text-muted-foreground text-[11px]">
            {comparison.differences.costDiffs.map((d, i) => (
              <p key={i}>• {d}</p>
            ))}
            {comparison.differences.synergyDiffs.map((d, i) => (
              <p key={i}>• {d}</p>
            ))}
            {comparison.differences.roleDiffs.map((d, i) => (
              <p key={i}>• {d}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
