"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Heart,
  Grid,
  List,
  Play,
  ArrowUpDown,
  Flame,
  Folder,
  Package,
  Baby,
  Scale,
  PiggyBank,
  LayoutGrid,
  Layers,
  Trash2,
} from "lucide-react";

interface SerializedTool {
  id: string;
  name: string;
  description: string;
  category: string;
  href: string;
}

interface DashboardStoreProps {
  tools: SerializedTool[];
}

// Icon mapper to circumvent Next.js Server-to-Client serialization issues
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  "baby-leave-planner": Baby,
  "baby-weight-tracker": Scale,
  "finance-tracker": PiggyBank,
};

function getToolIcon(id: string) {
  return ICON_MAP[id] || Package;
}

export default function DashboardStore({ tools }: DashboardStoreProps) {
  const router = useRouter();

  // Client-side states — always start with stable defaults to avoid hydration mismatch,
  // then sync from localStorage after mount.
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("toolhub_favorites");
      if (storedFavs) setFavorites(JSON.parse(storedFavs));
    } catch (e) {
      console.error("Error reading favorites from localStorage:", e);
    }
    try {
      const storedPlays = localStorage.getItem("toolhub_plays");
      if (storedPlays) setPlayCounts(JSON.parse(storedPlays));
    } catch (e) {
      console.error("Error reading play counts from localStorage:", e);
    }
    try {
      const storedViewMode = localStorage.getItem("toolhub_view_mode");
      if (storedViewMode === "grid" || storedViewMode === "list") {
        setViewMode(storedViewMode);
      }
    } catch (e) {
      console.error("Error reading view mode from localStorage:", e);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "plays" | "category">("name");

  // Touch Swipe Gesture State
  const [touchStartPos, setTouchStartPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{ id: string; x: number } | null>(null);

  // Sync state modifications with localStorage
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolhub_favorites", JSON.stringify(updated));
    }
  };

  // Record tool execution stats before navigating
  const registerLaunch = (id: string, href?: string) => {
    const newCounts = { ...playCounts, [id]: (playCounts[id] || 0) + 1 };
    setPlayCounts(newCounts);

    if (typeof window !== "undefined") {
      localStorage.setItem("toolhub_plays", JSON.stringify(newCounts));
    }

    if (href) {
      router.push(href);
    }
  };

  const handleClearStats = () => {
    if (confirm("¿Estás seguro de que deseas restablecer tus estadísticas y favoritos?")) {
      setFavorites([]);
      setPlayCounts({});
      if (typeof window !== "undefined") {
        localStorage.removeItem("toolhub_favorites");
        localStorage.removeItem("toolhub_plays");
      }
    }
  };

  // TOUCH SWIPE HANDLERS FOR MOBILE LIST/GRID ITEMS
  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartPos({ id, x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (id: string, e: React.TouchEvent) => {
    if (!touchStartPos || touchStartPos.id !== id) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartPos.x;
    const diffY = touch.clientY - touchStartPos.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeOffset({ id, x: diffX });
    }
  };

  const handleTouchEnd = (id: string, toolHref: string) => {
    if (swipeOffset && swipeOffset.id === id) {
      if (swipeOffset.x > 70) {
        toggleFavorite(id);
      } else if (swipeOffset.x < -70) {
        registerLaunch(id, toolHref);
      }
    }
    setTouchStartPos(null);
    setSwipeOffset(null);
  };

  // Extract all available categories dynamically from tools
  const categories = useMemo(() => {
    const list = new Set<string>();
    tools.forEach((t) => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [tools]);

  // Dynamic Filtering & Sorting
  const filteredTools = useMemo(() => {
    let result = [...tools];

    if (selectedCategory === "FAVORITES") {
      result = result.filter((t) => favorites.includes(t.id));
    } else if (selectedCategory !== "ALL") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "plays") {
        const playsA = playCounts[a.id] || 0;
        const playsB = playCounts[b.id] || 0;
        return playsB - playsA;
      } else if (sortBy === "category") {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

    return result;
  }, [tools, selectedCategory, searchQuery, sortBy, favorites, playCounts]);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolhub_view_mode", mode);
    }
  };

  return (
    <div className="container mx-auto px-3 py-3 max-w-7xl">

      {/* -------------------- TOP BAR: MOBILE CATEGORY SLIDER & SEARCH -------------------- */}
      <div className="lg:hidden mb-3 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            Todos ({tools.length})
          </button>

          <button
            onClick={() => setSelectedCategory("FAVORITES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              selectedCategory === "FAVORITES"
                ? "bg-pink-600 text-white shadow-xs"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <Heart size={12} className={favorites.length > 0 ? "fill-current text-pink-500" : ""} />
            Favoritos ({favorites.length})
          </button>

          {categories.map((cat) => {
            const count = tools.filter((t) => t.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Buscar herramienta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* -------------------- DESKTOP SIDEBAR -------------------- */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar herramienta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/80 bg-card hover:bg-card/80 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-xs font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground hover:text-foreground px-1"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Categories Navigation */}
          <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/60 overflow-hidden shadow-xs">
            <div className="px-3.5 py-2.5 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers size={12} className="text-primary" /> Categorías
              </span>
            </div>

            <nav className="p-1.5 space-y-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid size={13} /> Todos los Módulos
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  selectedCategory === "ALL" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tools.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("FAVORITES")}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "FAVORITES"
                    ? "bg-pink-600 text-white shadow-xs"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Heart size={13} className={favorites.length > 0 ? "fill-current" : ""} /> Favoritos
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  selectedCategory === "FAVORITES" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {favorites.length}
                </span>
              </button>

              <div className="h-px bg-border/50 my-1" />

              {categories.map((cat) => {
                const count = tools.filter((t) => t.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Folder size={13} className={isSelected ? "text-primary" : "text-muted-foreground"} /> {cat}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Clear stats link */}
          <div className="pt-1">
            <button
              onClick={handleClearStats}
              className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 rounded-xl font-bold transition-all text-[10px] flex items-center justify-center gap-1 border border-rose-500/20"
            >
              <Trash2 size={11} /> Restablecer datos locales
            </button>
          </div>

        </div>

        {/* -------------------- RIGHT COLUMN: ULTRA COMPACT TOOLS LIST / GRID -------------------- */}
        <div className="lg:col-span-9 space-y-3">

          {/* CONTROL BAR */}
          <div className="flex items-center justify-between gap-2 bg-card/25 backdrop-blur-xs px-3 py-2 rounded-xl border border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {selectedCategory === "ALL"
                  ? `Módulos (${filteredTools.length})`
                  : selectedCategory === "FAVORITES"
                  ? `Favoritos (${filteredTools.length})`
                  : `${selectedCategory} (${filteredTools.length})`}
              </span>
            </div>

            {/* Sorting & Layout Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-card border border-border/80 px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground">
                <ArrowUpDown size={11} className="text-primary" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "plays" | "category")}
                  className="bg-transparent border-0 outline-hidden focus:ring-0 text-foreground text-[10px] cursor-pointer font-bold"
                >
                  <option value="name" className="bg-card text-foreground">Nombre (A-Z)</option>
                  <option value="plays" className="bg-card text-foreground">Más Usados</option>
                  <option value="category" className="bg-card text-foreground">Por Categoría</option>
                </select>
              </div>

              <div className="flex items-center gap-0.5 bg-card/80 p-0.5 border border-border/60 rounded-lg">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  title="Cuadrícula compacta"
                  className={`p-1 rounded-md transition-all ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid size={12} />
                </button>
                <button
                  onClick={() => handleViewModeChange("list")}
                  title="Lista súper compacta"
                  className={`p-1 rounded-md transition-all ${
                    viewMode === "list" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC RESULTS: ULTRA COMPACT GRID OR LIST WITH SWIPE SUPPORT */}
          {filteredTools.length > 0 ? (
            viewMode === "grid" ? (

              /* ULTRA COMPACT GRID MODE */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredTools.map((tool) => {
                  const ToolIcon = getToolIcon(tool.id);
                  const isFav = favorites.includes(tool.id);
                  const count = playCounts[tool.id] || 0;
                  const currentSwipeX = swipeOffset && swipeOffset.id === tool.id ? swipeOffset.x : 0;

                  return (
                    <div
                      key={tool.id}
                      onTouchStart={(e) => handleTouchStart(tool.id, e)}
                      onTouchMove={(e) => handleTouchMove(tool.id, e)}
                      onTouchEnd={() => handleTouchEnd(tool.id, tool.href)}
                      style={{
                        transform: currentSwipeX ? `translateX(${currentSwipeX}px)` : undefined,
                        transition: currentSwipeX ? "none" : "transform 0.2s ease",
                      }}
                      className="group relative bg-card hover:bg-muted/40 rounded-xl border border-border/80 p-2.5 hover:border-primary/40 transition-all flex items-center justify-between gap-2 overflow-hidden shadow-2xs select-none touch-pan-y"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ToolIcon size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {tool.name}
                          </h4>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded-md inline-block mt-0.5">
                            {tool.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {count > 0 && (
                          <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded-md flex items-center gap-0.5">
                            <Flame size={9} /> {count}
                          </span>
                        )}
                        <button
                          onClick={(e) => toggleFavorite(tool.id, e)}
                          className={`p-1 rounded-md border transition-all ${
                            isFav
                              ? "bg-pink-600/10 border-pink-500 text-pink-500"
                              : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Heart size={11} className={isFav ? "fill-current" : ""} />
                        </button>
                        <Link
                          href={tool.href}
                          onClick={() => registerLaunch(tool.id)}
                          className="p-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg shadow-2xs transition-all"
                          title="Lanzar"
                        >
                          <Play size={10} fill="currentColor" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (

              /* ULTRA COMPACT LIST MODE WITH TOUCH SWIPE FEEDBACK */
              <div className="space-y-1 overflow-hidden">
                {filteredTools.map((tool) => {
                  const ToolIcon = getToolIcon(tool.id);
                  const isFav = favorites.includes(tool.id);
                  const count = playCounts[tool.id] || 0;
                  const currentSwipeX = swipeOffset && swipeOffset.id === tool.id ? swipeOffset.x : 0;

                  return (
                    <div key={tool.id} className="relative rounded-xl overflow-hidden bg-muted/20">

                      {/* Swipe Underlay Background Actions (Mobile) */}
                      <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-extrabold pointer-events-none">
                        <span className="flex items-center gap-1 text-pink-500">
                          <Heart size={14} className="fill-current" /> Favorito
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          Abrir <Play size={12} fill="currentColor" />
                        </span>
                      </div>

                      {/* Foreground Item with Touch Event Handlers */}
                      <div
                        onTouchStart={(e) => handleTouchStart(tool.id, e)}
                        onTouchMove={(e) => handleTouchMove(tool.id, e)}
                        onTouchEnd={() => handleTouchEnd(tool.id, tool.href)}
                        style={{
                          transform: currentSwipeX ? `translateX(${currentSwipeX}px)` : undefined,
                          transition: currentSwipeX ? "none" : "transform 0.2s ease",
                        }}
                        className="group bg-card hover:bg-muted/40 rounded-xl border border-border/60 px-2.5 py-1.5 hover:border-primary/30 transition-all flex items-center justify-between gap-2 relative z-10 select-none touch-pan-y"
                      >
                        {/* Left: Icon & Name */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 bg-primary/10 text-primary rounded-md flex items-center justify-center shrink-0">
                            <ToolIcon size={13} />
                          </div>

                          <div className="min-w-0 flex items-center gap-2">
                            <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                              {tool.name}
                            </h4>
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded-md shrink-0">
                              {tool.category}
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {count > 0 && (
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded-md flex items-center gap-0.5">
                              <Flame size={8} /> {count}
                            </span>
                          )}

                          <button
                            onClick={(e) => toggleFavorite(tool.id, e)}
                            className={`p-1 rounded-md border transition-all ${
                              isFav
                                ? "bg-pink-600/15 border-pink-500 text-pink-500"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <Heart size={10} className={isFav ? "fill-current" : ""} />
                          </button>

                          <Link
                            href={tool.href}
                            onClick={() => registerLaunch(tool.id)}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-[10px] rounded-lg shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <Play size={8} fill="currentColor" /> Abrir
                          </Link>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* EMPTY FALLBACK */
            <div className="flex flex-col items-center justify-center text-center p-6 bg-card/25 rounded-2xl border border-dashed border-border/80">
              <Package className="w-8 h-8 text-muted-foreground/60 mb-2 animate-bounce" />
              <h4 className="font-extrabold text-foreground mb-1 text-xs">
                No se encontraron herramientas
              </h4>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-lg font-bold text-xs"
              >
                Restablecer Filtros
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
