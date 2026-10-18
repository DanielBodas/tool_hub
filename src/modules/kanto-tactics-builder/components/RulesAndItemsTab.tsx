"use client";

import React, { useState } from "react";
import { SYNERGIES_DATA, PokemonType } from "../data/typesAndSynergies";
import { ITEM_COMPONENTS, COMPLETED_ITEMS } from "../data/items";
import { BookOpen, ShieldCheck, Sparkles, ExternalLink, Layers } from "lucide-react";

export default function RulesAndItemsTab() {
  const [activeSubTab, setActiveSubTab] = useState<"types" | "items" | "rules">("types");

  const typesList = Object.keys(SYNERGIES_DATA) as PokemonType[];

  return (
    <div className="space-y-4">
      {/* HEADER & SUB-TABS */}
      <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-2 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-2 flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" /> Reglas, Tipos y Recetas de Objetos
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
            Game Build v32 (17 Oct 2026)
          </span>
        </div>

        {/* SUB-NAVIGATION PILLS */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => setActiveSubTab("types")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              activeSubTab === "types"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card border-border/80 text-foreground hover:bg-muted"
            }`}
          >
            🔮 Matriz de Tipos y Umbrales
          </button>

          <button
            onClick={() => setActiveSubTab("items")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              activeSubTab === "items"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card border-border/80 text-foreground hover:bg-muted"
            }`}
          >
            🎒 Recetas de Objetos ({COMPLETED_ITEMS.length})
          </button>

          <button
            onClick={() => setActiveSubTab("rules")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              activeSubTab === "rules"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card border-border/80 text-foreground hover:bg-muted"
            }`}
          >
            📖 Reglas del Juego
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TYPES MATRIX */}
      {activeSubTab === "types" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {typesList.map((typeKey) => {
            const def = SYNERGIES_DATA[typeKey];
            return (
              <div
                key={typeKey}
                className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-3 space-y-2 shadow-2xs hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{def.icon}</span>
                    <h4 className="text-xs font-black text-foreground">{def.nameEs}</h4>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${def.badgeBg}`}>
                    {def.thresholds.length} Umbrales
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground">{def.description}</p>

                {def.specialNote && (
                  <p className="text-[9px] font-bold text-amber-400 bg-amber-500/10 p-1 rounded-md border border-amber-500/20">
                    ⚠️ {def.specialNote}
                  </p>
                )}

                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                    Bonus por Umbral:
                  </span>
                  {def.thresholds.map((t) => (
                    <div
                      key={t.count}
                      className="text-[10px] p-1 bg-muted/20 border border-border/40 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-extrabold text-foreground">{t.count} Unidades:</span>
                      <span className="font-bold text-emerald-400">{t.bonus}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: ITEMS RECIPES */}
      {activeSubTab === "items" && (
        <div className="space-y-3">
          {/* BASE COMPONENTS */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-3 space-y-2">
            <h4 className="text-xs font-black uppercase text-foreground">
              Componentes Básicos (4 Componentes)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(ITEM_COMPONENTS).map((comp) => (
                <div
                  key={comp.id}
                  className="p-2 bg-muted/30 border border-border/60 rounded-xl flex items-center gap-2"
                >
                  <span className="text-xl">{comp.icon}</span>
                  <div>
                    <h5 className="text-xs font-black text-foreground">{comp.nameEs}</h5>
                    <span className="text-[10px] font-bold text-emerald-400">{comp.stats}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COMPLETED RECIPES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {COMPLETED_ITEMS.map((item) => {
              const comp1 = ITEM_COMPONENTS[item.recipe[0]];
              const comp2 = ITEM_COMPONENTS[item.recipe[1]];

              return (
                <div
                  key={item.id}
                  className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-3 space-y-2 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <h4 className="text-xs font-black text-foreground">{item.nameEs}</h4>
                          <span className="text-[9px] text-muted-foreground">{item.name}</span>
                        </div>
                      </div>

                      {/* RECIPE BADGES */}
                      <div className="flex items-center gap-1 text-xs">
                        <span>{comp1?.icon}</span>
                        <span className="text-muted-foreground">+</span>
                        <span>{comp2?.icon}</span>
                      </div>
                    </div>

                    <p className="text-[10px] font-semibold text-emerald-400">{item.effect}</p>
                  </div>

                  <div className="pt-1.5 border-t border-border/40 text-[9px] text-muted-foreground font-bold">
                    Ideal en: {item.bestRoles.join(", ")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GAME RULES & SOURCES */}
      {activeSubTab === "rules" && (
        <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-4 space-y-3 text-xs text-muted-foreground">
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
            Reglas Específicas de Kanto Tactics
          </h4>

          <ul className="space-y-2 list-disc pl-4 text-foreground/90">
            <li>
              <strong>Cómputo de Sinergias:</strong> Cada especie diferente de Pokémon aporta 1 punto a sus tipos. Dos copias de un mismo Pokémon (ej. 2 Kadabra) cuentan como <strong>1 única unidad</strong> para la sinergia de tipo.
            </li>
            <li>
              <strong>Doble Tipo:</strong> Un Pokémon de doble tipo (ej. Venusaur = Planta/Veneno) aporta 1 punto a ambas sinergias simultáneamente.
            </li>
            <li>
              <strong>Excepciones de Volador:</strong> Gyarados y Dragonite tienen el tipo Volador en los emparejamientos de tipo, pero <strong>NO cuentan para la sinergia Volador</strong> (solo cuentan líneas evolutivas de origen aéreo).
            </li>
            <li>
              <strong>Límite de Tablero:</strong> El número máximo de plazas en el tablero equivale al nivel del jugador (nivel 1 a 10).
            </li>
            <li>
              <strong>Evolución y Estrellas:</strong> 3 copias de 1★ combinan en 1 copia de 2★. 3 copias de 2★ combinan en 1 copia de 3★.
            </li>
            <li>
              <strong>Equipamiento de Objetos:</strong> Cada Pokémon puede llevar hasta 3 objetos completados.
            </li>
          </ul>

          <div className="pt-2 border-t border-border/50 text-[10px]">
            <p>
              Fuentes oficiales y comunidad:{" "}
              <a
                href="https://kantotactics.org/"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
              >
                KantoTactics.org <ExternalLink size={10} />
              </a>{" "}
              · Desarrollado originalmente por Einoow (Lanzado Octubre 2026).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
