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
} from "lucide-react";

// --- TYPES ---
export interface LiquidAccount {
  id: string;
  name: string;
  balance: number;
  type: "bank" | "cash" | "savings";
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

const LOCAL_STORAGE_KEY = "finance_tracker_data_v1";

export function FinanceTrackerModule() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "liquidity" | "airbus" | "other"
  >("dashboard");

  // State
  const [liquidAccounts, setLiquidAccounts] = useState<LiquidAccount[]>([]);
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

  // Modals & Form states
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LiquidAccount | null>(
    null
  );
  const [accountForm, setAccountForm] = useState({
    name: "",
    balance: "",
    type: "bank" as "bank" | "cash" | "savings",
    notes: "",
  });

  const [showAirbusModal, setShowAirbusModal] = useState(false);
  const [editingAirbus, setEditingAirbus] = useState<AirbusPackage | null>(
    null
  );
  const currentYear = new Date().getFullYear();
  const [airbusForm, setAirbusForm] = useState({
    year: String(currentYear),
    purchasedShares: "",
    bonusShares: "",
    purchasePrice: "",
    officialPrice: "",
    marketPrice: "",
    yearGranted: String(currentYear),
    sold: false,
    soldPrice: "",
    notes: "",
  });

  const [showOtherModal, setShowOtherModal] = useState(false);
  const [editingOther, setEditingOther] = useState<OtherInvestment | null>(
    null
  );
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
            setLiquidAccounts(data.liquidAccounts || []);
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
            setLiquidAccounts(parsed.liquidAccounts || []);
            setAirbusPackages(parsed.airbusPackages || []);
            setOtherInvestments(parsed.otherInvestments || []);
            if (parsed.settings) {
              setSettings(parsed.settings);
            }
          } catch (e) {
            console.error("Error parsing local storage:", e);
          }
        } else {
          // Pre-seed mock data for demonstration if empty
          const sampleAccounts: LiquidAccount[] = [
            { id: "1", name: "Cuenta Corriente", balance: 12500, type: "bank", notes: "Gastos y nómina" },
            { id: "2", name: "Fondo Emergencia", balance: 8000, type: "savings", notes: "Reserva líquida" },
          ];
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
              notes: "ESOP 2022",
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
              notes: "ESOP 2023",
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
              notes: "ESOP 2024",
            },
          ];
          const sampleOther: OtherInvestment[] = [
            { id: "o1", name: "MSCI World ETF", category: "funds", initialValue: 15000, currentValue: 18400, notes: "Fondo indexado" },
            { id: "o2", name: "Criptomonedas", category: "crypto", initialValue: 3000, currentValue: 4200, notes: "BTC & ETH" },
          ];
          setLiquidAccounts(sampleAccounts);
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
    newAccounts: LiquidAccount[],
    newAirbus: AirbusPackage[],
    newOther: OtherInvestment[],
    newSettings: Settings
  ) => {
    setSaving(true);
    setSyncStatus("saving");

    const payload = {
      liquidAccounts: newAccounts,
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
    // 1. Total Liquidity
    const totalLiquidity = liquidAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

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
  }, [liquidAccounts, airbusPackages, otherInvestments, settings, currentYear]);

  // --- HANDLERS ---
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({ name: "", balance: "", type: "bank", notes: "" });
    setShowAccountModal(true);
  };

  const handleOpenEditAccount = (acc: LiquidAccount) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      balance: String(acc.balance),
      type: acc.type,
      notes: acc.notes || "",
    });
    setShowAccountModal(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name.trim()) return;

    let updated: LiquidAccount[];
    const balanceNum = parseFloat(accountForm.balance) || 0;

    if (editingAccount) {
      updated = liquidAccounts.map((a) =>
        a.id === editingAccount.id
          ? { ...a, name: accountForm.name, balance: balanceNum, type: accountForm.type, notes: accountForm.notes }
          : a
      );
    } else {
      const newAcc: LiquidAccount = {
        id: "acc_" + Date.now(),
        name: accountForm.name,
        balance: balanceNum,
        type: accountForm.type,
        notes: accountForm.notes,
      };
      updated = [...liquidAccounts, newAcc];
    }

    setLiquidAccounts(updated);
    saveData(updated, airbusPackages, otherInvestments, settings);
    setShowAccountModal(false);
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm("¿Eliminar esta cuenta?")) {
      const updated = liquidAccounts.filter((a) => a.id !== id);
      setLiquidAccounts(updated);
      saveData(updated, airbusPackages, otherInvestments, settings);
    }
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
    saveData(liquidAccounts, updated, otherInvestments, settings);
    setShowAirbusModal(false);
  };

  const handleDeleteAirbus = (id: string) => {
    if (confirm("¿Eliminar paquete de acciones?")) {
      const updated = airbusPackages.filter((p) => p.id !== id);
      setAirbusPackages(updated);
      saveData(liquidAccounts, updated, otherInvestments, settings);
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
    saveData(liquidAccounts, airbusPackages, updated, settings);
    setShowOtherModal(false);
  };

  const handleDeleteOther = (id: string) => {
    if (confirm("¿Eliminar esta inversión?")) {
      const updated = otherInvestments.filter((o) => o.id !== id);
      setOtherInvestments(updated);
      saveData(liquidAccounts, airbusPackages, updated, settings);
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
    saveData(liquidAccounts, airbusPackages, otherInvestments, newSettings);
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

  return (
    <div className="space-y-6 pb-8">
      {/* ULTRA-COMPACT HEADER BAR */}
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Gestor Financiero
            </h1>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                syncStatus === "synced"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-blue-500/10 text-blue-600"
              }`}
            >
              ● {syncStatus === "synced" ? "BD" : "Local"}
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenSettings}
          className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
          title="Ajustes de Inversión e IRPF"
        >
          <SettingsIcon size={16} />
          <span className="hidden sm:inline">Ajustes</span>
        </button>
      </div>

      {/* SEGMENTED TAB BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PieChart size={15} /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "liquidity"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wallet size={15} /> Liquidez ({formatEUR(calculations.totalLiquidity)})
        </button>
        <button
          onClick={() => setActiveTab("airbus")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "airbus"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plane size={15} /> Airbus ({formatEUR(calculations.totalAirbusMarketValue)})
        </button>
        <button
          onClick={() => setActiveTab("other")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "other"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp size={15} /> Otras Invers.
        </button>
      </div>

      {/* SECCIÓN 1: DASHBOARD PRINCIPAL */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI CARDS (2 COLUMNS ON MOBILE) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-xs col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Patrimonio Total
              </span>
              <p className="text-2xl font-extrabold tracking-tight text-foreground mt-1">
                {formatEUR(calculations.totalNetWorth)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Liquidez + Inversiones
              </p>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Dinero Líquido
              </span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">
                {formatEUR(calculations.totalLiquidity)}
              </p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                {calculations.liquidityRatio.toFixed(0)}% del total
              </p>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Invertido
              </span>
              <p className="text-xl font-extrabold text-purple-600 mt-1">
                {formatEUR(calculations.totalInvestments)}
              </p>
              <p className="text-[11px] font-bold text-purple-600 mt-0.5">
                {calculations.investmentRatio.toFixed(0)}% del total
              </p>
            </div>
          </div>

          {/* COMPACT PRUDENTIAL HEALTH GAUGE */}
          <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <PieChart className="text-blue-600" size={16} /> Prudencia: Nivel de Inversión
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-muted px-2.5 py-1 rounded-lg">
                Máx: {settings.targetInvestmentRatio}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-600">
                  Liquidez: {calculations.liquidityRatio.toFixed(0)}%
                </span>
                <span className="text-purple-600">
                  Invertido: {calculations.investmentRatio.toFixed(0)}%
                </span>
              </div>

              <div className="relative w-full h-5 bg-muted rounded-full overflow-hidden flex p-0.5 border border-border">
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-300"
                  style={{ width: `${Math.max(2, calculations.liquidityRatio)}%` }}
                />
                <div
                  className={`h-full rounded-r-full transition-all duration-300 ${
                    calculations.healthStatus === "warning"
                      ? "bg-rose-500"
                      : calculations.healthStatus === "caution"
                      ? "bg-amber-500"
                      : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.max(2, calculations.investmentRatio)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                  style={{ left: `${settings.targetInvestmentRatio}%` }}
                />
              </div>
            </div>

            {/* MICRO HEALTH CALLOUT */}
            {calculations.healthStatus === "warning" && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>⚠️ Superado el límite prudente ({settings.targetInvestmentRatio}%). Refuerza la liquidez.</span>
              </div>
            )}
            {calculations.healthStatus === "safe" && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>✅ Nivel de inversión seguro y equilibrado.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: LIQUIDEZ Y CUENTAS */}
      {activeTab === "liquidity" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
            <h2 className="text-base font-bold flex items-center gap-1.5">
              <Wallet className="text-emerald-600" size={18} /> Cuentas Bancarias
            </h2>
            <button
              onClick={handleOpenAddAccount}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <Plus size={14} /> Nueva Cuenta
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {liquidAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-card p-4 rounded-2xl border border-border shadow-xs flex justify-between items-center"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-600">
                    {acc.type === "bank" ? "Banco" : acc.type === "savings" ? "Ahorro" : "Efectivo"}
                  </span>
                  <h3 className="font-bold text-sm text-foreground">{acc.name}</h3>
                  <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                    {formatEUR(acc.balance)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditAccount(acc)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: ACCIONES AIRBUS */}
      {activeTab === "airbus" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
            <h2 className="text-base font-bold flex items-center gap-1.5">
              <Plane className="text-indigo-600" size={18} /> Acciones Airbus (ESOP)
            </h2>
            <button
              onClick={handleOpenAddAirbus}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus size={14} /> Nuevo Paquete
            </button>
          </div>

          {/* COMPACT METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-card p-3 rounded-xl border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Acciones</span>
              <p className="text-lg font-extrabold text-foreground">{calculations.totalAirbusShares} uds</p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Valor Mercado</span>
              <p className="text-lg font-extrabold text-indigo-600">{formatEUR(calculations.totalAirbusMarketValue)}</p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Margen Base IRPF</span>
              <p className="text-lg font-extrabold text-amber-600">{formatEUR(calculations.totalAirbusTaxableMargin)}</p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border">
              <span className="text-[10px] text-muted-foreground font-semibold">Ganancia Neta</span>
              <p className="text-lg font-extrabold text-emerald-600">{formatEUR(calculations.totalAirbusNetProfitIfSold)}</p>
            </div>
          </div>

          {/* ANNUAL PACKAGES CARDS / LIST FOR MOBILE */}
          <div className="space-y-2">
            {airbusPackages.map((pkg) => {
              const totalShares = pkg.purchasedShares + pkg.bonusShares;
              const paidOutOfPocket = pkg.purchasedShares * pkg.purchasePrice;
              const officialBasis = totalShares * pkg.officialPrice;
              const mktValue = totalShares * (pkg.sold && pkg.soldPrice ? pkg.soldPrice : pkg.marketPrice);
              const taxableMargin = Math.max(0, mktValue - officialBasis);
              const estTax = taxableMargin * (settings.taxRate / 100);
              const netBenefit = mktValue - paidOutOfPocket - estTax;
              const isLocked = (currentYear - pkg.yearGranted) < 3;

              return (
                <div
                  key={pkg.id}
                  className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-2"
                >
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">{pkg.year}</span>
                      <span className="text-xs text-muted-foreground">({totalShares} uds)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {pkg.sold ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600">
                          Vendida
                        </span>
                      ) : isLocked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 flex items-center gap-1">
                          <Lock size={12} /> Bloqueada ({pkg.yearGranted + 3})
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 flex items-center gap-1">
                          <Unlock size={12} /> Disponible
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenEditAirbus(pkg)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAirbus(pkg.id)}
                        className="p-1 text-muted-foreground hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Pagado</p>
                      <p className="font-bold text-foreground">{formatEUR(paidOutOfPocket)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Valor Actual</p>
                      <p className="font-bold text-indigo-600">{formatEUR(mktValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Neto Limpio</p>
                      <p className="font-bold text-emerald-600">{formatEUR(netBenefit)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: OTRAS INVERSIONES */}
      {activeTab === "other" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
            <h2 className="text-base font-bold flex items-center gap-1.5">
              <TrendingUp className="text-purple-600" size={18} /> Otras Inversiones
            </h2>
            <button
              onClick={handleOpenAddOther}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 transition cursor-pointer"
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
                    <p className="text-lg font-extrabold text-purple-600 mt-0.5">
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

      {/* --- MODAL: ACCOUNT --- */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xl max-w-sm w-full space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm">
                {editingAccount ? "Editar Cuenta" : "Añadir Cuenta"}
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BBVA Corriente"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Tipo</label>
                <select
                  value={accountForm.type}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="bank">Cuenta Bancaria</option>
                  <option value="savings">Cuenta Ahorro</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Saldo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-3 py-1.5 bg-muted text-foreground rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold"
                >
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
          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xl max-w-sm w-full space-y-4 max-h-[85dvh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm">
                {editingAirbus ? "Editar Paquete Airbus" : "Registrar Paquete Airbus"}
              </h3>
              <button
                onClick={() => setShowAirbusModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
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
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, yearGranted: e.target.value })
                    }
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
                    placeholder="30"
                    value={airbusForm.purchasedShares}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, purchasedShares: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Regalo (Y)</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={airbusForm.bonusShares}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, bonusShares: e.target.value })
                    }
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
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, purchasePrice: e.target.value })
                    }
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
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, officialPrice: e.target.value })
                    }
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Mercado/Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={airbusForm.marketPrice}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, marketPrice: e.target.value })
                    }
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={airbusForm.sold}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, sold: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-xs text-foreground">
                    Paquete ya vendido
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAirbusModal(false)}
                  className="px-3 py-1.5 bg-muted text-foreground rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Guardar Paquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: OTHER INVESTMENT --- */}
      {showOtherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xl max-w-sm w-full space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm">
                {editingOther ? "Editar Inversión" : "Añadir Inversión"}
              </h3>
              <button
                onClick={() => setShowOtherModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOther} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MSCI World ETF"
                  value={otherForm.name}
                  onChange={(e) =>
                    setOtherForm({ ...otherForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Categoría</label>
                <select
                  value={otherForm.category}
                  onChange={(e) =>
                    setOtherForm({ ...otherForm, category: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500"
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
                    onChange={(e) =>
                      setOtherForm({ ...otherForm, initialValue: e.target.value })
                    }
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
                    onChange={(e) =>
                      setOtherForm({ ...otherForm, currentValue: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="px-3 py-1.5 bg-muted text-foreground rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-xl font-bold"
                >
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
          <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border shadow-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm">⚙️ Ajustes de Prudencia e IRPF</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
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
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      targetInvestmentRatio: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, taxRate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3 py-1.5 bg-muted text-foreground rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold"
                >
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
