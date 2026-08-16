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
  RefreshCw,
  Coins,
  X,
  Settings as SettingsIcon,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Gift,
  ArrowUpRight,
  Zap,
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

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: PieChart },
  { id: "liquidity", label: "Liquidez", icon: Wallet },
  { id: "airbus", label: "Airbus ESOP", icon: Plane },
  { id: "other", label: "Otras Invers.", icon: TrendingUp },
] as const;

export function FinanceTrackerModule() {
  const [sectionIndex, setSectionIndex] = useState(0);

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
  const [airbusSimMode, setAirbusSimMode] = useState<"unlocked" | "all" | string>("unlocked");
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
              year: 2021,
              purchasedShares: 30,
              bonusShares: 15,
              purchasePrice: 98.0,
              officialPrice: 104.0,
              marketPrice: 142.5,
              yearGranted: 2021,
              sold: false,
              notes: "Añada 2021",
            },
            {
              id: "a2",
              year: 2022,
              purchasedShares: 30,
              bonusShares: 15,
              purchasePrice: 105.5,
              officialPrice: 112.0,
              marketPrice: 142.5,
              yearGranted: 2022,
              sold: false,
              notes: "Añada 2022",
            },
            {
              id: "a3",
              year: 2023,
              purchasedShares: 25,
              bonusShares: 12,
              purchasePrice: 118.0,
              officialPrice: 124.0,
              marketPrice: 142.5,
              yearGranted: 2023,
              sold: false,
              notes: "Añada 2023",
            },
            {
              id: "a4",
              year: 2024,
              purchasedShares: 35,
              bonusShares: 18,
              purchasePrice: 130.0,
              officialPrice: 138.0,
              marketPrice: 142.5,
              yearGranted: 2024,
              sold: false,
              notes: "Añada 2024",
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
    const totalLiquidity = Number(liquidity.totalLiquidity) || 0;
    const monthlyExpenses = Number(liquidity.monthlyExpenses) || 1;
    const runwayMonths = monthlyExpenses > 0 ? totalLiquidity / monthlyExpenses : 0;

    let totalAirbusShares = 0;
    let totalAirbusPurchasedShares = 0;
    let totalAirbusBonusShares = 0;
    let totalAirbusPaidOutOfPocket = 0;
    let totalAirbusOfficialCostBasis = 0;
    let totalAirbusMarketValue = 0;
    let totalAirbusTaxableMargin = 0;
    let totalAirbusEstimatedTax = 0;
    let totalAirbusUnlockedValue = 0;
    let totalAirbusLockedValue = 0;
    let totalAirbusBonusValue = 0;

    airbusPackages.forEach((pkg) => {
      if (pkg.sold) return;

      const totalShares = (Number(pkg.purchasedShares) || 0) + (Number(pkg.bonusShares) || 0);
      const paid = (Number(pkg.purchasedShares) || 0) * (Number(pkg.purchasePrice) || 0);
      const officialBasis = totalShares * (Number(pkg.officialPrice) || 0);
      const mktValue = totalShares * (Number(pkg.marketPrice) || 0);
      const bonusVal = (Number(pkg.bonusShares) || 0) * (Number(pkg.marketPrice) || 0);

      const taxableMargin = Math.max(0, mktValue - officialBasis);
      const tax = taxableMargin * (settings.taxRate / 100);

      totalAirbusShares += totalShares;
      totalAirbusPurchasedShares += Number(pkg.purchasedShares) || 0;
      totalAirbusBonusShares += Number(pkg.bonusShares) || 0;
      totalAirbusPaidOutOfPocket += paid;
      totalAirbusOfficialCostBasis += officialBasis;
      totalAirbusMarketValue += mktValue;
      totalAirbusTaxableMargin += taxableMargin;
      totalAirbusEstimatedTax += tax;
      totalAirbusBonusValue += bonusVal;

      const isLocked = (currentYear - pkg.yearGranted) < 3;
      if (isLocked) {
        totalAirbusLockedValue += mktValue;
      } else {
        totalAirbusUnlockedValue += mktValue;
      }
    });

    const totalAirbusNetProfitIfSold =
      totalAirbusMarketValue - totalAirbusPaidOutOfPocket - totalAirbusEstimatedTax;

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

    const totalInvestments = totalAirbusMarketValue + totalOtherInvestmentsCurrent;
    const totalNetWorth = totalLiquidity + totalInvestments;

    const investmentRatio =
      totalNetWorth > 0 ? (totalInvestments / totalNetWorth) * 100 : 0;
    const liquidityRatio =
      totalNetWorth > 0 ? (totalLiquidity / totalNetWorth) * 100 : 0;

    const airbusShareRatio =
      totalNetWorth > 0 ? (totalAirbusMarketValue / totalNetWorth) * 100 : 0;
    const otherShareRatio =
      totalNetWorth > 0 ? (totalOtherInvestmentsCurrent / totalNetWorth) * 100 : 0;

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
      totalAirbusPurchasedShares,
      totalAirbusBonusShares,
      totalAirbusPaidOutOfPocket,
      totalAirbusOfficialCostBasis,
      totalAirbusMarketValue,
      totalAirbusTaxableMargin,
      totalAirbusEstimatedTax,
      totalAirbusUnlockedValue,
      totalAirbusLockedValue,
      totalAirbusBonusValue,
      totalAirbusNetProfitIfSold,
      totalOtherInvestmentsInitial,
      totalOtherInvestmentsCurrent,
      totalOtherInvestmentsGain,
      totalInvestments,
      totalNetWorth,
      investmentRatio,
      liquidityRatio,
      airbusShareRatio,
      otherShareRatio,
      healthStatus,
    };
  }, [liquidity, airbusPackages, otherInvestments, settings, currentYear]);

  // --- SIMULATION CALCULATIONS ---
  const simulation = useMemo(() => {
    let packagesToSimulate: AirbusPackage[] = [];

    if (airbusSimMode === "unlocked") {
      packagesToSimulate = airbusPackages.filter(
        (p) => !p.sold && currentYear - p.yearGranted >= 3
      );
    } else if (airbusSimMode === "all") {
      packagesToSimulate = airbusPackages.filter((p) => !p.sold);
    } else {
      packagesToSimulate = airbusPackages.filter(
        (p) => !p.sold && p.id === airbusSimMode
      );
    }

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
  }, [airbusPackages, airbusSimMode, simMarketPriceOverride, settings, currentYear]);

  // --- HANDLERS ---
  const handleNextSection = () => {
    setSectionIndex((prev) => (prev + 1) % SECTIONS.length);
  };

  const handlePrevSection = () => {
    setSectionIndex((prev) => (prev - 1 + SECTIONS.length) % SECTIONS.length);
  };

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
        <p className="text-xs text-muted-foreground font-medium">Cargando...</p>
      </div>
    );
  }

  const activeSection = SECTIONS[sectionIndex];
  const IconComponent = activeSection.icon;

  return (
    <div className="space-y-4 pb-24 relative">
      {/* MOBILE-NATIVE HEADER */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-2">
          <Coins className="text-indigo-400" size={20} />
          <div>
            <h1 className="text-base font-black tracking-tight leading-none">
              Gestor Financiero
            </h1>
            <span className="text-[10px] text-slate-400 font-bold">
              {syncStatus === "synced" ? "● BD Conectada" : "● Modo Local"}
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenSettings}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-700"
        >
          <SettingsIcon size={14} />
          <span className="hidden sm:inline">Ajustes</span>
        </button>
      </div>

      {/* FIXED SCREEN CAROUSEL CONTAINER (NO PAGE SCROLL) */}
      <div className="min-h-[60vh] flex flex-col justify-between">
        {/* SECTION 1: WEALTH DASHBOARD */}
        {activeSection.id === "dashboard" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* NET WORTH HERO CARD */}
            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Patrimonio Neto Total
              </span>
              <p className="text-4xl font-black tracking-tight text-foreground">
                {formatEUR(calculations.totalNetWorth)}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Liquidez</span>
                  <p className="text-base font-extrabold text-emerald-600">{formatEUR(calculations.totalLiquidity)}</p>
                  <p className="text-[10px] text-emerald-600/80 font-bold">{calculations.liquidityRatio.toFixed(0)}% patrimonio</p>
                </div>

                <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">Invertido</span>
                  <p className="text-base font-extrabold text-purple-600">{formatEUR(calculations.totalInvestments)}</p>
                  <p className="text-[10px] text-purple-600/80 font-bold">{calculations.investmentRatio.toFixed(0)}% patrimonio</p>
                </div>
              </div>
            </div>

            {/* ASSET ALLOCATION BAR & PRUDENCE GAUGE */}
            <div className="bg-card p-4 rounded-3xl border border-border shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1 text-foreground">
                  <PieChart size={14} className="text-blue-600" /> Distribución y Prudencia
                </span>
                <span className="text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg text-[10px]">
                  Máx Inversión: {settings.targetInvestmentRatio}%
                </span>
              </div>

              <div className="relative w-full h-5 bg-muted rounded-full overflow-hidden flex p-0.5 border border-border">
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-300"
                  style={{ width: `${Math.max(2, calculations.liquidityRatio)}%` }}
                  title={`Liquidez ${calculations.liquidityRatio.toFixed(0)}%`}
                />
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${Math.max(2, calculations.airbusShareRatio)}%` }}
                  title={`Airbus ESOP ${calculations.airbusShareRatio.toFixed(0)}%`}
                />
                <div
                  className="bg-purple-600 h-full rounded-r-full transition-all duration-300"
                  style={{ width: `${Math.max(2, calculations.otherShareRatio)}%` }}
                  title={`Otras Inversiones ${calculations.otherShareRatio.toFixed(0)}%`}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                  style={{ left: `${settings.targetInvestmentRatio}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                <span className="text-emerald-600">● Liquidez ({calculations.liquidityRatio.toFixed(0)}%)</span>
                <span className="text-indigo-600">● Airbus ({calculations.airbusShareRatio.toFixed(0)}%)</span>
                <span className="text-purple-600">● Otras ({calculations.otherShareRatio.toFixed(0)}%)</span>
              </div>

              {calculations.healthStatus === "warning" && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                  <span>Atención: Has superado el límite de prudencia fijado ({settings.targetInvestmentRatio}%).</span>
                </div>
              )}
              {calculations.healthStatus === "safe" && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                  <span>Distribución equilibrada y colchón de {calculations.runwayMonths.toFixed(1)} meses.</span>
                </div>
              )}
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSectionIndex(1)}
                className="p-3 bg-card hover:bg-muted/50 rounded-2xl border border-border flex items-center justify-between text-xs font-bold transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5"><Wallet size={15} className="text-emerald-600" /> Ajustar Liquidez</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
              <button
                onClick={() => setSectionIndex(2)}
                className="p-3 bg-card hover:bg-muted/50 rounded-2xl border border-border flex items-center justify-between text-xs font-bold transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5"><Plane size={15} className="text-indigo-600" /> Ver Airbus ESOP</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: EFFORTLESS LIQUIDITY */}
        {activeSection.id === "liquidity" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-card p-5 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Wallet className="text-emerald-600" size={16} /> Liquidez y Fondo de Seguridad
                </h2>
                <button
                  onClick={handleOpenLiquidityModal}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-700"
                >
                  <Edit2 size={12} className="inline mr-1" /> Editar
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Fondo Líquido Disponible</span>
                  <p className="text-3xl font-black text-emerald-600 mt-0.5">{formatEUR(liquidity.totalLiquidity)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 p-3 rounded-xl border border-border">
                    <span className="text-[10px] text-muted-foreground font-semibold">Gastos Fijos / Mes</span>
                    <p className="font-extrabold text-foreground mt-0.5">{formatEUR(liquidity.monthlyExpenses)}</p>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                    <span className="text-[10px] font-bold text-blue-600">Colchón Cubierto</span>
                    <p className="font-black text-blue-600 mt-0.5">{calculations.runwayMonths.toFixed(1)} meses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: AIRBUS ESOP WEALTH TERMINAL */}
        {activeSection.id === "airbus" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-card p-4 rounded-3xl border border-border shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Plane className="text-indigo-600" size={16} /> Cartera Airbus ESOP
                </h2>
                <button
                  onClick={handleOpenAddAirbus}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-700"
                >
                  + Nueva Añada
                </button>
              </div>

              {/* HIGH DENSITY AIRBUS METRICS */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
                  <span className="text-[10px] text-muted-foreground font-semibold">Acciones Totales</span>
                  <p className="font-extrabold text-foreground">{calculations.totalAirbusShares} uds ({calculations.totalAirbusPurchasedShares} + {calculations.totalAirbusBonusShares} bonus)</p>
                  <p className="text-[10px] text-muted-foreground">Invertido: {formatEUR(calculations.totalAirbusPaidOutOfPocket)}</p>
                </div>

                <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-600 font-bold">Valor Mercado</span>
                  <p className="font-extrabold text-indigo-600">{formatEUR(calculations.totalAirbusMarketValue)}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold">Regalo Bonus: +{formatEUR(calculations.totalAirbusBonusValue)}</p>
                </div>

                <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <span className="text-[10px] text-amber-600 font-bold">Base Fiscal e IRPF</span>
                  <p className="font-extrabold text-amber-600">{formatEUR(calculations.totalAirbusTaxableMargin)}</p>
                  <p className="text-[10px] text-amber-600">IRPF ({settings.taxRate}%): -{formatEUR(calculations.totalAirbusEstimatedTax)}</p>
                </div>

                <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 font-bold">Ganancia Neta Limpia</span>
                  <p className="font-extrabold text-emerald-600">{formatEUR(calculations.totalAirbusNetProfitIfSold)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold">ROI Neto: {calculations.totalAirbusPaidOutOfPocket > 0 ? `+${((calculations.totalAirbusNetProfitIfSold / calculations.totalAirbusPaidOutOfPocket) * 100).toFixed(0)}%` : "0%"}</p>
                </div>
              </div>
            </div>

            {/* 3-YEAR LOCKUP TIMELINE CARDS */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-foreground px-1">Planes / Añadas Anuales</span>

              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
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
                    <div key={pkg.id} className="bg-card p-3 rounded-2xl border border-border shadow-xs text-xs space-y-2">
                      <div className="flex justify-between items-center border-b border-border pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm">Añada {pkg.year}</span>
                          <span className="text-[10px] text-muted-foreground">({totalShares} uds)</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {pkg.sold ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600">Vendida</span>
                          ) : isLocked ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 flex items-center gap-1">
                              <Lock size={10} /> Bloqueada ({3 - yearsElapsed}a)
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 flex items-center gap-1">
                              <Unlock size={10} /> Liquidable
                            </span>
                          )}

                          <button onClick={() => handleOpenEditAirbus(pkg)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteAirbus(pkg.id)} className="p-1 text-muted-foreground hover:text-rose-600 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div>
                          <span className="text-[10px] text-muted-foreground">Invertido</span>
                          <p className="font-bold">{formatEUR(paid)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">Mercado</span>
                          <p className="font-bold text-indigo-600">{formatEUR(mktValue)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">Neto Limpio</span>
                          <p className="font-bold text-emerald-600">{formatEUR(netProfit)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIMULATOR ACCORDION */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-border pb-1.5">
                <span className="font-extrabold flex items-center gap-1">
                  <Calculator size={14} className="text-indigo-600" /> Simulador Venta
                </span>
                <div className="flex gap-1 text-[10px]">
                  <button
                    onClick={() => setAirbusSimMode("unlocked")}
                    className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer ${airbusSimMode === "unlocked" ? "bg-indigo-600 text-white" : "bg-muted"}`}
                  >
                    Desbloqueadas
                  </button>
                  <button
                    onClick={() => setAirbusSimMode("all")}
                    className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer ${airbusSimMode === "all" ? "bg-indigo-600 text-white" : "bg-muted"}`}
                  >
                    Todas
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                <div>
                  <span className="text-[10px] text-muted-foreground">Acciones ({simulation.totalSimShares} uds)</span>
                  <p className="font-black text-sm text-indigo-600">Venta Bruta: {formatEUR(simulation.totalSimGrossProceeds)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-600 font-bold">IRPF ({settings.taxRate}%): -{formatEUR(simulation.simTax)}</span>
                  <p className="font-black text-sm text-emerald-600">Ingreso Neto: {formatEUR(simulation.simNetProceeds)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: OTRAS INVERSIONES */}
        {activeSection.id === "other" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center bg-card p-4 rounded-3xl border border-border shadow-xs">
              <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                <TrendingUp className="text-purple-600" size={16} /> Otras Inversiones
              </h2>
              <button
                onClick={handleOpenAddOther}
                className="px-2.5 py-1 bg-purple-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-purple-700"
              >
                + Añadir
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherInvestments.map((item) => {
                const gain = item.currentValue - item.initialValue;

                return (
                  <div key={item.id} className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-purple-600">{item.category}</span>
                      <h3 className="font-bold text-foreground">{item.name}</h3>
                      <p className="text-base font-extrabold text-purple-600 mt-0.5">{formatEUR(item.currentValue)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${gain >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                        {gain >= 0 ? "+" : ""}{formatEUR(gain)}
                      </span>
                      <button onClick={() => handleOpenEditOther(item)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => handleDeleteOther(item.id)} className="p-1 text-muted-foreground hover:text-rose-600 cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING MOBILE CAPSULE NAVIGATION BAR (0 PAGE SCROLL) */}
      <div className="fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto">
        <div className="bg-slate-900/95 text-white backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-between">
          <button
            onClick={handlePrevSection}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-2">
            <IconComponent size={18} className="text-indigo-400" />
            <span className="text-xs font-black text-white">{activeSection.label}</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {sectionIndex + 1}/{SECTIONS.length}
            </span>
          </div>

          <button
            onClick={handleNextSection}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer shadow-md"
            title="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

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
