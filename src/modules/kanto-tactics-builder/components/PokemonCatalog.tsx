"use client";

import React, { useState, useMemo } from "react";
import { POKEMON_CATALOG, PokemonUnit, UnitRole } from "../data/pokemon";
import { SYNERGIES_DATA, PokemonType } from "../data/typesAndSynergies";
import { Search, Filter, Plus, Check, ArrowUpDown } from "lucide-react";

interface PokemonCatalogProps {
  selectedPokemonIds: string[];
  onAddUnit: (pokemonId: string) => void;
  maxSlotsReached: boolean;
  typeFilterOverride?: string | null;
  onClearTypeOverride?: () => void;
}

export default function PokemonCatalog({
  selectedPokemonIds,
  onAddUnit,
  maxSlotsReached,
  typeFilterOverride,
  onClearTypeOverride,
}: PokemonCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCost, setSelectedCost] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"cost" | "tier" | "name">("tier");

  // Sync type filter override if passed from synergy click
  React.useEffect(() => {
    if (typeFilterOverride) {
      setSelectedType(typeFilterOverride);
    }
  }, [typeFilterOverride]);

  const activeSelectedSet = useMemo(() => new Set(selectedPokemonIds), [selectedPokemonIds]);

  const filteredList = useMemo(() => {
    return POKEMON_CATALOG.filter((unit) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = unit.nameEs.toLowerCase().includes(q) || unit.name.toLowerCase().includes(q);
        const matchesAbility = unit.ability.name.toLowerCase().includes(q);
        if (!matchesName && !matchesAbility) return false;
      }

      // Type Filter
      if (selectedType !== "ALL") {
        const matchPrimary = unit.primaryType === selectedType;
        const matchSecondary = unit.secondaryType === selectedType;
        if (!matchPrimary && !matchSecondary) return false;
      }

      // Cost Filter
      if (selectedCost !== "ALL") {
        if (unit.cost !== parseInt(selectedCost)) return false;
      }

      // Role Filter
      if (selectedRole !== "ALL") {
        if (unit.role !== selectedRole) return false;
      }

      // Tier Filter
      if (selectedTier !== "ALL") {
        if (unit.tier !== selectedTier) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "cost") {
        return a.cost - b.cost;
      } else if (sortBy === "tier") {
        const tierOrder = { S: 1, A: 2, B: 3, C: 4, D: 5 };
        return tierOrder[a.tier] - tierOrder[b.tier];
      } else {
        return a.nameEs.localeCompare(b.nameEs);
      }
    });
  }, [search, selectedType, selectedCost, selectedRole, selectedTier, sortBy]);

  const rolesList: UnitRole[] = ["Tanque", "Carry Físico", "Carry Mágico", "Soporte", "Control", "Asesino", "Luchador"];
  const typesList = Object.keys(SYNERGIES_DATA) as PokemonType[];

  return (
    <div className="bg-card/70 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-2 flex-wrap gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-primary" /> Catálogo de Pokémon ({filteredList.length})
        </h3>

        {/* SORT SELECTOR */}
        <div className="flex items-center gap-1 bg-card border border-border/80 px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground">
          <ArrowUpDown size={11} className="text-primary" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-0 outline-hidden text-foreground cursor-pointer font-bold"
          >
            <option value="tier">Orden: Tier (S → D)</option>
            <option value="cost">Orden: Coste (1 → 5)</option>
            <option value="name">Orden: Nombre (A → Z)</option>
          </select>
        </div>
      </div>

      {/* SEARCH AND FILTERS ROW */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Buscar por nombre o habilidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* TYPE SLIDER / PILLS */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
          <button
            onClick={() => {
              setSelectedType("ALL");
              if (onClearTypeOverride) onClearTypeOverride();
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all shrink-0 ${
              selectedType === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            Todos los Tipos
          </button>

          {typesList.map((t) => {
            const def = SYNERGIES_DATA[t];
            const isSel = selectedType === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 border ${
                  isSel
                    ? `${def.badgeBg} shadow-2xs`
                    : "bg-card border-border text-foreground hover:bg-muted"
                }`}
              >
                <span>{def.icon}</span>
                <span>{def.nameEs}</span>
              </button>
            );
          })}
        </div>

        {/* SUB-FILTERS: COST, ROLE, TIER */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
          {/* COST FILTER */}
          <select
            value={selectedCost}
            onChange={(e) => setSelectedCost(e.target.value)}
            className="bg-card border border-border rounded-lg p-1.5 text-foreground font-bold outline-hidden cursor-pointer"
          >
            <option value="ALL">Coste: Todos</option>
            <option value="1">Coste 1 ⭐</option>
            <option value="2">Coste 2 ⭐⭐</option>
            <option value="3">Coste 3 ⭐⭐⭐</option>
            <option value="4">Coste 4 💎</option>
            <option value="5">Coste 5 👑</option>
          </select>

          {/* ROLE FILTER */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-card border border-border rounded-lg p-1.5 text-foreground font-bold outline-hidden cursor-pointer"
          >
            <option value="ALL">Rol: Todos</option>
            {rolesList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* TIER FILTER */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-card border border-border rounded-lg p-1.5 text-foreground font-bold outline-hidden cursor-pointer"
          >
            <option value="ALL">Tier: Todos</option>
            <option value="S">Tier S (Top Meta)</option>
            <option value="A">Tier A (Excelente)</option>
            <option value="B">Tier B (Bueno)</option>
            <option value="C">Tier C (Situacional)</option>
          </select>
        </div>
      </div>

      {/* CATALOG GRID */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredList.map((unit) => {
            const isSelected = activeSelectedSet.has(unit.id);
            const primaryDef = SYNERGIES_DATA[unit.primaryType];
            const secondaryDef = unit.secondaryType ? SYNERGIES_DATA[unit.secondaryType] : null;

            return (
              <div
                key={unit.id}
                onClick={() => {
                  if (!isSelected && !maxSlotsReached) {
                    onAddUnit(unit.id);
                  }
                }}
                className={`group relative rounded-xl border p-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? "bg-primary/10 border-primary/60 shadow-2xs"
                    : maxSlotsReached
                    ? "bg-card/40 border-border/60 opacity-60 cursor-not-allowed"
                    : "bg-card hover:bg-muted/40 border-border/80 hover:border-primary/40"
                }`}
              >
                {/* TOP HEADER: TIER & COST */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                      unit.tier === "S"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : unit.tier === "A"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    Tier {unit.tier}
                  </span>

                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/20">
                    {unit.cost} 🪙
                  </span>
                </div>

                {/* SPRITE & NAME */}
                <div className="flex flex-col items-center text-center my-1">
                  <img
                    src={unit.sprite}
                    alt={unit.nameEs}
                    className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                  />
                  <h4 className="text-xs font-black text-foreground truncate w-full mt-0.5">
                    {unit.nameEs}
                  </h4>
                  <span className="text-[9px] font-semibold text-muted-foreground">
                    {unit.role}
                  </span>
                </div>

                {/* TYPES PILLS */}
                <div className="flex items-center justify-center gap-1 flex-wrap my-1">
                  <span
                    className={`text-[8px] font-extrabold px-1 py-0.2 rounded-md border ${primaryDef.badgeBg}`}
                  >
                    {primaryDef.icon} {primaryDef.nameEs}
                  </span>
                  {secondaryDef && (
                    <span
                      className={`text-[8px] font-extrabold px-1 py-0.2 rounded-md border ${secondaryDef.badgeBg}`}
                    >
                      {secondaryDef.icon} {secondaryDef.nameEs}
                    </span>
                  )}
                </div>

                {/* SELECTION BUTTON */}
                <button
                  disabled={isSelected || maxSlotsReached}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected && !maxSlotsReached) {
                      onAddUnit(unit.id);
                    }
                  }}
                  className={`w-full py-1 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : maxSlotsReached
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check size={10} /> Añadido
                    </>
                  ) : maxSlotsReached ? (
                    "Tablero Lleno"
                  ) : (
                    <>
                      <Plus size={10} /> Añadir
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 px-3 bg-muted/20 rounded-xl border border-dashed border-border/60">
          <p className="text-xs font-semibold text-muted-foreground">
            No se encontraron Pokémon con los filtros actuales.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedType("ALL");
              setSelectedCost("ALL");
              setSelectedRole("ALL");
              setSelectedTier("ALL");
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline"
          >
            Restablecer Filtros
          </button>
        </div>
      )}
    </div>
  );
}
