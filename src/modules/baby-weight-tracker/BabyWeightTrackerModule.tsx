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
  Sliders,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface WeightRecord {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  weight: number; // Recorded raw weight (High/Open of candle) in kg
  margin: number; // Clothing margin in kg
  blanket: string; // Blanket name
  blanketMargin: number; // Blanket margin in kg
  scale: string; // Weighing site (scale name)
  clothes: string; // Clothing preset name
  notes: string;
  updatedAt: string;
}

interface BlanketPreset {
  name: string;
  margin: number; // in kg
  label: string;
}

interface ClothingPreset {
  name: string;
  margin: number; // in kg
  label: string;
}

// Fixed distinct colors for weighing sites/scales
const COLOR_PALETTE = [
  { text: "text-indigo-500", border: "border-indigo-500", bg: "bg-indigo-500/10", fill: "rgb(99, 102, 241)", hex: "#6366f1" },
  { text: "text-emerald-500", border: "border-emerald-500", bg: "bg-emerald-500/10", fill: "rgb(16, 185, 129)", hex: "#10b981" },
  { text: "text-amber-500", border: "border-amber-500", bg: "bg-amber-500/10", fill: "rgb(245, 158, 11)", hex: "#f59e0b" },
  { text: "text-rose-500", border: "border-rose-500", bg: "bg-rose-500/10", fill: "rgb(244, 63, 94)", hex: "#f43f5e" },
  { text: "text-violet-500", border: "border-violet-500", bg: "bg-violet-500/10", fill: "rgb(139, 92, 246)", hex: "#8b5cf6" },
  { text: "text-cyan-500", border: "border-cyan-500", bg: "bg-cyan-500/10", fill: "rgb(6, 182, 212)", hex: "#06b6d4" }
];

