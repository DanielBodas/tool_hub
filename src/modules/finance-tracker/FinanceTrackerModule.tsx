"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Plane,
  PieChart,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  Info,
  RefreshCw,
  Coins,
  X,
  Settings as SettingsIcon,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles,
  DollarSign,
  ChevronRight,
  Sliders,
} from "lucide-react";

// --- TYPES ---
export interface LiquidData {
  totalLiquidity: number;
  monthlyExpenses: number;
  lastUpdated?: string;
  notes?: string;
}

export interface AirbusPackage {
  id: string;
  year: number;
  purchasedShares: number; // X
  bonusShares: number; // Y
  purchasePrice: number; // Out-of-pocket price paid per purchased share
  officialPrice: number; // Official reference price for tax calculation
  marketPrice: number; // Current valuation / market price per share
  yearGranted: number; // Grant year (lockup 3 years)
  sold: boolean;
  soldPrice?: number;
  notes?: string;
}

export interface OtherInvestment {
  id: string;
  name: string;
  category: "crypto" | "funds" | "stocks" | "real_estate" | "other";
  initialValue: number;
  currentValue: number;
  notes?: string;
}

export interface Settings {
  targetInvestmentRatio: number; // e.g. 60% max
  taxRate: number; // e.g. 19%
}

const LOCAL_STORAGE_KEY = "finance_tracker_data_v2";

