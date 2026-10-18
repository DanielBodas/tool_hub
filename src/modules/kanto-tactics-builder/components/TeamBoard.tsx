"use client";

import React, { useState } from "react";
import { BoardUnitSelection } from "../engine/synergies";
import { POKEMON_CATALOG, PokemonUnit } from "../data/pokemon";
import { SYNERGIES_DATA } from "../data/typesAndSynergies";
import { COMPLETED_ITEMS, CompletedItem } from "../data/items";
import {
  Trash2,
  RotateCcw,
  RotateCw,
  Save,
  FolderOpen,
  Copy,
  Download,
  Upload,
  Share2,
  Star,
  Plus,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TeamBoardProps {
  units: BoardUnitSelection[];
  boardSize: number;
  onUpdateUnits: (newUnits: BoardUnitSelection[]) => void;
  onChangeBoardSize: (newSize: number) => void;
  onClearBoard: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveTeam: (name: string) => void;
  savedTeams: { id: string; name: string; units: BoardUnitSelection[] }[];
  onLoadTeam: (units: BoardUnitSelection[]) => void;
  onDeleteSavedTeam: (id: string) => void;
}

export default function TeamBoard({
  units,
  boardSize,
  onUpdateUnits,
  onChangeBoardSize,
  onClearBoard,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveTeam,
  savedTeams,
  onLoadTeam,
  onDeleteSavedTeam,
}: TeamBoardProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [itemAssignTargetIndex, setItemAssignTargetIndex] = useState<number | null>(null);

  // Toggle Star Level (1★ -> 2★ -> 3★ -> 1★)
  const handleCycleStars = (index: number) => {
    const updated = [...units];
    const currentStars = updated[index].stars;
    updated[index].stars = currentStars === 1 ? 2 : currentStars === 2 ? 3 : 1;
    onUpdateUnits(updated);
  };

  // Remove Unit
  const handleRemoveUnit = (index: number) => {
    const updated = units.filter((_, i) => i !== index);
    onUpdateUnits(updated);
  };

  // Move Unit Left or Right
  const handleMoveUnit = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= units.length) return;

    const updated = [...units];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onUpdateUnits(updated);
  };

  // Duplicate current team
  const handleDuplicate = () => {
    onUpdateUnits([...units]);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ boardSize, units }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanto-team-lv${boardSize}.json`;
    a.click();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.units && Array.isArray(parsed.units)) {
          if (parsed.boardSize) onChangeBoardSize(parsed.boardSize);
          onUpdateUnits(parsed.units);
        }
      } catch (err) {
        alert("El archivo JSON no es válido.");
      }
    };
    reader.readAsText(file);
  };

  // Share via URL
  const handleShareURL = () => {
    const encoded = encodeURIComponent(JSON.stringify(units));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?team=${encoded}`;
    navigator.clipboard.writeText(shareableUrl);
    alert("¡URL del equipo copiada al portapapeles!");
  };

  // Equiping item
  const handleToggleItem = (unitIndex: number, itemId: string) => {
    const updated = [...units];
    const currentItems = updated[unitIndex].items || [];
    if (currentItems.includes(itemId)) {
      updated[unitIndex].items = currentItems.filter((id) => id !== itemId);
    } else {
      if (currentItems.length >= 3) {
        alert("Máximo 3 objetos por Pokémon.");
        return;
      }
      updated[unitIndex].items = [...currentItems, itemId];
    }
    onUpdateUnits(updated);
  };

  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 space-y-3.5 shadow-sm">
      {/* TOP HEADER: BOARD CONTROLS & ACTIONS */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card border border-border/80 px-2.5 py-1 rounded-xl">
            <span className="text-xs font-black text-foreground">
              Plazas del Equipo (Nivel):
            </span>
            <select
              value={boardSize}
              onChange={(e) => onChangeBoardSize(parseInt(e.target.value))}
              className="bg-transparent border-0 text-primary font-black text-xs cursor-pointer focus:outline-hidden"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n} className="bg-card text-foreground">
                  Nivel {n} ({units.length}/{n} Unidades)
                </option>
              ))}
            </select>
          </div>

          <span
            className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
              units.length === boardSize
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : units.length > boardSize
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            }`}
          >
            {units.length}/{boardSize} Plazas Ocupadas
          </span>
        </div>

        {/* TOOLBAR ACTIONS */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 rounded-lg border border-border/60 transition-all"
            title="Deshacer"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 rounded-lg border border-border/60 transition-all"
            title="Rehacer"
          >
            <RotateCw size={13} />
          </button>

          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-2.5 py-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Save size={12} /> Guardar
          </button>

          <button
            onClick={() => setLoadModalOpen(true)}
            className="px-2.5 py-1 bg-card hover:bg-muted text-foreground border border-border/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <FolderOpen size={12} /> Cargar ({savedTeams.length})
          </button>

          <button
            onClick={handleShareURL}
            className="p-1.5 bg-card hover:bg-muted text-muted-foreground rounded-lg border border-border/60 transition-all"
            title="Compartir enlace"
          >
            <Share2 size={13} />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-1.5 bg-card hover:bg-muted text-muted-foreground rounded-lg border border-border/60 transition-all"
            title="Exportar JSON"
          >
            <Download size={13} />
          </button>

          <label
            className="p-1.5 bg-card hover:bg-muted text-muted-foreground rounded-lg border border-border/60 transition-all cursor-pointer"
            title="Importar JSON"
          >
            <Upload size={13} />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={onClearBoard}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all"
            title="Vaciar tablero"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* BOARD UNITS GRID CARDS */}
      {units.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {units.map((unitSelection, index) => {
            const unit = POKEMON_CATALOG.find((p) => p.id === unitSelection.pokemonId);
            if (!unit) return null;

            const primaryDef = SYNERGIES_DATA[unit.primaryType];
            const secondaryDef = unit.secondaryType ? SYNERGIES_DATA[unit.secondaryType] : null;
            const equippedItems = (unitSelection.items || [])
              .map((id) => COMPLETED_ITEMS.find((item) => item.id === id))
              .filter((item): item is CompletedItem => item !== undefined);

            return (
              <div
                key={`${unit.id}-${index}`}
                className="group relative bg-card hover:bg-muted/30 rounded-xl border border-primary/30 p-2.5 shadow-2xs transition-all flex flex-col justify-between"
              >
                {/* TOP CARDS ROW: REORDER & STAR LEVEL & DELETE */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleMoveUnit(index, "left")}
                      disabled={index === 0}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveUnit(index, "right")}
                      disabled={index === units.length - 1}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  {/* STARS TOGGLE */}
                  <button
                    onClick={() => handleCycleStars(index)}
                    className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] hover:scale-105 transition-all"
                    title="Hacer clic para cambiar nivel de estrellas (1★, 2★, 3★)"
                  >
                    {Array.from({ length: unitSelection.stars }).map((_, i) => (
                      <Star key={i} size={10} fill="currentColor" />
                    ))}
                  </button>

                  <button
                    onClick={() => handleRemoveUnit(index)}
                    className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                    title="Quitar unidad"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* SPRITE & NAME */}
                <div className="flex flex-col items-center text-center my-1.5">
                  <img src={unit.sprite} alt={unit.nameEs} className="w-12 h-12 object-contain" />
                  <h4 className="text-xs font-black text-foreground truncate w-full mt-0.5">
                    {unit.nameEs}
                  </h4>
                  <span className="text-[9px] font-extrabold text-amber-400">
                    Coste {unit.cost} 🪙
                  </span>
                </div>

                {/* TYPES & ROLE */}
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

                {/* EQUIPPED ITEMS ROW */}
                <div className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {equippedItems.map((item) => (
                      <span
                        key={item.id}
                        title={`${item.nameEs}: ${item.effect}`}
                        className="text-xs cursor-pointer hover:scale-125 transition-transform"
                      >
                        {item.icon}
                      </span>
                    ))}
                    {equippedItems.length < 3 && (
                      <button
                        onClick={() => setItemAssignTargetIndex(index)}
                        className="w-5 h-5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-black flex items-center justify-center border border-border/60"
                        title="Equipar objeto"
                      >
                        +
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setItemAssignTargetIndex(index)}
                    className="text-[9px] font-extrabold text-primary hover:underline"
                  >
                    Objetos ({equippedItems.length}/3)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 px-4 bg-muted/15 rounded-2xl border border-dashed border-border/60">
          <Layers className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2 animate-bounce" />
          <p className="text-xs font-bold text-foreground mb-1">
            Tu tablero está vacío
          </p>
          <p className="text-[11px] text-muted-foreground">
            Selecciona Pokémon desde el catálogo o carga una composición meta para empezar.
          </p>
        </div>
      )}

      {/* SAVE TEAM MODAL */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-xl">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
              Guardar Composición de Equipo
            </h3>
            <input
              type="text"
              placeholder="Nombre del equipo (ej. Reroll Agua Vaporeon)..."
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              className="w-full p-2 bg-muted/40 border border-border rounded-xl text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!teamNameInput.trim()) return;
                  onSaveTeam(teamNameInput.trim());
                  setTeamNameInput("");
                  setSaveModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs"
              >
                Guardar Equipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOAD TEAM MODAL */}
      {loadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-4 max-w-md w-full space-y-3 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Mis Equipos Guardados ({savedTeams.length})
              </h3>
              <button
                onClick={() => setLoadModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            {savedTeams.length > 0 ? (
              <div className="space-y-2">
                {savedTeams.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-muted/20 border border-border/60 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-black text-foreground">{t.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {t.units.length} Unidades
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onLoadTeam(t.units);
                          setLoadModalOpen(false);
                        }}
                        className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => onDeleteSavedTeam(t.id)}
                        className="p-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No tienes equipos guardados aún.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ITEM ASSIGNMENT MODAL */}
      {itemAssignTargetIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-4 max-w-md w-full space-y-3 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                Equipar Objetos a {POKEMON_CATALOG.find((p) => p.id === units[itemAssignTargetIndex]?.pokemonId)?.nameEs}
              </h3>
              <button
                onClick={() => setItemAssignTargetIndex(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPLETED_ITEMS.map((item) => {
                const isEquipped = (units[itemAssignTargetIndex]?.items || []).includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(itemAssignTargetIndex, item.id)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                      isEquipped
                        ? "bg-primary/20 border-primary text-foreground"
                        : "bg-muted/20 border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black">{item.nameEs}</h5>
                        {isEquipped && (
                          <span className="text-[9px] font-black text-primary bg-primary/20 px-1 rounded-md">
                            Equipado
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">
                        {item.effect}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
