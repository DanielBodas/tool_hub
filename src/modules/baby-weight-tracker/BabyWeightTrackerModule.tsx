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
  X,
  Settings,
  Plus,
  Sliders
} from "lucide-react";

interface WeightRecord {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  weight: number; // Recorded weight (raw) in kg
  margin: number; // Clothing margin in kg
  scale: string; // Weighing site (scale name)
  clothes: string; // Clothing preset name
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

interface ClothingPreset {
  name: string;
  margin: number; // in kg
  label: string;
}

export function BabyWeightTrackerModule() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [clothing, setClothing] = useState<ClothingPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Settings Config states
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [newSite, setNewSite] = useState<string>("");
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [newPresetMargin, setNewPresetMargin] = useState<string>("0.05");

  // Filter States
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  // Local helper date initializers
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

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [weight, setWeight] = useState<string>("");
  const [margin, setMargin] = useState<string>("0.025");
  const [scale, setScale] = useState<string>("");
  const [clothes, setClothes] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"chart" | "list" | "calibration">("chart");
  const [selectedDay, setSelectedDay] = useState<GroupedDay | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Tooltip interactive state
  const [hoveredDay, setHoveredDay] = useState<GroupedDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Refresh handler (loads weights + configs)
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetch("/api/baby-weight-tracker")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo obtener la información");
        return res.json();
      })
      .then((data) => {
        setRecords(data.weights || []);
        const loadedSites = data.settings?.sites || [];
        const loadedClothing = data.settings?.clothing || [];
        setSites(loadedSites);
        setClothing(loadedClothing);

        // Auto-select all sites if filters are empty
        if (selectedSites.length === 0) {
          setSelectedSites(loadedSites);
        }
        setLoading(false);
      })
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : "Error al conectar con la base de datos";
        setError(errMsg);
        setLoading(false);
      });
  };

  // Initial load
  useEffect(() => {
    fetch("/api/baby-weight-tracker")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo obtener la información");
        return res.json();
      })
      .then((data) => {
        setRecords(data.weights || []);
        const loadedSites = data.settings?.sites || [];
        const loadedClothing = data.settings?.clothing || [];
        setSites(loadedSites);
        setClothing(loadedClothing);
        setSelectedSites(loadedSites);
        setLoading(false);
      })
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : "Error al conectar con la base de datos";
        setError(errMsg);
        setLoading(false);
      });
  }, []);

  // Preset behavior: adjust margin when clothes preset is chosen
  const handleClothesChange = (presetName: string) => {
    setClothes(presetName);
    const preset = clothing.find((p) => p.name === presetName);
    if (preset && presetName !== "Personalizado") {
      setMargin(preset.margin.toString());
    }
  };

  // Preset behavior: adjust preset when margin is typed manually
  const handleMarginChange = (val: string) => {
    setMargin(val);
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return;

    let matchedPreset = "Personalizado";
    for (const preset of clothing) {
      if (preset.margin === parsed && preset.name !== "Personalizado") {
        matchedPreset = preset.name;
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

    if (clothing.length > 0) {
      setClothes(clothing[0].name);
      setMargin(clothing[0].margin.toString());
    } else {
      setClothes("Sin ropa");
      setMargin("0.0");
    }

    if (sites.length > 0) {
      setScale(sites[0]);
    } else {
      setScale("Báscula Casa (Bebé)");
    }

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

  // Config Management Helpers
  const handleSaveConfig = async (updatedSites: string[], updatedClothing: ClothingPreset[]) => {
    try {
      const res = await fetch("/api/baby-weight-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "settings",
          sites: updatedSites,
          clothing: updatedClothing
        })
      });

      if (!res.ok) throw new Error("No se pudo guardar la configuración");

      const data = await res.json();
      if (data.settings) {
        setSites(data.settings.sites);
        setClothing(data.settings.clothing);
        setSelectedSites(data.settings.sites);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error al guardar la configuración";
      alert(errMsg);
    }
  };

  const handleAddSite = () => {
    if (!newSite.trim()) return;
    if (sites.includes(newSite.trim())) {
      alert("Este sitio ya existe");
      return;
    }
    const updated = [...sites, newSite.trim()];
    setSites(updated);
    setNewSite("");
    handleSaveConfig(updated, clothing);
  };

  const handleRemoveSite = (siteToRemove: string) => {
    const updated = sites.filter((s) => s !== siteToRemove);
    setSites(updated);
    handleSaveConfig(updated, clothing);
  };

  const handleAddClothing = () => {
    if (!newPresetName.trim() || !newPresetMargin) return;
    if (clothing.some((p) => p.name.toLowerCase() === newPresetName.trim().toLowerCase())) {
      alert("Esta vestimenta ya existe");
      return;
    }
    const parsedMargin = parseFloat(newPresetMargin);
    if (isNaN(parsedMargin)) return;

    const newPreset: ClothingPreset = {
      name: newPresetName.trim(),
      margin: parsedMargin,
      label: `${newPresetName.trim()} (+${(parsedMargin * 1000).toFixed(0)}g)`
    };

    const updated = [...clothing, newPreset];
    setClothing(updated);
    setNewPresetName("");
    setNewPresetMargin("0.05");
    handleSaveConfig(sites, updated);
  };

  const handleRemoveClothing = (presetName: string) => {
    const updated = clothing.filter((c) => pName(c.name) !== pName(presetName));
    setClothing(updated);
    handleSaveConfig(sites, updated);
  };

  const pName = (name: string) => name.toLowerCase().trim();

  // Multi-site filter toggle helper
  const handleToggleSiteFilter = (site: string) => {
    if (selectedSites.includes(site)) {
      if (selectedSites.length === 1) return; // Leave at least one checked
      setSelectedSites(selectedSites.filter((s) => s !== site));
    } else {
      setSelectedSites([...selectedSites, site]);
    }
  };

  // Grouping & Candlestick processing (Filtered by selected weighing sites)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => selectedSites.includes(r.scale));
  }, [records, selectedSites]);

  const groupedDays = useMemo<GroupedDay[]>(() => {
    if (filteredRecords.length === 0) return [];

    const map: { [date: string]: WeightRecord[] } = {};
    filteredRecords.forEach((r) => {
      if (!map[r.date]) {
        map[r.date] = [];
      }
      map[r.date].push(r);
    });

    const days: GroupedDay[] = Object.keys(map).map((d) => {
      const dayRecords = map[d].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

      const open = dayRecords[0].weight; // First weight of day (Recorded)
      const close = dayRecords[dayRecords.length - 1].weight - dayRecords[dayRecords.length - 1].margin; // Last weight of day (Net)

      const low = Math.min(...dayRecords.map((r) => r.weight - r.margin)); // Net Weight
      const high = Math.max(...dayRecords.map((r) => r.weight)); // Recorded Weight (High)

      const sum = dayRecords.reduce((acc, r) => acc + (r.weight - r.margin), 0);
      const average = sum / dayRecords.length; // Average Net Weight

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
  }, [filteredRecords]);

  // General Metrics (using filtered records)
  const metrics = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        lastWeight: 0,
        lastMargin: 0,
        totalGain: 0,
        average: 0,
        count: 0
      };
    }

    const sorted = [...filteredRecords].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const lastNet = last.weight - last.margin;
    const firstNet = first.weight - first.margin;

    const sum = filteredRecords.reduce((acc, r) => acc + (r.weight - r.margin), 0);
    const average = sum / filteredRecords.length;

    return {
      lastWeight: last.weight,
      lastMargin: last.margin,
      totalGain: lastNet - firstNet,
      average,
      count: filteredRecords.length
    };
  }, [filteredRecords]);

  // Calibration & Offset Extrapolation Algorithm
  const calibrationData = useMemo(() => {
    if (records.length === 0 || sites.length <= 1) return [];

    const scaleRecords: { [scale: string]: WeightRecord[] } = {};
    sites.forEach((s) => {
      scaleRecords[s] = records
        .filter((r) => r.scale === s)
        .sort((a, b) => a.date.localeCompare(b.date));
    });

    const primaryScale = sites[0];
    const primaryList = scaleRecords[primaryScale] || [];

    if (primaryList.length === 0) return [];

    const results: Array<{
      scale: string;
      offset: number; // in kg
      method: "direct" | "interpolated" | "insufficient";
      pointsCount: number;
    }> = [];

    // Linear extrapolation helper
    const estimateWeightAt = (dateStr: string, list: WeightRecord[]): number | null => {
      if (list.length === 0) return null;
      if (list.length === 1) return list[0].weight - list[0].margin;

      const targetTime = new Date(dateStr).getTime();

      let before: WeightRecord | null = null;
      let after: WeightRecord | null = null;

      for (const r of list) {
        const rTime = new Date(r.date).getTime();
        if (r.date === dateStr) {
          return r.weight - r.margin; // Direct match
        }
        if (rTime < targetTime) {
          const bVal = before as WeightRecord | null;
          if (bVal === null || new Date(bVal.date).getTime() < rTime) {
            before = r;
          }
        } else {
          const aVal = after as WeightRecord | null;
          if (aVal === null || new Date(aVal.date).getTime() > rTime) {
            after = r;
            break;
          }
        }
      }

      if (before && after) {
        const t1 = new Date(before.date).getTime();
        const t2 = new Date(after.date).getTime();
        const w1 = before.weight - before.margin;
        const w2 = after.weight - after.margin;

        const fraction = (targetTime - t1) / (t2 - t1);
        return w1 + fraction * (w2 - w1);
      }

      if (before) {
        const idx = list.indexOf(before);
        if (idx > 0) {
          const secondBefore = list[idx - 1];
          const t1 = new Date(secondBefore.date).getTime();
          const t2 = new Date(before.date).getTime();
          const w1 = secondBefore.weight - secondBefore.margin;
          const w2 = before.weight - before.margin;

          const fraction = (targetTime - t1) / (t2 - t1);
          return w1 + fraction * (w2 - w1);
        }
        return before.weight - before.margin;
      }

      if (after) {
        const idx = list.indexOf(after);
        if (idx < list.length - 1) {
          const secondAfter = list[idx + 1];
          const t1 = new Date(after.date).getTime();
          const t2 = new Date(secondAfter.date).getTime();
          const w1 = after.weight - after.margin;
          const w2 = secondAfter.weight - secondAfter.margin;

          const fraction = (targetTime - t1) / (t2 - t1);
          return w1 + fraction * (w2 - w1);
        }
        return after.weight - after.margin;
      }

      return null;
    };

    sites.forEach((site) => {
      if (site === primaryScale) return;
      const list = scaleRecords[site] || [];
      if (list.length === 0) {
        results.push({ scale: site, offset: 0, method: "insufficient", pointsCount: 0 });
        return;
      }

      let sumDiff = 0;
      let count = 0;
      let hasDirect = false;

      list.forEach((r) => {
        const sameDayPrimary = primaryList.find((pr) => pr.date === r.date);
        if (sameDayPrimary) {
          const netWeight = r.weight - r.margin;
          const primaryNetWeight = sameDayPrimary.weight - sameDayPrimary.margin;
          sumDiff += (netWeight - primaryNetWeight);
          count++;
          hasDirect = true;
        }
      });

      if (count === 0) {
        list.forEach((r) => {
          const primaryEstimatedNet = estimateWeightAt(r.date, primaryList);
          if (primaryEstimatedNet !== null) {
            const netWeight = r.weight - r.margin;
            sumDiff += (netWeight - primaryEstimatedNet);
            count++;
          }
        });
      }

      if (count > 0) {
        results.push({
          scale: site,
          offset: sumDiff / count,
          method: hasDirect ? "direct" : "interpolated",
          pointsCount: count
        });
      } else {
        results.push({
          scale: site,
          offset: 0,
          method: "insufficient",
          pointsCount: 0
        });
      }
    });

    return results;
  }, [records, sites]);

  // Site Specific Growth Trends
  const siteTrends = useMemo(() => {
    if (records.length === 0 || sites.length === 0) return [];

    return sites.map((site) => {
      const siteList = records
        .filter((r) => r.scale === site)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (siteList.length <= 1) {
        return {
          scale: site,
          count: siteList.length,
          growthRate: 0,
          trendText: "Datos insuficientes para tendencia"
        };
      }

      const first = siteList[0];
      const last = siteList[siteList.length - 1];
      const t1 = new Date(first.date).getTime();
      const t2 = new Date(last.date).getTime();
      const w1 = first.weight - first.margin;
      const w2 = last.weight - last.margin;

      const daysDiff = (t2 - t1) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 0) {
        return {
          scale: site,
          count: siteList.length,
          growthRate: 0,
          trendText: "Medidas el mismo día"
        };
      }

      const growthGrams = (w2 - w1) * 1000;
      const growthRate = growthGrams / daysDiff;

      return {
        scale: site,
        count: siteList.length,
        growthRate,
        trendText: `Gana aprox. ${growthRate.toFixed(1)}g/día`
      };
    });
  }, [records, sites]);

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

  // Scaler functions for chart
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
              Peso de mi Bebé <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/10">AVANZADO</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Velas de peso calibradas por sitio, vestimenta y extrapolación inteligente.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center p-3 bg-muted hover:bg-muted/80 text-foreground rounded-2xl border border-border transition active:scale-95 cursor-pointer"
            title="Configurar sitios y vestimentas"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm rounded-2xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <PlusCircle size={18} />
            Nuevo Registro
          </button>
        </div>
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
            Margen Ropa: ±{(metrics.lastMargin * 1000).toFixed(0)}g
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Crecimiento Neto</span>
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
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Peso Promedio Neto</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.average > 0 ? metrics.average.toFixed(3) : "—"}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">kg</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            Promedio sin vestimenta
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Registros Filtrados</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.count}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">pesos</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            De {records.length} totales
          </span>
        </div>
      </div>

      {/* Weighing Scale Filters (Fixed Categories) */}
      <div className="bg-card border border-border/50 p-4 rounded-3xl shadow-xs">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Filtrar por Sitio de Pesaje:</span>
        <div className="flex flex-wrap gap-2">
          {sites.map((site) => {
            const isChecked = selectedSites.includes(site);
            return (
              <button
                key={site}
                onClick={() => handleToggleSiteFilter(site)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isChecked ? "bg-primary" : "bg-muted-foreground"}`} />
                {site}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Graph + Side statistics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start flex-1 min-h-0">

        {/* Chart View (Left 2 columns on large screens) */}
        <div className="xl:col-span-2 bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs flex flex-col h-full min-h-[420px]">
          {/* Chart Header */}
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-card-foreground">
                Velas de Peso (Margen Ropa en la Vela)
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
                Registros ({filteredRecords.length})
              </button>
              <button
                onClick={() => setActiveTab("calibration")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "calibration"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Calibración
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
              ) : filteredRecords.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 text-muted-foreground">
                    <Scale size={28} />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">Sin registros filtrados</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Selecciona al menos una categoría de sitio arriba que contenga registros para pintar la gráfica de velas.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-muted-foreground mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-emerald-500 rounded-xs border border-emerald-600 block" />
                      <span>Subida diaria (Open &rarr; Close neto)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-rose-500 rounded-xs border border-rose-600 block" />
                      <span>Bajada diaria (Open &rarr; Close neto)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-0.5 h-3 bg-gray-400 dark:bg-gray-600 block" />
                      <span>Mecha: Rango total (Neto mínimo - Registrado máximo)</span>
                    </div>
                  </div>

                  {/* SVG Candlestick Plot Area */}
                  <div className="relative flex-1 bg-card/30 rounded-2xl border border-border/40 p-1">
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
                              {hoveredDay.records.length} {hoveredDay.records.length === 1 ? "peso" : "pesos"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                            <div>Máx (Registrado):</div>
                            <div className="text-right font-bold text-foreground">{(hoveredDay.high).toFixed(3)} kg</div>
                            <div>Mín (Neto):</div>
                            <div className="text-right font-bold text-foreground">{(hoveredDay.low).toFixed(3)} kg</div>
                            <div>Apertura (1º Reg):</div>
                            <div className="text-right font-bold text-foreground">{hoveredDay.open.toFixed(3)} kg</div>
                            <div>Cierre (Último Neto):</div>
                            <div className="text-right font-bold text-foreground">{hoveredDay.close.toFixed(3)} kg</div>
                          </div>
                          <div className="text-[9px] text-muted-foreground italic truncate">
                            Sitios: {Array.from(new Set(hoveredDay.records.map(r => r.scale))).join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-2 italic">
                    La vela representa la diferencia entre el peso registrado y el neto (restado el margen de la vestimenta).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: List View */}
          {activeTab === "list" && (
            <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  Sin registros que mostrar.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Headers */}
                  <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-2 bg-muted/50 rounded-xl text-xs font-bold text-muted-foreground">
                    <div>Fecha/Hora</div>
                    <div>Peso Reg. (kg)</div>
                    <div>Peso Neto (kg)</div>
                    <div>Margen Ropa</div>
                    <div>Sitio de Pesaje</div>
                    <div className="text-right">Acciones</div>
                  </div>

                  {filteredRecords.map((record) => {
                    const netWeight = record.weight - record.margin;
                    return (
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

                        {/* Recorded Weight */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="md:hidden text-muted-foreground font-semibold">Reg:</span>
                          <span className="font-extrabold text-foreground">{record.weight.toFixed(3)} kg</span>
                        </div>

                        {/* Net Weight */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="md:hidden text-muted-foreground font-semibold">Neto:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{netWeight.toFixed(3)} kg</span>
                        </div>

                        {/* Margin */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="md:hidden text-muted-foreground font-semibold">Ropa:</span>
                          <span className="text-muted-foreground font-mono">
                            -{record.margin > 0 ? `${(record.margin * 1000).toFixed(0)}g` : "0g"} ({record.clothes})
                          </span>
                        </div>

                        {/* Scale */}
                        <div className="flex items-center gap-2 md:block truncate">
                          <span className="md:hidden text-muted-foreground font-semibold">Sitio:</span>
                          <span className="text-foreground font-semibold">{record.scale}</span>
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Calibration & Extrapolation */}
          {activeTab === "calibration" && (
            <div className="p-5 flex-1 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-2xl border border-primary/20 text-xs">
                <Info size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Calibración Inteligente de Básculas:</strong> Este algoritmo calcula la diferencia promedio de peso neto de las básculas comparándolas con la báscula de referencia (<strong>{sites[0]}</strong>).
                  Si no hay mediciones el mismo día, realiza una <strong>extrapolación/interpolación lineal</strong> basada en el peso del bebé para calcular la diferencia estimada en esa fecha.
                </p>
              </div>

              {calibrationData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  Añade pesos en más de una báscula para calibrar diferencias de calibración.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calibrationData.map((cal) => {
                    const absOffsetGrams = Math.abs(cal.offset * 1000);
                    const isPositive = cal.offset >= 0;
                    return (
                      <div
                        key={cal.scale}
                        className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <span className="font-extrabold text-sm text-foreground">{cal.scale}</span>
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {cal.pointsCount} {cal.pointsCount === 1 ? "punto" : "puntos"}
                          </span>
                        </div>

                        {cal.method === "insufficient" ? (
                          <div className="text-xs text-muted-foreground">
                            Sin mediciones para calcular offsets. Introduce pesos en esta báscula.
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black ${isPositive ? "text-rose-500" : "text-emerald-500"}`}>
                                {isPositive ? "+" : "-"}
                                {absOffsetGrams.toFixed(0)}g
                              </span>
                              <span className="text-muted-foreground font-semibold">promedio</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {isPositive
                                ? `Esta báscula registra un promedio de ${absOffsetGrams.toFixed(0)}g MÁS de peso neto que ${sites[0]}.`
                                : `Esta báscula registra un promedio de ${absOffsetGrams.toFixed(0)}g MENOS de peso neto que ${sites[0]}.`
                              }
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold mt-2">
                              <span className={`px-1.5 py-0.5 rounded-full ${
                                cal.method === "direct" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                              }`}>
                                {cal.method === "direct" ? "Coincidencias el mismo día" : "Extrapolado lineal"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Day Details Card (Right Sidebar Column) + Trends Section */}
        <div className="space-y-4 flex flex-col h-full">
          {/* Day specific breakdown */}
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

                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-2xl border border-border/30 animate-fade-in">
                  <div className="text-[10px] text-muted-foreground">Rango total día:</div>
                  <div className="text-right font-mono font-bold text-xs text-foreground">
                    {selectedDay.low.toFixed(3)} - {selectedDay.high.toFixed(3)} kg
                  </div>
                  <div className="text-[10px] text-muted-foreground">Apertura (Recorded):</div>
                  <div className="text-right font-mono font-bold text-xs text-foreground">
                    {selectedDay.open.toFixed(3)} kg
                  </div>
                  <div className="text-[10px] text-muted-foreground">Cierre (Neto):</div>
                  <div className="text-right font-mono font-bold text-xs text-foreground">
                    {selectedDay.close.toFixed(3)} kg
                  </div>
                  <div className="text-[10px] text-muted-foreground">Variación neta:</div>
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
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
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
                          <div>Sitio: {r.scale}</div>
                          <div className="text-right">Neto: {(r.weight - r.margin).toFixed(3)} kg</div>
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          Ropa: {r.clothes} (-{(r.margin * 1000).toFixed(0)}g)
                        </div>
                        {r.notes && (
                          <p className="text-[10px] text-muted-foreground italic bg-muted/40 p-1 rounded-md mt-1 truncate">
                            &ldquo;{r.notes}&rdquo;
                          </p>
                        )}

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

          {/* Scale trends */}
          <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-card-foreground border-b border-border pb-3">
              <TrendingUp size={15} className="text-emerald-500" />
              <span>Tendencias por Sitio</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {siteTrends.map((trend) => (
                <div
                  key={trend.scale}
                  className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>{trend.scale}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {trend.count} pesos
                    </span>
                  </div>

                  {trend.count <= 1 ? (
                    <div className="text-[10px] text-muted-foreground italic">
                      Datos insuficientes para tendencia.
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5 text-xs">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        +{trend.growthRate.toFixed(1)}g
                      </span>
                      <span className="text-[10px] text-muted-foreground">por día</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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
                  <span>Peso registrado bruto (kg)</span>
                  <span className="text-[9px] text-primary lowercase font-medium">e.g. 2.570 para 2kg 570g</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="2.570"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="block w-full px-4 py-3 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-black text-lg"
                />
              </div>

              {/* Vestimenta Pre-selection */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Vestimenta (Descuenta el margen de peso en la vela)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clothing.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleClothesChange(preset.name)}
                      className={`px-2.5 py-2 rounded-xl text-center font-bold text-[10px] border-2 transition cursor-pointer ${
                        clothes === preset.name
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {preset.name} (-{(preset.margin * 1000).toFixed(0)}g)
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleClothesChange("Personalizado")}
                    className={`px-2.5 py-2 rounded-xl text-center font-bold text-[10px] border-2 transition cursor-pointer ${
                      clothes === "Personalizado"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Margin Input */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] flex items-center justify-between">
                  <span>Margen descontable de ropa (kg)</span>
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
                  Sitio donde se ha pesado (Categoría)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {sites.map((siteName) => (
                    <button
                      type="button"
                      key={siteName}
                      onClick={() => setScale(siteName)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition cursor-pointer ${
                        scale === siteName
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/60 border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {siteName}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Introduce u otro sitio personalizado"
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

      {/* Config Customization Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 flex flex-col space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-primary" />
                <h3 className="font-extrabold text-foreground tracking-tight">
                  Configurar Categorías de Sitios y Vestimentas
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 hover:bg-muted rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sites Section */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                1. Sitios de Pesaje (Categorías fijas):
              </span>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                {sites.map((s) => (
                  <div key={s} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-bold text-foreground">
                    <span>{s}</span>
                    <button
                      onClick={() => handleRemoveSite(s)}
                      disabled={sites.length <= 1}
                      className="p-1 hover:bg-destructive/10 text-destructive/80 hover:text-destructive rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Eliminar sitio"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nueva báscula / Sitio (e.g. Pediatra)"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  className="flex-1 px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold"
                />
                <button
                  onClick={handleAddSite}
                  className="px-4 py-2 bg-primary text-primary-foreground font-extrabold rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} />
                  Añadir
                </button>
              </div>
            </div>

            {/* Clothing presets section */}
            <div className="space-y-3 border-t border-border pt-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                2. Vestimentas y sus márgenes:
              </span>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {clothing.map((preset) => (
                  <div key={preset.name} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-bold text-foreground">
                    <span>{preset.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-primary text-[11px] font-extrabold">
                        -{(preset.margin * 1000).toFixed(0)}g
                      </span>
                      <button
                        onClick={() => handleRemoveClothing(preset.name)}
                        className="p-1 hover:bg-destructive/10 text-destructive/80 hover:text-destructive rounded-lg cursor-pointer"
                        title="Eliminar vestimenta"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Vestimenta (e.g. Pañal sucio)"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      step="0.005"
                      placeholder="Margen (kg) e.g. 0.05"
                      value={newPresetMargin}
                      onChange={(e) => setNewPresetMargin(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">
                      {(parseFloat(newPresetMargin || "0") * 1000).toFixed(0)}g
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleAddClothing}
                  className="w-full py-2 bg-primary text-primary-foreground font-extrabold rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  Añadir Nueva Vestimenta
                </button>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full py-3 bg-muted text-foreground hover:opacity-90 font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Cerrar y Aplicar
            </button>
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
