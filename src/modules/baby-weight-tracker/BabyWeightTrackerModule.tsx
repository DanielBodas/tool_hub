"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Scale,
  Calendar,
  Clock,
  PlusCircle,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  X
} from "lucide-react";

interface WeightRecord {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  weight: number; // in kg
  margin: number; // in kg
  scale: string; // Scale name
  clothes: string; // Vestimenta description
  notes: string;
  updatedAt: string;
}

interface GroupedDay {
  date: string;
  displayDate: string;
  records: WeightRecord[];
  open: number;
  close: number;
  high: number;
  low: number;
  average: number;
}

const CLOTHING_PRESETS: { [key: string]: { label: string; margin: number } } = {
  "Sin ropa": { label: "Sin ropa (Desnudo)", margin: 0.0 },
  "Pañal limpio": { label: "Pañal limpio (+25g)", margin: 0.025 },
  "Ropa ligera": { label: "Ropa ligera (+100g)", margin: 0.1 },
  "Ropa de abrigo": { label: "Ropa de abrigo (+250g)", margin: 0.25 },
  "Personalizado": { label: "Margen personalizado", margin: 0.05 }
};

const SCALE_SUGGESTIONS = [
  "Báscula Casa (Bebé)",
  "Báscula Farmacia",
  "Consulta Pediatra",
  "Báscula Cocina",
  "Otra"
];

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getCurrentTimeString = () => {
  const today = new Date();
  const hh = String(today.getHours()).padStart(2, "0");
  const min = String(today.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
};

export function BabyWeightTrackerModule() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [weight, setWeight] = useState<string>("");
  const [margin, setMargin] = useState<string>("0.05");
  const [scale, setScale] = useState<string>("Báscula Casa (Bebé)");
  const [clothes, setClothes] = useState<string>("Pañal limpio");
  const [notes, setNotes] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"chart" | "list">("chart");
  const [selectedDay, setSelectedDay] = useState<GroupedDay | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Tooltip interactive state
  const [hoveredDay, setHoveredDay] = useState<GroupedDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Refresh handler (used for retries and user-triggered actions)
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetch("/api/baby-weight-tracker")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo obtener la información de peso");
        }
        return res.json();
      })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : "Error al conectar con la base de datos";
        setError(errMsg);
        setLoading(false);
      });
  };

  // Initial load via asynchronous mount
  useEffect(() => {
    fetch("/api/baby-weight-tracker")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo obtener la información de peso");
        }
        return res.json();
      })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : "Error al conectar con la base de datos";
        setError(errMsg);
        setLoading(false);
      });
  }, []);

  // Preset behavior: adjust margin when clothes preset is chosen
  const handleClothesChange = (val: string) => {
    setClothes(val);
    if (CLOTHING_PRESETS[val] && val !== "Personalizado") {
      setMargin(CLOTHING_PRESETS[val].margin.toString());
    }
  };

  // Preset behavior: adjust preset when margin is typed manually
  const handleMarginChange = (val: string) => {
    setMargin(val);
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return;

    let matchedPreset = "Personalizado";
    for (const [key, preset] of Object.entries(CLOTHING_PRESETS)) {
      if (preset.margin === parsed && key !== "Personalizado") {
        matchedPreset = key;
        break;
      }
    }
    setClothes(matchedPreset);
  };

  const handleEdit = (record: WeightRecord) => {
    setFormId(record._id);
    setDate(record.date);
    setTime(record.time);
    setWeight(record.weight.toString());
    setMargin(record.margin.toString());
    setScale(record.scale);
    setClothes(record.clothes);
    setNotes(record.notes);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormId(null);
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setWeight("");
    setMargin("0.05");
    setScale("Báscula Casa (Bebé)");
    setClothes("Pañal limpio");
    setNotes("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) {
      alert("Por favor, introduce un peso válido");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/baby-weight-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId,
          date,
          time,
          weight: parseFloat(weight),
          margin: parseFloat(margin) || 0,
          scale,
          clothes,
          notes
        })
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el registro");
      }

      handleRefresh();
      setShowAddModal(false);
      resetForm();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error al guardar el peso";
      alert(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/baby-weight-tracker?id=${deleteId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar el registro");
      }

      handleRefresh();
      setDeleteId(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error al eliminar el registro";
      alert(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  // Grouping & Candlestick processing
  const groupedDays = useMemo<GroupedDay[]>(() => {
    if (records.length === 0) return [];

    const map: { [date: string]: WeightRecord[] } = {};
    records.forEach((r) => {
      if (!map[r.date]) {
        map[r.date] = [];
      }
      map[r.date].push(r);
    });

    const days: GroupedDay[] = Object.keys(map).map((d) => {
      const dayRecords = map[d].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

      const open = dayRecords[0].weight;
      const close = dayRecords[dayRecords.length - 1].weight;

      const low = Math.min(...dayRecords.map((r) => r.weight - r.margin));
      const high = Math.max(...dayRecords.map((r) => r.weight + r.margin));

      const sum = dayRecords.reduce((acc, r) => acc + r.weight, 0);
      const average = sum / dayRecords.length;

      const dateParts = d.split("-");
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const displayDate = dateParts.length === 3
        ? `${parseInt(dateParts[2])} ${months[parseInt(dateParts[1]) - 1]}`
        : d;

      return {
        date: d,
        displayDate,
        records: dayRecords,
        open,
        close,
        high,
        low,
        average
      };
    });

    return days.sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  // General Metrics
  const metrics = useMemo(() => {
    if (records.length === 0) {
      return {
        lastWeight: 0,
        lastMargin: 0,
        totalGain: 0,
        average: 0,
        count: 0
      };
    }

    const sorted = [...records].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const sum = records.reduce((acc, r) => acc + r.weight, 0);
    const average = sum / records.length;

    return {
      lastWeight: last.weight,
      lastMargin: last.margin,
      totalGain: last.weight - first.weight,
      average,
      count: records.length
    };
  }, [records]);

  // Dynamic Chart Parameters
  const chartDimensions = useMemo(() => {
    const minWidth = 320;
    const baseWidthPerCandle = 75;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const computedWidth = paddingLeft + paddingRight + groupedDays.length * baseWidthPerCandle;
    const width = Math.max(minWidth, computedWidth);
    const height = 300;

    let minY = 0;
    let maxY = 10;

    if (groupedDays.length > 0) {
      const lows = groupedDays.map((d) => d.low);
      const highs = groupedDays.map((d) => d.high);
      const absoluteMin = Math.min(...lows);
      const absoluteMax = Math.max(...highs);

      const span = absoluteMax - absoluteMin;
      const verticalPadding = span > 0 ? span * 0.15 : 0.5;

      minY = Math.max(0, absoluteMin - verticalPadding);
      maxY = absoluteMax + verticalPadding;
    }

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      minY,
      maxY
    };
  }, [groupedDays]);

  // Scaler functions
  const scaleY = (val: number) => {
    const { height, paddingTop, paddingBottom, minY, maxY } = chartDimensions;
    if (maxY === minY) return height / 2;
    const usableHeight = height - paddingTop - paddingBottom;
    return height - paddingBottom - ((val - minY) / (maxY - minY)) * usableHeight;
  };

  const scaleX = (index: number) => {
    const { paddingLeft } = chartDimensions;
    const baseWidthPerCandle = 75;
    return paddingLeft + index * baseWidthPerCandle + baseWidthPerCandle / 2;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (groupedDays.length === 0 || !chartContainerRef.current) return;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const scrollLeft = chartContainerRef.current.scrollLeft;

    const clientX = e.clientX - rect.left + scrollLeft;

    const baseWidthPerCandle = 75;
    const paddingLeft = 50;
    const offset = clientX - paddingLeft;

    let index = Math.floor(offset / baseWidthPerCandle);
    if (index < 0) index = 0;
    if (index >= groupedDays.length) index = groupedDays.length - 1;

    const day = groupedDays[index];
    if (day) {
      setHoveredDay(day);

      const tooltipX = scaleX(index) - scrollLeft;
      const tooltipY = scaleY(day.average) - 60;

      setTooltipPos({
        x: Math.max(10, Math.min(rect.width - 240, tooltipX - 100)),
        y: Math.max(10, tooltipY)
      });
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredDay(null);
  };

  return (
    <div className="space-y-4 md:space-y-6 flex-1 flex flex-col">
      {/* Error alert banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs font-bold p-4 rounded-2xl flex items-center gap-2 border border-destructive/20 animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={handleRefresh} className="ml-auto underline hover:opacity-85 cursor-pointer">Reintentar</button>
        </div>
      )}

      {/* Upper header action section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-4 rounded-3xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/15 text-primary rounded-2xl flex items-center justify-center shadow-xs shrink-0">
            <Scale size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              Peso de mi Bebé <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/10">BETA</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Añade medidas con margen para visualizar rangos reales (velas).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
        >
          <PlusCircle size={18} />
          Nuevo Registro
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Último Peso</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.lastWeight > 0 ? metrics.lastWeight.toFixed(3) : "—"}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">kg</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
            <Info size={11} className="text-primary shrink-0" />
            Margen: ±{(metrics.lastMargin * 1000).toFixed(0)}g
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Crecimiento total</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics.totalGain >= 0 ? "+" : ""}
              {metrics.lastWeight > 0 ? metrics.totalGain.toFixed(3) : "—"}
            </span>
            <span className="text-sm md:text-base font-extrabold text-emerald-600 dark:text-emerald-400">kg</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-500 shrink-0" />
            Desde primer registro
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Peso Promedio</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.average > 0 ? metrics.average.toFixed(3) : "—"}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">kg</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            Mediana de todos los días
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Mediciones</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.count}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">pesos</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            En base de datos
          </span>
        </div>
      </div>

      {/* Main Grid: Graph + Quick Entries */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start flex-1 min-h-0">

        {/* Chart View (Left 2 columns on large screens) */}
        <div className="xl:col-span-2 bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs flex flex-col h-full min-h-[420px]">
          {/* Chart Header */}
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-card-foreground">
                Análisis Gráfico (Velas de Peso)
              </span>
            </div>

            {/* View selectors */}
            <div className="flex bg-muted p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("chart")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "chart"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Gráfico
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "list"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registros ({records.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Chart View */}
          {activeTab === "chart" && (
            <div className="p-4 flex-1 flex flex-col justify-between relative min-h-[350px]">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <RefreshCw className="animate-spin text-primary mb-3" size={32} />
                  <span className="text-sm font-bold">Cargando registros...</span>
                </div>
              ) : records.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
                    <Scale size={28} />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">Sin datos de peso</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Añade el primer peso del bebé para pintar el gráfico de velas interactivo con márgenes de ropa o básculas.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl shadow-md cursor-pointer"
                  >
                    Añadir primer peso
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-muted-foreground mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-emerald-500 rounded-xs border border-emerald-600 block" />
                      <span>Subida diaria (Open &rarr; Close)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-rose-500 rounded-xs border border-rose-600 block" />
                      <span>Bajada diaria (Open &rarr; Close)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-0.5 h-3 bg-gray-400 dark:bg-gray-600 block" />
                      <span>Línea: Rango de Margen (Low / High)</span>
                    </div>
                  </div>

                  {/* SVG Candlestick Plot Area */}
                  <div className="relative flex-1 bg-card/30 rounded-2xl border border-border/40 p-1">
                    {/* Horizontal scroll container for mobile responsiveness */}
                    <div
                      ref={chartContainerRef}
                      className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent py-2"
                    >
                      <svg
                        width={chartDimensions.width}
                        height={chartDimensions.height}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={handleCanvasMouseLeave}
                        className="overflow-visible select-none cursor-crosshair mx-auto"
                      >
                        {/* Horizontal Grid lines */}
                        {Array.from({ length: 5 }).map((_, i) => {
                          const val =
                            chartDimensions.minY +
                            (i / 4) * (chartDimensions.maxY - chartDimensions.minY);
                          const y = scaleY(val);
                          return (
                            <g key={i}>
                              <line
                                x1={chartDimensions.paddingLeft}
                                y1={y}
                                x2={chartDimensions.width - chartDimensions.paddingRight}
                                y2={y}
                                stroke="var(--color-border)"
                                strokeWidth="0.5"
                                strokeDasharray="3,3"
                              />
                              <text
                                x={chartDimensions.paddingLeft - 8}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-muted-foreground font-mono text-[10px] font-bold"
                              >
                                {val.toFixed(2)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Plotting the Candlesticks */}
                        {groupedDays.map((day, idx) => {
                          const x = scaleX(idx);
                          const yHigh = scaleY(day.high);
                          const yLow = scaleY(day.low);
                          const yOpen = scaleY(day.open);
                          const yClose = scaleY(day.close);

                          const isBullish = day.close >= day.open;
                          const candleColor = isBullish
                            ? "rgb(16, 185, 129)"
                            : "rgb(244, 63, 94)";

                          const bodyTop = Math.min(yOpen, yClose);
                          const bodyBottom = Math.max(yOpen, yClose);
                          const candleHeight = Math.max(3, bodyBottom - bodyTop);

                          const isHovered = hoveredDay?.date === day.date;
                          const isSelected = selectedDay?.date === day.date;

                          return (
                            <g key={day.date} className="transition-all duration-150">
                              {/* Background hover highlights */}
                              <rect
                                x={x - 30}
                                y={chartDimensions.paddingTop}
                                width={60}
                                height={
                                  chartDimensions.height -
                                  chartDimensions.paddingTop -
                                  chartDimensions.paddingBottom
                                }
                                fill={isHovered ? "currentColor" : "transparent"}
                                className={isHovered ? "text-primary/5 rounded-xl animate-fade-in" : ""}
                                onClick={() => setSelectedDay(day)}
                              />

                              {/* Wick (vertical low-high line) */}
                              <line
                                x1={x}
                                y1={yLow}
                                x2={x}
                                y2={yHigh}
                                stroke={isHovered || isSelected ? "var(--color-foreground)" : "currentColor"}
                                strokeWidth={isHovered || isSelected ? "2.5" : "1.5"}
                                className="text-muted-foreground"
                              />

                              {/* Candle Body */}
                              <rect
                                x={x - 12}
                                y={bodyTop}
                                width={24}
                                height={candleHeight}
                                fill={candleColor}
                                rx="3"
                                stroke={isHovered || isSelected ? "var(--color-foreground)" : "none"}
                                strokeWidth="2"
                                className="transition-all shadow-xs"
                                onClick={() => setSelectedDay(day)}
                              />

                              {/* Single node dots for extra precision if only 1 entry */}
                              {day.records.length === 1 && (
                                <circle
                                  cx={x}
                                  cy={yOpen}
                                  r="4"
                                  fill="white"
                                  stroke={candleColor}
                                  strokeWidth="2.5"
                                />
                              )}

                              {/* X Axis Label */}
                              <text
                                x={x}
                                y={chartDimensions.height - 12}
                                textAnchor="middle"
                                className={`font-semibold text-[10px] ${
                                  isSelected
                                    ? "fill-primary font-extrabold"
                                    : isHovered
                                    ? "fill-foreground"
                                    : "fill-muted-foreground"
                                }`}
                                onClick={() => setSelectedDay(day)}
                              >
                                {day.displayDate}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Interactive Canvas Hover Tooltip inside plot */}
                      {hoveredDay && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                          }}
                          className="w-[220px] bg-card/95 border border-border text-foreground p-3 rounded-2xl shadow-xl backdrop-blur-md pointer-events-none z-10 space-y-1.5 transition-all duration-75 text-left"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-1">
                            <span className="text-xs font-extrabold text-foreground">{hoveredDay.displayDate}</span>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                              {hoveredDay.records.length} {hoveredDay.records.length === 1 ? "medición" : "mediciones"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                            <div>Máx (High):</div>
                            <div className="text-right font-bold text-foreground">{hoveredDay.high.toFixed(3)} kg</div>
                            <div>Mín (Low):</div>
                            <div className="text-right font-bold text-foreground">{hoveredDay.low.toFixed(3)} kg</div>
                            <div>Apertura (Open):</div>
                            <div className="text-right font-bold text-foreground">{hoveredDay.open.toFixed(3)} kg</div>
                            <div>Cierre (Close):</div>
                            <div className="text-right font-bold text-foreground">{hoveredDay.close.toFixed(3)} kg</div>
                          </div>
                          <div className="text-[9px] text-muted-foreground italic truncate">
                            Básculas: {Array.from(new Set(hoveredDay.records.map(r => r.scale))).join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-2 italic">
                    Desliza horizontalmente la gráfica si tienes muchas mediciones. Pulsa en una vela para ver el desglose diario.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: List View */}
          {activeTab === "list" && (
            <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
              {records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  Sin registros que mostrar.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Headers */}
                  <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-2 bg-muted/50 rounded-xl text-xs font-bold text-muted-foreground">
                    <div>Fecha/Hora</div>
                    <div>Peso (kg)</div>
                    <div>Margen (kg)</div>
                    <div>Báscula</div>
                    <div>Vestimenta</div>
                    <div className="text-right">Acciones</div>
                  </div>

                  {records.map((record) => (
                    <div
                      key={record._id}
                      className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center px-4 py-3 bg-card border border-border/50 hover:border-primary/30 rounded-2xl transition shadow-xs text-xs"
                    >
                      {/* Date & Time */}
                      <div className="flex items-center gap-2 md:block">
                        <Calendar size={13} className="text-primary md:hidden shrink-0" />
                        <span className="font-bold text-foreground">{record.date}</span>
                        <span className="text-muted-foreground ml-2 md:ml-0 md:block font-medium">
                          {record.time}
                        </span>
                      </div>

                      {/* Weight */}
                      <div className="flex items-center gap-2 md:block">
                        <span className="md:hidden text-muted-foreground font-semibold">Peso:</span>
                        <span className="font-black text-foreground text-sm">{record.weight.toFixed(3)} kg</span>
                      </div>

                      {/* Margin */}
                      <div className="flex items-center gap-2 md:block">
                        <span className="md:hidden text-muted-foreground font-semibold">Margen:</span>
                        <span className="text-muted-foreground font-mono">
                          ±{(record.margin * 1000).toFixed(0)}g
                        </span>
                      </div>

                      {/* Scale */}
                      <div className="flex items-center gap-2 md:block truncate">
                        <span className="md:hidden text-muted-foreground font-semibold">Báscula:</span>
                        <span className="text-foreground font-semibold">{record.scale}</span>
                      </div>

                      {/* Clothes Presets */}
                      <div className="flex items-center gap-2 md:block">
                        <span className="md:hidden text-muted-foreground font-semibold">Ropa:</span>
                        <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-bold text-muted-foreground">
                          {record.clothes}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition active:scale-95 cursor-pointer"
                          title="Editar registro"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(record._id)}
                          className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition active:scale-95 cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Display notes if any */}
                      {record.notes && (
                        <div className="col-span-1 md:col-span-6 mt-1 text-[11px] text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl italic">
                          Nota: {record.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Day Details Card (Right Sidebar Column) */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-card-foreground border-b border-border pb-3">
            <Calendar size={15} className="text-primary" />
            <span>Desglose por Día</span>
          </div>

          {selectedDay ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-foreground text-sm">{selectedDay.date}</span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Day candlestick statistics */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-2xl border border-border/30 animate-fade-in">
                <div className="text-[10px] text-muted-foreground">Rango de Margen (Low-High)</div>
                <div className="text-right font-mono font-bold text-xs text-foreground">
                  {selectedDay.low.toFixed(3)} - {selectedDay.high.toFixed(3)} kg
                </div>
                <div className="text-[10px] text-muted-foreground">Primer Peso (Open)</div>
                <div className="text-right font-mono font-bold text-xs text-foreground">
                  {selectedDay.open.toFixed(3)} kg
                </div>
                <div className="text-[10px] text-muted-foreground">Último Peso (Close)</div>
                <div className="text-right font-mono font-bold text-xs text-foreground">
                  {selectedDay.close.toFixed(3)} kg
                </div>
                <div className="text-[10px] text-muted-foreground">Diferencia neta</div>
                <div className={`text-right font-mono font-extrabold text-xs ${
                  selectedDay.close >= selectedDay.open ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {selectedDay.close >= selectedDay.open ? "+" : ""}
                  {(selectedDay.close - selectedDay.open).toFixed(3)} kg
                </div>
              </div>

              {/* Day specific measurements */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Mediciones de este día:
                </span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedDay.records.map((r) => (
                    <div
                      key={r._id}
                      className="p-3 bg-card border border-border/60 hover:border-primary/40 rounded-xl space-y-1 text-xs relative group transition-all"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-muted-foreground" />
                          <span>{r.time}</span>
                        </div>
                        <span className="font-extrabold text-sm text-primary">{r.weight.toFixed(3)} kg</span>
                      </div>
                      <div className="grid grid-cols-2 text-[10px] text-muted-foreground font-semibold">
                        <div>Báscula: {r.scale}</div>
                        <div className="text-right">Ropa: {r.clothes}</div>
                      </div>
                      {r.notes && (
                        <p className="text-[10px] text-muted-foreground italic bg-muted/40 p-1 rounded-md mt-1 truncate">
                          &ldquo;{r.notes}&rdquo;
                        </p>
                      )}

                      {/* Hover action bar inside sidebar */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 shadow-sm">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1 hover:bg-muted text-foreground rounded-md transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={() => setDeleteId(r._id)}
                          className="p-1 hover:bg-destructive/10 text-destructive rounded-md transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
              <Info size={28} className="text-primary/30 mb-2" />
              <p className="text-xs max-w-[200px]">
                Pulsa sobre cualquier vela en el gráfico para ver el desglose completo del día y comparar básculas o ropa.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Popover Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Scale size={18} />
                </div>
                <h3 className="font-extrabold text-foreground tracking-tight">
                  {formId ? "Editar Registro de Peso" : "Nuevo Registro de Peso"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-muted rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Date Input */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                    Fecha
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                    />
                  </div>
                </div>

                {/* Time Input */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                    Hora
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Input */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] flex items-center justify-between">
                  <span>Peso registrado (kg)</span>
                  <span className="text-[9px] text-primary lowercase font-medium">e.g. 3.450 para 3kg 450g</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="3.450"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="block w-full px-4 py-3 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-black text-lg"
                />
              </div>

              {/* Vestimenta Pre-selection */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Vestimenta del bebé (Ajusta margen auto)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.keys(CLOTHING_PRESETS).map((presetKey) => (
                    <button
                      type="button"
                      key={presetKey}
                      onClick={() => handleClothesChange(presetKey)}
                      className={`px-2.5 py-2 rounded-xl text-center font-bold text-[10px] border-2 transition cursor-pointer ${
                        clothes === presetKey
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {presetKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin Input */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] flex items-center justify-between">
                  <span>Margen de error / Ropa (kg)</span>
                  <span className="font-mono text-primary text-[10px]">±{(parseFloat(margin || "0") * 1000).toFixed(0)}g</span>
                </label>
                <input
                  type="number"
                  step="0.005"
                  required
                  value={margin}
                  onChange={(e) => handleMarginChange(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold"
                />
              </div>

              {/* Scale selection */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Báscula de medición
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {SCALE_SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => setScale(suggestion)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition cursor-pointer ${
                        scale === suggestion
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/60 border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Introduce u otra báscula personalizada"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  className="block w-full px-4 py-2 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Notas adicionales (Opcional)
                </label>
                <textarea
                  placeholder="Notas como: después del baño, pañal un poco sucio, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="block w-full px-4 py-2 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 bg-muted hover:opacity-80 rounded-2xl font-extrabold text-center transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-2xl font-extrabold text-center transition active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="animate-spin" size={15} />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={15} />
                      Guardar Peso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col space-y-4 text-center">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-2">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-extrabold text-foreground text-base tracking-tight">
              ¿Eliminar medición de peso?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta acción no se puede deshacer y alterará el histórico de la gráfica de velas de tu bebé.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-muted hover:opacity-80 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <Trash2 size={13} />
                )}
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
