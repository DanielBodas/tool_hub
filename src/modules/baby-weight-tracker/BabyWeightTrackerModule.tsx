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
  ChevronUp,
  Search,
  LineChart,
  History,
  Activity,
  MapPin,
  Shirt,
  Layers,
  Check,
  Calculator,
  ArrowRight
} from "lucide-react";
import {
  getWHOPercentilesAtAge,
  calculateWHOPercentile,
  getAgeInDays,
  Sex
} from "./whoPercentiles";

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

  // WHO Percentile and Baby Profile States
  const [babyBirthDate, setBabyBirthDate] = useState<string>("");
  const [babySex, setBabySex] = useState<"female" | "male">("female");
  const [showPercentiles, setShowPercentiles] = useState<boolean>(true);

  // Settings Config states
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [configTab, setConfigTab] = useState<"baby" | "sites" | "clothing" | "blankets">("baby");
  const [newSite, setNewSite] = useState<string>("");

  const [newClothingName, setNewClothingName] = useState<string>("");
  const [newClothingMargin, setNewClothingMargin] = useState<string>("0.05");

  const [newBlanketName, setNewBlanketName] = useState<string>("");
  const [newBlanketMargin, setNewBlanketMargin] = useState<string>("0.1");

  // Inline editing states for config modal
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [editSiteValue, setEditSiteValue] = useState<string>("");

  const [editingClothing, setEditingClothing] = useState<string | null>(null);
  const [editClothingName, setEditClothingName] = useState<string>("");
  const [editClothingMargin, setEditClothingMargin] = useState<string>("");

  const [editingBlanket, setEditingBlanket] = useState<string | null>(null);
  const [editBlanketName, setEditBlanketName] = useState<string>("");
  const [editBlanketMargin, setEditBlanketMargin] = useState<string>("");

  // Filter & Navigation States
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [mainTab, setMainTab] = useState<"chart" | "history" | "analysis">("chart");
  const [analysisSubTab, setAnalysisSubTab] = useState<"comparative" | "trends" | "calibration">("comparative");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Analysis comparative state
  const [calcMode, setCalcMode] = useState<"pairwise" | "multi">("pairwise");
  const [calcSiteFilter, setCalcSiteFilter] = useState<string>("ALL"); // "ALL" or specific site name
  const [calcStartId, setCalcStartId] = useState<string>("");
  const [calcEndId, setCalcEndId] = useState<string>("");
  const [selectedCalcRecordIds, setSelectedCalcRecordIds] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);

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
        if (data.settings?.birthDate) setBabyBirthDate(data.settings.birthDate);
        if (data.settings?.sex) setBabySex(data.settings.sex);

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
        if (data.settings?.birthDate) setBabyBirthDate(data.settings.birthDate);
        if (data.settings?.sex) setBabySex(data.settings.sex);
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
      if (selectedRecord?._id === deleteId) {
        setSelectedRecord(null);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error al eliminar el registro";
      alert(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  // Config Management Helpers
  const handleSaveConfig = async (
    updatedSites: string[],
    updatedClothing: ClothingPreset[],
    updatedBlankets: BlanketPreset[],
    updatedBirthDate: string = babyBirthDate,
    updatedSex: "female" | "male" = babySex
  ) => {
    try {
      const res = await fetch("/api/baby-weight-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "settings",
          sites: updatedSites,
          clothing: updatedClothing,
          blankets: updatedBlankets,
          birthDate: updatedBirthDate,
          sex: updatedSex
        })
      });

      if (!res.ok) throw new Error("No se pudo guardar la configuración");

      const data = await res.json();
      if (data.settings) {
        setSites(data.settings.sites);
        setClothing(data.settings.clothing);
        setBlankets(data.settings.blankets);
        if (data.settings.birthDate !== undefined) setBabyBirthDate(data.settings.birthDate);
        if (data.settings.sex) setBabySex(data.settings.sex);
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

  const handleStartEditSite = (siteName: string) => {
    setEditingSite(siteName);
    setEditSiteValue(siteName);
  };

  const handleCancelEditSite = () => {
    setEditingSite(null);
    setEditSiteValue("");
  };

  const handleSaveEditSite = (oldSiteName: string) => {
    const trimmed = editSiteValue.trim();
    if (!trimmed) {
      alert("El nombre del sitio no puede estar vacío");
      return;
    }
    if (trimmed !== oldSiteName && sites.includes(trimmed)) {
      alert("Ya existe un sitio con ese nombre");
      return;
    }

    const updatedSites = sites.map((s) => (s === oldSiteName ? trimmed : s));
    setSites(updatedSites);

    if (selectedSites.includes(oldSiteName)) {
      setSelectedSites((prev) => prev.map((s) => (s === oldSiteName ? trimmed : s)));
    }

    if (scale === oldSiteName) {
      setScale(trimmed);
    }

    if (trimmed !== oldSiteName) {
      setRecords((prev) =>
        prev.map((r) => (r.scale === oldSiteName ? { ...r, scale: trimmed } : r))
      );
    }

    setEditingSite(null);
    setEditSiteValue("");
    handleSaveConfig(updatedSites, clothing, blankets);
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

  const handleStartEditClothing = (preset: ClothingPreset) => {
    setEditingClothing(preset.name);
    setEditClothingName(preset.name);
    setEditClothingMargin(preset.margin.toString());
  };

  const handleCancelEditClothing = () => {
    setEditingClothing(null);
    setEditClothingName("");
    setEditClothingMargin("");
  };

  const handleSaveEditClothing = (oldPresetName: string) => {
    const trimmedName = editClothingName.trim();
    if (!trimmedName) {
      alert("El nombre del preset de vestimenta no puede estar vacío");
      return;
    }
    const parsedMargin = parseFloat(editClothingMargin);
    if (isNaN(parsedMargin) || parsedMargin < 0) {
      alert("Por favor, introduce un margen válido");
      return;
    }

    if (
      pName(trimmedName) !== pName(oldPresetName) &&
      clothing.some((c) => pName(c.name) === pName(trimmedName))
    ) {
      alert("Ya existe una vestimenta con ese nombre");
      return;
    }

    const updatedPreset: ClothingPreset = {
      name: trimmedName,
      margin: parsedMargin,
      label: `${trimmedName} (+${(parsedMargin * 1000).toFixed(0)}g)`
    };

    const updatedClothing = clothing.map((c) =>
      pName(c.name) === pName(oldPresetName) ? updatedPreset : c
    );

    setClothing(updatedClothing);

    if (clothes === oldPresetName) {
      setClothes(trimmedName);
      setMargin(parsedMargin.toString());
    }

    setEditingClothing(null);
    setEditClothingName("");
    setEditClothingMargin("");
    handleSaveConfig(sites, updatedClothing, blankets);
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

  const handleStartEditBlanket = (preset: BlanketPreset) => {
    setEditingBlanket(preset.name);
    setEditBlanketName(preset.name);
    setEditBlanketMargin(preset.margin.toString());
  };

  const handleCancelEditBlanket = () => {
    setEditingBlanket(null);
    setEditBlanketName("");
    setEditBlanketMargin("");
  };

  const handleSaveEditBlanket = (oldPresetName: string) => {
    const trimmedName = editBlanketName.trim();
    if (!trimmedName) {
      alert("El nombre del preset de manta/trapo no puede estar vacío");
      return;
    }
    const parsedMargin = parseFloat(editBlanketMargin);
    if (isNaN(parsedMargin) || parsedMargin < 0) {
      alert("Por favor, introduce un margen válido");
      return;
    }

    if (
      pName(trimmedName) !== pName(oldPresetName) &&
      blankets.some((b) => pName(b.name) === pName(trimmedName))
    ) {
      alert("Ya existe una manta o trapo con ese nombre");
      return;
    }

    const updatedPreset: BlanketPreset = {
      name: trimmedName,
      margin: parsedMargin,
      label: `${trimmedName} (+${(parsedMargin * 1000).toFixed(0)}g)`
    };

    const updatedBlankets = blankets.map((b) =>
      pName(b.name) === pName(oldPresetName) ? updatedPreset : b
    );

    setBlankets(updatedBlankets);

    if (blanket === oldPresetName) {
      setBlanket(trimmedName);
      setBlanketMargin(parsedMargin.toString());
    }

    setEditingBlanket(null);
    setEditBlanketName("");
    setEditBlanketMargin("");
    handleSaveConfig(sites, clothing, updatedBlankets);
  };

  const pName = (name: string) => name.toLowerCase().trim();

  // Site filter helpers for chart
  const handleSelectAllSites = () => {
    setSelectedSites([...sites]);
  };

  const handleSelectOnlySite = (site: string) => {
    if (selectedSites.length === 1 && selectedSites[0] === site) {
      // Tapping sole active site resets to all sites
      setSelectedSites([...sites]);
    } else {
      // Tapping a site isolates the chart to ONLY that site in 1 click
      setSelectedSites([site]);
    }
  };

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

  // Search filtered records for History List View
  const searchFilteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return filteredRecords;
    const q = searchQuery.toLowerCase();
    return filteredRecords.filter(
      (r) =>
        r.date.includes(q) ||
        r.scale.toLowerCase().includes(q) ||
        r.clothes.toLowerCase().includes(q) ||
        (r.blanket && r.blanket.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [filteredRecords, searchQuery]);

  // Records available for calculator based on selected scale filter
  const calcAvailableRecords = useMemo(() => {
    const list = calcSiteFilter === "ALL"
      ? records
      : records.filter((r) => r.scale === calcSiteFilter);
    return list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [records, calcSiteFilter]);

  // Auto-set default calculator selection when records or site filter change
  useEffect(() => {
    if (calcAvailableRecords.length >= 2) {
      if (!calcStartId || !calcAvailableRecords.some((r) => r._id === calcStartId)) {
        setCalcStartId(calcAvailableRecords[0]._id);
      }
      if (!calcEndId || !calcAvailableRecords.some((r) => r._id === calcEndId)) {
        setCalcEndId(calcAvailableRecords[calcAvailableRecords.length - 1]._id);
      }
      const validSelected = selectedCalcRecordIds.filter((id) =>
        calcAvailableRecords.some((r) => r._id === id)
      );
      if (validSelected.length < 2) {
        setSelectedCalcRecordIds(calcAvailableRecords.map((r) => r._id));
      }
    }
  }, [calcAvailableRecords, calcStartId, calcEndId, selectedCalcRecordIds]);

  // Comparative calculations
  const comparativePairResult = useMemo(() => {
    if (!calcStartId || !calcEndId || records.length < 2) return null;
    const rStart = records.find((r) => r._id === calcStartId);
    const rEnd = records.find((r) => r._id === calcEndId);
    if (!rStart || !rEnd) return null;

    const netStart = rStart.weight - rStart.margin - (rStart.blanketMargin || 0);
    const netEnd = rEnd.weight - rEnd.margin - (rEnd.blanketMargin || 0);

    const tStart = new Date(`${rStart.date}T${rStart.time || "00:00"}`).getTime();
    const tEnd = new Date(`${rEnd.date}T${rEnd.time || "00:00"}`).getTime();

    const diffMs = tEnd - tStart;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffGrams = (netEnd - netStart) * 1000;
    const gPerDay = diffDays > 0 ? diffGrams / diffDays : 0;

    return {
      rStart,
      rEnd,
      netStart,
      netEnd,
      diffDays,
      diffGrams,
      gPerDay,
      isReversed: diffMs < 0
    };
  }, [records, calcStartId, calcEndId]);

  const comparativeMultiResult = useMemo(() => {
    const selectedList = records
      .filter((r) => selectedCalcRecordIds.includes(r._id))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

    if (selectedList.length < 2) return null;

    const first = selectedList[0];
    const last = selectedList[selectedList.length - 1];

    const netFirst = first.weight - first.margin - (first.blanketMargin || 0);
    const netLast = last.weight - last.margin - (last.blanketMargin || 0);

    const tFirst = new Date(`${first.date}T${first.time || "00:00"}`).getTime();
    const tLast = new Date(`${last.date}T${last.time || "00:00"}`).getTime();

    const totalDays = (tLast - tFirst) / (1000 * 60 * 60 * 24);
    const totalGrams = (netLast - netFirst) * 1000;
    const gPerDay = totalDays > 0 ? totalGrams / totalDays : 0;

    // Consecutive intervals
    const steps = [];
    for (let i = 0; i < selectedList.length - 1; i++) {
      const prev = selectedList[i];
      const curr = selectedList[i + 1];

      const netPrev = prev.weight - prev.margin - (prev.blanketMargin || 0);
      const netCurr = curr.weight - curr.margin - (curr.blanketMargin || 0);

      const tPrev = new Date(`${prev.date}T${prev.time || "00:00"}`).getTime();
      const tCurr = new Date(`${curr.date}T${curr.time || "00:00"}`).getTime();

      const days = (tCurr - tPrev) / (1000 * 60 * 60 * 24);
      const grams = (netCurr - netPrev) * 1000;
      const rate = days > 0 ? grams / days : 0;

      steps.push({
        prev,
        curr,
        netPrev,
        netCurr,
        days,
        grams,
        rate
      });
    }

    return {
      selectedList,
      first,
      last,
      netFirst,
      netLast,
      totalDays,
      totalGrams,
      gPerDay,
      steps
    };
  }, [records, selectedCalcRecordIds]);

  const toggleMultiSelectRecord = (id: string) => {
    if (selectedCalcRecordIds.includes(id)) {
      if (selectedCalcRecordIds.length <= 2) return; // Maintain at least 2
      setSelectedCalcRecordIds(selectedCalcRecordIds.filter((i) => i !== id));
    } else {
      setSelectedCalcRecordIds([...selectedCalcRecordIds, id]);
    }
  };

  // General Metrics (using filtered records)
  const metrics = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        lastWeight: 0,
        lastNetWeight: 0,
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
      lastNetWeight: lastNet,
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
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 25;
    const paddingBottom = 35;

    const computedWidth = paddingLeft + paddingRight + filteredRecords.length * baseWidthPerCandle;
    const width = Math.max(minWidth, computedWidth);
    const height = 260;

    let minY = 0;
    let maxY = 10;

    if (filteredRecords.length > 0) {
      const lows = filteredRecords.map((r) => r.weight - r.margin - (r.blanketMargin || 0));
      const highs = filteredRecords.map((r) => r.weight);
      let absoluteMin = Math.min(...lows);
      let absoluteMax = Math.max(...highs);

      if (showPercentiles && babyBirthDate) {
        filteredRecords.forEach((r) => {
          const age = getAgeInDays(babyBirthDate, r.date);
          const p = getWHOPercentilesAtAge(age, babySex);
          if (p.p3 < absoluteMin) absoluteMin = p.p3;
          if (p.p97 > absoluteMax) absoluteMax = p.p97;
        });
      }

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
  }, [filteredRecords, showPercentiles, babyBirthDate, babySex]);

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

  // WHO Percentile SVG Overlay calculation
  const percentilesData = useMemo(() => {
    if (!showPercentiles || !babyBirthDate || filteredRecords.length === 0) return null;

    const points = filteredRecords.map((r, idx) => {
      const age = getAgeInDays(babyBirthDate, r.date);
      const band = getWHOPercentilesAtAge(age, babySex);
      const x = scaleX(idx);
      return {
        x,
        age,
        date: r.date,
        p3: scaleY(band.p3),
        p15: scaleY(band.p15),
        p50: scaleY(band.p50),
        p85: scaleY(band.p85),
        p97: scaleY(band.p97),
        rawP3: band.p3,
        rawP50: band.p50,
        rawP97: band.p97
      };
    });

    if (points.length === 0) return null;

    const p3Path = points.map((p) => `${p.x},${p.p3}`).join(" ");
    const p15Path = points.map((p) => `${p.x},${p.p15}`).join(" ");
    const p50Path = points.map((p) => `${p.x},${p.p50}`).join(" ");
    const p85Path = points.map((p) => `${p.x},${p.p85}`).join(" ");
    const p97Path = points.map((p) => `${p.x},${p.p97}`).join(" ");

    const forwardP15 = points.map((p) => `${p.x},${p.p15}`);
    const reverseP85 = [...points].reverse().map((p) => `${p.x},${p.p85}`);
    const bandP15P85Polygon = [...forwardP15, ...reverseP85].join(" ");

    return { points, p3Path, p15Path, p50Path, p85Path, p97Path, bandP15P85Polygon };
  }, [showPercentiles, babyBirthDate, babySex, filteredRecords, chartDimensions]);

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (filteredRecords.length === 0 || !chartContainerRef.current) return;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const scrollLeft = chartContainerRef.current.scrollLeft;

    const clientX = e.clientX - rect.left + scrollLeft;

    const baseWidthPerCandle = 75;
    const paddingLeft = 45;
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
        x: Math.max(10, Math.min(rect.width - 220, tooltipX - 90)),
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
          return r.weight - r.margin - (r.blanketMargin || 0);
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
          trendText: "Sin suficientes datos"
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
          trendText: "Pesajes mismo día"
        };
      }

      const growthGrams = (w2 - w1) * 1000;
      const growthRate = growthGrams / daysDiff;

      return {
        scale: site,
        count: siteList.length,
        growthRate,
        trendText: `+${growthRate.toFixed(1)}g/día`
      };
    });
  }, [records, sites]);

  const formatDateLabel = (dStr: string) => {
    const parts = dStr.split("-");
    if (parts.length !== 3) return dStr;
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]}`;
  };

  return (
    <div className="space-y-3 md:space-y-5 flex-1 flex flex-col pb-6">
      {/* Error alert banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs font-bold p-3 rounded-2xl flex items-center gap-2 border border-destructive/20 animate-fade-in">
          <AlertCircle size={15} className="shrink-0" />
          <span className="truncate">{error}</span>
          <button onClick={handleRefresh} className="ml-auto underline cursor-pointer shrink-0">Reintentar</button>
        </div>
      )}

      {/* MOBILE COMPACT HERO & ACTION HEADER */}
      <div className="bg-card border border-border/80 p-3 md:p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Main Title & Key Stats Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
              <Scale size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-black text-foreground tracking-tight leading-tight flex items-center gap-1.5">
                Seguimiento de Peso
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-0.5">
                <span className="whitespace-nowrap">Neto actual: <strong className="text-foreground">{metrics.lastNetWeight > 0 ? `${metrics.lastNetWeight.toFixed(3)} kg` : "—"}</strong></span>
                {metrics.lastNetWeight > 0 && metrics.totalGain !== 0 && (
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 ${metrics.totalGain >= 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600"}`}>
                    {metrics.totalGain >= 0 ? "+" : ""}{metrics.totalGain.toFixed(3)} kg
                  </span>
                )}
                {metrics.lastNetWeight > 0 && filteredRecords.length > 0 && babyBirthDate && (
                  (() => {
                    const lastRec = filteredRecords[filteredRecords.length - 1];
                    const age = getAgeInDays(babyBirthDate, lastRec.date);
                    const pInfo = calculateWHOPercentile(metrics.lastNetWeight, age, babySex);
                    return (
                      <span className="px-2 py-0.5 bg-primary/15 text-primary rounded-full font-extrabold text-[10px] whitespace-nowrap inline-flex items-center shrink-0" title={`Percentil OMS a los ${age} días (${(age / 7).toFixed(1)} sem)`}>
                        {pInfo.label}
                      </span>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition active:scale-95 cursor-pointer"
              title="Ajustes"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-3.5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle size={16} />
              <span>+ Peso</span>
            </button>
          </div>
        </div>

        {/* TOP-LEVEL NAVIGATION SEGMENTS (OPTIMIZED FOR MOBILE UX) */}
        <div className="grid grid-cols-3 bg-muted p-1 rounded-2xl gap-1 text-center">
          <button
            onClick={() => setMainTab("chart")}
            className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mainTab === "chart"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LineChart size={14} />
            <span>Gráfico</span>
          </button>
          <button
            onClick={() => setMainTab("history")}
            className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mainTab === "history"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History size={14} />
            <span>Histórico</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-bold ml-0.5">
              {filteredRecords.length}
            </span>
          </button>
          <button
            onClick={() => setMainTab("analysis")}
            className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mainTab === "analysis"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity size={14} />
            <span>Análisis</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GRÁFICO (Chart + Compact Filter + Interactive Details Card) */}
      {mainTab === "chart" && (
        <div className="space-y-3 animate-fade-in">
          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card p-3 rounded-2xl border border-border/60 shadow-xs flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Último Peso Neto</span>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-xl font-black text-foreground">
                  {metrics.lastNetWeight > 0 ? metrics.lastNetWeight.toFixed(3) : "—"}
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">kg</span>
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5">
                Bruto: {metrics.lastWeight.toFixed(3)}kg | Margen: -{((metrics.lastMargin + metrics.lastBlanketMargin) * 1000).toFixed(0)}g
              </span>
            </div>

            <div className="bg-card p-3 rounded-2xl border border-border/60 shadow-xs flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ganancia Total</span>
              <div className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
                <span className={`text-xl font-black ${metrics.lastNetWeight > 0 && metrics.totalGain < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {metrics.lastNetWeight > 0 ? `${metrics.totalGain >= 0 ? "+" : ""}${metrics.totalGain.toFixed(3)}` : "—"}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">kg</span>
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5">
                Promedio: {metrics.average > 0 ? `${metrics.average.toFixed(3)}kg` : "—"}
              </span>
            </div>
          </div>

          {/* Site Filter Pills supporting both multi-selection group toggle and 1-click single site isolation */}
          <div className="bg-card border border-border/60 p-2.5 rounded-2xl shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                Filtrar por sitio:
              </span>
              <span className="text-[9px] text-muted-foreground">
                Toca para activar/desactivar varios | usa &quot;solo&quot; para aislar 1
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={handleSelectAllSites}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 border ${
                  selectedSites.length === sites.length
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/60 text-muted-foreground border-border/40 hover:text-foreground"
                }`}
              >
                Todas ({sites.length})
              </button>

              {sites.map((site) => {
                const isChecked = selectedSites.includes(site);
                const color = siteColors[site] || { hex: "#888" };
                return (
                  <div
                    key={site}
                    className={`inline-flex items-center rounded-xl text-[10px] font-bold transition border shrink-0 overflow-hidden ${
                      isChecked
                        ? "bg-muted/50 text-foreground border-border"
                        : "bg-transparent border-border/30 text-muted-foreground opacity-50"
                    }`}
                    style={isChecked ? { borderColor: color.hex } : {}}
                  >
                    {/* Main toggle pill for multi-selection */}
                    <button
                      type="button"
                      onClick={() => handleToggleSiteFilter(site)}
                      className="px-2.5 py-1 flex items-center gap-1.5 hover:bg-muted/80 cursor-pointer"
                      title="Activar/desactivar este sitio"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                      <span className="truncate max-w-[110px]" style={isChecked ? { color: color.hex } : {}}>
                        {site}
                      </span>
                    </button>

                    {/* Quick "solo" button to isolate this single scale in 1 click */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOnlySite(site);
                      }}
                      className={`px-1.5 py-1 text-[8px] uppercase tracking-wider font-black border-l border-border/40 hover:bg-primary/20 hover:text-primary cursor-pointer transition ${
                        selectedSites.length === 1 && selectedSites[0] === site
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Ver solo este sitio de pesaje"
                    >
                      solo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Candlestick Chart View */}
          <div className="bg-card border border-border/80 rounded-3xl p-3 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-foreground px-1">
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Sparkles size={13} className="text-primary" /> Velas por pesaje
              </span>

              {/* WHO Percentiles Chart Overlay Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (!babyBirthDate) {
                    setConfigTab("baby");
                    setShowConfigModal(true);
                  } else {
                    setShowPercentiles(!showPercentiles);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1.5 border ${
                  showPercentiles && babyBirthDate
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground"
                }`}
                title={babyBirthDate ? "Activar/desactivar curvas de percentiles OMS" : "Configurar fecha de nacimiento para ver percentiles OMS"}
              >
                <TrendingUp size={12} className={showPercentiles && babyBirthDate ? "text-emerald-500" : ""} />
                <span>Curvas OMS {babySex === "female" ? "👧" : "👦"}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${showPercentiles && babyBirthDate ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                  {showPercentiles && babyBirthDate ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="animate-spin text-primary mb-2" size={28} />
                <span className="text-xs font-bold">Cargando gráfico...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <Scale size={24} className="mx-auto text-muted-foreground/50" />
                <p className="text-xs font-bold text-foreground">Sin datos que mostrar</p>
                <p className="text-[11px] text-muted-foreground">Añade o activa algún sitio de pesaje.</p>
              </div>
            ) : (
              <div className="relative bg-muted/20 rounded-2xl border border-border/40 p-1">
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
                    {/* WHO Percentile Band Overlay */}
                    {percentilesData && (
                      <g className="percentile-overlay opacity-80 pointer-events-none">
                        {/* Shaded central normal area (P15 to P85) */}
                        {percentilesData.points.length > 1 && (
                          <polygon
                            points={percentilesData.bandP15P85Polygon}
                            fill="rgb(16, 185, 129)"
                            fillOpacity="0.08"
                          />
                        )}

                        {/* P3 Outer Curve */}
                        <polyline
                          points={percentilesData.p3Path}
                          fill="none"
                          stroke="rgb(239, 68, 68)"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          strokeOpacity="0.6"
                        />

                        {/* P15 Curve */}
                        <polyline
                          points={percentilesData.p15Path}
                          fill="none"
                          stroke="rgb(245, 158, 11)"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                          strokeOpacity="0.5"
                        />

                        {/* P50 Median Curve */}
                        <polyline
                          points={percentilesData.p50Path}
                          fill="none"
                          stroke="rgb(16, 185, 129)"
                          strokeWidth="2"
                          strokeOpacity="0.85"
                        />

                        {/* P85 Curve */}
                        <polyline
                          points={percentilesData.p85Path}
                          fill="none"
                          stroke="rgb(245, 158, 11)"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                          strokeOpacity="0.5"
                        />

                        {/* P97 Outer Curve */}
                        <polyline
                          points={percentilesData.p97Path}
                          fill="none"
                          stroke="rgb(239, 68, 68)"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          strokeOpacity="0.6"
                        />

                        {/* Curve Labels at the last point */}
                        {percentilesData.points.length > 0 && (() => {
                          const last = percentilesData.points[percentilesData.points.length - 1];
                          return (
                            <g>
                              <text x={last.x + 4} y={last.p97 + 3} fill="currentColor" className="text-[7px] text-rose-500 font-bold">P97</text>
                              <text x={last.x + 4} y={last.p50 + 3} fill="currentColor" className="text-[8px] text-emerald-500 font-black">P50</text>
                              <text x={last.x + 4} y={last.p3 + 3} fill="currentColor" className="text-[7px] text-rose-500 font-bold">P3</text>
                            </g>
                          );
                        })()}
                      </g>
                    )}

                    {/* Horizontal Grid lines */}
                    {Array.from({ length: 4 }).map((_, i) => {
                      const val =
                        chartDimensions.minY +
                        (i / 3) * (chartDimensions.maxY - chartDimensions.minY);
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
                            x={chartDimensions.paddingLeft - 6}
                            y={y + 3}
                            textAnchor="end"
                            fill="currentColor"
                            className="text-muted-foreground font-mono text-[8px] font-bold"
                          >
                            {val.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Candlesticks */}
                    {filteredRecords.map((record, idx) => {
                      const x = scaleX(idx);
                      const yHigh = scaleY(record.weight);
                      const totalMargin = record.margin + (record.blanketMargin || 0);
                      const netWeight = record.weight - totalMargin;
                      const yLow = scaleY(netWeight);

                      const colorDef = siteColors[record.scale] || { fill: "rgb(99, 102, 241)", hex: "#6366f1" };
                      const bodyTop = yHigh;
                      const bodyBottom = yLow;
                      const candleHeight = Math.max(3, bodyBottom - bodyTop);

                      const isHovered = hoveredRecord?._id === record._id;
                      const isSelected = selectedRecord?._id === record._id;

                      return (
                        <g key={record._id}>
                          {/* Touch hit box */}
                          <rect
                            x={x - 25}
                            y={chartDimensions.paddingTop}
                            width={50}
                            height={
                              chartDimensions.height -
                              chartDimensions.paddingTop -
                              chartDimensions.paddingBottom
                            }
                            fill={isHovered || isSelected ? "currentColor" : "transparent"}
                            className={isHovered || isSelected ? "text-primary/10 rounded-xl" : ""}
                            onClick={() => setSelectedRecord(record)}
                          />

                          {/* Wick */}
                          <line
                            x1={x}
                            y1={yLow}
                            x2={x}
                            y2={yHigh}
                            stroke={isSelected ? "var(--color-foreground)" : colorDef.hex}
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                          />

                          {/* Candle body */}
                          <rect
                            x={x - 10}
                            y={bodyTop}
                            width={20}
                            height={candleHeight}
                            fill={colorDef.hex}
                            rx="3"
                            stroke={isSelected ? "var(--color-foreground)" : "none"}
                            strokeWidth="2"
                            className="cursor-pointer"
                            onClick={() => setSelectedRecord(record)}
                          />

                          <circle
                            cx={x}
                            cy={yHigh}
                            r="2"
                            fill="white"
                            stroke={colorDef.hex}
                            strokeWidth="1.5"
                          />

                          {/* Date Label */}
                          <text
                            x={x}
                            y={chartDimensions.height - 15}
                            textAnchor="middle"
                            fill="currentColor"
                            className={`font-bold text-[8px] ${
                              isSelected ? "text-primary font-black" : "text-muted-foreground"
                            }`}
                            onClick={() => setSelectedRecord(record)}
                          >
                            {formatDateLabel(record.date)}
                          </text>

                          {/* Time Label */}
                          <text
                            x={x}
                            y={chartDimensions.height - 6}
                            textAnchor="middle"
                            fill="currentColor"
                            className="text-[7px] text-muted-foreground/70 font-mono"
                            onClick={() => setSelectedRecord(record)}
                          >
                            {record.time}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Selected Record Card Details directly under the chart */}
          {selectedRecord ? (
            <div className="bg-card border-2 border-primary/40 rounded-3xl p-4 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (siteColors[selectedRecord.scale] || { hex: "#888" }).hex }} />
                  <span className="font-black text-sm text-foreground">
                    {formatDateLabel(selectedRecord.date)} - {selectedRecord.time}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 hover:bg-muted rounded-lg text-muted-foreground cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="bg-muted/40 p-2.5 rounded-2xl border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase block font-bold">Peso Bruto (High)</span>
                  <span className="text-base font-black text-foreground">{selectedRecord.weight.toFixed(3)} kg</span>
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase block font-bold">Peso Neto (Low)</span>
                    {babyBirthDate && (
                      (() => {
                        const net = selectedRecord.weight - selectedRecord.margin - (selectedRecord.blanketMargin || 0);
                        const age = getAgeInDays(babyBirthDate, selectedRecord.date);
                        const pInfo = calculateWHOPercentile(net, age, babySex);
                        return (
                          <span className="px-1.5 py-0.2 bg-primary/15 text-primary font-black text-[9px] rounded-md">
                            {pInfo.label}
                          </span>
                        );
                      })()
                    )}
                  </div>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {(selectedRecord.weight - selectedRecord.margin - (selectedRecord.blanketMargin || 0)).toFixed(3)} kg
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 p-2.5 rounded-2xl">
                <div className="flex justify-between">
                  <span>Sitio:</span>
                  <span className="font-bold text-foreground">{selectedRecord.scale}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margen Ropa:</span>
                  <span className="font-mono text-foreground">-{(selectedRecord.margin * 1000).toFixed(0)}g ({selectedRecord.clothes})</span>
                </div>
                <div className="flex justify-between">
                  <span>Margen Manta:</span>
                  <span className="font-mono text-foreground">-{((selectedRecord.blanketMargin || 0) * 1000).toFixed(0)}g ({selectedRecord.blanket || "Ninguna"})</span>
                </div>
                {selectedRecord.notes && (
                  <div className="pt-1.5 border-t border-border/40 italic text-[11px] text-foreground">
                    &ldquo;{selectedRecord.notes}&rdquo;
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(selectedRecord)}
                  className="flex-1 py-2 border border-border bg-muted hover:bg-muted/80 rounded-xl text-xs font-extrabold transition cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteId(selectedRecord._id)}
                  className="flex-1 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-xl text-xs font-extrabold transition cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center italic">
              Toca una vela en la gráfica para desplegar los detalles completos del pesaje.
            </p>
          )}
        </div>
      )}

      {/* TAB 2: HISTÓRICO (Clean Searchable List) */}
      {mainTab === "history" && (
        <div className="space-y-3 animate-fade-in">
          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por fecha, báscula o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {searchFilteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border/60 rounded-3xl p-4 space-y-1">
              <History size={24} className="mx-auto text-muted-foreground/50" />
              <p className="text-xs font-bold text-foreground">No hay pesajes que coincidan</p>
              <p className="text-[11px] text-muted-foreground">Prueba a borrar el filtro de búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchFilteredRecords.map((record) => {
                const netWeight = record.weight - record.margin - (record.blanketMargin || 0);
                const color = siteColors[record.scale] || { hex: "#888" };
                return (
                  <div
                    key={record._id}
                    className="p-3 bg-card border border-border/70 hover:border-primary/40 rounded-2xl shadow-xs space-y-2 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                        <span className="font-extrabold text-xs text-foreground">{record.date}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{record.time}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: `${color.hex}18`, color: color.hex }}>
                        {record.scale}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-xl text-xs">
                      <div>
                        <span className="text-[9px] text-muted-foreground block font-bold">P. Bruto</span>
                        <span className="font-extrabold text-foreground">{record.weight.toFixed(3)} kg</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-bold">P. Neto Real</span>
                          {babyBirthDate && (
                            (() => {
                              const age = getAgeInDays(babyBirthDate, record.date);
                              const pInfo = calculateWHOPercentile(netWeight, age, babySex);
                              return (
                                <span className="px-1.5 py-0.2 bg-primary/15 text-primary font-extrabold text-[8px] rounded-md">
                                  {pInfo.label}
                                </span>
                              );
                            })()
                          )}
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{netWeight.toFixed(3)} kg</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        Ropa: -{(record.margin * 1000).toFixed(0)}g | Manta: -{((record.blanketMargin || 0) * 1000).toFixed(0)}g
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 hover:bg-primary/10 hover:text-primary rounded-lg transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(record._id)}
                          className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-lg transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {record.notes && (
                      <p className="text-[10px] text-muted-foreground italic bg-muted/40 px-2.5 py-1 rounded-lg">
                        &ldquo;{record.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANÁLISIS (Subsections: Comparative Calculator, Trends, Scale Calibration) */}
      {mainTab === "analysis" && (
        <div className="space-y-3 animate-fade-in">
          {/* ANALYSIS SUBSECTION NAVIGATION PILLS */}
          <div className="grid grid-cols-3 bg-muted/70 p-1 rounded-2xl gap-1 text-center border border-border/40">
            <button
              onClick={() => setAnalysisSubTab("comparative")}
              className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                analysisSubTab === "comparative"
                  ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator size={13} />
              <span>Calculadora</span>
            </button>
            <button
              onClick={() => setAnalysisSubTab("trends")}
              className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                analysisSubTab === "trends"
                  ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp size={13} />
              <span>Tendencia</span>
            </button>
            <button
              onClick={() => setAnalysisSubTab("calibration")}
              className={`py-2 px-2 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                analysisSubTab === "calibration"
                  ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity size={13} />
              <span>Calibración</span>
            </button>
          </div>

          {/* SUBSECTION 1: COMPARATIVE WEIGHT CALCULATOR */}
          {analysisSubTab === "comparative" && (
            <div className="space-y-3 animate-fade-in">
              {/* Mode switch & Same Scale Filter header */}
              <div className="bg-card border border-border/80 rounded-3xl p-4 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Calculator size={16} className="text-primary" />
                      <span>Calculadora de Gramos e Incremento Diario</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Compara la ganancia de peso exacta y ritmo en gramos/día entre pesajes.
                    </p>
                  </div>

                  {/* Segmented control for 2 vs Varios */}
                  <div className="flex bg-muted p-1 rounded-xl text-[10px] font-extrabold shrink-0 border border-border/40">
                    <button
                      onClick={() => setCalcMode("pairwise")}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        calcMode === "pairwise" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Entre 2 Pesajes
                    </button>
                    <button
                      onClick={() => setCalcMode("multi")}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        calcMode === "multi" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                    >
                      Entre Varios ({calcAvailableRecords.length})
                    </button>
                  </div>
                </div>

                {/* SAME WEIGHING SITE FILTER PILLS */}
                <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-2xl border border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} className="text-primary" />
                      <span>Filtrar por Sitio de Pesaje:</span>
                    </span>
                    {calcSiteFilter !== "ALL" && (
                      <span className="text-[10px] text-primary font-bold">
                        Calculando solo en: {calcSiteFilter}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setCalcSiteFilter("ALL")}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 border ${
                        calcSiteFilter === "ALL"
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todas las básculas ({records.length})
                    </button>
                    {sites.map((s) => {
                      const count = records.filter((r) => r.scale === s).length;
                      const isSelected = calcSiteFilter === s;
                      const color = siteColors[s] || { hex: "#888" };
                      return (
                        <button
                          key={s}
                          onClick={() => setCalcSiteFilter(s)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                            isSelected
                              ? "bg-card text-foreground shadow-xs"
                              : "bg-card/60 border-border/40 text-muted-foreground opacity-70 hover:opacity-100"
                          }`}
                          style={isSelected ? { borderColor: color.hex, color: color.hex } : {}}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }} />
                          <span className="truncate max-w-[120px]">{s}</span>
                          <span className="text-[9px] opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {calcAvailableRecords.length < 2 ? (
                  <div className="text-center py-6 space-y-1 bg-card rounded-2xl border border-border/40 p-4">
                    <Scale size={20} className="mx-auto text-muted-foreground/50" />
                    <p className="text-xs font-bold text-foreground">Necesitas al menos 2 pesajes para esta selección</p>
                    <p className="text-[11px] text-muted-foreground">
                      {calcSiteFilter !== "ALL"
                        ? `Añade más pesajes en ${calcSiteFilter} o selecciona "Todas las básculas".`
                        : "Añade más pesajes desde el botón '+ Peso'."}
                    </p>
                  </div>
                ) : calcMode === "pairwise" ? (
                  /* PAIRWISE COMPARISON MODE WITH VISUAL SELECTION CARDS IN COLLAPSIBLE ACCORDION */
                  <div className="space-y-3.5">
                    {/* Pairwise Calculation Summary Results Card (PRIMARY FOCUS) */}
                    {comparativePairResult && (
                      <div className="bg-card border-2 border-primary/30 rounded-3xl p-4 space-y-3.5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-foreground border-b border-border/50 pb-2.5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-xl text-xs font-black">
                              {comparativePairResult.rStart.date} ({comparativePairResult.rStart.time})
                            </span>
                            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-xl text-xs font-black">
                              {comparativePairResult.rEnd.date} ({comparativePairResult.rEnd.time})
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono font-bold shrink-0 bg-muted px-2.5 py-1 rounded-xl">
                            {comparativePairResult.diffDays >= 0 ? comparativePairResult.diffDays.toFixed(1) : 0} días transcurridos
                          </span>
                        </div>

                        {/* Same site indicator badge */}
                        {comparativePairResult.rStart.scale === comparativePairResult.rEnd.scale && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <Check size={14} className="shrink-0" />
                            <span>Mismo sitio de pesaje: <strong>{comparativePairResult.rStart.scale}</strong> (sin desfase de calibración)</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {/* Grams Difference KPI */}
                          <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                              Gramos Ganados
                            </span>
                            <div className="mt-1">
                              <span className={`text-2xl font-black ${comparativePairResult.diffGrams >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                                {comparativePairResult.diffGrams >= 0 ? "+" : ""}{comparativePairResult.diffGrams.toFixed(0)}
                              </span>
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 ml-1">g</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                              ({(comparativePairResult.diffGrams / 1000).toFixed(3)} kg)
                            </span>
                          </div>

                          {/* Grams per Day KPI */}
                          <div className="bg-primary/10 p-3.5 rounded-2xl border border-primary/20 flex flex-col justify-between">
                            <span className="text-[9px] font-black text-primary uppercase tracking-wider block">
                              Ritmo Diario (g/día)
                            </span>
                            <div className="mt-1">
                              <span className="text-2xl font-black text-primary">
                                {comparativePairResult.gPerDay >= 0 ? "+" : ""}{comparativePairResult.gPerDay.toFixed(1)}
                              </span>
                              <span className="text-xs font-black text-primary ml-1">g/día</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-0.5">
                              Promedio en el periodo
                            </span>
                          </div>

                          {/* Net Weight Span KPI */}
                          <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/40 flex flex-col justify-between col-span-2 sm:col-span-1">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
                              Peso Neto Inicio / Fin
                            </span>
                            <div className="mt-1 flex items-baseline gap-1 text-foreground font-black text-sm">
                              <span>{comparativePairResult.netStart.toFixed(3)}kg</span>
                              <span className="text-muted-foreground font-normal">→</span>
                              <span>{comparativePairResult.netEnd.toFixed(3)}kg</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground mt-0.5 truncate">
                              {comparativePairResult.rStart.scale} → {comparativePairResult.rEnd.scale}
                            </span>
                          </div>
                        </div>

                        {comparativePairResult.isReversed && (
                          <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center">
                            ⚠️ El pesaje final seleccionado es anterior en fecha al pesaje inicial.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Collapsible Record Picker Accordion */}
                    <div className="bg-muted/20 border border-border/60 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                        className="w-full p-3 flex items-center justify-between font-extrabold text-xs text-foreground bg-muted/30 hover:bg-muted/60 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sliders size={14} className="text-primary" />
                          <span>📋 Cambiar Selección de Pesajes Inicial / Final</span>
                        </span>
                        {isPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isPickerOpen && (
                        <div className="p-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fade-in">
                          {/* Start Record Card Picker */}
                          <div className="space-y-1.5 bg-card/60 p-2.5 rounded-xl border border-border/40">
                            <span className="font-black text-[10px] text-muted-foreground uppercase block tracking-wider">
                              1️⃣ Pesaje Inicial (A)
                            </span>
                            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                              {calcAvailableRecords.map((r) => {
                                const net = r.weight - r.margin - (r.blanketMargin || 0);
                                const color = siteColors[r.scale] || { hex: "#888" };
                                const isSelected = r._id === calcStartId;
                                return (
                                  <button
                                    key={r._id}
                                    type="button"
                                    onClick={() => setCalcStartId(r._id)}
                                    className={`w-full text-left p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? "bg-card border-primary ring-2 ring-primary/20 text-foreground shadow-xs"
                                        : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-card"
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                                        <span className="font-extrabold text-foreground text-xs">{r.date}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{r.time}</span>
                                      </div>
                                      <span className="text-[9px] text-muted-foreground truncate block mt-0.5">
                                        {r.scale}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`font-mono font-black text-xs block ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {net.toFixed(3)} kg
                                      </span>
                                      <span className="text-[8px] text-muted-foreground">Neto</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* End Record Card Picker */}
                          <div className="space-y-1.5 bg-card/60 p-2.5 rounded-xl border border-border/40">
                            <span className="font-black text-[10px] text-muted-foreground uppercase block tracking-wider">
                              2️⃣ Pesaje Final (B)
                            </span>
                            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                              {calcAvailableRecords.map((r) => {
                                const net = r.weight - r.margin - (r.blanketMargin || 0);
                                const color = siteColors[r.scale] || { hex: "#888" };
                                const isSelected = r._id === calcEndId;
                                return (
                                  <button
                                    key={r._id}
                                    type="button"
                                    onClick={() => setCalcEndId(r._id)}
                                    className={`w-full text-left p-2 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                      isSelected
                                        ? "bg-card border-primary ring-2 ring-primary/20 text-foreground shadow-xs"
                                        : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-card"
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                                        <span className="font-extrabold text-foreground text-xs">{r.date}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{r.time}</span>
                                      </div>
                                      <span className="text-[9px] text-muted-foreground truncate block mt-0.5">
                                        {r.scale}
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className={`font-mono font-black text-xs block ${isSelected ? "text-primary" : "text-foreground"}`}>
                                        {net.toFixed(3)} kg
                                      </span>
                                      <span className="text-[8px] text-muted-foreground">Neto</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* MULTI RECORD COMPARISON MODE WITH COLLAPSIBLE ACCORDION BREAKDOWN */
                  <div className="space-y-3">
                    {/* Multi Result Summary Cards */}
                    {comparativeMultiResult && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                              Total Crecimiento
                            </span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                              +{comparativeMultiResult.totalGrams.toFixed(0)}g
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              en {comparativeMultiResult.totalDays.toFixed(1)} días
                            </span>
                          </div>

                          <div className="bg-primary/10 p-3.5 rounded-2xl border border-primary/20">
                            <span className="text-[9px] font-black text-primary uppercase tracking-wider block">
                              Promedio Total
                            </span>
                            <span className="text-2xl font-black text-primary mt-1 block">
                              +{comparativeMultiResult.gPerDay.toFixed(1)}g/día
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              ritmo medio global
                            </span>
                          </div>

                          <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/40 col-span-2 sm:col-span-1">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
                              Intervalos Evaluados
                            </span>
                            <span className="text-xl font-black text-foreground mt-1 block">
                              {comparativeMultiResult.steps.length} tramos
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold truncate block">
                              {comparativeMultiResult.first.date} → {comparativeMultiResult.last.date}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Selection List Accordion */}
                        <div className="bg-muted/20 border border-border/60 rounded-2xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className="w-full p-3 flex items-center justify-between font-extrabold text-xs text-foreground bg-muted/30 hover:bg-muted/60 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Check size={14} className="text-primary" />
                              <span>📋 Seleccionar Pesajes Incluidos ({selectedCalcRecordIds.filter((id) => calcAvailableRecords.some((r) => r._id === id)).length})</span>
                            </span>
                            {isPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {isPickerOpen && (
                            <div className="p-3 border-t border-border/40 max-h-[220px] overflow-y-auto space-y-1.5 animate-fade-in">
                              {calcAvailableRecords.map((r) => {
                                const net = r.weight - r.margin - (r.blanketMargin || 0);
                                const isChecked = selectedCalcRecordIds.includes(r._id);
                                const color = siteColors[r.scale] || { hex: "#888" };
                                return (
                                  <div
                                    key={r._id}
                                    onClick={() => toggleMultiSelectRecord(r._id)}
                                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                                      isChecked
                                        ? "bg-card border-primary/50 text-foreground shadow-xs"
                                        : "bg-card/40 border-border/30 text-muted-foreground hover:bg-card/80"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}}
                                        className="rounded text-primary focus:ring-primary/30 shrink-0"
                                      />
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                                      <div className="truncate">
                                        <span className="font-extrabold text-xs text-foreground block leading-tight">
                                          {r.date} <span className="text-[10px] font-mono text-muted-foreground">({r.time})</span>
                                        </span>
                                        <span className="text-[9px] text-muted-foreground truncate block">
                                          {r.scale}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-black text-xs text-foreground block">
                                        {net.toFixed(3)} kg
                                      </span>
                                      <span className="text-[8px] text-muted-foreground">Neto</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Collapsible Breakdown Accordion */}
                        <div className="bg-muted/20 border border-border/60 rounded-2xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
                            className="w-full p-3 flex items-center justify-between font-extrabold text-xs text-foreground bg-muted/30 hover:bg-muted/60 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <TrendingUp size={14} className="text-primary" />
                              <span>📊 Ver Desglose por Tramo Consecutivo ({comparativeMultiResult.steps.length})</span>
                            </span>
                            {isBreakdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {isBreakdownOpen && (
                            <div className="p-3 border-t border-border/40 space-y-1.5 max-h-[220px] overflow-y-auto animate-fade-in">
                              {comparativeMultiResult.steps.map((step, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-card border border-border/40 rounded-xl flex items-center justify-between text-xs font-bold"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-muted-foreground font-mono text-[10px]">#{idx + 1}</span>
                                    <span className="truncate">{step.prev.date} → {step.curr.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`font-mono font-black ${step.grams >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                                      {step.grams >= 0 ? "+" : ""}{step.grams.toFixed(0)}g
                                    </span>
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono text-[10px] rounded-md">
                                      {step.rate.toFixed(1)}g/día
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBSECTION 2: GROWTH TRENDS BY SCALE */}
          {analysisSubTab === "trends" && (
            <div className="bg-card border border-border/80 rounded-3xl p-4 shadow-xs space-y-3 animate-fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>Ritmo de Crecimiento por Báscula</span>
              </h3>

              {siteTrends.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin datos suficientes.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siteTrends.map((trend) => {
                    const color = siteColors[trend.scale] || { hex: "#888" };
                    return (
                      <div
                        key={trend.scale}
                        className="p-3 bg-muted/30 border border-border/50 rounded-2xl space-y-1"
                        style={{ borderLeft: `3px solid ${color.hex}` }}
                      >
                        <div className="flex justify-between items-center text-xs font-bold text-foreground">
                          <span className="truncate pr-1">{trend.scale}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{trend.count} pesajes</span>
                        </div>
                        {trend.count <= 1 ? (
                          <p className="text-[10px] text-muted-foreground italic">Insuficiente para tendencia</p>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{trend.growthRate.toFixed(1)}g</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">por día</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBSECTION 3: SCALE CALIBRATION */}
          {analysisSubTab === "calibration" && (
            <div className="bg-card border border-border/80 rounded-3xl p-4 shadow-xs space-y-3 animate-fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Activity size={16} className="text-primary" />
                <span>Calibración de Básculas</span>
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Calcula el desfase promedio de peso respecto a la báscula de referencia (<strong>{sites[0] || "Principal"}</strong>) por interpolación lineal.
              </p>

              {calibrationData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Registra pesajes en más de una báscula para ver la calibración.</p>
              ) : (
                <div className="space-y-2">
                  {calibrationData.map((cal) => {
                    const absGrams = Math.abs(cal.offset * 1000);
                    const isPos = cal.offset >= 0;
                    return (
                      <div key={cal.scale} className="p-3 bg-muted/30 border border-border/50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-foreground block">{cal.scale}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {cal.method === "direct" ? "Mismo día" : "Interpolado"} ({cal.pointsCount} pts)
                          </span>
                        </div>
                        {cal.method === "insufficient" ? (
                          <span className="text-[10px] text-muted-foreground italic">Sin puntos</span>
                        ) : (
                          <div className="text-right">
                            <span className={`font-black text-sm block ${isPos ? "text-rose-500" : "text-emerald-500"}`}>
                              {isPos ? "+" : "-"}{absGrams.toFixed(0)}g
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              vs {sites[0]}
                            </span>
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
      )}

      {/* Popover Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl p-5 md:p-6 flex flex-col my-auto max-h-[85dvh] sm:max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Scale size={18} />
                </div>
                <h3 className="font-extrabold text-foreground text-sm tracking-tight">
                  {formId ? "Editar Pesaje" : "Nuevo Registro de Peso"}
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
            <div className="flex-1 overflow-y-auto py-3 pr-1 scrollbar-thin">
              <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {/* Date Input */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Fecha</label>
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full pl-8 pr-2 py-2 bg-muted/60 border border-border rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Time Input */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase text-[9px]">Hora</label>
                  <div className="relative">
                    <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="block w-full pl-8 pr-2 py-2 bg-muted/60 border border-border rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Input */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px] flex items-center justify-between">
                  <span>Peso Bruto en Báscula (kg)</span>
                  <span className="text-[9px] text-primary lowercase font-medium">e.g. 2.570 = 2kg 570g</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="2.570"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-muted/60 border-2 border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/40 font-black text-base"
                />
              </div>

              {/* Vestimenta Pre-selection */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Vestimenta</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {clothing.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleClothesChange(preset.name)}
                      className={`px-2 py-1.5 rounded-xl text-center font-bold text-[10px] border transition cursor-pointer ${
                        clothes === preset.name
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border text-muted-foreground"
                      }`}
                    >
                      {preset.name} (-{(preset.margin * 1000).toFixed(0)}g)
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin Input */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px] flex items-center justify-between">
                  <span>Margen Ropa (kg)</span>
                  <span className="font-mono text-primary text-[10px]">±{(parseFloat(margin || "0") * 1000).toFixed(0)}g</span>
                </label>
                <input
                  type="number"
                  step="0.005"
                  required
                  value={margin}
                  onChange={(e) => handleMarginChange(e.target.value)}
                  className="block w-full px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none font-mono font-bold text-xs"
                />
              </div>

              {/* Blanket Pre-selection */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Manta / Trapo</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {blankets.map((preset) => (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => handleBlanketChange(preset.name)}
                      className={`px-2 py-1.5 rounded-xl text-center font-bold text-[10px] border transition cursor-pointer ${
                        blanket === preset.name
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border text-muted-foreground"
                      }`}
                    >
                      {preset.name} (-{(preset.margin * 1000).toFixed(0)}g)
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale selection */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Sitio de pesaje</label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {sites.map((siteName) => (
                    <button
                      type="button"
                      key={siteName}
                      onClick={() => setScale(siteName)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition cursor-pointer ${
                        scale === siteName
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/60 border-border text-muted-foreground"
                      }`}
                    >
                      {siteName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[9px]">Notas (Opcional)</label>
                <textarea
                  placeholder="Notas adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="block w-full px-3 py-1.5 bg-muted/60 border border-border rounded-xl font-medium text-xs outline-none"
                />
              </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-2.5 bg-muted rounded-xl font-extrabold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-2.5 bg-primary text-primary-foreground disabled:opacity-50 rounded-xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={14} />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Config Customization Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card border border-border/90 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-5 md:p-6 flex flex-col my-auto max-h-[85dvh] sm:max-h-[90vh] overflow-hidden animate-fade-in text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground tracking-tight text-sm leading-none">
                    Configuración de Básculas y Márgenes
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">
                    Gestiona los parámetros para el cálculo del peso neto real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Internal Navigation Sub-Tabs */}
            <div className="grid grid-cols-4 bg-muted/80 p-1 rounded-2xl gap-1 mt-3.5 shrink-0 text-center border border-border/30">
              <button
                onClick={() => setConfigTab("baby")}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  configTab === "baby"
                    ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar size={13} />
                <span>Bebé/OMS</span>
              </button>
              <button
                onClick={() => setConfigTab("sites")}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  configTab === "sites"
                    ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapPin size={13} />
                <span>Sitios</span>
                <span className="text-[8px] px-1 py-0.2 bg-primary/10 text-primary rounded-full font-black">
                  {sites.length}
                </span>
              </button>
              <button
                onClick={() => setConfigTab("clothing")}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  configTab === "clothing"
                    ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shirt size={13} />
                <span>Ropa</span>
                <span className="text-[8px] px-1 py-0.2 bg-primary/10 text-primary rounded-full font-black">
                  {clothing.length}
                </span>
              </button>
              <button
                onClick={() => setConfigTab("blankets")}
                className={`py-2 px-1 text-[11px] font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  configTab === "blankets"
                    ? "bg-card text-foreground shadow-xs border border-border/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers size={13} />
                <span>Mantas</span>
                <span className="text-[8px] px-1 py-0.2 bg-primary/10 text-primary rounded-full font-black">
                  {blankets.length}
                </span>
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto py-3.5 space-y-4 pr-1 scrollbar-thin">
              {/* Baby OMS Profile Section */}
              {configTab === "baby" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 space-y-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider block">
                      Perfil del Bebé para Percentiles OMS
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Introduce la fecha de nacimiento y sexo para superponer en el gráfico y tablas las curvas de crecimiento oficiales de la OMS.
                    </p>
                  </div>

                  {/* Birth Date Input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[10px] block">
                      Fecha de Nacimiento
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        value={babyBirthDate}
                        onChange={(e) => {
                          setBabyBirthDate(e.target.value);
                          handleSaveConfig(sites, clothing, blankets, e.target.value, babySex);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 bg-card border border-border/80 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs"
                      />
                    </div>
                  </div>

                  {/* Sex Selection */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase text-[10px] block">
                      Sexo (Estándares OMS)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBabySex("female");
                          handleSaveConfig(sites, clothing, blankets, babyBirthDate, "female");
                        }}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                          babySex === "female"
                            ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-xs"
                            : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>👧 Niña (Girls)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBabySex("male");
                          handleSaveConfig(sites, clothing, blankets, babyBirthDate, "male");
                        }}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-2 ${
                          babySex === "male"
                            ? "bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-black shadow-xs"
                            : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>👦 Niño (Boys)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sites Section */}
              {configTab === "sites" && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Básculas y Ubicaciones
                    </span>
                    <span className="text-[10px] text-muted-foreground">La primera báscula es la de referencia</span>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {sites.map((s, idx) => {
                      const isEditing = editingSite === s;
                      return (
                        <div
                          key={s}
                          className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 text-xs font-extrabold text-foreground transition gap-2"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (siteColors[s] || { hex: "#888" }).hex }} />
                              <input
                                type="text"
                                value={editSiteValue}
                                onChange={(e) => setEditSiteValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSaveEditSite(s);
                                  } else if (e.key === "Escape") {
                                    handleCancelEditSite();
                                  }
                                }}
                                autoFocus
                                className="flex-1 px-2 py-1 bg-card border border-primary rounded-lg text-xs font-bold outline-none"
                              />
                              <button
                                onClick={() => handleSaveEditSite(s)}
                                className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 rounded-xl transition cursor-pointer shrink-0"
                                title="Guardar cambios"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelEditSite}
                                className="p-1.5 text-muted-foreground hover:bg-muted rounded-xl transition cursor-pointer shrink-0"
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (siteColors[s] || { hex: "#888" }).hex }} />
                                <span className="truncate">{s}</span>
                                {idx === 0 && (
                                  <span className="px-2 py-0.5 bg-primary/15 text-primary text-[9px] font-extrabold rounded-md uppercase tracking-wider shrink-0">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEditSite(s)}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition cursor-pointer"
                                  title="Editar báscula"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveSite(s)}
                                  disabled={sites.length <= 1}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition disabled:opacity-30 cursor-pointer"
                                  title="Eliminar báscula"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add site card container */}
                  <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-foreground block">
                      Añadir nueva báscula
                    </span>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Ej. Báscula Abuelos"
                          value={newSite}
                          onChange={(e) => setNewSite(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-card border border-border/80 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs"
                        />
                      </div>
                      <button
                        onClick={handleAddSite}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl transition active:scale-95 cursor-pointer text-xs shrink-0 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Clothing presets section */}
              {configTab === "clothing" && (
                <div className="space-y-3.5 animate-fade-in">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Presets de Vestimenta y Márgenes
                  </span>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {clothing.map((preset) => {
                      const isEditing = editingClothing === preset.name;
                      return (
                        <div
                          key={preset.name}
                          className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 text-xs font-extrabold text-foreground transition gap-2"
                        >
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Shirt size={14} className="text-primary/70 shrink-0" />
                                <input
                                  type="text"
                                  value={editClothingName}
                                  onChange={(e) => setEditClothingName(e.target.value)}
                                  placeholder="Nombre"
                                  autoFocus
                                  className="flex-1 px-2 py-1 bg-card border border-primary rounded-lg text-xs font-bold outline-none min-w-0"
                                />
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  step="0.005"
                                  value={editClothingMargin}
                                  onChange={(e) => setEditClothingMargin(e.target.value)}
                                  placeholder="kg"
                                  className="w-20 px-2 py-1 bg-card border border-primary rounded-lg text-xs font-mono font-bold outline-none"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">kg</span>
                                <button
                                  onClick={() => handleSaveEditClothing(preset.name)}
                                  className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 rounded-xl transition cursor-pointer shrink-0"
                                  title="Guardar cambios"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={handleCancelEditClothing}
                                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-xl transition cursor-pointer shrink-0"
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <Shirt size={14} className="text-primary/70 shrink-0" />
                                <span className="truncate">{preset.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-mono font-extrabold text-[11px] rounded-full">
                                  -{(preset.margin * 1000).toFixed(0)}g
                                </span>
                                <button
                                  onClick={() => handleStartEditClothing(preset)}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition cursor-pointer"
                                  title="Editar preset"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveClothing(preset.name)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition cursor-pointer"
                                  title="Eliminar preset"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add clothing card container */}
                  <div className="p-3.5 bg-muted/20 border border-border/60 rounded-2xl space-y-2.5">
                    <span className="text-[10px] font-bold text-foreground block">
                      Añadir preset de vestimenta
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre (ej. Pijama grueso)"
                        value={newClothingName}
                        onChange={(e) => setNewClothingName(e.target.value)}
                        className="px-3 py-2 bg-card border border-border/80 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs"
                      />
                      <input
                        type="number"
                        step="0.005"
                        placeholder="Margen en kg (ej. 0.08)"
                        value={newClothingMargin}
                        onChange={(e) => setNewClothingMargin(e.target.value)}
                        className="px-3 py-2 bg-card border border-border/80 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs font-mono"
                      />
                    </div>
                    <button
                      onClick={handleAddClothing}
                      className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-xs"
                    >
                      <Plus size={14} />
                      Añadir Presets Ropa
                    </button>
                  </div>
                </div>
              )}

              {/* Blanket presets section */}
              {configTab === "blankets" && (
                <div className="space-y-3.5 animate-fade-in">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Presets de Mantas, Trapos y Toallas
                  </span>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {blankets.map((preset) => {
                      const isEditing = editingBlanket === preset.name;
                      return (
                        <div
                          key={preset.name}
                          className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 text-xs font-extrabold text-foreground transition gap-2"
                        >
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Layers size={14} className="text-primary/70 shrink-0" />
                                <input
                                  type="text"
                                  value={editBlanketName}
                                  onChange={(e) => setEditBlanketName(e.target.value)}
                                  placeholder="Nombre"
                                  autoFocus
                                  className="flex-1 px-2 py-1 bg-card border border-primary rounded-lg text-xs font-bold outline-none min-w-0"
                                />
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  step="0.005"
                                  value={editBlanketMargin}
                                  onChange={(e) => setEditBlanketMargin(e.target.value)}
                                  placeholder="kg"
                                  className="w-20 px-2 py-1 bg-card border border-primary rounded-lg text-xs font-mono font-bold outline-none"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">kg</span>
                                <button
                                  onClick={() => handleSaveEditBlanket(preset.name)}
                                  className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 rounded-xl transition cursor-pointer shrink-0"
                                  title="Guardar cambios"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={handleCancelEditBlanket}
                                  className="p-1.5 text-muted-foreground hover:bg-muted rounded-xl transition cursor-pointer shrink-0"
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <Layers size={14} className="text-primary/70 shrink-0" />
                                <span className="truncate">{preset.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-mono font-extrabold text-[11px] rounded-full">
                                  -{(preset.margin * 1000).toFixed(0)}g
                                </span>
                                <button
                                  onClick={() => handleStartEditBlanket(preset)}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition cursor-pointer"
                                  title="Editar preset"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveBlanket(preset.name)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition cursor-pointer"
                                  title="Eliminar preset"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add blanket card container */}
                  <div className="p-3.5 bg-muted/20 border border-border/60 rounded-2xl space-y-2.5">
                    <span className="text-[10px] font-bold text-foreground block">
                      Añadir preset de manta / trapo
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre (ej. Manta de lana)"
                        value={newBlanketName}
                        onChange={(e) => setNewBlanketName(e.target.value)}
                        className="px-3 py-2 bg-card border border-border/80 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs"
                      />
                      <input
                        type="number"
                        step="0.005"
                        placeholder="Margen en kg (ej. 0.15)"
                        value={newBlanketMargin}
                        onChange={(e) => setNewBlanketMargin(e.target.value)}
                        className="px-3 py-2 bg-card border border-border/80 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-bold text-xs font-mono"
                      />
                    </div>
                    <button
                      onClick={handleAddBlanket}
                      className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-xs"
                    >
                      <Plus size={14} />
                      Añadir Preset Manta
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2.5 border-t border-border/60 shrink-0">
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground font-black text-xs rounded-xl cursor-pointer transition active:scale-98"
              >
                Cerrar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-sm rounded-[2rem] shadow-2xl p-6 flex flex-col space-y-4 text-center text-xs">
            <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-extrabold text-foreground text-sm">
              ¿Eliminar medición de peso?
            </h3>
            <p className="text-muted-foreground">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 bg-muted rounded-xl font-bold cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-2 bg-destructive text-destructive-foreground disabled:opacity-50 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                {deleting ? <RefreshCw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
