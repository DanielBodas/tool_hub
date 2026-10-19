"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronUp,
  X,
  PlusCircle,
  HelpCircle,
  FolderOpen,
  Tag,
  Check,
  ArrowUp,
  ArrowDown,
  Info,
  Sliders,
  AlignLeft,
  FileText
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
  color: string; // Color name
  description: string;
  tags: string[];
  contents: string[];
  shelfId: string;
  baldaId: string;
  huecoIndex: number;
  stackIndex: number; // Vertical position inside the slot (0 is bottom)
}

// Colors list for visual customization
const COLOR_OPTIONS = [
  { name: "Slate", class: "bg-slate-500 hover:bg-slate-600 border-slate-700 text-white shadow-slate-500/30" },
  { name: "Red", class: "bg-rose-500 hover:bg-rose-600 border-rose-700 text-white shadow-rose-500/30" },
  { name: "Orange", class: "bg-orange-500 hover:bg-orange-600 border-orange-700 text-white shadow-orange-500/30" },
  { name: "Yellow", class: "bg-amber-500 hover:bg-amber-600 border-amber-700 text-white shadow-amber-500/30" },
  { name: "Green", class: "bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white shadow-emerald-500/30" },
  { name: "Blue", class: "bg-sky-500 hover:bg-sky-600 border-sky-700 text-white shadow-sky-500/30" },
  { name: "Indigo", class: "bg-indigo-500 hover:bg-indigo-600 border-indigo-700 text-white shadow-indigo-500/30" },
  { name: "Purple", class: "bg-purple-500 hover:bg-purple-600 border-purple-700 text-white shadow-purple-500/30" },
];