export function BabyWeightTrackerModule() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [clothing, setClothing] = useState<ClothingPreset[]>([]);
  const [blankets, setBlankets] = useState<BlanketPreset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Settings Config states
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [newSite, setNewSite] = useState<string>("");

  const [newClothingName, setNewClothingName] = useState<string>("");
  const [newClothingMargin, setNewClothingMargin] = useState<string>("0.05");

  const [newBlanketName, setNewBlanketName] = useState<string>("");
  const [newBlanketMargin, setNewBlanketMargin] = useState<string>("0.1");

  // Filter States
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  // Accordion Expand/Collapse States (for vertical space saving on mobile)
  const [isDetailExpanded, setIsDetailExpanded] = useState<boolean>(true);
  const [isTrendsExpanded, setIsTrendsExpanded] = useState<boolean>(false);

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
  const [blanket, setBlanket] = useState<string>("Ninguna");
  const [blanketMargin, setBlanketMargin] = useState<string>("0.0");
  const [scale, setScale] = useState<string>("");
  const [clothes, setClothes] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"chart" | "list" | "calibration">("chart");
  const [selectedRecord, setSelectedRecord] = useState<WeightRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Tooltip interactive state
  const [hoveredRecord, setHoveredRecord] = useState<WeightRecord | null>(null);
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
        const loadedBlankets = data.settings?.blankets || [];
        setSites(loadedSites);
        setClothing(loadedClothing);
        setBlankets(loadedBlankets);

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
        const loadedBlankets = data.settings?.blankets || [];
        setSites(loadedSites);
        setClothing(loadedClothing);
        setBlankets(loadedBlankets);
        setSelectedSites(loadedSites);
        setLoading(false);
      })
      .catch((err) => {
        const errMsg = err instanceof Error ? err.message : "Error al conectar con la base de datos";
        setError(errMsg);
        setLoading(false);
      });
  }, []);

  // Map scales/sites to distinct colors dynamically
  const siteColors = useMemo(() => {
    const map: { [site: string]: typeof COLOR_PALETTE[0] } = {};
    sites.forEach((site, index) => {
      map[site] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    return map;
  }, [sites]);

  // Preset behavior: adjust margin when clothes preset is chosen
  const handleClothesChange = (presetName: string) => {
    setClothes(presetName);
    const preset = clothing.find((p) => p.name === presetName);
    if (preset && presetName !== "Personalizado") {
      setMargin(preset.margin.toString());
    }
  };

  // Preset behavior: adjust preset when clothing margin is typed manually
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

  // Preset behavior: adjust blanket margin when blanket preset is chosen
  const handleBlanketChange = (presetName: string) => {
    setBlanket(presetName);
    const preset = blankets.find((p) => p.name === presetName);
    if (preset && presetName !== "Personalizado") {
      setBlanketMargin(preset.margin.toString());
    }
  };

  // Preset behavior: adjust preset when blanket margin is typed manually
  const handleBlanketMarginChange = (val: string) => {
    setBlanketMargin(val);
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return;

    let matchedPreset = "Personalizado";
    for (const preset of blankets) {
      if (preset.margin === parsed && preset.name !== "Personalizado") {
        matchedPreset = preset.name;
        break;
      }
    }
    setBlanket(matchedPreset);
  };

  const handleEdit = (record: WeightRecord) => {
    setFormId(record._id);
    setDate(record.date);
    setTime(record.time);
    setWeight(record.weight.toString());
    setMargin(record.margin.toString());
    setBlanket(record.blanket || "Ninguna");
    setBlanketMargin((record.blanketMargin || 0).toString());
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

    if (blankets.length > 0) {
      setBlanket(blankets[0].name);
      setBlanketMargin(blankets[0].margin.toString());
    } else {
      setBlanket("Ninguna");
      setBlanketMargin("0.0");
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
          blanket,
          blanketMargin: parseFloat(blanketMargin) || 0,
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
  const handleSaveConfig = async (updatedSites: string[], updatedClothing: ClothingPreset[], updatedBlankets: BlanketPreset[]) => {
    try {
      const res = await fetch("/api/baby-weight-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "settings",
          sites: updatedSites,
          clothing: updatedClothing,
          blankets: updatedBlankets
        })
      });

      if (!res.ok) throw new Error("No se pudo guardar la configuración");

      const data = await res.json();
      if (data.settings) {
        setSites(data.settings.sites);
        setClothing(data.settings.clothing);
        setBlankets(data.settings.blankets);
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
    handleSaveConfig(updated, clothing, blankets);
  };

  const handleRemoveSite = (siteToRemove: string) => {
    const updated = sites.filter((s) => s !== siteToRemove);
    setSites(updated);
    handleSaveConfig(updated, clothing, blankets);
  };

  const handleAddClothing = () => {
    if (!newClothingName.trim() || !newClothingMargin) return;
    if (clothing.some((p) => pName(p.name) === pName(newClothingName))) {
      alert("Esta vestimenta ya existe");
      return;
    }
    const parsedMargin = parseFloat(newClothingMargin);
    if (isNaN(parsedMargin)) return;

    const newPreset: ClothingPreset = {
      name: newClothingName.trim(),
      margin: parsedMargin,
      label: `${newClothingName.trim()} (+${(parsedMargin * 1000).toFixed(0)}g)`
    };

    const updated = [...clothing, newPreset];
    setClothing(updated);
    setNewClothingName("");
    setNewClothingMargin("0.05");
    handleSaveConfig(sites, updated, blankets);
  };

  const handleRemoveClothing = (presetName: string) => {
    const updated = clothing.filter((c) => pName(c.name) !== pName(presetName));
    setClothing(updated);
    handleSaveConfig(sites, updated, blankets);
  };

  const handleAddBlanket = () => {
    if (!newBlanketName.trim() || !newBlanketMargin) return;
    if (blankets.some((p) => pName(p.name) === pName(newBlanketName))) {
      alert("Esta manta/trapo ya existe");
      return;
    }
    const parsedMargin = parseFloat(newBlanketMargin);
    if (isNaN(parsedMargin)) return;

    const newPreset: BlanketPreset = {
      name: newBlanketName.trim(),
      margin: parsedMargin,
      label: `${newBlanketName.trim()} (+${(parsedMargin * 1000).toFixed(0)}g)`
    };

    const updated = [...blankets, newPreset];
    setBlankets(updated);
    setNewBlanketName("");
    setNewBlanketMargin("0.1");
    handleSaveConfig(sites, clothing, updated);
  };

  const handleRemoveBlanket = (presetName: string) => {
    const updated = blankets.filter((c) => pName(c.name) !== pName(presetName));
    setBlankets(updated);
    handleSaveConfig(sites, clothing, updated);
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
    return records
      .filter((r) => selectedSites.includes(r.scale))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [records, selectedSites]);

  // General Metrics (using filtered records)
  const metrics = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        lastWeight: 0,
        lastMargin: 0,
        lastBlanketMargin: 0,
        totalGain: 0,
        average: 0,
        count: 0
      };
    }

    const first = filteredRecords[0];
    const last = filteredRecords[filteredRecords.length - 1];

    const lastNet = last.weight - last.margin - (last.blanketMargin || 0);
    const firstNet = first.weight - first.margin - (first.blanketMargin || 0);

    const sum = filteredRecords.reduce((acc, r) => acc + (r.weight - r.margin - (r.blanketMargin || 0)), 0);
    const average = sum / filteredRecords.length;

    return {
      lastWeight: last.weight,
      lastMargin: last.margin,
      lastBlanketMargin: last.blanketMargin || 0,
      totalGain: lastNet - firstNet,
      average,
      count: filteredRecords.length
    };
  }, [filteredRecords]);

  // Dynamic Chart Parameters
  const chartDimensions = useMemo(() => {
    const minWidth = 320;
    const baseWidthPerCandle = 75;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const computedWidth = paddingLeft + paddingRight + filteredRecords.length * baseWidthPerCandle;
    const width = Math.max(minWidth, computedWidth);
    const height = 300;

    let minY = 0;
    let maxY = 10;

    if (filteredRecords.length > 0) {
      const lows = filteredRecords.map((r) => r.weight - r.margin - (r.blanketMargin || 0));
      const highs = filteredRecords.map((r) => r.weight);
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
  }, [filteredRecords]);

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
    if (filteredRecords.length === 0 || !chartContainerRef.current) return;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const scrollLeft = chartContainerRef.current.scrollLeft;

    const clientX = e.clientX - rect.left + scrollLeft;

    const baseWidthPerCandle = 75;
    const paddingLeft = 50;
    const offset = clientX - paddingLeft;

    let index = Math.floor(offset / baseWidthPerCandle);
    if (index < 0) index = 0;
    if (index >= filteredRecords.length) index = filteredRecords.length - 1;

    const record = filteredRecords[index];
    if (record) {
      setHoveredRecord(record);

      const tooltipX = scaleX(index) - scrollLeft;
      const tooltipY = scaleY(record.weight - record.margin - (record.blanketMargin || 0)) - 60;

      setTooltipPos({
        x: Math.max(10, Math.min(rect.width - 240, tooltipX - 100)),
        y: Math.max(10, tooltipY)
      });
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredRecord(null);
  };

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
      if (list.length === 1) return list[0].weight - list[0].margin - (list[0].blanketMargin || 0);

      const targetTime = new Date(dateStr).getTime();

      let before: WeightRecord | null = null;
      let after: WeightRecord | null = null;

      for (const r of list) {
        const rTime = new Date(r.date).getTime();
        if (r.date === dateStr) {
          return r.weight - r.margin - (r.blanketMargin || 0); // Direct match
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
        const w1 = before.weight - before.margin - (before.blanketMargin || 0);
        const w2 = after.weight - after.margin - (after.blanketMargin || 0);

        const fraction = (targetTime - t1) / (t2 - t1);
        return w1 + fraction * (w2 - w1);
      }

      if (before) {
        const idx = list.indexOf(before);
        if (idx > 0) {
          const secondBefore = list[idx - 1];
          const t1 = new Date(secondBefore.date).getTime();
          const t2 = new Date(before.date).getTime();
          const w1 = secondBefore.weight - secondBefore.margin - (secondBefore.blanketMargin || 0);
          const w2 = before.weight - before.margin - (before.blanketMargin || 0);

          const fraction = (targetTime - t1) / (t2 - t1);
          return w1 + fraction * (w2 - w1);
        }
        return before.weight - before.margin - (before.blanketMargin || 0);
      }

      if (after) {
        const idx = list.indexOf(after);
        if (idx < list.length - 1) {
          const secondAfter = list[idx + 1];
          const t1 = new Date(after.date).getTime();
          const t2 = new Date(secondAfter.date).getTime();
          const w1 = after.weight - after.margin - (after.blanketMargin || 0);
          const w2 = secondAfter.weight - secondAfter.margin - (secondAfter.blanketMargin || 0);

          const fraction = (targetTime - t1) / (t2 - t1);
          return w1 + fraction * (w2 - w1);
        }
        return after.weight - after.margin - (after.blanketMargin || 0);
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
          const netWeight = r.weight - r.margin - (r.blanketMargin || 0);
          const primaryNetWeight = sameDayPrimary.weight - sameDayPrimary.margin - (sameDayPrimary.blanketMargin || 0);
          sumDiff += (netWeight - primaryNetWeight);
          count++;
          hasDirect = true;
        }
      });

      if (count === 0) {
        list.forEach((r) => {
          const primaryEstimatedNet = estimateWeightAt(r.date, primaryList);
          if (primaryEstimatedNet !== null) {
            const netWeight = r.weight - r.margin - (r.blanketMargin || 0);
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
      const w1 = first.weight - first.margin - (first.blanketMargin || 0);
      const w2 = last.weight - last.margin - (last.blanketMargin || 0);

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

  const formatDateLabel = (dStr: string) => {
    const parts = dStr.split("-");
    if (parts.length !== 3) return dStr;
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]}`;
  };

  // Helper trigger to auto-expand details on selected candle
  const handleSelectRecord = (record: WeightRecord) => {
    setSelectedRecord(record);
    setIsDetailExpanded(true); // Always expand the details section on mobile when clicked
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
              Peso de mi Bebé <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/10">PRECIOSO</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Velas individuales coloreadas por sitio. Diferenciación total de pesajes el mismo día.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center p-3 bg-muted hover:bg-muted/80 text-foreground rounded-2xl border border-border transition active:scale-95 cursor-pointer"
            title="Configurar sitios, vestimentas y mantas"
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
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Último Peso Bruto</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.lastWeight > 0 ? metrics.lastWeight.toFixed(3) : "—"}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">kg</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
            <Info size={11} className="text-primary shrink-0" />
            Ropa: {(metrics.lastMargin * 1000).toFixed(0)}g | Manta: {(metrics.lastBlanketMargin * 1000).toFixed(0)}g
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
            Desde primer registro (Neto)
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
            Promedio neto real descontado
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-card hover:bg-muted/10 p-3 md:p-5 rounded-3xl border border-border/60 transition shadow-xs flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">Registros Activos</span>
          <div className="my-1 md:my-2 flex items-baseline gap-1">
            <span className="text-xl md:text-3xl font-black text-foreground">
              {metrics.count}
            </span>
            <span className="text-sm md:text-base font-extrabold text-muted-foreground">pesos</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            Filtrados de {records.length} totales
          </span>
        </div>
      </div>

      {/* Weighing Scale Filters (Fixed Categories) */}
      <div className="bg-card border border-border/50 p-4 rounded-3xl shadow-xs">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Filtrar por Sitio de Pesaje (colores fijos):</span>
        <div className="flex flex-wrap gap-2">
          {sites.map((site) => {
            const isChecked = selectedSites.includes(site);
            const scaleColor = siteColors[site] || { text: "text-muted-foreground", hex: "#888" };
            return (
              <button
                key={site}
                onClick={() => handleToggleSiteFilter(site)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? "bg-muted text-foreground border-muted"
                    : "bg-transparent border-border/40 text-muted-foreground hover:bg-muted/50"
                }`}
                style={isChecked ? { borderColor: scaleColor.hex, color: scaleColor.hex } : {}}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scaleColor.hex }} />
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
                Análisis por Pesajes Individuales (Velas Coloreadas por Sitio)
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
                    Selecciona al menos un sitio arriba que contenga registros para pintar la gráfica de velas.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Legend of Sites with Colors */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-muted-foreground mb-3 px-1 border-b border-border/30 pb-2">
                    <span className="uppercase tracking-widest text-[9px]">Código de Color por Sitio:</span>
                    {sites.map((site) => {
                      const color = siteColors[site] || { hex: "#888" };
                      return (
                        <div key={site} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                          <span>{site}</span>
                        </div>
                      );
                    })}
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
                                fill="currentColor"
                                className="text-muted-foreground font-mono text-[9px] font-bold"
                              >
                                {val.toFixed(2)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Plotting the Candlesticks for each individual record */}
                        {filteredRecords.map((record, idx) => {
                          const x = scaleX(idx);

                          // High = Recorded raw weight (e.g. 2.570 kg)
                          const yHigh = scaleY(record.weight);

                          // Low = Net Weight = Recorded - clothing - blanket (e.g. 2.520 kg)
                          const totalMargin = record.margin + (record.blanketMargin || 0);
                          const netWeight = record.weight - totalMargin;
                          const yLow = scaleY(netWeight);

                          // Open of Candle = Recorded Weight, Close = Net weight
                          const yOpen = yHigh;
                          const yClose = yLow;

                          const colorDef = siteColors[record.scale] || { fill: "rgb(99, 102, 241)", hex: "#6366f1" };

                          const bodyTop = yOpen;
                          const bodyBottom = yClose;
                          const candleHeight = Math.max(3, bodyBottom - bodyTop);

                          const isHovered = hoveredRecord?._id === record._id;
                          const isSelected = selectedRecord?._id === record._id;

                          return (
                            <g key={record._id} className="transition-all duration-150">
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
                                className={isHovered ? "text-primary/5 rounded-xl" : ""}
                                onClick={() => handleSelectRecord(record)}
                              />

                              {/* Wick (vertical line) */}
                              <line
                                x1={x}
                                y1={yLow}
                                x2={x}
                                y2={yHigh}
                                stroke={isHovered || isSelected ? "var(--color-foreground)" : colorDef.hex}
                                strokeWidth={isHovered || isSelected ? "2.5" : "1.5"}
                              />

                              {/* Candle Body (the margin block!) */}
                              <rect
                                x={x - 12}
                                y={bodyTop}
                                width={24}
                                height={candleHeight}
                                fill={colorDef.hex}
                                rx="3"
                                stroke={isHovered || isSelected ? "var(--color-foreground)" : "none"}
                                strokeWidth="2"
                                className="transition-all shadow-xs cursor-pointer"
                                onClick={() => handleSelectRecord(record)}
                              />

                              {/* Single node dots for extra visual center */}
                              <circle
                                cx={x}
                                cy={yHigh}
                                r="2.5"
                                fill="white"
                                stroke={colorDef.hex}
                                strokeWidth="1.5"
                              />

                              {/* X Axis Label Line 1: Date */}
                              <text
                                x={x}
                                y={chartDimensions.height - 18}
                                textAnchor="middle"
                                fill="currentColor"
                                className={`font-bold text-[9px] ${
                                  isSelected
                                    ? "text-primary font-extrabold"
                                    : isHovered
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                                onClick={() => handleSelectRecord(record)}
                              >
                                {formatDateLabel(record.date)}
                              </text>

                              {/* X Axis Label Line 2: Time */}
                              <text
                                x={x}
                                y={chartDimensions.height - 8}
                                textAnchor="middle"
                                fill="currentColor"
                                className="font-semibold text-[8px] text-muted-foreground/75"
                                onClick={() => handleSelectRecord(record)}
                              >
                                {record.time}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Interactive Canvas Hover Tooltip inside plot */}
                      {hoveredRecord && (
                        <div
                          style={{
                            position: "absolute",
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                          }}
                          className="w-[220px] bg-card/95 border border-border text-foreground p-3 rounded-2xl shadow-xl backdrop-blur-md pointer-events-none z-10 space-y-1.5 transition-all duration-75 text-left"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-1">
                            <span className="text-xs font-extrabold text-foreground">
                              {formatDateLabel(hoveredRecord.date)} {hoveredRecord.time}
                            </span>
                            <span className="text-[8px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: (siteColors[hoveredRecord.scale] || { hex: "#888" }).hex }}>
                              {hoveredRecord.scale}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                            <div>P. Bruto (High):</div>
                            <div className="text-right font-bold text-foreground">{(hoveredRecord.weight).toFixed(3)} kg</div>
                            <div>P. Neto (Low):</div>
                            <div className="text-right font-black text-emerald-500">{(hoveredRecord.weight - hoveredRecord.margin - (hoveredRecord.blanketMargin || 0)).toFixed(3)} kg</div>
                            <div>Margen Ropa:</div>
                            <div className="text-right text-foreground">{(hoveredRecord.margin * 1000).toFixed(0)}g ({hoveredRecord.clothes})</div>
                            <div>Manta/Trapo:</div>
                            <div className="text-right text-foreground">{((hoveredRecord.blanketMargin || 0) * 1000).toFixed(0)}g ({hoveredRecord.blanket || "Ninguna"})</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-2 italic">
                    El cuerpo de la vela muestra el margen descontado. La parte superior es el peso bruto y la inferior el peso neto real del bebé.
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
                  <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 bg-muted/50 rounded-xl text-xs font-bold text-muted-foreground">
                    <div>Fecha/Hora</div>
                    <div>Peso Reg. (kg)</div>
                    <div>Peso Neto (kg)</div>
                    <div>Margen Ropa</div>
                    <div>Manta/Trapo</div>
                    <div>Sitio de Pesaje</div>
                    <div className="text-right">Acciones</div>
                  </div>

                  {filteredRecords.map((record) => {
                    const netWeight = record.weight - record.margin - (record.blanketMargin || 0);
                    const color = siteColors[record.scale] || { hex: "#888" };
                    return (
                      <div
                        key={record._id}
                        className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center px-4 py-3 bg-card border border-border/50 hover:border-primary/30 rounded-2xl transition shadow-xs text-xs"
                      >
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 md:block">
                          <Calendar size={13} className="text-primary md:hidden shrink-0" />
                          <span className="font-bold text-foreground">{record.date}</span>
                          <span className="text-muted-foreground ml-2 md:ml-0 md:block font-medium font-mono">
                            {record.time}
                          </span>
                        </div>

                        {/* Recorded Weight */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="md:hidden text-muted-foreground font-semibold">Bruto:</span>
                          <span className="font-extrabold text-foreground">{record.weight.toFixed(3)} kg</span>
                        </div>

                        {/* Net Weight */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="md:hidden text-muted-foreground font-semibold">Neto:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{netWeight.toFixed(3)} kg</span>
                        </div>

                        {/* Margin */}
                        <div className="flex items-center gap-2 md:block truncate">
                          <span className="md:hidden text-muted-foreground font-semibold">Ropa:</span>
                          <span className="text-muted-foreground">
                            -{(record.margin * 1000).toFixed(0)}g ({record.clothes})
                          </span>
                        </div>

                        {/* Blanket */}
                        <div className="flex items-center gap-2 md:block truncate">
                          <span className="md:hidden text-muted-foreground font-semibold">Manta:</span>
                          <span className="text-muted-foreground">
                            -{((record.blanketMargin || 0) * 1000).toFixed(0)}g ({record.blanket || "Ninguna"})
                          </span>
                        </div>

                        {/* Scale */}
                        <div className="flex items-center gap-2 md:block truncate">
                          <span className="md:hidden text-muted-foreground font-semibold">Sitio:</span>
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px]" style={{ backgroundColor: `${color.hex}20`, color: color.hex }}>
                            {record.scale}
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
                          <div className="col-span-1 md:col-span-7 mt-1 text-[11px] text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl italic">
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

        {/* Side column: COLLAPSIBLE Details and Trends Accordions (Saves vertical space on mobile) */}
        <div className="space-y-4 flex flex-col h-full">
          {/* 1. COLLAPSIBLE Record specific breakdown */}
          <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs flex flex-col">
            <button
              onClick={() => setIsDetailExpanded(!isDetailExpanded)}
              className="w-full px-5 py-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-card-foreground hover:bg-muted/30 transition select-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span>Desglose del Pesaje</span>
              </div>
              {isDetailExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isDetailExpanded && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border/40 animate-fade-in">
                {selectedRecord ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-foreground text-sm">{formatDateLabel(selectedRecord.date)} {selectedRecord.time}</span>
                      <button
                        onClick={() => setSelectedRecord(null)}
                        className="p-1 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl border border-border/30 space-y-1.5 text-xs font-semibold text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Sitio de Pesaje:</span>
                        <span className="font-bold text-foreground">{selectedRecord.scale}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/30 pt-1.5">
                        <span>Peso Bruto (High):</span>
                        <span className="font-mono font-bold text-foreground">{selectedRecord.weight.toFixed(3)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margen Ropa:</span>
                        <span className="font-mono text-foreground">-{(selectedRecord.margin * 1000).toFixed(0)}g ({selectedRecord.clothes})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Manta/Trapo:</span>
                        <span className="font-mono text-foreground">-{((selectedRecord.blanketMargin || 0) * 1000).toFixed(0)}g ({selectedRecord.blanket || "Ninguna"})</span>
                      </div>
                      <div className="flex justify-between border-t border-border/30 pt-1.5">
                        <span>Peso Neto Real (Low):</span>
                        <span className="font-mono font-black text-emerald-500 text-sm">{(selectedRecord.weight - selectedRecord.margin - (selectedRecord.blanketMargin || 0)).toFixed(3)} kg</span>
                      </div>
                    </div>

                    {selectedRecord.notes && (
                      <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl italic">
                        &ldquo;{selectedRecord.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(selectedRecord)}
                        className="flex-1 py-2 border border-border bg-muted hover:bg-muted/80 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteId(selectedRecord._id)}
                        className="flex-1 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                    <Info size={24} className="text-primary/30 mb-2" />
                    <p className="text-xs max-w-[200px] leading-relaxed">
                      Pulsa sobre cualquier vela en el gráfico para ver el desglose completo del pesaje.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. COLLAPSIBLE Scale trends (starts collapsed on mobile to save space) */}
          <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs flex flex-col">
            <button
              onClick={() => setIsTrendsExpanded(!isTrendsExpanded)}
              className="w-full px-5 py-4 flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-card-foreground hover:bg-muted/30 transition select-none cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-500" />
                <span>Tendencias por Sitio</span>
              </div>
              {isTrendsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isTrendsExpanded && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-border/40 animate-fade-in max-h-[250px] overflow-y-auto">
                {siteTrends.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">Sin datos de tendencias.</div>
                ) : (
                  siteTrends.map((trend) => {
                    const color = siteColors[trend.scale] || { hex: "#888" };
                    return (
                      <div
                        key={trend.scale}
                        className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-1"
                        style={{ borderLeft: `3.5px solid ${color.hex}` }}
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-foreground">
                          <span className="truncate pr-1">{trend.scale}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {trend.count} pesos
                          </span>
                        </div>

                        {trend.count <= 1 ? (
                          <div className="text-[10px] text-muted-foreground italic">
                            Datos insuficientes para tendencia.
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1.5 text-xs">
                            <span className="font-extrabold animate-pulse" style={{ color: color.hex }}>
                              +{trend.growthRate.toFixed(1)}g
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">por día</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popover Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
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
                  <span>Peso registrado bruto en Báscula (kg)</span>
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
                  Vestimenta (Descuenta el margen en la vela)
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

              {/* Blanket Pre-selection */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Manta, Toalla o Trapo de Báscula (Descuenta margen)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {blankets.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleBlanketChange(preset.name)}
                      className={`px-2.5 py-2 rounded-xl text-center font-bold text-[10px] border-2 transition cursor-pointer ${
                        blanket === preset.name
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {preset.name} (-{(preset.margin * 1000).toFixed(0)}g)
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleBlanketChange("Personalizado")}
                    className={`px-2.5 py-2 rounded-xl text-center font-bold text-[10px] border-2 transition cursor-pointer ${
                      blanket === "Personalizado"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/40 border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Blanket Margin Input */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] flex items-center justify-between">
                  <span>Margen descontable de manta/talla (kg)</span>
                  <span className="font-mono text-primary text-[10px]">±{(parseFloat(blanketMargin || "0") * 1000).toFixed(0)}g</span>
                </label>
                <input
                  type="number"
                  step="0.005"
                  required
                  value={blanketMargin}
                  onChange={(e) => handleBlanketMarginChange(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-muted/60 hover:bg-muted focus:bg-card border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold"
                />
              </div>

              {/* Scale selection */}
              <div className="space-y-1 pt-1">
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
          <div className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 flex flex-col space-y-5 max-h-[90vh] overflow-y-auto font-sans animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-primary" />
                <h3 className="font-extrabold text-foreground tracking-tight">
                  Configurar Sitios, Vestimentas y Mantas
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
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
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
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
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
                    value={newClothingName}
                    onChange={(e) => setNewClothingName(e.target.value)}
                    className="px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      step="0.005"
                      placeholder="Margen (kg)"
                      value={newClothingMargin}
                      onChange={(e) => setNewClothingMargin(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">
                      {(parseFloat(newClothingMargin || "0") * 1000).toFixed(0)}g
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleAddClothing}
                  className="w-full py-2 bg-primary text-primary-foreground font-extrabold rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  Añadir Vestimenta
                </button>
              </div>
            </div>

            {/* Blanket presets section */}
            <div className="space-y-3 border-t border-border pt-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                3. Mantas, Toallas y Trapos (Márgenes de báscula):
              </span>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {blankets.map((preset) => (
                  <div key={preset.name} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/50 text-xs font-bold text-foreground">
                    <span>{preset.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-primary text-[11px] font-extrabold">
                        -{(preset.margin * 1000).toFixed(0)}g
                      </span>
                      <button
                        onClick={() => handleRemoveBlanket(preset.name)}
                        className="p-1 hover:bg-destructive/10 text-destructive/80 hover:text-destructive rounded-lg cursor-pointer"
                        title="Eliminar manta"
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
                    placeholder="Manta/Trapo (e.g. Arrullo fino)"
                    value={newBlanketName}
                    onChange={(e) => setNewBlanketName(e.target.value)}
                    className="px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold"
                  />
                  <div className="relative">
                    <input
                      type="number"
                      step="0.005"
                      placeholder="Margen (kg)"
                      value={newBlanketMargin}
                      onChange={(e) => setNewBlanketMargin(e.target.value)}
                      className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-bold font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">
                      {(parseFloat(newBlanketMargin || "0") * 1000).toFixed(0)}g
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleAddBlanket}
                  className="w-full py-2 bg-primary text-primary-foreground font-extrabold rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  Añadir Manta/Trapo
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