export function FinanceTrackerModule() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "liquidity" | "airbus" | "other"
  >("dashboard");

  // State
  const [liquidity, setLiquidity] = useState<LiquidData>({
    totalLiquidity: 20500,
    monthlyExpenses: 2000,
  });
  const [airbusPackages, setAirbusPackages] = useState<AirbusPackage[]>([]);
  const [otherInvestments, setOtherInvestments] = useState<OtherInvestment[]>(
    []
  );
  const [settings, setSettings] = useState<Settings>({
    targetInvestmentRatio: 60,
    taxRate: 19,
  });

  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "synced" | "saving" | "error" | "offline"
  >("synced");

  // Simulation & Modal states
  const [selectedAirbusSimId, setSelectedAirbusSimId] = useState<string | "all">("all");
  const [simMarketPriceOverride, setSimMarketPriceOverride] = useState<string>("");

  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  const [liquidityForm, setLiquidityForm] = useState({
    totalLiquidity: "20500",
    monthlyExpenses: "2000",
    notes: "",
  });

  const [showAirbusModal, setShowAirbusModal] = useState(false);
  const [editingAirbus, setEditingAirbus] = useState<AirbusPackage | null>(null);
  const currentYear = new Date().getFullYear();
  const [airbusForm, setAirbusForm] = useState({
    year: String(currentYear),
    purchasedShares: "",
    bonusShares: "",
    purchasePrice: "",
    officialPrice: "",
    marketPrice: "142.50",
    yearGranted: String(currentYear),
    sold: false,
    soldPrice: "",
    notes: "",
  });

  const [showOtherModal, setShowOtherModal] = useState(false);
  const [editingOther, setEditingOther] = useState<OtherInvestment | null>(null);
  const [otherForm, setOtherForm] = useState({
    name: "",
    category: "funds" as OtherInvestment["category"],
    initialValue: "",
    currentValue: "",
    notes: "",
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    targetInvestmentRatio: "60",
    taxRate: "19",
  });

  // --- INITIAL LOAD & PERSISTENCE ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let loadedFromApi = false;

      try {
        const res = await fetch("/api/finance-tracker");
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            if (data.liquidity) {
              setLiquidity(data.liquidity);
            } else if (Array.isArray(data.liquidAccounts) && data.liquidAccounts.length > 0) {
              const total = data.liquidAccounts.reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0);
              setLiquidity({ totalLiquidity: total, monthlyExpenses: 2000 });
            }
            setAirbusPackages(data.airbusPackages || []);
            setOtherInvestments(data.otherInvestments || []);
            if (data.settings) {
              setSettings({
                targetInvestmentRatio: data.settings.targetInvestmentRatio ?? 60,
                taxRate: data.settings.taxRate ?? 19,
              });
            }
            loadedFromApi = true;
            setSyncStatus("synced");
          }
        }
      } catch (e) {
        console.warn("API fetch failed, falling back to local storage:", e);
      }

      if (!loadedFromApi) {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.liquidity) setLiquidity(parsed.liquidity);
            setAirbusPackages(parsed.airbusPackages || []);
            setOtherInvestments(parsed.otherInvestments || []);
            if (parsed.settings) setSettings(parsed.settings);
          } catch (e) {
            console.error("Error parsing local storage:", e);
          }
        } else {
          // Pre-seed mock data
          const sampleAirbus: AirbusPackage[] = [
            {
              id: "a1",
              year: 2022,
              purchasedShares: 30,
              bonusShares: 15,
              purchasePrice: 105.5,
              officialPrice: 112.0,
              marketPrice: 142.5,
              yearGranted: 2022,
              sold: false,
              notes: "Plan ESOP 2022",
            },
            {
              id: "a2",
              year: 2023,
              purchasedShares: 25,
              bonusShares: 12,
              purchasePrice: 118.0,
              officialPrice: 124.0,
              marketPrice: 142.5,
              yearGranted: 2023,
              sold: false,
              notes: "Plan ESOP 2023",
            },
            {
              id: "a3",
              year: 2024,
              purchasedShares: 35,
              bonusShares: 18,
              purchasePrice: 130.0,
              officialPrice: 138.0,
              marketPrice: 142.5,
              yearGranted: 2024,
              sold: false,
              notes: "Plan ESOP 2024",
            },
          ];
          const sampleOther: OtherInvestment[] = [
            { id: "o1", name: "MSCI World ETF Indexado", category: "funds", initialValue: 15000, currentValue: 18400, notes: "Fondo global" },
            { id: "o2", name: "Criptomonedas Diversificadas", category: "crypto", initialValue: 3000, currentValue: 4200, notes: "BTC & ETH" },
          ];
          setAirbusPackages(sampleAirbus);
          setOtherInvestments(sampleOther);
        }
        setSyncStatus("offline");
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const saveData = async (
    newLiquidity: LiquidData,
    newAirbus: AirbusPackage[],
    newOther: OtherInvestment[],
    newSettings: Settings
  ) => {
    setSaving(true);
    setSyncStatus("saving");

    const payload = {
      liquidity: newLiquidity,
      airbusPackages: newAirbus,
      otherInvestments: newOther,
      settings: newSettings,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Local storage save error:", e);
    }

    try {
      const res = await fetch("/api/finance-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("offline");
      }
    } catch (e) {
      console.warn("API save error:", e);
      setSyncStatus("offline");
    } finally {
      setSaving(false);
    }
  };

  // --- DERIVED CALCULATIONS ---
  const calculations = useMemo(() => {
    // 1. Total Liquidity & Months of Runway
    const totalLiquidity = Number(liquidity.totalLiquidity) || 0;
    const monthlyExpenses = Number(liquidity.monthlyExpenses) || 1;
    const runwayMonths = monthlyExpenses > 0 ? totalLiquidity / monthlyExpenses : 0;

    // 2. Airbus Investments
    let totalAirbusShares = 0;
    let totalAirbusPaidOutOfPocket = 0;
    let totalAirbusOfficialCostBasis = 0;
    let totalAirbusMarketValue = 0;
    let totalAirbusTaxableMargin = 0;
    let totalAirbusEstimatedTax = 0;
    let totalAirbusUnlockedValue = 0;
    let totalAirbusLockedValue = 0;

    airbusPackages.forEach((pkg) => {
      if (pkg.sold) return;

      const totalShares = (Number(pkg.purchasedShares) || 0) + (Number(pkg.bonusShares) || 0);
      const paid = (Number(pkg.purchasedShares) || 0) * (Number(pkg.purchasePrice) || 0);
      const officialBasis = totalShares * (Number(pkg.officialPrice) || 0);
      const mktValue = totalShares * (Number(pkg.marketPrice) || 0);

      const taxableMargin = Math.max(0, mktValue - officialBasis);
      const tax = taxableMargin * (settings.taxRate / 100);

      totalAirbusShares += totalShares;
      totalAirbusPaidOutOfPocket += paid;
      totalAirbusOfficialCostBasis += officialBasis;
      totalAirbusMarketValue += mktValue;
      totalAirbusTaxableMargin += taxableMargin;
      totalAirbusEstimatedTax += tax;

      const isLocked = (currentYear - pkg.yearGranted) < 3;
      if (isLocked) {
        totalAirbusLockedValue += mktValue;
      } else {
        totalAirbusUnlockedValue += mktValue;
      }
    });

    const totalAirbusNetProfitIfSold =
      totalAirbusMarketValue - totalAirbusPaidOutOfPocket - totalAirbusEstimatedTax;

    // 3. Other Investments
    const totalOtherInvestmentsInitial = otherInvestments.reduce(
      (sum, o) => sum + (Number(o.initialValue) || 0),
      0
    );
    const totalOtherInvestmentsCurrent = otherInvestments.reduce(
      (sum, o) => sum + (Number(o.currentValue) || 0),
      0
    );
    const totalOtherInvestmentsGain =
      totalOtherInvestmentsCurrent - totalOtherInvestmentsInitial;

    // 4. Totals & Ratios
    const totalInvestments = totalAirbusMarketValue + totalOtherInvestmentsCurrent;
    const totalNetWorth = totalLiquidity + totalInvestments;

    const investmentRatio =
      totalNetWorth > 0 ? (totalInvestments / totalNetWorth) * 100 : 0;
    const liquidityRatio =
      totalNetWorth > 0 ? (totalLiquidity / totalNetWorth) * 100 : 0;

    let healthStatus: "safe" | "warning" | "caution" = "safe";
    if (investmentRatio > settings.targetInvestmentRatio + 10) {
      healthStatus = "warning";
    } else if (investmentRatio > settings.targetInvestmentRatio) {
      healthStatus = "caution";
    }

    return {
      totalLiquidity,
      monthlyExpenses,
      runwayMonths,
      totalAirbusShares,
      totalAirbusPaidOutOfPocket,
      totalAirbusOfficialCostBasis,
      totalAirbusMarketValue,
      totalAirbusTaxableMargin,
      totalAirbusEstimatedTax,
      totalAirbusUnlockedValue,
      totalAirbusLockedValue,
      totalAirbusNetProfitIfSold,
      totalOtherInvestmentsInitial,
      totalOtherInvestmentsCurrent,
      totalOtherInvestmentsGain,
      totalInvestments,
      totalNetWorth,
      investmentRatio,
      liquidityRatio,
      healthStatus,
    };
  }, [liquidity, airbusPackages, otherInvestments, settings, currentYear]);

  // --- SIMULATION CALCULATIONS ---
  const simulation = useMemo(() => {
    const packagesToSimulate =
      selectedAirbusSimId === "all"
        ? airbusPackages.filter((p) => !p.sold)
        : airbusPackages.filter((p) => p.id === selectedAirbusSimId && !p.sold);

    let totalSimShares = 0;
    let totalSimPaid = 0;
    let totalSimOfficialBasis = 0;
    let totalSimGrossProceeds = 0;

    packagesToSimulate.forEach((pkg) => {
      const shares = pkg.purchasedShares + pkg.bonusShares;
      const effectivePrice = simMarketPriceOverride
        ? parseFloat(simMarketPriceOverride) || pkg.marketPrice
        : pkg.marketPrice;

      const paid = pkg.purchasedShares * pkg.purchasePrice;
      const official = shares * pkg.officialPrice;
      const gross = shares * effectivePrice;

      totalSimShares += shares;
      totalSimPaid += paid;
      totalSimOfficialBasis += official;
      totalSimGrossProceeds += gross;
    });

    const simTaxableMargin = Math.max(0, totalSimGrossProceeds - totalSimOfficialBasis);
    const simTax = simTaxableMargin * (settings.taxRate / 100);
    const simNetProceeds = totalSimGrossProceeds - simTax;
    const simRealNetProfit = totalSimGrossProceeds - totalSimPaid - simTax;
    const simRoi = totalSimPaid > 0 ? (simRealNetProfit / totalSimPaid) * 100 : 0;

    return {
      totalSimShares,
      totalSimPaid,
      totalSimOfficialBasis,
      totalSimGrossProceeds,
      simTaxableMargin,
      simTax,
      simNetProceeds,
      simRealNetProfit,
      simRoi,
    };
  }, [airbusPackages, selectedAirbusSimId, simMarketPriceOverride, settings]);

  // --- HANDLERS ---
  const handleOpenLiquidityModal = () => {
    setLiquidityForm({
      totalLiquidity: String(liquidity.totalLiquidity),
      monthlyExpenses: String(liquidity.monthlyExpenses),
      notes: liquidity.notes || "",
    });
    setShowLiquidityModal(true);
  };

  const handleSaveLiquidity = (e: React.FormEvent) => {
    e.preventDefault();
    const newLiq: LiquidData = {
      totalLiquidity: parseFloat(liquidityForm.totalLiquidity) || 0,
      monthlyExpenses: parseFloat(liquidityForm.monthlyExpenses) || 0,
      notes: liquidityForm.notes,
      lastUpdated: new Date().toISOString(),
    };
    setLiquidity(newLiq);
    saveData(newLiq, airbusPackages, otherInvestments, settings);
    setShowLiquidityModal(false);
  };

  const handleOpenAddAirbus = () => {
    setEditingAirbus(null);
    setAirbusForm({
      year: String(currentYear),
      purchasedShares: "",
      bonusShares: "",
      purchasePrice: "",
      officialPrice: "",
      marketPrice: "142.50",
      yearGranted: String(currentYear),
      sold: false,
      soldPrice: "",
      notes: "",
    });
    setShowAirbusModal(true);
  };

  const handleOpenEditAirbus = (pkg: AirbusPackage) => {
    setEditingAirbus(pkg);
    setAirbusForm({
      year: String(pkg.year),
      purchasedShares: String(pkg.purchasedShares),
      bonusShares: String(pkg.bonusShares),
      purchasePrice: String(pkg.purchasePrice),
      officialPrice: String(pkg.officialPrice),
      marketPrice: String(pkg.marketPrice),
      yearGranted: String(pkg.yearGranted || pkg.year),
      sold: pkg.sold || false,
      soldPrice: pkg.soldPrice ? String(pkg.soldPrice) : "",
      notes: pkg.notes || "",
    });
    setShowAirbusModal(true);
  };

  const handleSaveAirbus = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = parseInt(airbusForm.year) || currentYear;
    const purchased = parseFloat(airbusForm.purchasedShares) || 0;
    const bonus = parseFloat(airbusForm.bonusShares) || 0;
    const pPrice = parseFloat(airbusForm.purchasePrice) || 0;
    const oPrice = parseFloat(airbusForm.officialPrice) || 0;
    const mPrice = parseFloat(airbusForm.marketPrice) || 0;
    const yGranted = parseInt(airbusForm.yearGranted) || yr;

    let updated: AirbusPackage[];

    if (editingAirbus) {
      updated = airbusPackages.map((p) =>
        p.id === editingAirbus.id
          ? {
              ...p,
              year: yr,
              purchasedShares: purchased,
              bonusShares: bonus,
              purchasePrice: pPrice,
              officialPrice: oPrice,
              marketPrice: mPrice,
              yearGranted: yGranted,
              sold: airbusForm.sold,
              soldPrice: airbusForm.soldPrice ? parseFloat(airbusForm.soldPrice) : undefined,
              notes: airbusForm.notes,
            }
          : p
      );
    } else {
      const newPkg: AirbusPackage = {
        id: "airbus_" + Date.now(),
        year: yr,
        purchasedShares: purchased,
        bonusShares: bonus,
        purchasePrice: pPrice,
        officialPrice: oPrice,
        marketPrice: mPrice,
        yearGranted: yGranted,
        sold: airbusForm.sold,
        soldPrice: airbusForm.soldPrice ? parseFloat(airbusForm.soldPrice) : undefined,
        notes: airbusForm.notes,
      };
      updated = [...airbusPackages, newPkg];
    }

    setAirbusPackages(updated);
    saveData(liquidity, updated, otherInvestments, settings);
    setShowAirbusModal(false);
  };

  const handleDeleteAirbus = (id: string) => {
    if (confirm("¿Eliminar este paquete de acciones de Airbus?")) {
      const updated = airbusPackages.filter((p) => p.id !== id);
      setAirbusPackages(updated);
      saveData(liquidity, updated, otherInvestments, settings);
    }
  };

  const handleOpenAddOther = () => {
    setEditingOther(null);
    setOtherForm({
      name: "",
      category: "funds",
      initialValue: "",
      currentValue: "",
      notes: "",
    });
    setShowOtherModal(true);
  };

  const handleOpenEditOther = (item: OtherInvestment) => {
    setEditingOther(item);
    setOtherForm({
      name: item.name,
      category: item.category,
      initialValue: String(item.initialValue),
      currentValue: String(item.currentValue),
      notes: item.notes || "",
    });
    setShowOtherModal(true);
  };

  const handleSaveOther = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherForm.name.trim()) return;

    const initial = parseFloat(otherForm.initialValue) || 0;
    const current = parseFloat(otherForm.currentValue) || 0;

    let updated: OtherInvestment[];

    if (editingOther) {
      updated = otherInvestments.map((o) =>
        o.id === editingOther.id
          ? {
              ...o,
              name: otherForm.name,
              category: otherForm.category,
              initialValue: initial,
              currentValue: current,
              notes: otherForm.notes,
            }
          : o
      );
    } else {
      const newOther: OtherInvestment = {
        id: "other_" + Date.now(),
        name: otherForm.name,
        category: otherForm.category,
        initialValue: initial,
        currentValue: current,
        notes: otherForm.notes,
      };
      updated = [...otherInvestments, newOther];
    }

    setOtherInvestments(updated);
    saveData(liquidity, airbusPackages, updated, settings);
    setShowOtherModal(false);
  };

  const handleDeleteOther = (id: string) => {
    if (confirm("¿Eliminar esta inversión?")) {
      const updated = otherInvestments.filter((o) => o.id !== id);
      setOtherInvestments(updated);
      saveData(liquidity, airbusPackages, updated, settings);
    }
  };

  const handleOpenSettings = () => {
    setSettingsForm({
      targetInvestmentRatio: String(settings.targetInvestmentRatio),
      taxRate: String(settings.taxRate),
    });
    setShowSettingsModal(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRatio = Math.min(100, Math.max(0, parseFloat(settingsForm.targetInvestmentRatio) || 60));
    const tax = Math.min(100, Math.max(0, parseFloat(settingsForm.taxRate) || 19));

    const newSettings = { targetInvestmentRatio: targetRatio, taxRate: tax };
    setSettings(newSettings);
    saveData(liquidity, airbusPackages, otherInvestments, newSettings);
    setShowSettingsModal(false);
  };

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Cargando Gestor Financiero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* PROFESSIONAL EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Coins className="text-indigo-400" size={24} /> Financial Portfolio Manager
            </h1>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                syncStatus === "synced"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              ● {syncStatus === "synced" ? "MongoDB Live" : "Local Sync"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Control ejecutivo de patrimonio, liquidez ágil y simulación fiscal Airbus ESOP.
          </p>
        </div>

        <button
          onClick={handleOpenSettings}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
        >
          <SettingsIcon size={15} /> Ajustes (Máx: {settings.targetInvestmentRatio}%)
        </button>
      </div>

      {/* EXECUTIVE TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-xs">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-blue-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <PieChart size={16} /> Resumen General
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "liquidity"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Wallet size={16} /> Liquidez ({formatEUR(calculations.totalLiquidity)})
        </button>
        <button
          onClick={() => setActiveTab("airbus")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "airbus"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Plane size={16} /> Airbus ESOP ({formatEUR(calculations.totalAirbusMarketValue)})
        </button>
        <button
          onClick={() => setActiveTab("other")}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "other"
              ? "bg-purple-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <TrendingUp size={16} /> Otras Invers.
        </button>
      </div>

      {/* SECTION 1: EXECUTIVE DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* WEALTH OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Patrimonio Neto Total
                </span>
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Coins size={18} />
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight text-foreground">
                {formatEUR(calculations.totalNetWorth)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Liquidez total + Portafolio Inversiones
              </p>
            </div>

            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Fondo Líquido Disponible
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <Wallet size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatEUR(calculations.totalLiquidity)}
              </p>
              <p className="text-xs font-bold text-emerald-600 mt-1">
                {calculations.liquidityRatio.toFixed(0)}% del patrimonio ({calculations.runwayMonths.toFixed(1)} meses colchón)
              </p>
            </div>

            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Capital Total Invertido
                </span>
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600 tracking-tight">
                {formatEUR(calculations.totalInvestments)}
              </p>
              <p className="text-xs font-bold text-purple-600 mt-1">
                {calculations.investmentRatio.toFixed(0)}% del patrimonio global
              </p>
            </div>
          </div>

          {/* PRUDENTIAL HEALTH GAUGE */}
          <div className="bg-card p-5 md:p-6 rounded-3xl border border-border shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2">
                  <PieChart className="text-blue-600" size={18} /> Ratio de Prudencia e Inversión
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitoreo automático para evitar sobreinversión y asegurar liquidez prudente.
                </p>
              </div>

              <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                Objetivo Máx: {settings.targetInvestmentRatio}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-emerald-600">
                  Liquidez Actual: {calculations.liquidityRatio.toFixed(0)}% ({formatEUR(calculations.totalLiquidity)})
                </span>
                <span className="text-purple-600">
                  Invertido: {calculations.investmentRatio.toFixed(0)}% ({formatEUR(calculations.totalInvestments)})
                </span>
              </div>

              <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden flex p-1 border border-border">
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${Math.max(2, calculations.liquidityRatio)}%` }}
                />
                <div
                  className={`h-full rounded-r-full transition-all duration-500 ${
                    calculations.healthStatus === "warning"
                      ? "bg-rose-500"
                      : calculations.healthStatus === "caution"
                      ? "bg-amber-500"
                      : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.max(2, calculations.investmentRatio)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-foreground z-10 shadow-sm"
                  style={{ left: `${settings.targetInvestmentRatio}%` }}
                />
              </div>
            </div>

            {calculations.healthStatus === "warning" && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                <span>⚠️ Superado el límite de seguridad ({settings.targetInvestmentRatio}%). Se recomienda pausar aportaciones a inversiones.</span>
              </div>
            )}
            {calculations.healthStatus === "safe" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
                <span>✅ Distribución de patrimonio prudente y altamente equilibrada.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: EFFORTLESS LIQUIDITY & BANK */}
      {activeTab === "liquidity" && (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Wallet className="text-emerald-600" size={22} /> Gestión Ágil de Liquidez
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Sin la molestia de registrar transacciones diarias. Solo actualiza tu saldo global disponible.
                </p>
              </div>

              <button
                onClick={handleOpenLiquidityModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 size={15} /> Actualizar Saldo
              </button>
            </div>

            {/* EFFORTLESS LIQUIDITY METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Dinero Disponible Total
                </span>
                <p className="text-3xl font-black text-emerald-600 mt-1">
                  {formatEUR(liquidity.totalLiquidity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  En cuentas bancarias y efectivo
                </p>
              </div>

              <div className="bg-muted/50 p-5 rounded-2xl border border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Gastos Fijos Estimados / Mes
                </span>
                <p className="text-2xl font-black text-foreground mt-1">
                  {formatEUR(liquidity.monthlyExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Costo de vida básico mensual
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Colchón de Seguridad
                </span>
                <p className="text-3xl font-black text-blue-600 mt-1">
                  {calculations.runwayMonths.toFixed(1)} <span className="text-sm font-bold">meses</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Meses cubiertos sin ingresos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PROFESSIONAL AIRBUS ESOP PORTFOLIO */}
      {activeTab === "airbus" && (
        <div className="space-y-6">
          {/* AIRBUS EXECUTIVE HEADER */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Plane className="text-indigo-600" size={22} /> Cartera de Acciones Airbus (ESOP)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Planes de compra con descuento y bonificaciones anuales. Control de bloqueo e IRPF.
                </p>
              </div>

              <button
                onClick={handleOpenAddAirbus}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={15} /> Registrar Añada / Plan
              </button>
            </div>

            {/* EXECUTIVE METRICS BAR */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Acciones Totales</span>
                <p className="text-xl font-black text-foreground mt-0.5">{calculations.totalAirbusShares} uds</p>
                <p className="text-[11px] text-muted-foreground">Invertido: {formatEUR(calculations.totalAirbusPaidOutOfPocket)}</p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Valor Mercado</span>
                <p className="text-xl font-black text-indigo-600 mt-0.5">{formatEUR(calculations.totalAirbusMarketValue)}</p>
                <p className="text-[11px] text-indigo-600/80 font-bold">Base Fiscal: {formatEUR(calculations.totalAirbusOfficialCostBasis)}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Margen Fiscal Base</span>
                <p className="text-xl font-black text-amber-600 mt-0.5">{formatEUR(calculations.totalAirbusTaxableMargin)}</p>
                <p className="text-[11px] text-amber-600/80 font-bold">IRPF ({settings.taxRate}%): -{formatEUR(calculations.totalAirbusEstimatedTax)}</p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Beneficio Neto Real</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{formatEUR(calculations.totalAirbusNetProfitIfSold)}</p>
                <p className="text-[11px] text-emerald-600/80 font-bold">Limpio tras pagar impuestos</p>
              </div>
            </div>
          </div>

          {/* ANNUAL TRANCHES TIMELINE CARDS */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-foreground px-1">Añadas Anuales Registradas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {airbusPackages.map((pkg) => {
                const totalShares = pkg.purchasedShares + pkg.bonusShares;
                const paid = pkg.purchasedShares * pkg.purchasePrice;
                const officialBasis = totalShares * pkg.officialPrice;
                const mktValue = totalShares * (pkg.sold && pkg.soldPrice ? pkg.soldPrice : pkg.marketPrice);
                const taxableMargin = Math.max(0, mktValue - officialBasis);
                const estTax = taxableMargin * (settings.taxRate / 100);
                const netProfit = mktValue - paid - estTax;
                const yearsElapsed = currentYear - pkg.yearGranted;
                const isLocked = yearsElapsed < 3;

                return (
                  <div
                    key={pkg.id}
                    className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-4 hover:border-indigo-500/40 transition"
                  >
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-foreground">Añada {pkg.year}</span>
                          <span className="text-xs px-2.5 py-0.5 bg-muted rounded-full font-bold text-muted-foreground">
                            {totalShares} acciones
                          </span>
                        </div>
                        {pkg.notes && <p className="text-xs text-muted-foreground mt-0.5">{pkg.notes}</p>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {pkg.sold ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Vendida
                          </span>
                        ) : isLocked ? (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1"
                            title={`Bloqueada hasta ${pkg.yearGranted + 3}`}
                          >
                            <Lock size={13} /> Bloqueada ({3 - yearsElapsed} año{3 - yearsElapsed > 1 ? "s" : ""})
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                            <Unlock size={13} /> Liquidable
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenEditAirbus(pkg)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition cursor-pointer"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteAirbus(pkg.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-muted/40 p-2.5 rounded-xl">
                        <span className="text-muted-foreground">Estructura</span>
                        <p className="font-bold text-foreground mt-0.5">
                          {pkg.purchasedShares} compradas + {pkg.bonusShares} bonus
                        </p>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-xl">
                        <span className="text-muted-foreground">Inversión Bolsillo</span>
                        <p className="font-bold text-foreground mt-0.5">{formatEUR(paid)}</p>
                      </div>
                      <div className="bg-muted/40 p-2.5 rounded-xl">
                        <span className="text-muted-foreground">Precio Oficial / Mercado</span>
                        <p className="font-bold text-indigo-600 mt-0.5">
                          {formatEUR(pkg.officialPrice)} / {formatEUR(pkg.marketPrice)}
                        </p>
                      </div>
                      <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                        <span className="text-emerald-600 font-bold">Ganancia Neta Limpia</span>
                        <p className="font-black text-emerald-600 mt-0.5">{formatEUR(netProfit)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INTERACTIVE SETTLEMENT & TAX SIMULATOR */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Calculator className="text-indigo-600" size={18} /> Simulador de Liquidación e Impuestos
              </h3>
              <span className="text-xs font-bold text-muted-foreground">
                Tipo IRPF: {settings.taxRate}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Selecciona la Añada / Paquete a Simular
                </label>
                <select
                  value={selectedAirbusSimId}
                  onChange={(e) => setSelectedAirbusSimId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-semibold"
                >
                  <option value="all">Todas las Añadas Activas ({calculations.totalAirbusShares} acciones)</option>
                  {airbusPackages
                    .filter((p) => !p.sold)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        Añada {p.year} ({p.purchasedShares + p.bonusShares} acciones)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Precio de Mercado Simulado (€ por acción)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 150.00"
                  value={simMarketPriceOverride}
                  onChange={(e) => setSimMarketPriceOverride(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                />
              </div>
            </div>

            {/* SIMULATION RESULT DISPLAY */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Importe Bruto Venta</span>
                  <p className="text-lg font-black text-foreground mt-0.5">{formatEUR(simulation.totalSimGrossProceeds)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Base Imponible Oficial</span>
                  <p className="text-lg font-black text-amber-600 mt-0.5">{formatEUR(simulation.simTaxableMargin)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Retención IRPF ({settings.taxRate}%)</span>
                  <p className="text-lg font-black text-rose-600 mt-0.5">-{formatEUR(simulation.simTax)}</p>
                </div>
                <div>
                  <span className="text-emerald-600 font-bold">Depósito Neto Limpio</span>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">{formatEUR(simulation.simNetProceeds)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-indigo-500/20 pt-2 text-xs">
                <span className="text-muted-foreground">
                  Ganancia Neta Real (tras descontar pago inicial {formatEUR(simulation.totalSimPaid)}):
                </span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  +{formatEUR(simulation.simRealNetProfit)} ({simulation.simRoi.toFixed(1)}% ROI)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: OTHER INVESTMENTS */}
      {activeTab === "other" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-3xl border border-border shadow-xs">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="text-purple-600" size={18} /> Otras Inversiones
            </h2>
            <button
              onClick={handleOpenAddOther}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus size={14} /> Nueva Inversión
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherInvestments.map((item) => {
              const gain = item.currentValue - item.initialValue;

              return (
                <div
                  key={item.id}
                  className="bg-card p-4 rounded-2xl border border-border shadow-xs flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-purple-600">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-sm text-foreground">{item.name}</h3>
                    <p className="text-lg font-black text-purple-600 mt-0.5">
                      {formatEUR(item.currentValue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        gain >= 0
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {gain >= 0 ? "+" : ""}
                      {formatEUR(gain)}
                    </span>
                    <button
                      onClick={() => handleOpenEditOther(item)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteOther(item.id)}
                      className="p-1 text-muted-foreground hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODAL: LIQUIDITY --- */}
      {showLiquidityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-extrabold text-sm">Actualizar Liquidez y Gastos</h3>
              <button onClick={() => setShowLiquidityModal(false)} className="text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLiquidity} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Saldo Global Disponible (€)
                </label>
                <input
                  type="number"
                  step="100"
                  required
                  value={liquidityForm.totalLiquidity}
                  onChange={(e) => setLiquidityForm({ ...liquidityForm, totalLiquidity: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Gastos Mensuales Estimados (€)
                </label>
                <input
                  type="number"
                  step="50"
                  required
                  value={liquidityForm.monthlyExpenses}
                  onChange={(e) => setLiquidityForm({ ...liquidityForm, monthlyExpenses: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLiquidityModal(false)}
                  className="px-3 py-1.5 bg-muted rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: AIRBUS PACKAGE --- */}
      {showAirbusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-xl max-w-sm w-full space-y-4 max-h-[85dvh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-extrabold text-sm">
                {editingAirbus ? "Editar Plan Airbus" : "Registrar Plan Airbus"}
              </h3>
              <button onClick={() => setShowAirbusModal(false)} className="text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAirbus} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Año Plan</label>
                  <input
                    type="number"
                    required
                    value={airbusForm.year}
                    onChange={(e) =>
                      setAirbusForm({
                        ...airbusForm,
                        year: e.target.value,
                        yearGranted: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Año Adjudicación</label>
                  <input
                    type="number"
                    required
                    value={airbusForm.yearGranted}
                    onChange={(e) => setAirbusForm({ ...airbusForm, yearGranted: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Compradas (X)</label>
                  <input
                    type="number"
                    required
                    value={airbusForm.purchasedShares}
                    onChange={(e) => setAirbusForm({ ...airbusForm, purchasedShares: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Bonus (Y)</label>
                  <input
                    type="number"
                    required
                    value={airbusForm.bonusShares}
                    onChange={(e) => setAirbusForm({ ...airbusForm, bonusShares: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={airbusForm.purchasePrice}
                    onChange={(e) => setAirbusForm({ ...airbusForm, purchasePrice: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Precio Oficial</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={airbusForm.officialPrice}
                    onChange={(e) => setAirbusForm({ ...airbusForm, officialPrice: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Mercado</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={airbusForm.marketPrice}
                    onChange={(e) => setAirbusForm({ ...airbusForm, marketPrice: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={airbusForm.sold}
                    onChange={(e) => setAirbusForm({ ...airbusForm, sold: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-indigo-600"
                  />
                  <span className="font-semibold text-xs text-foreground">Paquete ya vendido</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAirbusModal(false)}
                  className="px-3 py-1.5 bg-muted rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: OTHER INVESTMENT --- */}
      {showOtherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-extrabold text-sm">{editingOther ? "Editar Inversión" : "Añadir Inversión"}</h3>
              <button onClick={() => setShowOtherModal(false)} className="text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOther} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={otherForm.name}
                  onChange={(e) => setOtherForm({ ...otherForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Categoría</label>
                <select
                  value={otherForm.category}
                  onChange={(e) => setOtherForm({ ...otherForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="funds">Fondo Indexado / ETF</option>
                  <option value="crypto">Criptomonedas</option>
                  <option value="stocks">Otras Acciones</option>
                  <option value="real_estate">Bienes Raíces</option>
                  <option value="other">Otros Activos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Inicial (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={otherForm.initialValue}
                    onChange={(e) => setOtherForm({ ...otherForm, initialValue: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Actual (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={otherForm.currentValue}
                    onChange={(e) => setOtherForm({ ...otherForm, currentValue: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="px-3 py-1.5 bg-muted rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white rounded-xl font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: SETTINGS --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-extrabold text-sm">⚙️ Ajustes de Prudencia e IRPF</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Máximo % Invertido Objetivo
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={settingsForm.targetInvestmentRatio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, targetInvestmentRatio: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Retención IRPF Plusvalía Airbus (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={settingsForm.taxRate}
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3 py-1.5 bg-muted rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
