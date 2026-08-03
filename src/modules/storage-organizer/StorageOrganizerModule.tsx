"use client";

import { useState, useEffect, useRef } from "react";
import {
  Boxes,
  Plus,
  Trash2,
  Edit3,
  Search,
  Cloud,
  CloudOff,
  Move,
  Package,
  Layers,
  Settings,
  ChevronDown,
  X,
  PlusCircle,
  HelpCircle,
  FolderOpen,
  Tag,
  Check
} from "lucide-react";

// Types
interface Balda {
  id: string;
  name: string;
  huecoCount: number; // number of slots
}

interface Shelf {
  id: string;
  name: string;
  baldas: Balda[];
}

interface StorageItem {
  id: string;
  name: string;
  type: "caja" | "suelto";
  color: string; // Tailwind class name or Hex (e.g. 'indigo', 'emerald', 'rose', 'amber', 'sky', 'slate')
  description: string;
  tags: string[]; // array of tags
  contents: string[]; // sub-items inside boxes
  shelfId: string;
  baldaId: string;
  huecoIndex: number; // 0-based index
}

// Colors list for visual customization
const COLOR_OPTIONS = [
  { name: "Slate", class: "bg-slate-500 border-slate-600 text-white" },
  { name: "Red", class: "bg-rose-500 border-rose-600 text-white" },
  { name: "Orange", class: "bg-orange-500 border-orange-600 text-white" },
  { name: "Yellow", class: "bg-amber-500 border-amber-600 text-white" },
  { name: "Green", class: "bg-emerald-500 border-emerald-600 text-white" },
  { name: "Blue", class: "bg-sky-500 border-sky-600 text-white" },
  { name: "Indigo", class: "bg-indigo-500 border-indigo-600 text-white" },
  { name: "Purple", class: "bg-purple-500 border-purple-600 text-white" },
];

