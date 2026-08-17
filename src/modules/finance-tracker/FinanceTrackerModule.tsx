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
  ShieldCheck,
  RefreshCw,
  Coins,
  X,
  Settings as SettingsIcon,
  Calculator,
  ChevronRight,
  Gift,
  Building2,
  ArrowUpRight,
  Sparkles,
  Info,
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
  soldPrice?: number; // Real price per share at the moment of sale
  soldDate?: string; // ISO date of the sale
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "liquidity" | "airbus" | "other">("dashboard");

  // State
  const [liquidity, setLiquidity] = useState<LiquidData>({
    totalLiquidity: 20500,
    monthlyExpenses: 2000,
  });
  const [airbusPackages, setAirbusPackages] = useState<AirbusPackage[]>([]);
  const [otherInvestments, setOtherInvestments] = useState<OtherInvestment[]>([]);
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
  const [expandedAirbusId, setExpandedAirbusId] = useState<string | null>(null);

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
    soldDate: "",
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
          // Pre-seed sample data
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
              notes: "Plan ESOP 2021",
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
              notes: "Plan ESOP 2022",
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
              notes: "Plan ESOP 2023",
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

    // Realized (sold) accumulators
    let realizedGrossProceeds = 0;
    let realizedCostBasis = 0;
    let realizedTaxableMargin = 0;
    let realizedTax = 0;
    let realizedNetProfit = 0;
    let soldPackagesCount = 0;

    airbusPackages.forEach((pkg) => {
      const totalShares = (Number(pkg.purchasedShares) || 0) + (Number(pkg.bonusShares) || 0);
      const paid = (Number(pkg.purchasedShares) || 0) * (Number(pkg.purchasePrice) || 0);
      const officialBasis = totalShares * (Number(pkg.officialPrice) || 0);

      if (pkg.sold) {
        const salePrice = Number(pkg.soldPrice) || Number(pkg.marketPrice) || 0;
        const gross = totalShares * salePrice;
        const margin = Math.max(0, gross - officialBasis);
        const tax = margin * (settings.taxRate / 100);
        realizedGrossProceeds += gross;
        realizedCostBasis += paid;
        realizedTaxableMargin += margin;
        realizedTax += tax;
        realizedNetProfit += gross - paid - tax;
        soldPackagesCount += 1;
        return;
      }

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
      realizedGrossProceeds,
      realizedCostBasis,
      realizedTaxableMargin,
      realizedTax,
      realizedNetProfit,
      soldPackagesCount,
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
      soldDate: "",
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
      soldDate: pkg.soldDate ? pkg.soldDate.slice(0, 10) : "",
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
    const soldPriceVal = airbusForm.soldPrice ? parseFloat(airbusForm.soldPrice) : undefined;
    const soldDateVal = airbusForm.sold
      ? (airbusForm.soldDate || new Date().toISOString().slice(0, 10))
      : undefined;

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
              soldPrice: airbusForm.sold ? soldPriceVal : undefined,
              soldDate: soldDateVal,
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
        soldPrice: airbusForm.sold ? soldPriceVal : undefined,
        soldDate: soldDateVal,
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
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Cargando Gestor Financiero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4 pb-12">
      {/* HEADER BAR */}
      <div className="bg-card border border-border/80 p-3 md:p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
              <Coins size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-foreground tracking-tight leading-none">
                Gestor Financiero
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold mt-1">
                <span className="inline-flex items-center gap-1 font-bold">
                  <span className={`w-2 h-2 rounded-full ${syncStatus === "synced" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {syncStatus === "synced" ? "BD Conectada" : "Modo Local"}
                </span>
                <span>•</span>
                <span>Patrimonio: <strong className="text-foreground">{formatEUR(calculations.totalNetWorth)}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenSettings}
            data-testid="settings-btn"
            className="p-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-2xl border border-border transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            title="Ajustes de Prudencia e IRPF"
          >
            <SettingsIcon size={16} />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        </div>

        {/* TOP SEGMENTED TABS */}
        <div className="grid grid-cols-4 bg-muted p-1 rounded-2xl gap-1 text-center">
          <button
            onClick={() => setActiveTab("dashboard")}
            data-testid="tab-dashboard"
            className={`py-2 px-1 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PieChart size={14} className="shrink-0 text-blue-500" />
            <span className="truncate">Resumen</span>
          </button>
          <button
            onClick={() => setActiveTab("liquidity")}
            data-testid="tab-liquidity"
            className={`py-2 px-1 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "liquidity"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet size={14} className="shrink-0 text-emerald-500" />
            <span className="truncate">Liquidez</span>
          </button>
          <button
            onClick={() => setActiveTab("airbus")}
            data-testid="tab-airbus"
            className={`py-2 px-1 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "airbus"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plane size={14} className="shrink-0 text-indigo-500" />
            <span className="truncate">Airbus ESOP</span>
          </button>
          <button
            onClick={() => setActiveTab("other")}
            data-testid="tab-other"
            className={`py-2 px-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === "other"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp size={14} className="shrink-0 text-purple-500" />
            <span className="truncate">Otras Invers.</span>
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-3 animate-fade-in">
          {/* NET WORTH HERO CARD */}
          <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Patrimonio Neto Total
            </span>
            <p className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              {formatEUR(calculations.totalNetWorth)}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Liquidez Disponible</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatEUR(calculations.totalLiquidity)}</p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold">{calculations.liquidityRatio.toFixed(0)}% del patrimonio</p>
              </div>

              <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20">
                <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase">Total Invertido</span>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400">{formatEUR(calculations.totalInvestments)}</p>
                <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 font-bold">{calculations.investmentRatio.toFixed(0)}% del patrimonio</p>
              </div>
            </div>
          </div>

          {/* ASSET ALLOCATION BAR & PRUDENCE GAUGE */}
          <div className="bg-card p-4 rounded-3xl border border-border/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <span className="flex items-center gap-1.5 text-foreground">
                <PieChart size={15} className="text-blue-500" /> Distribución y Control de Riesgo
              </span>
              <span className="text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full text-[10px] font-black">
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

            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">● Liquidez ({calculations.liquidityRatio.toFixed(0)}%)</span>
              <span className="text-indigo-600 dark:text-indigo-400">● Airbus ({calculations.airbusShareRatio.toFixed(0)}%)</span>
              <span className="text-purple-600 dark:text-purple-400">● Otras ({calculations.otherShareRatio.toFixed(0)}%)</span>
            </div>

            {calculations.healthStatus === "warning" && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Atención: Has superado el límite de prudencia fijado ({settings.targetInvestmentRatio}%).</span>
              </div>
            )}
            {calculations.healthStatus === "safe" && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Distribución equilibrada y colchón de {calculations.runwayMonths.toFixed(1)} meses.</span>
              </div>
            )}
          </div>

          {/* QUICK LINKS */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("liquidity")}
              className="p-3.5 bg-card hover:bg-muted/50 rounded-2xl border border-border/80 flex items-center justify-between text-xs font-extrabold transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5"><Wallet size={16} className="text-emerald-500" /> Ajustar Liquidez</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => setActiveTab("airbus")}
              className="p-3.5 bg-card hover:bg-muted/50 rounded-2xl border border-border/80 flex items-center justify-between text-xs font-extrabold transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5"><Plane size={16} className="text-indigo-500" /> Ver Airbus ESOP</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EFFORTLESS LIQUIDITY */}
      {activeTab === "liquidity" && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                <Wallet className="text-emerald-500" size={18} /> Liquidez y Fondo de Seguridad
              </h2>
              <button
                onClick={handleOpenLiquidityModal}
                data-testid="edit-liquidity-btn"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition active:scale-95"
              >
                <Edit2 size={13} className="inline mr-1" /> Editar Saldo
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Fondo Líquido Disponible</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{formatEUR(liquidity.totalLiquidity)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Gastos Mensuales</span>
                  <p className="font-extrabold text-foreground text-sm mt-0.5">{formatEUR(liquidity.monthlyExpenses)}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Colchón Cubierto</span>
                  <p className="font-black text-blue-600 dark:text-blue-400 text-sm mt-0.5">{calculations.runwayMonths.toFixed(1)} meses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AIRBUS ESOP WEALTH TERMINAL */}
      {activeTab === "airbus" && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-card p-4 rounded-3xl border border-border/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border/60 pb-2.5">
              <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                <Plane className="text-indigo-500" size={18} /> Cartera Airbus ESOP
              </h2>
              <button
                onClick={handleOpenAddAirbus}
                data-testid="add-airbus-btn"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition active:scale-95"
              >
                + Nueva Añada
              </button>
            </div>

            {/* AIRBUS METRICS GRID */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-2xl border border-border/60">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Acciones Totales</span>
                <p className="font-extrabold text-foreground text-sm">{calculations.totalAirbusShares} uds</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Invertido: {formatEUR(calculations.totalAirbusPaidOutOfPocket)}</p>
              </div>

              <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">Valor Mercado</span>
                <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{formatEUR(calculations.totalAirbusMarketValue)}</p>
                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-bold mt-0.5">Bonus: +{formatEUR(calculations.totalAirbusBonusValue)}</p>
              </div>

              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Base Fiscal IRPF</span>
                <p className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{formatEUR(calculations.totalAirbusTaxableMargin)}</p>
                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-bold">Retención ({settings.taxRate}%): -{formatEUR(calculations.totalAirbusEstimatedTax)}</p>
              </div>

              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Beneficio Neto Limpio</span>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatEUR(calculations.totalAirbusNetProfitIfSold)}</p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold mt-0.5">
                  ROI Neto: {calculations.totalAirbusPaidOutOfPocket > 0 ? `+${((calculations.totalAirbusNetProfitIfSold / calculations.totalAirbusPaidOutOfPocket) * 100).toFixed(0)}%` : "0%"}
                </p>
              </div>
            </div>
          </div>

          {/* REALIZED GAINS CARD */}
          {calculations.soldPackagesCount > 0 && (
            <div className="bg-card p-4 rounded-3xl border border-emerald-500/30 shadow-xs space-y-2" data-testid="airbus-realized-card">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                  <ArrowUpRight className="text-emerald-500" size={17} /> Beneficio Realizado ({calculations.soldPackagesCount})
                </span>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                  Ventas cerradas
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-muted/40 p-2.5 rounded-2xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Ingreso Venta</span>
                  <p className="font-extrabold text-foreground text-sm">{formatEUR(calculations.realizedGrossProceeds)}</p>
                </div>
                <div className="bg-rose-500/10 p-2.5 rounded-2xl border border-rose-500/20">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase block">Impuestos ({settings.taxRate}%)</span>
                  <p className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">−{formatEUR(calculations.realizedTax)}</p>
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Neto Real</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatEUR(calculations.realizedNetProfit)}</p>
                </div>
              </div>
            </div>
          )}

          {/* 3-YEAR LOCKUP CARDS LIST */}
          <div className="space-y-2">
            <span className="text-xs font-black text-foreground px-1 uppercase tracking-wider text-muted-foreground block">
              Planes y Añadas Anuales
            </span>

            <div className="space-y-2">
              {airbusPackages.map((pkg) => {
                const totalShares = pkg.purchasedShares + pkg.bonusShares;
                const paid = pkg.purchasedShares * pkg.purchasePrice;
                const officialBasis = totalShares * pkg.officialPrice;
                const priceUsed = pkg.sold && pkg.soldPrice ? pkg.soldPrice : pkg.marketPrice;
                const priceLabel = pkg.sold ? "Venta" : "Mercado";
                const mktValue = totalShares * priceUsed;
                const taxableMargin = Math.max(0, mktValue - officialBasis);
                const estTax = taxableMargin * (settings.taxRate / 100);
                const netProfit = mktValue - paid - estTax;
                const yearsElapsed = currentYear - pkg.yearGranted;
                const isLocked = yearsElapsed < 3;

                return (
                  <div key={pkg.id} className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs text-xs space-y-2">
                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">Añada {pkg.year}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({totalShares} uds)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {pkg.sold ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Vendida</span>
                        ) : isLocked ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Lock size={10} /> Bloqueada ({3 - yearsElapsed}a)
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                            <Unlock size={10} /> Liquidable
                          </span>
                        )}

                        <button onClick={() => handleOpenEditAirbus(pkg)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteAirbus(pkg.id)} className="p-1 text-muted-foreground hover:text-rose-600 cursor-pointer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-muted/30 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Invertido ({pkg.purchasedShares}x)</span>
                        <p className="font-bold text-foreground">{formatEUR(paid)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold">{priceLabel}</span>
                        <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatEUR(mktValue)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Neto {pkg.sold ? "Real" : "Limpio"}</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatEUR(netProfit)}</p>
                      </div>
                    </div>

                    {/* DETAILED FISCAL BREAKDOWN */}
                    <button
                      onClick={() => setExpandedAirbusId(expandedAirbusId === pkg.id ? null : pkg.id)}
                      className="w-full flex items-center justify-between text-[10px] font-bold text-muted-foreground hover:text-foreground px-1 py-0.5 cursor-pointer"
                      data-testid={`airbus-detail-toggle-${pkg.id}`}
                    >
                      <span className="flex items-center gap-1"><Calculator size={11} className="text-indigo-500" /> Desglose fiscal detallado</span>
                      <ChevronRight size={12} className={`transition-transform ${expandedAirbusId === pkg.id ? "rotate-90" : ""}`} />
                    </button>

                    {expandedAirbusId === pkg.id && (
                      <div className="space-y-1 text-[11px] bg-muted/20 border border-border/50 p-2.5 rounded-xl animate-fade-in" data-testid={`airbus-detail-${pkg.id}`}>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Acciones compradas (X)</span>
                          <span className="font-mono font-bold text-foreground">{pkg.purchasedShares} × {formatEUR(pkg.purchasePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Acciones regalo (Y) · coste 0</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{pkg.bonusShares} uds</span>
                        </div>
                        <div className="flex justify-between border-t border-border/40 pt-1">
                          <span className="text-muted-foreground">Coste de compra</span>
                          <span className="font-mono font-bold text-foreground">{formatEUR(paid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ingreso {pkg.sold ? "venta" : "estimado"} ({totalShares} × {formatEUR(priceUsed)})</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatEUR(mktValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor oficial ({totalShares} × {formatEUR(pkg.officialPrice)})</span>
                          <span className="font-mono font-bold text-foreground">{formatEUR(officialBasis)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/40 pt-1">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Base fiscal (Venta − Oficial)</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatEUR(taxableMargin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Impuesto ({settings.taxRate}%)</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">−{formatEUR(estTax)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/40 pt-1 text-sm">
                          <span className="text-emerald-700 dark:text-emerald-400 font-black">Beneficio neto {pkg.sold ? "real" : "estimado"}</span>
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">{formatEUR(netProfit)}</span>
                        </div>
                        {pkg.sold && pkg.soldDate && (
                          <p className="text-[10px] text-muted-foreground text-right pt-0.5">Vendido el {new Date(pkg.soldDate).toLocaleDateString("es-ES")}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIMULATOR ACCORDION */}
          <div className="bg-card p-4 rounded-3xl border border-border/80 shadow-xs space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <span className="font-extrabold flex items-center gap-1.5 text-foreground">
                <Calculator size={16} className="text-indigo-500" /> Simulador de Liquidación IRPF
              </span>
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setAirbusSimMode("unlocked")}
                  className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer border ${airbusSimMode === "unlocked" ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted border-border/50 text-muted-foreground"}`}
                >
                  Desbloqueadas
                </button>
                <button
                  onClick={() => setAirbusSimMode("all")}
                  className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer border ${airbusSimMode === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-muted border-border/50 text-muted-foreground"}`}
                >
                  Todas
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-2xl border border-border/60">
              <label className="text-[10px] font-bold text-muted-foreground shrink-0">Precio venta objetivo (€):</label>
              <input
                type="number"
                step="0.01"
                value={simMarketPriceOverride}
                onChange={(e) => setSimMarketPriceOverride(e.target.value)}
                placeholder="Usar precio de mercado"
                className="flex-1 min-w-0 px-2 py-1.5 bg-card border border-border rounded-xl font-mono text-[11px] outline-none"
                data-testid="sim-price-input"
              />
              {simMarketPriceOverride && (
                <button
                  onClick={() => setSimMarketPriceOverride("")}
                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 cursor-pointer shrink-0"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex justify-between items-center bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold">Acciones Simuladas ({simulation.totalSimShares} uds)</span>
                <p className="font-black text-sm text-indigo-600 dark:text-indigo-400">Venta Bruta: {formatEUR(simulation.totalSimGrossProceeds)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">IRPF ({settings.taxRate}%): -{formatEUR(simulation.simTax)}</span>
                <p className="font-black text-sm text-emerald-600 dark:text-emerald-400">Neto: {formatEUR(simulation.simNetProceeds)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-muted/40 p-2 rounded-xl border border-border/60 text-center">
                <span className="text-muted-foreground font-bold block">Coste compra</span>
                <p className="font-mono font-bold text-foreground">{formatEUR(simulation.totalSimPaid)}</p>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-center">
                <span className="text-amber-600 dark:text-amber-400 font-bold block">Base fiscal</span>
                <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatEUR(simulation.simTaxableMargin)}</p>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Benef. real neto</span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatEUR(simulation.simRealNetProfit)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OTRAS INVERSIONES */}
      {activeTab === "other" && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-between items-center bg-card p-4 rounded-3xl border border-border/80 shadow-xs">
            <h2 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
              <TrendingUp className="text-purple-500" size={18} /> Otras Inversiones
            </h2>
            <button
              onClick={handleOpenAddOther}
              data-testid="add-other-btn"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs cursor-pointer transition active:scale-95"
            >
              + Añadir
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {otherInvestments.map((item) => {
              const gain = item.currentValue - item.initialValue;

              return (
                <div key={item.id} className="bg-card p-3.5 rounded-2xl border border-border/70 shadow-xs flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-purple-600 dark:text-purple-400 tracking-wider block">{item.category}</span>
                    <h3 className="font-black text-foreground text-sm mt-0.5">{item.name}</h3>
                    <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{formatEUR(item.currentValue)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${gain >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"}`}>
                      {gain >= 0 ? "+" : ""}{formatEUR(gain)}
                    </span>
                    <button onClick={() => handleOpenEditOther(item)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDeleteOther(item.id)} className="p-1 text-muted-foreground hover:text-rose-600 cursor-pointer">
                      <Trash2 size={13} />
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <h3 className="font-extrabold text-sm">Actualizar Liquidez y Gastos</h3>
              <button onClick={() => setShowLiquidityModal(false)} className="text-muted-foreground hover:text-foreground">
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
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl font-mono text-sm font-bold outline-none"
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
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowLiquidityModal(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: AIRBUS PACKAGE --- */}
      {showAirbusModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-4 max-h-[85dvh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <h3 className="font-extrabold text-sm">
                {editingAirbus ? "Editar Plan Airbus" : "Registrar Plan Airbus"}
              </h3>
              <button onClick={() => setShowAirbusModal(false)} className="text-muted-foreground hover:text-foreground">
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
                    className="w-full px-3 py-1.5 bg-muted/60 border border-border rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Año Adjudicación</label>
                  <input
                    type="number"
                    required
                    value={airbusForm.yearGranted}
                    onChange={(e) => setAirbusForm({ ...airbusForm, yearGranted: e.target.value })}
                    className="w-full px-3 py-1.5 bg-muted/60 border border-border rounded-xl font-mono outline-none"
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
                    className="w-full px-3 py-1.5 bg-muted/60 border border-border rounded-xl font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Bonus Regalo (Y)</label>
                  <input
                    type="number"
                    required
                    value={airbusForm.bonusShares}
                    onChange={(e) => setAirbusForm({ ...airbusForm, bonusShares: e.target.value })}
                    className="w-full px-3 py-1.5 bg-muted/60 border border-border rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">P. Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={airbusForm.purchasePrice}
                    onChange={(e) => setAirbusForm({ ...airbusForm, purchasePrice: e.target.value })}
                    className="w-full px-2 py-1.5 bg-muted/60 border border-border rounded-xl font-mono text-[11px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">P. Oficial</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={airbusForm.officialPrice}
                    onChange={(e) => setAirbusForm({ ...airbusForm, officialPrice: e.target.value })}
                    className="w-full px-2 py-1.5 bg-muted/60 border border-border rounded-xl font-mono text-[11px] outline-none"
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
                    className="w-full px-2 py-1.5 bg-muted/60 border border-border rounded-xl font-mono text-[11px] outline-none"
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
                    data-testid="airbus-sold-checkbox"
                  />
                  <span className="font-semibold text-xs text-foreground">Marcar como vendido</span>
                </label>
              </div>

              {airbusForm.sold && (
                <div className="grid grid-cols-2 gap-2 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-2xl animate-fade-in">
                  <div>
                    <label className="block font-bold text-emerald-700 dark:text-emerald-400 mb-1">Precio Venta (€/acción)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={airbusForm.soldPrice}
                      onChange={(e) => setAirbusForm({ ...airbusForm, soldPrice: e.target.value })}
                      className="w-full px-2 py-1.5 bg-card border border-emerald-500/30 rounded-xl font-mono text-[11px] outline-none"
                      data-testid="airbus-sold-price-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-700 dark:text-emerald-400 mb-1">Fecha Venta</label>
                    <input
                      type="date"
                      value={airbusForm.soldDate}
                      onChange={(e) => setAirbusForm({ ...airbusForm, soldDate: e.target.value })}
                      className="w-full px-2 py-1.5 bg-card border border-emerald-500/30 rounded-xl font-mono text-[11px] outline-none"
                      data-testid="airbus-sold-date-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAirbusModal(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer" data-testid="airbus-save-btn">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: OTHER INVESTMENT --- */}
      {showOtherModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <h3 className="font-extrabold text-sm">{editingOther ? "Editar Inversión" : "Añadir Inversión"}</h3>
              <button onClick={() => setShowOtherModal(false)} className="text-muted-foreground hover:text-foreground">
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
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Categoría</label>
                <select
                  value={otherForm.category}
                  onChange={(e) => setOtherForm({ ...otherForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl outline-none"
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
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl font-mono outline-none"
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
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white rounded-xl font-bold cursor-pointer">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: SETTINGS --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card text-card-foreground p-5 rounded-3xl border border-border shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-2">
              <h3 className="font-extrabold text-sm">Ajustes de Prudencia e IRPF</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">
                  Límite Máximo Invertido (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={settingsForm.targetInvestmentRatio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, targetInvestmentRatio: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl font-mono outline-none"
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
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-xl font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl font-bold cursor-pointer">
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