export function StorageOrganizerModule() {
  // Persistence state
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<"loading" | "cloud" | "local" | "error">("loading");
  const [isSaving, setIsSaving] = useState(false);

  // Responsive mobile view tab state
  const [viewTab, setViewTab] = useState<"shelf" | "detail">("shelf");

  // Accordion toggle states to save space and avoid scrolling
  const [isStackExpanded, setIsStackExpanded] = useState(true);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false); // Collapsed by default on mobile to save space!

  // UI State
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSlot, setActiveSlot] = useState<{
    shelfId: string;
    baldaId: string;
    huecoIndex: number;
    itemId?: string; // Optional specific item selected within the stack
  } | null>(null);

  // Drag and Drop Dragged Item State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{
    baldaId: string;
    huecoIndex: number;
  } | null>(null);

  // Compact Form states
  const [newShelfName, setNewShelfName] = useState("");
  const [newShelfBaldasCount, setNewShelfBaldasCount] = useState(4);
  const [newShelfHuecosDefault, setNewShelfHuecosDefault] = useState(3);

  const [isConfiguringShelves, setIsConfiguringShelves] = useState(false);

  // Nested collapsible section states inside configuration
  const [configSection, setConfigSection] = useState<"edit" | "baldas" | "create" | null>(null);

  // Track expanded state for individual baldas in personalization list to minimize scroll space
  const [expandedBaldaIds, setExpandedBaldaIds] = useState<Record<string, boolean>>({});

  // Additional sidebar collapsible state
  const [isDetailCardExpanded, setIsDetailCardExpanded] = useState(true);

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

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/storage-organizer");
        const resData = await response.json();

        if (resData.offline) {
          loadFromLocalStorage();
        } else if (response.ok && resData.shelves) {
          setShelves(resData.shelves);
          const loadedItems = (resData.items || []).map((it: any, idx: number) => ({
            ...it,
            stackIndex: typeof it.stackIndex === "number" ? it.stackIndex : 0,
          }));
          setItems(loadedItems);
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

      const migratedItems = parsedItems.map((it: any) => ({
        ...it,
        stackIndex: typeof it.stackIndex === "number" ? it.stackIndex : 0,
      }));

      setShelves(parsedShelves);
      setItems(migratedItems);
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

  // Trigger auto-save
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (syncStatus === "loading") return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSaving(true);

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

  const currentShelf = shelves.find((s) => s.id === selectedShelfId) || shelves[0];

  // Group items by location & sort by stackIndex ascending
  const itemsByLocation = items.reduce((acc, item) => {
    const key = `${item.shelfId}-${item.baldaId}-${item.huecoIndex}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, StorageItem[]>);

  // Sort stacks inside each slot
  Object.keys(itemsByLocation).forEach((key) => {
    itemsByLocation[key].sort((a, b) => a.stackIndex - b.stackIndex);
  });

  // Search matching helper
  function isMatchingSearch(item: StorageItem, query: string): boolean {
    if (!query.trim()) return true;
    const cleanQuery = query.toLowerCase().trim();

    const nameMatch = item.name.toLowerCase().includes(cleanQuery);
    const descMatch = item.description.toLowerCase().includes(cleanQuery);
    const tagMatch = item.tags.some(t => t.toLowerCase().includes(cleanQuery));
    const contentMatch = item.contents.some(c => c.toLowerCase().includes(cleanQuery));

    return nameMatch || descMatch || tagMatch || contentMatch;
  }

  const hasActiveSearch = searchQuery.trim().length > 0;

  // Find currently selected item in the selected slot
  const slotItems = activeSlot
    ? (itemsByLocation[`${activeSlot.shelfId}-${activeSlot.baldaId}-${activeSlot.huecoIndex}`] || [])
    : [];

  const selectedSlotItem = activeSlot && activeSlot.itemId
    ? (slotItems.find((it) => it.id === activeSlot.itemId) || null)
    : null;

  // Action: Click slot (empty space or clicking specific item)
  function handleSlotClick(shelfId: string, baldaId: string, huecoIndex: number, specificItemId?: string) {
    const slotKey = `${shelfId}-${baldaId}-${huecoIndex}`;
    const slotList = itemsByLocation[slotKey] || [];

    const targetItemId = specificItemId || (slotList.length > 0 ? slotList[slotList.length - 1].id : undefined);

    setActiveSlot({ shelfId, baldaId, huecoIndex, itemId: targetItemId });

    const existing = targetItemId ? slotList.find((it) => it.id === targetItemId) : null;
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
      setItemForm({
        name: "",
        type: "caja",
        color: "Indigo",
        description: "",
        tagsInput: "",
        contentsInput: "",
      });
    }

    // Auto navigate to the detail tab on mobile so user instantly sees what's inside or can add!
    if (window.innerWidth < 1024) {
      setViewTab("detail");
    }
  }

  // Action: Select another specific item in the same stack (from the stack details list)
  function handleSelectSpecificItem(itemId: string) {
    if (!activeSlot) return;
    setActiveSlot({ ...activeSlot, itemId });
    const existing = slotItems.find((it) => it.id === itemId);
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
    }
  }

  // Action: Save/Place Item
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

    const slotKey = `${activeSlot.shelfId}-${activeSlot.baldaId}-${activeSlot.huecoIndex}`;
    const currentStack = itemsByLocation[slotKey] || [];

    let finalStackIndex = 0;
    if (itemForm.id) {
      const existing = currentStack.find((it) => it.id === itemForm.id);
      finalStackIndex = existing ? existing.stackIndex : currentStack.length;
    } else {
      finalStackIndex = currentStack.length; // place on top of stack
    }

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
      stackIndex: finalStackIndex,
    };

    let updatedItems;
    if (itemForm.id) {
      updatedItems = items.map((it) => (it.id === itemForm.id ? newItem : it));
    } else {
      updatedItems = [...items, newItem];
    }

    setItems(updatedItems);
    setActiveSlot({ ...activeSlot, itemId: newItem.id });

    // Populate form with newly saved values
    setItemForm({
      id: newItem.id,
      name: newItem.name,
      type: newItem.type,
      color: newItem.color,
      description: newItem.description,
      tagsInput: newItem.tags.join(", "),
      contentsInput: newItem.contents.join(", "),
    });

    // Auto navigate back to shelf tab on mobile so user sees the newly placed item in the grid!
    if (window.innerWidth < 1024) {
      setViewTab("shelf");
    }
  }

  // Action: Delete/Remove Item
  function handleRemoveItem(itemId: string) {
    if (confirm("¿Estás seguro de que deseas quitar este artículo?")) {
      const itemToRemove = items.find((it) => it.id === itemId);
      if (!itemToRemove) return;

      const slotKey = `${itemToRemove.shelfId}-${itemToRemove.baldaId}-${itemToRemove.huecoIndex}`;
      const remainingInSlot = items
        .filter((it) => it.id !== itemId && `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` === slotKey)
        .sort((a, b) => a.stackIndex - b.stackIndex);

      // Re-index remaining stack
      const reindexedItemsInSlot = remainingInSlot.map((it, idx) => ({
        ...it,
        stackIndex: idx,
      }));

      const otherItems = items.filter(
        (it) => `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` !== slotKey
      );

      setItems([...otherItems, ...reindexedItemsInSlot]);
      setActiveSlot(null);
    }
  }

  // Stacking reorder manually: Up / Down
  function handleMoveStackIndex(itemId: string, direction: "up" | "down") {
    const targetItem = items.find((it) => it.id === itemId);
    if (!targetItem) return;

    const slotKey = `${targetItem.shelfId}-${targetItem.baldaId}-${targetItem.huecoIndex}`;
    const slotStack = items
      .filter((it) => `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` === slotKey)
      .sort((a, b) => a.stackIndex - b.stackIndex);

    const currentIdx = slotStack.findIndex((it) => it.id === itemId);
    if (currentIdx === -1) return;

    const targetSwapIdx = direction === "up" ? currentIdx + 1 : currentIdx - 1;
    if (targetSwapIdx < 0 || targetSwapIdx >= slotStack.length) return; // out of bounds

    // Swap indexes
    const tempIndex = slotStack[currentIdx].stackIndex;
    slotStack[currentIdx].stackIndex = slotStack[targetSwapIdx].stackIndex;
    slotStack[targetSwapIdx].stackIndex = tempIndex;

    const otherItems = items.filter(
      (it) => `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` !== slotKey
    );

    setItems([...otherItems, ...slotStack]);
    // Refresh slot selection to currently moved item
    if (activeSlot) {
      setActiveSlot({ ...activeSlot, itemId });
    }
  }

  // HTML5 Drag and Drop event handlers
  function handleDragStart(e: React.DragEvent, item: StorageItem) {
    e.dataTransfer.setData("text/plain", item.id);
    setDraggedItemId(item.id);
  }

  function handleDragOver(e: React.DragEvent, baldaId: string, huecoIndex: number) {
    e.preventDefault();
    if (dragOverSlot?.baldaId !== baldaId || dragOverSlot?.huecoIndex !== huecoIndex) {
      setDragOverSlot({ baldaId, huecoIndex });
    }
  }

  function handleDragLeave() {
    setDragOverSlot(null);
  }

  function handleDrop(e: React.DragEvent, shelfId: string, baldaId: string, huecoIndex: number) {
    e.preventDefault();
    setDragOverSlot(null);

    const itemId = e.dataTransfer.getData("text/plain") || draggedItemId;
    if (!itemId) return;

    setDraggedItemId(null);

    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    // If dropped in the same slot, do nothing
    if (item.shelfId === shelfId && item.baldaId === baldaId && item.huecoIndex === huecoIndex) {
      return;
    }

    // Move to the new slot, assign top stackIndex
    const destinationSlotKey = `${shelfId}-${baldaId}-${huecoIndex}`;
    const destStack = itemsByLocation[destinationSlotKey] || [];

    const sourceSlotKey = `${item.shelfId}-${item.baldaId}-${item.huecoIndex}`;

    // Adjust stackIndex of original slot (re-index remaining)
    const remainingInSource = items
      .filter((it) => it.id !== itemId && `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` === sourceSlotKey)
      .sort((a, b) => a.stackIndex - b.stackIndex)
      .map((it, idx) => ({ ...it, stackIndex: idx }));

    const otherItems = items.filter(
      (it) =>
        `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` !== sourceSlotKey &&
        `${it.shelfId}-${it.baldaId}-${it.huecoIndex}` !== destinationSlotKey &&
        it.id !== itemId
    );

    const movedItem: StorageItem = {
      ...item,
      shelfId,
      baldaId,
      huecoIndex,
      stackIndex: destStack.length, // placed on top
    };

    setItems([...otherItems, ...remainingInSource, movedItem]);
    setActiveSlot({ shelfId, baldaId, huecoIndex, itemId: movedItem.id });

    // Reset form to moved item
    setItemForm({
      id: movedItem.id,
      name: movedItem.name,
      type: movedItem.type,
      color: movedItem.color,
      description: movedItem.description,
      tagsInput: movedItem.tags.join(", "),
      contentsInput: movedItem.contents.join(", "),
    });
  }

  // Toggle individual balda accordion in customization
  function toggleBaldaAccordion(baldaId: string) {
    setExpandedBaldaIds((prev) => ({
      ...prev,
      [baldaId]: !prev[baldaId],
    }));
  }

  // Manual Shelf Creation
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
    setNewShelfName("");
    setConfigSection("baldas"); // Swtich to baldas of the new shelf to customize!
  }

  // Actions for modifying shelves
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
      huecoCount: 3,
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
          `Esta balda contiene ${itemsInBalda.length} artículos en sus huecos. Se perderán. ¿Quieres continuar?`
        )
      ) {
        return;
      }
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

        if (!increment && b.huecoCount > 1) {
          const removedSlotIdx = b.huecoCount - 1;
          const itemsInRemovedSlot = items.filter(
            (it) => it.shelfId === shelfId && it.baldaId === baldaId && it.huecoIndex === removedSlotIdx
          );
          if (itemsInRemovedSlot.length > 0) {
            if (
              !confirm(
                `El último hueco contiene ${itemsInRemovedSlot.length} artículos apilados. Se borrarán si reduces el tamaño. ¿Continuar?`
              )
            ) {
              return b;
            }
            setItems(
              items.filter(
                (it) => !(it.shelfId === shelfId && it.baldaId === baldaId && it.huecoIndex === removedSlotIdx)
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
        `¿Seguro que quieres eliminar esta estantería? Se borrarán todos sus huecos y los ${itemsOnShelf.length} artículos que contiene.`
      )
    ) {
      setShelves(shelves.filter((sh) => sh.id !== shelfId));
      setItems(items.filter((it) => it.shelfId !== shelfId));
      setActiveSlot(null);
      const remaining = shelves.filter((sh) => sh.id !== shelfId);
      if (remaining.length > 0) {
        setSelectedShelfId(remaining[0].id);
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Title Header with Sync Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border/80 p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Boxes className="text-primary" size={24} /> Organizador de Trastero
          </h1>
          <p className="text-xs text-muted-foreground">
            Gestión visual y ultra compacta. Arrastra y apila cajas minimizando el scroll.
          </p>
        </div>

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

      {/* MOBILE/TABLET ONLY LATERAL NAVIGATION TABS (Hidden on lg breakpoint and above) */}
      <div className="lg:hidden flex bg-muted p-1 rounded-xl border border-border/80 shadow-inner">
        <button
          onClick={() => setViewTab("shelf")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
            viewTab === "shelf"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlignLeft size={14} />
          <span>Ver Estantería (Plano)</span>
        </button>
        <button
          onClick={() => setViewTab("detail")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition relative ${
            viewTab === "detail"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText size={14} />
          <span>Detalle / Colocar</span>
          {activeSlot && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left Column: Shelf Visualizer (Visible on desktop OR when viewTab === 'shelf' on mobile) */}
        <div className={`lg:col-span-8 space-y-4 ${viewTab === "shelf" ? "block" : "hidden lg:block"}`}>

          {/* Controls: Select, Search, Config */}
          <div className="bg-card border border-border/80 p-3 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">

              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-xs font-black text-muted-foreground shrink-0 hidden sm:inline">
                  Estantería activa:
                </span>
                <div className="relative flex-1 min-w-0">
                  <select
                    value={selectedShelfId}
                    onChange={(e) => {
                      setSelectedShelfId(e.target.value);
                      setActiveSlot(null);
                    }}
                    className="w-full h-8 pl-2.5 pr-8 bg-muted hover:bg-muted/80 text-xs font-extrabold rounded-lg border border-border cursor-pointer appearance-none focus:outline-hidden focus:ring-1 focus:ring-primary truncate text-primary"
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

              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                <button
                  onClick={() => {
                    setIsConfiguringShelves(!isConfiguringShelves);
                    if (!isConfiguringShelves) {
                      setConfigSection("baldas"); // Default to Baldas management for high visual control
                    }
                  }}
                  className={`h-8 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                    isConfiguringShelves
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "bg-secondary hover:bg-muted border border-border text-secondary-foreground"
                  }`}
                >
                  <Settings size={14} className={isConfiguringShelves ? "animate-spin" : ""} />
                  <span>⚙️ Gestión del Trastero</span>
                </button>
              </div>
            </div>

            {/* UNIFIED GESTIÓN DEL TRASTERO ACCORDION SYSTEM */}
            {isConfiguringShelves && currentShelf && (
              <div className="bg-card border-2 border-dashed border-amber-500/35 p-3 rounded-2xl shadow-xs space-y-2.5">
                <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    Panel de Configuración del Trastero
                  </span>
                  <button
                    onClick={() => setIsConfiguringShelves(false)}
                    className="text-[9px] font-extrabold text-muted-foreground hover:text-foreground bg-muted px-2 py-0.5 rounded"
                  >
                    Ocultar
                  </button>
                </div>

                {/* Sub-Accordion 1: EDITAR ESTANTERÍA ACTIVA */}
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setConfigSection(configSection === "edit" ? null : "edit")}
                    className="w-full bg-muted/40 hover:bg-muted/70 p-2 flex justify-between items-center text-left text-[11px] font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Edit3 size={12} className="text-amber-500" /> 🏗️ Cambiar Nombre o Eliminar Estantería
                    </span>
                    {configSection === "edit" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {configSection === "edit" && (
                    <div className="p-2.5 bg-card border-t border-border/50 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nombre de la Estantería</label>
                        <input
                          type="text"
                          value={currentShelf.name}
                          onChange={(e) => handleRenameShelf(currentShelf.id, e.target.value)}
                          className="w-full h-7 px-2 bg-muted/60 text-xs font-bold rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteShelf(currentShelf.id)}
                        className="w-full h-7 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Eliminar {currentShelf.name} permanentemente</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-Accordion 2: BALDAS Y COMPARTIMENTOS (Nested accordions inside!) */}
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setConfigSection(configSection === "baldas" ? null : "baldas")}
                    className="w-full bg-muted/40 hover:bg-muted/70 p-2 flex justify-between items-center text-left text-[11px] font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} className="text-amber-500" /> 🪵 Baldas y Compartimentos ({currentShelf.baldas.length})
                    </span>
                    {configSection === "baldas" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {configSection === "baldas" && (
                    <div className="p-2 bg-card border-t border-border/50 space-y-2">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1">
                        Toca cada balda para ajustar su nombre o número de huecos:
                      </p>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {currentShelf.baldas.map((balda, idx) => {
                          const isExpanded = !!expandedBaldaIds[balda.id];
                          return (
                            <div key={balda.id} className="border border-border/75 rounded-lg overflow-hidden bg-muted/10">

                              {/* Balda nested accordion header toggle */}
                              <button
                                type="button"
                                onClick={() => toggleBaldaAccordion(balda.id)}
                                className={`w-full p-1.5 px-2.5 flex justify-between items-center text-left cursor-pointer transition ${
                                  isExpanded ? "bg-amber-500/5 font-bold" : "hover:bg-muted/30"
                                }`}
                              >
                                <span className="text-[11px] flex items-center gap-1.5 truncate">
                                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-700 px-1.5 py-0.2 rounded-sm font-black">
                                    Balda #{idx + 1}
                                  </span>
                                  <span className="truncate">{balda.name}</span>
                                  <span className="text-[9px] text-muted-foreground font-medium">({balda.huecoCount} huecos)</span>
                                </span>
                                {isExpanded ? <ChevronUp size={11} className="text-amber-500" /> : <ChevronDown size={11} />}
                              </button>

                              {/* Balda content view if expanded */}
                              {isExpanded && (
                                <div className="p-2 bg-card border-t border-border/50 space-y-2 text-xs">
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nombre del Estante</label>
                                    <input
                                      type="text"
                                      value={balda.name}
                                      onChange={(e) => handleRenameBalda(currentShelf.id, balda.id, e.target.value)}
                                      className="w-full h-7 px-2 bg-muted/60 text-[11px] font-semibold rounded-md border border-border"
                                    />
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground mr-1">Huecos:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBaldaHuecos(currentShelf.id, balda.id, false)}
                                        disabled={balda.huecoCount <= 1}
                                        className="w-6 h-6 bg-muted hover:bg-muted/80 disabled:opacity-40 text-xs font-black rounded-md border border-border flex items-center justify-center"
                                      >
                                        -
                                      </button>
                                      <span className="w-6 text-center font-bold text-xs">{balda.huecoCount}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBaldaHuecos(currentShelf.id, balda.id, true)}
                                        className="w-6 h-6 bg-muted hover:bg-muted/80 text-xs font-black rounded-md border border-border flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBaldaFromShelf(currentShelf.id, balda.id)}
                                      className="h-6 px-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-md text-[10px] font-semibold flex items-center gap-1 transition"
                                      title="Borrar Balda"
                                    >
                                      <Trash2 size={11} /> Borrar Balda
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddBaldaToShelf(currentShelf.id)}
                        className="w-full h-7 border border-dashed border-primary/40 text-primary hover:bg-primary/5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Añadir Balda Inferior</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-Accordion 3: CREAR NUEVA ESTANTERÍA */}
                <div className="border border-border/80 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setConfigSection(configSection === "create" ? null : "create")}
                    className="w-full bg-muted/40 hover:bg-muted/70 p-2 flex justify-between items-center text-left text-[11px] font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <PlusCircle size={12} className="text-emerald-500" /> ➕ Crear Nueva Estantería
                    </span>
                    {configSection === "create" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {configSection === "create" && (
                    <form onSubmit={handleAddShelf} className="p-2.5 bg-card border-t border-border/50 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nombre</label>
                        <input
                          type="text"
                          placeholder="Ej. Estantería Rinconera"
                          value={newShelfName}
                          onChange={(e) => setNewShelfName(e.target.value)}
                          required
                          className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-extrabold uppercase text-muted-foreground">Nº Baldas</label>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={newShelfBaldasCount}
                            onChange={(e) => setNewShelfBaldasCount(parseInt(e.target.value) || 4)}
                            className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-extrabold uppercase text-muted-foreground">Huecos por balda</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={newShelfHuecosDefault}
                            onChange={(e) => setNewShelfHuecosDefault(parseInt(e.target.value) || 3)}
                            className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="w-full h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-md transition cursor-pointer"
                        >
                          Crear Estantería
                        </button>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            )}

            {/* Smart Live Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Búsqueda rápida de cajas, objetos, etiquetas..."
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

          {/* Highly Visual Real Shelf Renderer */}
          {currentShelf ? (
            <div className="bg-card border border-border/85 rounded-2xl p-4 shadow-xs relative">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" />
                  Plano de {currentShelf.name}
                </span>

                <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-bold bg-muted/40 px-2 py-1 rounded-md">
                  <Info size={12} className="text-primary" />
                  <span className="hidden xs:inline">Arrastra cajas para recolocarlas o apilarlas</span>
                  <span className="xs:hidden">Toca un hueco para apilar o ver detalles</span>
                </div>
              </div>

              {/* Realistic Bookcase Outer Structure */}
              <div className="relative border-x-[14px] border-slate-700 dark:border-slate-800 bg-muted/30 p-4 rounded-xl shadow-lg flex flex-col gap-6">

                {/* Structural metallic/wood frame pillars */}
                <div className="absolute inset-y-0 left-0 w-1 bg-black/20 border-r border-white/5 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-1 bg-black/20 border-l border-white/5 pointer-events-none" />

                {/* Notch holes (Cremallera de estantería) to make it look exceptionally visual */}
                <div className="absolute inset-y-2 left-[-10px] w-1 flex flex-col justify-between items-center opacity-30 pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1 bg-black rounded-xs" />
                  ))}
                </div>
                <div className="absolute inset-y-2 right-[-10px] w-1 flex flex-col justify-between items-center opacity-30 pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1 bg-black rounded-xs" />
                  ))}
                </div>

                {currentShelf.baldas.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground font-semibold">
                    No hay baldas todavía. Usa &quot;Personalizar&quot; para crear estantes.
                  </div>
                ) : (
                  currentShelf.baldas.map((balda) => (
                    <div key={balda.id} className="relative space-y-1.5">

                      {/* Balda Label Header */}
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground/90 px-1">
                        <span>{balda.name}</span>
                        <span>{balda.huecoCount} Huecos</span>
                      </div>

                      {/* Row Slots container */}
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `repeat(${balda.huecoCount}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: balda.huecoCount }).map((_, slotIdx) => {
                          const slotKey = `${currentShelf.id}-${balda.id}-${slotIdx}`;
                          const stackList = itemsByLocation[slotKey] || [];

                          // Drag and drop states
                          const isOver = dragOverSlot?.baldaId === balda.id && dragOverSlot?.huecoIndex === slotIdx;

                          // Check if any item in the stack matches search query
                          const hasSearchQuery = searchQuery.trim().length > 0;
                          const hasMatchInStack = stackList.some((it) => isMatchingSearch(it, searchQuery));
                          const isDimmed = hasSearchQuery && !hasMatchInStack;

                          const isSlotActive = activeSlot?.shelfId === currentShelf.id &&
                                               activeSlot?.baldaId === balda.id &&
                                               activeSlot?.huecoIndex === slotIdx;

                          return (
                            <div
                              key={slotIdx}
                              onDragOver={(e) => handleDragOver(e, balda.id, slotIdx)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, currentShelf.id, balda.id, slotIdx)}
                              onClick={() => handleSlotClick(currentShelf.id, balda.id, slotIdx)}
                              className={`relative group min-h-[5rem] rounded-xl border-2 flex flex-col justify-end p-1.5 transition-all duration-200 ${
                                isOver
                                  ? "border-primary bg-primary/10 scale-102 ring-2 ring-primary/40"
                                  : isSlotActive
                                    ? "border-primary/80 bg-muted/60"
                                    : "border-dashed border-border/80 hover:border-muted-foreground/40 bg-card/45 hover:bg-muted/30"
                              } ${isDimmed ? "opacity-20 saturate-50 scale-95" : "opacity-100 cursor-pointer"}`}
                            >
                              {/* Background Slot Indicator Number */}
                              <div className="absolute top-1 left-1.5 text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground/50 select-none z-0">
                                H{slotIdx + 1}
                              </div>

                              {/* Stacked Box Items (Rendered in stack order, bottom to top) */}
                              {stackList.length > 0 ? (
                                <div className="flex flex-col justify-end w-full space-y-[-6px] z-10 select-none">
                                  {stackList.map((item, stackIdx) => {
                                    const isItemSelected = activeSlot?.itemId === item.id;
                                    const isQueryMatch = hasSearchQuery && isMatchingSearch(item, searchQuery);

                                    // Color styling
                                    const opt = COLOR_OPTIONS.find((c) => c.name === item.color);
                                    const colorStyle = opt ? opt.class : "bg-indigo-500 text-white border-indigo-700";

                                    // Visual 3D-like stacking style
                                    const stackOffsetStyle = {
                                      transform: `translateY(${-stackIdx * 1}px) scale(${1 - (stackList.length - 1 - stackIdx) * 0.02})`,
                                      zIndex: stackIdx,
                                    };

                                    return (
                                      <div
                                        key={item.id}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        onClick={(e) => {
                                          e.stopPropagation(); // don't trigger slot click
                                          handleSlotClick(currentShelf.id, balda.id, slotIdx, item.id);
                                        }}
                                        style={stackOffsetStyle}
                                        className={`group/box relative px-2 py-1 md:py-1.5 rounded-md border text-left shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing ${colorStyle} ${
                                          isItemSelected
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-primary scale-102 font-black border-white shadow-md"
                                            : "border-black/15"
                                        } ${hasSearchQuery && !isQueryMatch ? "opacity-30" : "opacity-100"}`}
                                      >
                                        <div className="flex items-center justify-between gap-1 min-w-0">
                                          <p className="text-[9px] md:text-[10px] font-bold leading-tight truncate flex-1">
                                            {item.name}
                                          </p>
                                          <span className="text-[8px] opacity-75 shrink-0 hidden xs:inline">
                                            {item.type === "caja" ? "📦" : "🏷️"}
                                          </span>
                                        </div>

                                        {/* Highlight glow if matching search query */}
                                        {hasSearchQuery && isQueryMatch && (
                                          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground/30 group-hover:text-primary/60 transition-colors pointer-events-none py-6">
                                  <Plus size={14} className="stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Sturdy wood shelf bracket supports on sides */}
                      <div className="absolute bottom-[-1px] left-[-14px] w-3.5 h-3.5 bg-slate-400 dark:bg-slate-600 rounded-br-lg shadow-sm" />
                      <div className="absolute bottom-[-1px] right-[-14px] w-3.5 h-3.5 bg-slate-400 dark:bg-slate-600 rounded-bl-lg shadow-sm" />

                      {/* Heavy Duty Pine Wood Plank Plinth */}
                      <div className="h-3.5 bg-amber-800 dark:bg-slate-700 rounded-md shadow-md border-b-2 border-amber-950/40 flex items-center px-2">
                        <div className="w-full h-0.5 bg-amber-700/50 dark:bg-slate-600/50 rounded-full" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-8 rounded-2xl text-center text-muted-foreground font-semibold">
              Cargando trastero...
            </div>
          )}
        </div>

        {/* Right Column: Details, Manual Stack Ordering, Form Editor (Visible on desktop OR when viewTab === 'detail' on mobile) */}
        <div className={`lg:col-span-4 space-y-4 ${viewTab === "detail" ? "block" : "hidden lg:block"}`}>

          {/* Active Slot Panel with Accordions */}
          {activeSlot ? (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4 relative">

              {/* Header Box */}
              <div className="flex justify-between items-center border-b border-border/60 pb-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                    Panel de Hueco (H{activeSlot.huecoIndex + 1})
                  </span>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">
                    {currentShelf.baldas.find((b) => b.id === activeSlot.baldaId)?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveSlot(null);
                    // On mobile, auto return to the shelf view if closing details!
                    if (window.innerWidth < 1024) {
                      setViewTab("shelf");
                    }
                  }}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Accordion 1: Pila de Cajas (Stack structure) */}
              {slotItems.length > 0 && (
                <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setIsStackExpanded(!isStackExpanded)}
                    className="w-full bg-muted/40 hover:bg-muted/75 p-2.5 flex justify-between items-center text-left cursor-pointer transition"
                  >
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                      <Layers size={11} className="text-primary" /> Estructura de Apilado ({slotItems.length})
                    </span>
                    {isStackExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isStackExpanded && (
                    <div className="p-2 bg-card space-y-1.5 border-t border-border/50">
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {[...slotItems].reverse().map((item, idx) => {
                          const listIdx = slotItems.length - 1 - idx;
                          const isSelected = activeSlot.itemId === item.id;
                          const opt = COLOR_OPTIONS.find((c) => c.name === item.color);
                          const colorClass = opt ? opt.class.split(" ")[0] : "bg-indigo-500";

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-1.5 rounded-lg border text-xs gap-2 transition ${
                                isSelected
                                  ? "bg-primary/5 border-primary/50 ring-1 ring-primary/25 font-bold"
                                  : "bg-muted/30 border-border hover:bg-muted"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectSpecificItem(item.id)}
                                className="flex-1 text-left min-w-0 font-bold truncate flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`} />
                                <span className="truncate">{item.name}</span>
                              </button>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleMoveStackIndex(item.id, "up")}
                                  disabled={listIdx === slotItems.length - 1}
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-35 rounded-md"
                                  title="Subir de la pila"
                                >
                                  <ArrowUp size={11} className="stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveStackIndex(item.id, "down")}
                                  disabled={listIdx === 0}
                                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-35 rounded-md"
                                  title="Bajar de la pila"
                                >
                                  <ArrowDown size={11} className="stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-md"
                                  title="Retirar"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Item Details (Static/Collapsible view) wrapped inside an accordion to minimize vertical space */}
              {selectedSlotItem && (
                <div className="border border-border/85 rounded-xl overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setIsDetailCardExpanded(!isDetailCardExpanded)}
                    className="w-full bg-muted/30 hover:bg-muted/65 p-2 flex justify-between items-center text-left cursor-pointer transition text-xs"
                  >
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1.5">
                      <FileText size={12} className="text-primary" /> 📋 Ficha de Detalles y Contenido
                    </span>
                    {isDetailCardExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {isDetailCardExpanded && (
                    <div className="p-3 bg-card space-y-3 text-xs border-t border-border/50">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black text-white ${
                            COLOR_OPTIONS.find((c) => c.name === selectedSlotItem.color)?.class.split(" ")[0] || "bg-indigo-500"
                          }`}>
                            {selectedSlotItem.type === "caja" ? "📦 Caja" : "🏷️ Suelto"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Posición #{selectedSlotItem.stackIndex + 1} de la pila
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-foreground">
                          {selectedSlotItem.name}
                        </h3>
                      </div>

                      {selectedSlotItem.description && (
                        <p className="text-muted-foreground bg-muted/45 p-2 rounded-lg italic text-[11px] leading-relaxed">
                          {selectedSlotItem.description}
                        </p>
                      )}

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
                    </div>
                  )}
                </div>
              )}

              {/* Special visual callout if editing an existing box, to make creating a new one completely clear */}
              {selectedSlotItem && (
                <div className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 p-3 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        Estás viendo/editando una caja existente.
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Si en lugar de modificarla, lo que quieres es **añadir o generar una NUEVA caja** en este mismo hueco (apilándola arriba), pulsa el siguiente botón:
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setItemForm({
                        name: "",
                        type: "caja",
                        color: "Indigo",
                        description: "",
                        tagsInput: "",
                        contentsInput: "",
                      });
                      if (activeSlot) {
                        setActiveSlot({ ...activeSlot, itemId: undefined });
                      }
                    }}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle size={13} />
                    <span>➕ GENERAR / APILAR NUEVA CAJA AQUÍ</span>
                  </button>
                </div>
              )}

              {/* Stacking Reset Option (fallback clear visual box state helper) */}
              {!selectedSlotItem && slotItems.length > 0 && (
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={12} /> Listo para apilar una nueva caja
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setItemForm({
                        name: "",
                        type: "caja",
                        color: "Indigo",
                        description: "",
                        tagsInput: "",
                        contentsInput: "",
                      });
                      if (activeSlot) {
                        setActiveSlot({ ...activeSlot, itemId: undefined });
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Limpiar campos
                  </button>
                </div>
              )}

              {/* Accordion 2: Formulario (Add/Edit Form) */}
              <div className={`border rounded-xl overflow-hidden shadow-xs transition-colors duration-200 ${
                selectedSlotItem
                  ? "border-amber-500/30"
                  : "border-emerald-500/30"
              }`}>
                <button
                  type="button"
                  onClick={() => setIsFormExpanded(!isFormExpanded)}
                  className={`w-full p-2.5 flex justify-between items-center text-left cursor-pointer transition-colors duration-200 ${
                    selectedSlotItem
                      ? "bg-amber-500/5 hover:bg-amber-500/10"
                      : "bg-emerald-500/5 hover:bg-emerald-500/10"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase flex items-center gap-1.5">
                    {selectedSlotItem ? (
                      <>
                        <Edit3 size={12} className="text-amber-500 animate-pulse" />
                        <span className="text-amber-800 dark:text-amber-400">✏️ EDITANDO: {selectedSlotItem.name}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={12} className="text-emerald-500" />
                        <span className="text-emerald-800 dark:text-emerald-400">➕ CREANDO NUEVA CAJA O ARTÍCULO</span>
                      </>
                    )}
                  </span>
                  {isFormExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {isFormExpanded && (
                  <form onSubmit={handleSaveItem} className="p-3 bg-card space-y-2.5 border-t border-border/50">
                    {/* Visual Mode Ribbon inside form */}
                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider text-center ${
                      selectedSlotItem
                        ? "bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {selectedSlotItem
                        ? "Modo: Editando detalles de la caja seleccionada"
                        : "Modo: Creando nueva caja para apilar en el hueco"
                      }
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Nombre de Caja u Objeto</label>
                        <input
                          type="text"
                          placeholder="Ej. Caja de Herramientas, Ropa de Invierno"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                          required
                          className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden focus:ring-1 focus:ring-primary font-bold"
                        />
                      </div>

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
                          <span>Caja</span>
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
                          <span>Objeto</span>
                        </button>
                      </div>

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

                      <div className="space-y-0.5">
                        <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Breve Descripción</label>
                        <input
                          type="text"
                          placeholder="Ej. Herramientas pesadas de bricolaje"
                          value={itemForm.description}
                          onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                          className="w-full h-7 px-2 bg-muted/60 text-xs rounded-md border border-border focus:outline-hidden"
                        />
                      </div>

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
                            className="w-full h-7 px-2 bg-card text-xs rounded-md border border-border focus:outline-hidden text-[11px]"
                          />
                        </div>
                      )}

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
                      className={`w-full h-8 text-xs font-black rounded-md cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5 ${
                        selectedSlotItem
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {selectedSlotItem ? (
                        <>
                          <Check size={13} />
                          <span>Guardar Cambios de Caja</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle size={13} />
                          <span>¡CREAR Y APILAR NUEVA CAJA!</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-4 text-center py-8 text-muted-foreground shadow-xs">
              <HelpCircle size={28} className="mx-auto mb-2 text-muted-foreground/60" />
              <h4 className="text-xs font-bold text-foreground mb-1">
                ¿Cómo organizar tus cosas?
              </h4>
              <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                Selecciona cualquier hueco vacío o caja en el plano de la estantería para colocar, ver, editar, reordenar la pila, o arrastrar objetos con Drag & Drop de forma ultra compacta.
              </p>
            </div>
          )}

          {/* Collapsible Stats Summary Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="w-full p-3.5 flex justify-between items-center text-left font-bold text-xs cursor-pointer transition bg-muted/10 hover:bg-muted/30"
            >
              <span className="text-foreground">Resumen de tu Trastero</span>
              {isStatsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isStatsExpanded && (
              <div className="p-3.5 bg-card border-t border-border/50 grid grid-cols-2 gap-2 text-center">
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
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