export function StorageOrganizerModule() {
  // Persistence state
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<"loading" | "cloud" | "local" | "error">("loading");
  const [isSaving, setIsSaving] = useState(false);

  // UI State
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlot, setActiveSlot] = useState<{
    shelfId: string;
    baldaId: string;
    huecoIndex: number;
  } | null>(null);

  // Compact Form states
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");
  const [newShelfBaldasCount, setNewShelfBaldasCount] = useState(4);
  const [newShelfHuecosDefault, setNewShelfHuecosDefault] = useState(3);

  const [isConfiguringShelves, setIsConfiguringShelves] = useState(false);
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);

  // Form states for adding/editing box or item
  const [itemForm, setItemForm] = useState<{
    id?: string;
    name: string;
    type: "caja" | "suelto";
    color: string;
    description: string;
    tagsInput: string;
    contentsInput: string;
  }>({
    name: "",
    type: "caja",
    color: "Indigo",
    description: "",
    tagsInput: "",
    contentsInput: "",
  });

  // State to handle moving boxes
  const [movingItem, setMovingItem] = useState<StorageItem | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/storage-organizer");
        const resData = await response.json();

        if (resData.offline) {
          // MongoDB offline fallback to local storage
          loadFromLocalStorage();
        } else if (response.ok && resData.shelves) {
          setShelves(resData.shelves);
          setItems(resData.items || []);
          setSyncStatus("cloud");
          if (resData.shelves.length > 0) {
            setSelectedShelfId(resData.shelves[0].id);
          }
        } else {
          loadFromLocalStorage();
        }
      } catch (e) {
        console.error("Failed to load cloud data, falling back to LocalStorage:", e);
        loadFromLocalStorage();
      }
    }

    loadData();
  }, []);

  function loadFromLocalStorage() {
    try {
      const storedShelves = localStorage.getItem("trastero_shelves");
      const storedItems = localStorage.getItem("trastero_items");

      const parsedShelves = storedShelves ? JSON.parse(storedShelves) : getInitialDefaultShelves();
      const parsedItems = storedItems ? JSON.parse(storedItems) : [];

      setShelves(parsedShelves);
      setItems(parsedItems);
      setSyncStatus("local");

      if (parsedShelves.length > 0) {
        setSelectedShelfId(parsedShelves[0].id);
      }
    } catch (err) {
      console.error("Local storage read failed:", err);
      setSyncStatus("error");
    }
  }

  function getInitialDefaultShelves(): Shelf[] {
    return [
      {
        id: "shelf-1",
        name: "Estantería Entrada",
        baldas: [
          { id: "b1", name: "Balda Alta", huecoCount: 4 },
          { id: "b2", name: "Balda Media-Alta", huecoCount: 4 },
          { id: "b3", name: "Balda Media-Baja", huecoCount: 4 },
          { id: "b4", name: "Balda Suelo", huecoCount: 3 },
        ],
      },
    ];
  }

  // Trigger auto-save on shelves or items change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (syncStatus === "loading") return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSaving(true);

      // Always write to local storage first
      try {
        localStorage.setItem("trastero_shelves", JSON.stringify(shelves));
        localStorage.setItem("trastero_items", JSON.stringify(items));
      } catch (err) {
        console.error("Failed to write to local storage:", err);
      }

      if (syncStatus === "cloud") {
        try {
          const response = await fetch("/api/storage-organizer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shelves, items }),
          });

          if (!response.ok) {
            console.warn("POST to sync failed, retaining local status.");
            setSyncStatus("local");
          }
        } catch (e) {
          console.error("Sync error, continuing in local mode:", e);
          setSyncStatus("local");
        }
      }
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [shelves, items, syncStatus]);

  // Find currently selected shelf
  const currentShelf = shelves.find((s) => s.id === selectedShelfId) || shelves[0];

  // Group items by location for fast access
  const itemsByLocation = items.reduce((acc, item) => {
    const key = `${item.shelfId}-${item.baldaId}-${item.huecoIndex}`;
    acc[key] = item;
    return acc;
  }, {} as Record<string, StorageItem>);

  // Live matching search helper
  function isMatchingSearch(item: StorageItem, query: string): boolean {
    if (!query.trim()) return true;
    const cleanQuery = query.toLowerCase().trim();

    const nameMatch = item.name.toLowerCase().includes(cleanQuery);
    const descMatch = item.description.toLowerCase().includes(cleanQuery);
    const tagMatch = item.tags.some(t => t.toLowerCase().includes(cleanQuery));
    const contentMatch = item.contents.some(c => c.toLowerCase().includes(cleanQuery));

    return nameMatch || descMatch || tagMatch || contentMatch;
  }

  // Any item search match inside the active shelf
  const hasActiveSearch = searchQuery.trim().length > 0;

  // Active item in the selected slot
  const selectedSlotItem = activeSlot
    ? itemsByLocation[`${activeSlot.shelfId}-${activeSlot.baldaId}-${activeSlot.huecoIndex}`]
    : null;

  // Action: Open slot details or edit/create item form
  function handleSlotClick(shelfId: string, baldaId: string, huecoIndex: number) {
    setActiveSlot({ shelfId, baldaId, huecoIndex });

    const existing = itemsByLocation[`${shelfId}-${baldaId}-${huecoIndex}`];
    if (existing) {
      setItemForm({
        id: existing.id,
        name: existing.name,
        type: existing.type,
        color: existing.color,
        description: existing.description,
        tagsInput: existing.tags.join(", "),
        contentsInput: existing.contents.join(", "),
      });
    } else {
      // Empty slot: reset form for fresh entry
      setItemForm({
        name: "",
        type: "caja",
        color: "Indigo",
        description: "",
        tagsInput: "",
        contentsInput: "",
      });
    }
  }

  // Action: Save Item/Box to slot
  function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSlot) return;
    if (!itemForm.name.trim()) return;

    const tags = itemForm.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const contents = itemForm.contentsInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const newItem: StorageItem = {
      id: itemForm.id || `item-${Date.now()}`,
      name: itemForm.name.trim(),
      type: itemForm.type,
      color: itemForm.color,
      description: itemForm.description.trim(),
      tags,
      contents,
      shelfId: activeSlot.shelfId,
      baldaId: activeSlot.baldaId,
      huecoIndex: activeSlot.huecoIndex,
    };

    if (itemForm.id) {
      // Edit existing
      setItems(items.map((it) => (it.id === itemForm.id ? newItem : it)));
    } else {
      // Create new
      setItems([...items, newItem]);
    }

    // Refresh details context
    setItemForm({
      id: newItem.id,
      name: newItem.name,
      type: newItem.type,
      color: newItem.color,
      description: newItem.description,
      tagsInput: newItem.tags.join(", "),
      contentsInput: newItem.contents.join(", "),
    });
  }

  // Action: Remove Item/Box
  function handleRemoveItem(itemId: string) {
    if (confirm("¿Estás seguro de que quieres quitar esta caja o artículo?")) {
      setItems(items.filter((it) => it.id !== itemId));
      // Reset form & active slot state
      setActiveSlot(null);
    }
  }

  // Action: Add Shelf
  function handleAddShelf(e: React.FormEvent) {
    e.preventDefault();
    if (!newShelfName.trim()) return;

    const baldasList: Balda[] = [];
    for (let i = 1; i <= newShelfBaldasCount; i++) {
      baldasList.push({
        id: `balda-${Date.now()}-${i}`,
        name: `Balda ${i}`,
        huecoCount: newShelfHuecosDefault,
      });
    }

    const newShelf: Shelf = {
      id: `shelf-${Date.now()}`,
      name: newShelfName.trim(),
      baldas: baldasList,
    };

    setShelves([...shelves, newShelf]);
    setSelectedShelfId(newShelf.id);
    setIsAddingShelf(false);
    setNewShelfName("");
  }

  // Action: Rename/Update Shelf baldas & slots
  function updateShelfBaldas(shelfId: string, updatedBaldas: Balda[]) {
    setShelves(
      shelves.map((sh) => (sh.id === shelfId ? { ...sh, baldas: updatedBaldas } : sh))
    );
  }

  function handleAddBaldaToShelf(shelfId: string) {
    const target = shelves.find((sh) => sh.id === shelfId);
    if (!target) return;

    const newBaldaNum = target.baldas.length + 1;
    const newBalda: Balda = {
      id: `balda-${Date.now()}-${newBaldaNum}`,
      name: `Balda ${newBaldaNum}`,
      huecoCount: 3, // default
    };

    updateShelfBaldas(shelfId, [...target.baldas, newBalda]);
  }

  function handleRemoveBaldaFromShelf(shelfId: string, baldaId: string) {
    const target = shelves.find((sh) => sh.id === shelfId);
    if (!target) return;

    const itemsInBalda = items.filter((it) => it.shelfId === shelfId && it.baldaId === baldaId);
    if (itemsInBalda.length > 0) {
      if (
        !confirm(
          `Esta balda contiene ${itemsInBalda.length} artículos. Al eliminar la balda, se perderán. ¿Quieres continuar?`
        )
      ) {
        return;
      }
      // Remove orphans
      setItems(items.filter((it) => !(it.shelfId === shelfId && it.baldaId === baldaId)));
    }

    updateShelfBaldas(
      shelfId,
      target.baldas.filter((b) => b.id !== baldaId)
    );
  }

  function handleUpdateBaldaHuecos(shelfId: string, baldaId: string, increment: boolean) {
    const target = shelves.find((sh) => sh.id === shelfId);
    if (!target) return;

    const updated = target.baldas.map((b) => {
      if (b.id === baldaId) {
        const nextCount = increment ? b.huecoCount + 1 : Math.max(1, b.huecoCount - 1);

        // If shrinking, verify if we are deleting slots containing items
        if (!increment && b.huecoCount > 1) {
          const removedSlotIndex = b.huecoCount - 1; // 0-based index of last slot
          const itemsInRemovedSlot = items.filter(
            (it) => it.shelfId === shelfId && it.baldaId === baldaId && it.huecoIndex === removedSlotIndex
          );
          if (itemsInRemovedSlot.length > 0) {
            if (
              !confirm(
                `El último hueco contiene un artículo (${itemsInRemovedSlot[0].name}). Se borrará si reduces el tamaño. ¿Continuar?`
              )
            ) {
              return b;
            }
            // Remove orphan
            setItems(
              items.filter(
                (it) => !(it.shelfId === shelfId && it.baldaId === baldaId && it.huecoIndex === removedSlotIndex)
              )
            );
          }
        }

        return { ...b, huecoCount: nextCount };
      }
      return b;
    });

    updateShelfBaldas(shelfId, updated);
  }

  function handleRenameBalda(shelfId: string, baldaId: string, newName: string) {
    const target = shelves.find((sh) => sh.id === shelfId);
    if (!target) return;

    const updated = target.baldas.map((b) => (b.id === baldaId ? { ...b, name: newName } : b));
    updateShelfBaldas(shelfId, updated);
  }

  function handleRenameShelf(shelfId: string, newName: string) {
    if (!newName.trim()) return;
    setShelves(
      shelves.map((sh) => (sh.id === shelfId ? { ...sh, name: newName.trim() } : sh))
    );
  }

  function handleDeleteShelf(shelfId: string) {
    if (shelves.length <= 1) {
      alert("Debes tener al menos una estantería en tu trastero.");
      return;
    }

    const itemsOnShelf = items.filter((it) => it.shelfId === shelfId);
    if (
      confirm(
        `¿Seguro que quieres eliminar esta estantería? Se borrarán todos sus huecos y los ${itemsOnShelf.length} artículos/cajas que contiene.`
      )
    ) {
      setShelves(shelves.filter((sh) => sh.id !== shelfId));
      setItems(items.filter((it) => it.shelfId !== shelfId));
      setActiveSlot(null);
      // Select another remaining shelf
      const remaining = shelves.filter((sh) => sh.id !== shelfId);
      if (remaining.length > 0) {
        setSelectedShelfId(remaining[0].id);
      }
    }
  }

  // Action: Move items/boxes
  function initiateMove(item: StorageItem) {
    setMovingItem(item);
    setActiveSlot(null);
  }

  function completeMove(shelfId: string, baldaId: string, huecoIndex: number) {
    if (!movingItem) return;

    // Check if destination slot is occupied
    const destItem = itemsByLocation[`${shelfId}-${baldaId}-${huecoIndex}`];
    if (destItem) {
      alert(`La ubicación de destino ya está ocupada por "${destItem.name}".`);
      return;
    }

    // Move
    setItems(
      items.map((it) =>
        it.id === movingItem.id
          ? { ...it, shelfId, baldaId, huecoIndex }
          : it
      )
    );

    // Refresh views
    setMovingItem(null);
    setActiveSlot({ shelfId, baldaId, huecoIndex });

    // Reset form to moved item
    setItemForm({
      id: movingItem.id,
      name: movingItem.name,
      type: movingItem.type,
      color: movingItem.color,
      description: movingItem.description,
      tagsInput: movingItem.tags.join(", "),
      contentsInput: movingItem.contents.join(", "),
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Title Bar with Sync Status indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Boxes className="text-primary" size={24} /> Organizador de Trastero
          </h1>
          <p className="text-xs text-muted-foreground">
            Control visual e inmediato de tus estanterías. Micro-entradas adaptadas a móviles.
          </p>
        </div>

        {/* Sync Indicator Pill */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-secondary/50 text-secondary-foreground border border-border">
            {syncStatus === "cloud" ? (
              <>
                <Cloud size={12} className="text-emerald-500 animate-pulse" />
                <span>Nube activa</span>
              </>
            ) : syncStatus === "local" ? (
              <>
                <CloudOff size={12} className="text-amber-500 animate-pulse" />
                <span>Modo Local</span>
              </>
            ) : syncStatus === "loading" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <CloudOff size={12} className="text-rose-500" />
                <span>Error de conexión</span>
              </>
            )}
          </div>

          {isSaving && (
            <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Guardando...
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Control panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left column (Grid + Maps) (Occupies 8/12 of horizontal space on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls: Select Shelf, Search, Configure */}
          <div className="bg-card border border-border/85 p-3 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">

              {/* Shelf Selection Dropdown */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-xs font-bold text-muted-foreground shrink-0 hidden sm:inline">
                  Estantería:
                </span>
                <div className="relative flex-1 min-w-0">
                  <select
                    value={selectedShelfId}
                    onChange={(e) => {
                      setSelectedShelfId(e.target.value);
                      setActiveSlot(null);
                    }}
                    className="w-full h-8 pl-2 pr-8 bg-muted hover:bg-muted/80 text-xs font-bold rounded-lg border border-border cursor-pointer appearance-none focus:outline-hidden focus:ring-1 focus:ring-primary truncate"
                  >
                    {shelves.map((sh) => (
                      <option key={sh.id} value={sh.id}>
                        {sh.name} ({sh.baldas.length} Baldas, {sh.baldas.reduce((sum, b) => sum + b.huecoCount, 0)} Huecos)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                <button
                  onClick={() => setIsAddingShelf(!isAddingShelf)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    isAddingShelf
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-primary/15 text-primary hover:bg-primary/20"
                  }`}
                >
                  <PlusCircle size={14} />
                  <span className="hidden xs:inline">Nueva Estantería</span>
                </button>
                <button
                  onClick={() => setIsConfiguringShelves(!isConfiguringShelves)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    isConfiguringShelves
                      ? "bg-slate-700 text-white"
                      : "bg-secondary text-secondary-foreground hover:bg-muted border border-border"
                  }`}
                >
                  <Settings size={14} />
                  <span>Personalizar</span>
                </button>
              </div>
            </div>

            {/* Sub-form: Add New Shelf */}
            {isAddingShelf && (
              <form onSubmit={handleAddShelf} className="p-3 bg-muted/50 border border-border/80 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center border-b border-border/50 pb-1.5">
                  <h4 className="text-xs font-bold text-foreground">Crear Nueva Estantería</h4>
                  <button type="button" onClick={() => setIsAddingShelf(false)}>
                    <X size={14} className="text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                {/* Space saving grid for inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej. Estantería Rinconera"
                      value={newShelfName}
                      onChange={(e) => setNewShelfName(e.target.value)}
                      required
                      className="w-full h-7 px-2 bg-card text-xs rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nº Baldas (Filas)</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={newShelfBaldasCount}
                      onChange={(e) => setNewShelfBaldasCount(parseInt(e.target.value) || 4)}
                      className="w-full h-7 px-2 bg-card text-xs rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Huecos por balda</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newShelfHuecosDefault}
                      onChange={(e) => setNewShelfHuecosDefault(parseInt(e.target.value) || 3)}
                      className="w-full h-7 px-2 bg-card text-xs rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="h-7 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition"
                  >
                    Crear Estantería
                  </button>
                </div>
              </form>
            )}

            {/* Smart Micro Live Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Búsqueda instantánea de cajas, objetos, etiquetas o contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-8 bg-muted text-xs rounded-lg border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Configuration Mode: Customizing baldass and huecos */}
          {isConfiguringShelves && currentShelf && (
            <div className="bg-card border-2 border-dashed border-primary/25 p-4 rounded-2xl shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Settings size={16} className="text-primary" />
                  <h3 className="text-sm font-black text-foreground">
                    Modo Personalización: {currentShelf.name}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsConfiguringShelves(false);
                    setEditingShelfId(null);
                  }}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded-md"
                >
                  Cerrar
                </button>
              </div>

              {/* Shelf Name editing */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-muted/40 p-2 rounded-xl">
                <span className="text-xs font-bold text-muted-foreground shrink-0">Renombrar Estantería:</span>
                <input
                  type="text"
                  value={currentShelf.name}
                  onChange={(e) => handleRenameShelf(currentShelf.id, e.target.value)}
                  className="h-7 px-2 bg-card text-xs font-bold rounded-md border border-border flex-1"
                />
                <button
                  onClick={() => handleDeleteShelf(currentShelf.id)}
                  className="h-7 px-3.5 bg-rose-500/15 text-rose-500 text-xs font-bold rounded-md hover:bg-rose-500 hover:text-white flex items-center justify-center gap-1 transition"
                >
                  <Trash2 size={13} />
                  <span>Eliminar Estantería</span>
                </button>
              </div>

              {/* Customize Baldas & Huecos individually */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                  Configuración individual de baldas y huecos (de arriba a abajo):
                </p>

                <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1">
                  {currentShelf.baldas.map((balda, idx) => (
                    <div key={balda.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Name of Balda */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={balda.name}
                          onChange={(e) => handleRenameBalda(currentShelf.id, balda.id, e.target.value)}
                          placeholder="Nombre Balda"
                          className="h-7 px-2 bg-muted/40 hover:bg-muted text-xs font-semibold rounded-md border border-border/80 flex-1 min-w-0"
                        />
                      </div>

                      {/* Customize slot count */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-1.5">Huecos (Huecos):</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateBaldaHuecos(currentShelf.id, balda.id, false)}
                            disabled={balda.huecoCount <= 1}
                            className="w-6 h-6 bg-muted hover:bg-muted/80 disabled:opacity-40 text-xs font-black rounded-md border border-border flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{balda.huecoCount}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateBaldaHuecos(currentShelf.id, balda.id, true)}
                            className="w-6 h-6 bg-muted hover:bg-muted/80 text-xs font-black rounded-md border border-border flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove this single balda */}
                        <button
                          type="button"
                          onClick={() => handleRemoveBaldaFromShelf(currentShelf.id, balda.id)}
                          className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-md transition"
                          title="Eliminar Balda"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new Balda button */}
                <button
                  type="button"
                  onClick={() => handleAddBaldaToShelf(currentShelf.id)}
                  className="w-full h-8 border border-dashed border-primary/40 text-primary hover:bg-primary/5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus size={14} />
                  <span>Añadir Balda Inferior</span>
                </button>
              </div>
            </div>
          )}

          {/* Visual Shelf Render */}
          {currentShelf ? (
            <div className="bg-card border border-border/85 rounded-2xl p-4 shadow-xs relative">
              {/* Shelf Title & Info */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" />
                  {currentShelf.name}
                </span>

                {movingItem && (
                  <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg text-xs animate-pulse">
                    <Move size={12} />
                    <span>Moviendo &quot;{movingItem.name}&quot;... Elige un hueco vacío de destino</span>
                    <button
                      onClick={() => setMovingItem(null)}
                      className="p-0.5 hover:bg-primary/20 rounded-md"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Shelf Frame (Outer border representing a sturdy bookshelf) */}
              <div className="border-[6px] border-amber-900/80 dark:border-slate-800 rounded-xl bg-muted/40 overflow-hidden shadow-inner p-2.5 space-y-4">
                {currentShelf.baldas.length === 0 ? (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    Esta estantería no tiene baldas. Haz clic en &quot;Personalizar&quot; para añadirlas.
                  </div>
                ) : (
                  currentShelf.baldas.map((balda) => (
                    <div key={balda.id} className="space-y-1">
                      {/* Balda Label */}
                      <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80 px-1">
                        <span>{balda.name}</span>
                        <span>{balda.huecoCount} huecos</span>
                      </div>

                      {/* Baldas Row Slots */}
                      <div
                        className="grid gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${balda.huecoCount}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: balda.huecoCount }).map((_, slotIdx) => {
                          const locationKey = `${currentShelf.id}-${balda.id}-${slotIdx}`;
                          const slotItem = itemsByLocation[locationKey];
                          const isActive =
                            activeSlot?.shelfId === currentShelf.id &&
                            activeSlot?.baldaId === balda.id &&
                            activeSlot?.huecoIndex === slotIdx;

                          // Search filter matching
                          const matchesQuery = slotItem ? isMatchingSearch(slotItem, searchQuery) : false;
                          const isDimmed = hasActiveSearch && !matchesQuery;

                          // Visual Color Badge mapping
                          let colorClass = "bg-card border-border/80 hover:bg-muted text-card-foreground";
                          if (slotItem) {
                            const option = COLOR_OPTIONS.find((c) => c.name === slotItem.color);
                            colorClass = option ? option.class : "bg-indigo-500 text-white";
                          }

                          return (
                            <button
                              key={slotIdx}
                              onClick={() => {
                                if (movingItem) {
                                  completeMove(currentShelf.id, balda.id, slotIdx);
                                } else {
                                  handleSlotClick(currentShelf.id, balda.id, slotIdx);
                                }
                              }}
                              className={`group relative text-left h-14 md:h-16 p-1 rounded-lg border flex flex-col justify-between transition-all overflow-hidden ${colorClass} ${
                                isActive ? "ring-2 ring-primary border-primary scale-[1.01]" : ""
                              } ${isDimmed ? "opacity-20 saturate-50 scale-95" : "opacity-100 shadow-xs hover:scale-[1.005] cursor-pointer"}`}
                            >
                              {/* Slot ID Badge */}
                              <span className={`text-[8px] font-extrabold px-1 rounded-sm border select-none w-max ${
                                slotItem
                                  ? "bg-black/15 border-white/10 text-white/80"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}>
                                H{slotIdx + 1}
                              </span>

                              {/* Slot Content Summary */}
                              {slotItem ? (
                                <div className="mt-1 flex-1 flex flex-col justify-between min-w-0">
                                  {/* Item Name */}
                                  <p className="text-[10px] md:text-xs font-black leading-tight truncate">
                                    {slotItem.name}
                                  </p>
                                  {/* Compact category or contents indicator */}
                                  <div className="flex items-center justify-between text-[7px] md:text-[8px] text-white/80 shrink-0 truncate">
                                    <span className="font-semibold truncate">
                                      {slotItem.type === "caja" ? "📦 Caja" : "🏷️ Art."}
                                    </span>
                                    {slotItem.contents.length > 0 && (
                                      <span className="bg-black/20 px-1 rounded-xs scale-90 shrink-0">
                                        +{slotItem.contents.length} cos.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1 flex-1 flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-md text-muted-foreground group-hover:text-primary transition-colors">
                                  <Plus size={12} />
                                </div>
                              )}

                              {/* Mini Match Glow */}
                              {hasActiveSearch && matchesQuery && (
                                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-bl-full shadow-xs animate-ping" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Sturdy Wood plank line under the row */}
                      <div className="h-2.5 bg-amber-950 dark:bg-slate-700/80 rounded-sm shadow-md" />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-8 rounded-2xl text-center text-muted-foreground">
              Cargando trastero...
            </div>
          )}
        </div>

        {/* Right Column: Slot Details, Mini Editor & Content List (Occupies 4/12 of workspace) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Section: Slot details or micro editor form */}
          {activeSlot ? (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3 relative">
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                  Detalle de Hueco ({activeSlot.huecoIndex + 1})
                </span>
                <button
                  onClick={() => setActiveSlot(null)}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>

              {selectedSlotItem ? (
                /* Detail Mode: What is in this slot */
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black text-white ${
                          COLOR_OPTIONS.find((c) => c.name === selectedSlotItem.color)?.class.split(" ")[0] || "bg-indigo-500"
                        }`}>
                          {selectedSlotItem.type === "caja" ? "📦 Caja" : "🏷️ Suelto"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          En {currentShelf.baldas.find(b => b.id === activeSlot.baldaId)?.name}, H{activeSlot.huecoIndex + 1}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-foreground">
                        {selectedSlotItem.name}
                      </h3>
                    </div>

                    {/* Action Row inside Card */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => initiateMove(selectedSlotItem)}
                        className="p-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary rounded-lg transition"
                        title="Mover de lugar"
                      >
                        <Move size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(selectedSlotItem.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition"
                        title="Eliminar / Vaciar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedSlotItem.description && (
                    <p className="text-muted-foreground bg-muted/45 p-2 rounded-lg italic text-[11px] leading-relaxed">
                      {selectedSlotItem.description}
                    </p>
                  )}

                  {/* Tags */}
                  {selectedSlotItem.tags.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold uppercase text-muted-foreground">Etiquetas</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSlotItem.tags.map((tag, i) => (
                          <span key={i} className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border border-border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contents (For boxes) */}
                  {selectedSlotItem.type === "caja" && (
                    <div className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-[9px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                        <FolderOpen size={11} /> Artículos dentro de la caja:
                      </p>
                      {selectedSlotItem.contents.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">La caja está vacía.</p>
                      ) : (
                        <ul className="space-y-1">
                          {selectedSlotItem.contents.map((content, i) => (
                            <li key={i} className="flex items-center gap-1 text-[11px] text-foreground font-medium pl-1">
                              <span className="text-primary">•</span> {content}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Quick Edit Trigger button */}
                  <div className="pt-2 border-t border-border/40 flex justify-end">
                    <button
                      onClick={() => {
                        // Keep current activeSlot but toggle to form mode by resetting the itemForm just in case,
                        // actually, the form is already populated inside handleSlotClick, so we just let them edit.
                        // We will show form inline below details
                      }}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Edit3 size={12} /> Editar detalles
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Form Mode: Inline Mini Inputs to edit or create item */}
              <form onSubmit={handleSaveItem} className="space-y-2.5 border-t border-border/40 pt-3">
                <div className="flex items-center gap-1">
                  <Edit3 size={12} className="text-primary" />
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                    {selectedSlotItem ? "Editar Información" : "Colocar Caja / Objeto aquí"}
                  </span>
                </div>

                {/* Compact Grid for inputs */}
                <div className="space-y-2">
                  {/* Name field */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nombre de Caja u Objeto</label>
                    <input
                      type="text"
                      placeholder="Ej. Caja 5 - Tornillos y Clavos"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      required
                      className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary font-bold"
                    />
                  </div>

                  {/* Type Selector (Compact Pills) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, type: "caja" })}
                      className={`h-7 rounded-md text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        itemForm.type === "caja"
                          ? "bg-primary/10 text-primary border-primary/40"
                          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      <Package size={11} />
                      <span>Caja (Contiene cosas)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, type: "suelto" })}
                      className={`h-7 rounded-md text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        itemForm.type === "suelto"
                          ? "bg-primary/10 text-primary border-primary/40"
                          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      <Tag size={11} />
                      <span>Artículo suelto</span>
                    </button>
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Código de Color Visual</label>
                    <div className="flex flex-wrap gap-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setItemForm({ ...itemForm, color: c.name })}
                          className={`w-5 h-5 rounded-full cursor-pointer transition flex items-center justify-center ${
                            c.class.split(" ")[0]
                          } ${
                            itemForm.color === c.name
                              ? "ring-2 ring-primary ring-offset-2 scale-110"
                              : "hover:scale-105 border border-white/20"
                          }`}
                          title={c.name}
                        >
                          {itemForm.color === c.name && <Check size={10} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Breve Descripción (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Herramientas pesadas de bricolaje"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden"
                    />
                  </div>

                  {/* Inner contents (Only for boxes) */}
                  {itemForm.type === "caja" && (
                    <div className="space-y-0.5 bg-primary/5 p-2 rounded-lg border border-primary/10">
                      <label className="text-[9px] font-extrabold uppercase text-primary flex items-center gap-1">
                        <FolderOpen size={11} /> Artículos dentro (Separados por coma)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Taladro, Martillo, Destornilladores, Cinta"
                        value={itemForm.contentsInput}
                        onChange={(e) => setItemForm({ ...itemForm, contentsInput: e.target.value })}
                        className="w-full h-7 px-2 bg-card text-xs rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary text-[11px]"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Etiquetas (Separadas por coma)</label>
                    <input
                      type="text"
                      placeholder="Ej. herramientas, metal, pesado"
                      value={itemForm.tagsInput}
                      onChange={(e) => setItemForm({ ...itemForm, tagsInput: e.target.value })}
                      className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-7 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/95 cursor-pointer transition shadow-xs"
                >
                  {selectedSlotItem ? "Guardar Cambios" : "Colocar en este hueco"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 text-center py-8 text-muted-foreground shadow-xs">
              <HelpCircle size={28} className="mx-auto mb-2 text-muted-foreground/60" />
              <h4 className="text-xs font-bold text-foreground mb-1">
                ¿Cómo organizar tus cosas?
              </h4>
              <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                Selecciona cualquier hueco vacío o caja en el plano de la estantería para colocar, ver, editar o mover objetos de manera ultra compacta.
              </p>
            </div>
          )}

          {/* Quick Stats Summary Card */}
          <div className="bg-card border border-border rounded-2xl p-3.5 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-foreground">Resumen de tu Trastero</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-muted/50 p-2 rounded-xl">
                <span className="text-[10px] text-muted-foreground font-semibold">Total Cajas</span>
                <p className="text-lg font-black text-primary">
                  {items.filter((it) => it.type === "caja").length}
                </p>
              </div>
              <div className="bg-muted/50 p-2 rounded-xl">
                <span className="text-[10px] text-muted-foreground font-semibold">Art. Sueltos</span>
                <p className="text-lg font-black text-foreground">
                  {items.filter((it) => it.type === "suelto").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
