"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Heart,
  Grid,
  List,
  Play,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  Flame,
  Folder,
  Package,
  Baby,
  Scale,
  PiggyBank,
  Clock,
  LayoutGrid,
  Layers,
  Compass,
  Trash2,
} from "lucide-react";

// Serialization-friendly Tool type
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
  // Client-side states (lazy initialization)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedFavs = localStorage.getItem("toolhub_favorites");
        return storedFavs ? JSON.parse(storedFavs) : [];
      } catch (e) {
        console.error("Error reading favorites from localStorage:", e);
      }
    }
    return [];
  });

  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedPlays = localStorage.getItem("toolhub_plays");
        return storedPlays ? JSON.parse(storedPlays) : {};
      } catch (e) {
        console.error("Error reading play counts from localStorage:", e);
      }
    }
    return {};
  });

  const [lastOpened, setLastOpened] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedLastOpened = localStorage.getItem("toolhub_last_opened");
        return storedLastOpened ? JSON.parse(storedLastOpened) : {};
      } catch (e) {
        console.error("Error reading last opened dates from localStorage:", e);
      }
    }
    return {};
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">((() => {
    if (typeof window !== "undefined") {
      try {
        const storedViewMode = localStorage.getItem("toolhub_view_mode");
        if (storedViewMode === "grid" || storedViewMode === "list") {
          return storedViewMode;
        }
      } catch (e) {
        console.error("Error reading view mode from localStorage:", e);
      }
    }
    return "grid";
  })());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL"); // "ALL", "FAVORITES", or specific categories
  const [sortBy, setSortBy] = useState<"name" | "plays" | "category">("name");

  // Sync state modifications with localStorage
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolhub_favorites", JSON.stringify(updated));
    }
  };

  // Record tool execution stats before navigating
  const registerLaunch = (id: string) => {
    const newCounts = { ...playCounts, [id]: (playCounts[id] || 0) + 1 };
    setPlayCounts(newCounts);

    const newLastOpened = { ...lastOpened, [id]: new Date().toISOString() };
    setLastOpened(newLastOpened);

    if (typeof window !== "undefined") {
      localStorage.setItem("toolhub_plays", JSON.stringify(newCounts));
      localStorage.setItem("toolhub_last_opened", JSON.stringify(newLastOpened));
    }
  };

  const handleClearStats = () => {
    if (confirm("¿Estás seguro de que deseas restablecer tus estadísticas y favoritos?")) {
      setFavorites([]);
      setPlayCounts({});
      setLastOpened({});
      if (typeof window !== "undefined") {
        localStorage.removeItem("toolhub_favorites");
        localStorage.removeItem("toolhub_plays");
        localStorage.removeItem("toolhub_last_opened");
      }
    }
  };

  // Extract all available categories dynamically from tools
  const categories = useMemo(() => {
    const list = new Set<string>();
    tools.forEach((t) => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [tools]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalTools = tools.length;
    const favoriteCount = favorites.length;
    const totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0);
    const mostPlayedId = Object.entries(playCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const mostPlayedName = tools.find((t) => t.id === mostPlayedId)?.name || "Ninguno";

    return {
      totalTools,
      favoriteCount,
      totalPlays,
      mostPlayedName,
    };
  }, [tools, favorites, playCounts]);

  // Dynamic Filtering & Sorting
  const filteredTools = useMemo(() => {
    let result = [...tools];

    // 1. Category Filter
    if (selectedCategory === "FAVORITES") {
      result = result.filter((t) => favorites.includes(t.id));
    } else if (selectedCategory !== "ALL") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "plays") {
        const playsA = playCounts[a.id] || 0;
        const playsB = playCounts[b.id] || 0;
        return playsB - playsA; // Descending
      } else if (sortBy === "category") {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

    return result;
  }, [tools, selectedCategory, searchQuery, sortBy, favorites, playCounts]);

  // Featured Tool: Pick the most played, or a favorite, or the first tool
  const featuredTool = useMemo(() => {
    if (tools.length === 0) return null;

    // Pick the most played tool as featured, otherwise the first favorite, or fallback to the first tool
    const sortedByPlays = [...tools].sort((a, b) => {
      const playsA = playCounts[a.id] || 0;
      const playsB = playCounts[b.id] || 0;
      return playsB - playsA;
    });

    if (playCounts[sortedByPlays[0]?.id] > 0) {
      return sortedByPlays[0];
    }

    if (favorites.length > 0) {
      const firstFav = tools.find((t) => t.id === favorites[0]);
      if (firstFav) return firstFav;
    }

    return tools[0];
  }, [tools, playCounts, favorites]);

  // Change view mode and save
  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("toolhub_view_mode", mode);
    }
  };

  // Format date helper
  const formatLastOpened = (isoString?: string) => {
    if (!isoString) return "Nunca";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Hace poco";
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">

      {/* -------------------- MOBILE ONLY CATEGORY SLIDER -------------------- */}
      {/* Horizontally scrolling buttons that prevent vertical scroll fatigue on mobile */}
      <div className="lg:hidden mb-4 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap">
          {/* ALL button */}
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            Todos ({tools.length})
          </button>

          {/* FAVORITES button */}
          <button
            onClick={() => setSelectedCategory("FAVORITES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategory === "FAVORITES"
                ? "bg-pink-600 text-white shadow-xs"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <Heart size={12} className={favorites.length > 0 ? "fill-current text-pink-500" : ""} />
            Favoritos ({favorites.length})
          </button>

          {/* DYNAMIC CATEGORIES */}
          {categories.map((cat) => {
            const count = tools.filter((t) => t.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
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

        {/* Compact Search on Mobile */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar herramienta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* -------------------- DESKTOP SIDEBAR (hidden on mobile) -------------------- */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">

          {/* Dashboard Mini-Brand */}
          <div className="bg-card/40 backdrop-blur-md rounded-2xl p-5 border border-border/60 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Librería de Módulos
              </span>
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-1.5">
              <Compass className="text-primary w-5 h-5" /> Explorador
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Organiza, marca como favorito y accede rápidamente a tus herramientas.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Buscar herramienta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-card/80 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm font-semibold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground px-1"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Categories Navigation */}
          <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/60 overflow-hidden shadow-xs">
            <div className="px-4.5 py-3 border-b border-border/50 bg-muted/20 flex justify-between items-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers size={12} className="text-primary" /> Categorías / Filtros
              </span>
            </div>

            <nav className="p-2 space-y-1">
              {/* ALL */}
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "ALL"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid size={14} /> Todos los Módulos
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  selectedCategory === "ALL" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tools.length}
                </span>
              </button>

              {/* FAVORITES */}
              <button
                onClick={() => setSelectedCategory("FAVORITES")}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "FAVORITES"
                    ? "bg-pink-600 text-white shadow-xs"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Heart size={14} className={favorites.length > 0 ? "fill-current" : ""} /> Favoritos ❤️
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  selectedCategory === "FAVORITES" ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {favorites.length}
                </span>
              </button>

              <div className="h-px bg-border/50 my-2" />

              {/* DYNAMIC CATEGORIES */}
              {categories.map((cat) => {
                const count = tools.filter((t) => t.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Folder size={14} className={isSelected ? "text-primary" : "text-muted-foreground"} /> {cat}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-card/20 backdrop-blur-xs rounded-2xl p-4.5 border border-border/40 text-xs space-y-3">
            <h4 className="font-extrabold text-muted-foreground uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-500" /> Estadísticas de Uso
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card/40 p-2.5 rounded-xl border border-border/30">
                <p className="text-[10px] text-muted-foreground font-medium">Lanzamientos</p>
                <p className="text-base font-black text-foreground mt-0.5">
                  {stats.totalPlays} <span className="text-[10px] font-normal text-muted-foreground">veces</span>
                </p>
              </div>
              <div className="bg-card/40 p-2.5 rounded-xl border border-border/30">
                <p className="text-[10px] text-muted-foreground font-medium">Favoritas</p>
                <p className="text-base font-black text-foreground mt-0.5">
                  {stats.favoriteCount} <span className="text-[10px] font-normal text-muted-foreground">items</span>
                </p>
              </div>
            </div>

            <div className="bg-card/40 p-3 rounded-xl border border-border/30 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Más utilizada:</span>
                <span className="font-bold text-primary max-w-[120px] truncate" title={stats.mostPlayedName}>
                  {stats.mostPlayedName}
                </span>
              </div>
            </div>

            <button
              onClick={handleClearStats}
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 rounded-xl font-bold transition-all text-[11px] flex items-center justify-center gap-1.5 border border-rose-500/20"
            >
              <Trash2 size={12} /> Restablecer datos locales
            </button>
          </div>

        </div>

        {/* -------------------- RIGHT COLUMN: Tools List / Grid -------------------- */}
        <div className="lg:col-span-9 space-y-6">

          {/* HERO BANNER: Desktop-Only Featured Tool (hidden completely on mobile to prevent layout pushes) */}
          {featuredTool && selectedCategory === "ALL" && !searchQuery && (
            <div className="hidden lg:block relative group rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-indigo-950/40 via-card to-background shadow-lg">
              {/* Glassmorphic background glow */}
              <div className="absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="p-6 md:p-8 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                {/* Left side: content */}
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles size={11} className="animate-pulse" /> RECOMENDADO / DESTACADO
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {featuredTool.name}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                      {featuredTool.description}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/15 border border-primary/10 px-3 py-1 rounded-full">
                      {featuredTool.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> Último acceso: {formatLastOpened(lastOpened[featuredTool.id])}
                    </span>
                    {playCounts[featuredTool.id] > 0 && (
                      <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Flame size={12} /> {playCounts[featuredTool.id]} accesos
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: huge icon & action button */}
                <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-8">
                  {/* Decorative Icon Glow */}
                  <div className="w-18 h-18 bg-primary/15 text-primary rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-all duration-300">
                    {React.createElement(getToolIcon(featuredTool.id), { size: 36 })}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto md:w-full justify-center">
                    {/* Launch Play Button */}
                    <Link
                      href={featuredTool.href}
                      onClick={() => registerLaunch(featuredTool.id)}
                      className="flex-1 sm:flex-initial md:w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-sm rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Play size={16} fill="currentColor" /> EJECUTAR MÓDULO
                    </Link>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(featuredTool.id, e)}
                      title={favorites.includes(featuredTool.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                      className={`p-3.5 rounded-xl border transition-all ${
                        favorites.includes(featuredTool.id)
                          ? "bg-pink-600/10 border-pink-500 text-pink-500 hover:bg-pink-600/20"
                          : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Heart size={18} className={favorites.includes(featuredTool.id) ? "fill-current" : ""} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STORE WORKSPACE HEADER & CONTROL BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/25 backdrop-blur-xs p-4 rounded-2xl border border-border/40">

            {/* Title / Info */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                {selectedCategory === "ALL"
                  ? "Todos los Módulos"
                  : selectedCategory === "FAVORITES"
                  ? "Mis Favoritos"
                  : `Módulos en ${selectedCategory}`}
                {searchQuery && <span className="text-xs text-muted-foreground font-normal ml-2">filtrado por &quot;{searchQuery}&quot;</span>}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Mostrando {filteredTools.length} de {tools.length} herramientas disponibles.
              </p>
            </div>

            {/* Sorting & Views Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-card border border-border/80 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-muted-foreground">
                <ArrowUpDown size={12} className="text-primary" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "plays" | "category")}
                  className="bg-transparent border-0 outline-hidden focus:ring-0 text-foreground text-[11px] cursor-pointer font-bold"
                >
                  <option value="name" className="bg-card text-foreground">Nombre (A-Z)</option>
                  <option value="plays" className="bg-card text-foreground">Más Usados</option>
                  <option value="category" className="bg-card text-foreground">Por Categoría</option>
                </select>
              </div>

              <div className="h-6 w-px bg-border/60 hidden sm:block" />

              {/* View Layout Toggles */}
              <div className="flex items-center gap-1 bg-card/80 p-1 border border-border/60 rounded-xl">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  title="Cuadrícula compacta"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid size={13} />
                </button>
                <button
                  onClick={() => handleViewModeChange("list")}
                  title="Lista súper compacta"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List size={13} />
                </button>
              </div>

            </div>

          </div>

          {/* DYNAMIC RESULTS: GRID OR LIST MODE */}
          {filteredTools.length > 0 ? (
            viewMode === "grid" ? (

              /* GRID MODE: COMPACT & SCALABLE CARDS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool) => {
                  const ToolIcon = getToolIcon(tool.id);
                  const isFav = favorites.includes(tool.id);
                  const count = playCounts[tool.id] || 0;

                  return (
                    <div
                      key={tool.id}
                      className="group relative bg-card hover:bg-muted/30 rounded-2xl border border-border/80 p-4 hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Decorative small colored background shape */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

                      <div>
                        {/* Top layout: Icon, Fav, Execution info */}
                        <div className="flex justify-between items-start mb-3">
                          {/* Colored Icon box */}
                          <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-200">
                            <ToolIcon size={18} />
                          </div>

                          {/* Top actions: Visits & Fav Button */}
                          <div className="flex items-center gap-1.5 z-10">
                            {count > 0 && (
                              <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <Flame size={9} /> {count}
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleFavorite(tool.id, e)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isFav
                                  ? "bg-pink-600/10 border-pink-500 text-pink-500 hover:bg-pink-600/20"
                                  : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Heart size={12} className={isFav ? "fill-current" : ""} />
                            </button>
                          </div>
                        </div>

                        {/* Text info */}
                        <h4 className="text-xs sm:text-sm font-extrabold text-foreground mb-1 group-hover:text-primary transition-colors tracking-tight">
                          {tool.name}
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2 mb-3" title={tool.description}>
                          {tool.description}
                        </p>
                      </div>

                      {/* Footer Info & Play Action */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {tool.category}
                        </span>

                        <Link
                          href={tool.href}
                          onClick={() => registerLaunch(tool.id)}
                          className="text-[11px] font-black text-primary group-hover:text-primary-hover transition-colors flex items-center gap-1"
                        >
                          Lanzar <Play size={10} fill="currentColor" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Add Tool Placeholder Card inside grid */}
                <div className="rounded-2xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-center p-4 bg-card/20 hover:bg-card/40 transition-all group">
                  <span className="text-xs font-bold text-foreground mb-1">
                    ¿Quieres añadir más?
                  </span>
                  <p className="text-[10px] text-muted-foreground max-w-[180px] leading-normal">
                    Añade un módulo en <code className="text-primary font-mono text-[10px]">src/modules/</code> y aparecerá aquí automáticamente.
                  </p>
                </div>
              </div>
            ) : (

              /* LIST MODE: ULTRA-COMPACT ROWS FOR EXTREME SCALABILITY */
              <div className="space-y-1.5">
                {filteredTools.map((tool) => {
                  const ToolIcon = getToolIcon(tool.id);
                  const isFav = favorites.includes(tool.id);
                  const count = playCounts[tool.id] || 0;

                  return (
                    <div
                      key={tool.id}
                      className="group bg-card hover:bg-muted/35 rounded-xl border border-border/60 px-3 py-1.5 hover:border-primary/30 transition-all flex items-center justify-between gap-3"
                    >

                      {/* Left: Icon, Name & Category */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                          <ToolIcon size={14} />
                        </div>

                        <div className="min-w-0 flex-1 md:flex md:items-center md:gap-4">
                          <div className="min-w-[140px] shrink-0">
                            <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                              {tool.name}
                            </h4>
                          </div>

                          <div className="hidden md:block flex-1 min-w-0">
                            <p className="text-muted-foreground text-[10px] truncate">
                              {tool.description}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {tool.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stats & Actions */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Play Counts */}
                        {count > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Flame size={9} /> {count} <span className="hidden sm:inline font-normal text-muted-foreground text-[8px]">accesos</span>
                          </span>
                        ) : (
                          <span className="hidden sm:inline text-[9px] text-muted-foreground">No usado</span>
                        )}

                        {/* Last Opened */}
                        <span className="hidden lg:inline text-[9px] text-muted-foreground">
                          {formatLastOpened(lastOpened[tool.id])}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Heart toggle */}
                          <button
                            onClick={(e) => toggleFavorite(tool.id, e)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isFav
                                ? "bg-pink-600/15 border-pink-500 text-pink-500"
                                : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <Heart size={11} className={isFav ? "fill-current" : ""} />
                          </button>

                          {/* Open link */}
                          <Link
                            href={tool.href}
                            onClick={() => registerLaunch(tool.id)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-[10px] rounded-lg shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <Play size={8} fill="currentColor" /> Lanzar
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
            <div className="flex flex-col items-center justify-center text-center p-8 bg-card/25 rounded-3xl border-2 border-dashed border-border/80">
              <Package className="w-10 h-10 text-muted-foreground/60 mb-3 animate-bounce" />
              <h4 className="font-extrabold text-foreground mb-1 text-xs">
                No se encontraron herramientas
              </h4>
              <p className="text-[11px] text-muted-foreground max-w-sm leading-normal mb-3">
                No hay herramientas que coincidan con los criterios o filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-md"
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
