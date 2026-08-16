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
            { id: "1", name: "Cuenta Corriente Principal", balance: 12500, type: "bank", notes: "Gastos mensuales y nómina" },
            { id: "2", name: "Fondo de Emergencia", balance: 8000, type: "savings", notes: "6 meses de gastos guardados" },
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
            { id: "o1", name: "Fondo Indexado MSCI World", category: "funds", initialValue: 15000, currentValue: 18400, notes: "Aportación periódica" },
            { id: "o2", name: "Bitcoin & Ethereum", category: "crypto", initialValue: 3000, currentValue: 4200, notes: "Cartera cripto diversificada" },
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

    // Save local storage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Local storage save error:", e);
    }

    // Save API
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
    let totalAirbusPaidOutOfPocket = 0; // X * P_compra
    let totalAirbusOfficialCostBasis = 0; // (X + Y) * P_oficial
    let totalAirbusMarketValue = 0; // (X + Y) * P_mercado
    let totalAirbusTaxableMargin = 0;
    let totalAirbusEstimatedTax = 0;
    let totalAirbusUnlockedValue = 0;
    let totalAirbusLockedValue = 0;

    airbusPackages.forEach((pkg) => {
      if (pkg.sold) return; // Skip sold items for current market portfolio holdings

      const totalShares = (Number(pkg.purchasedShares) || 0) + (Number(pkg.bonusShares) || 0);
      const paid = (Number(pkg.purchasedShares) || 0) * (Number(pkg.purchasePrice) || 0);
      const officialBasis = totalShares * (Number(pkg.officialPrice) || 0);
      const mktValue = totalShares * (Number(pkg.marketPrice) || 0);

      // Tax gain margin = (Total shares * Market Price) - (Total shares * Official Price)
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

    // Investment Health Level
    // If investment ratio exceeds target threshold by > 10%, caution
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

  // --- ACCOUNT HANDLERS ---
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
    if (confirm("¿Seguro que deseas eliminar esta cuenta?")) {
      const updated = liquidAccounts.filter((a) => a.id !== id);
      setLiquidAccounts(updated);
      saveData(updated, airbusPackages, otherInvestments, settings);
    }
  };

  // --- AIRBUS HANDLERS ---
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
    if (confirm("¿Deseas eliminar este paquete de acciones Airbus?")) {
      const updated = airbusPackages.filter((p) => p.id !== id);
      setAirbusPackages(updated);
      saveData(liquidAccounts, updated, otherInvestments, settings);
    }
  };

  // --- OTHER INVESTMENTS HANDLERS ---
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
    if (confirm("¿Deseas eliminar esta inversión?")) {
      const updated = otherInvestments.filter((o) => o.id !== id);
      setOtherInvestments(updated);
      saveData(liquidAccounts, airbusPackages, updated, settings);
    }
  };

  // --- SETTINGS HANDLERS ---
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

  // Format currency
  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando Gestor Financiero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Gestor Financiero
            </h1>
            <span
              title={
                syncStatus === "synced"
                  ? "Datos guardados en MongoDB"
                  : syncStatus === "saving"
                  ? "Guardando cambios..."
                  : "Modo almacenamiento local offline"
              }
              className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                syncStatus === "synced"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : syncStatus === "saving"
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === "synced"
                    ? "bg-emerald-500"
                    : syncStatus === "saving"
                    ? "bg-amber-500"
                    : "bg-blue-500"
                }`}
              />
              {syncStatus === "synced"
                ? "BD Sincronizada"
                : syncStatus === "saving"
                ? "Guardando..."
                : "Modo Local"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Control de salud financiera, liquidez prudente e inversiones diversificadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm rounded-xl font-medium transition cursor-pointer"
          >
            ⚙️ Ajustes ({settings.targetInvestmentRatio}% Máx. Inversión)
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PieChart size={18} /> Resumen General
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "liquidity"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wallet size={18} /> Liquidez ({formatEUR(calculations.totalLiquidity)})
        </button>
        <button
          onClick={() => setActiveTab("airbus")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "airbus"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plane size={18} /> Acciones Airbus ({formatEUR(calculations.totalAirbusMarketValue)})
        </button>
        <button
          onClick={() => setActiveTab("other")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "other"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp size={18} /> Otras Inversiones ({formatEUR(calculations.totalOtherInvestmentsCurrent)})
        </button>
      </div>

      {/* TAB 1: DASHBOARD / RESUMEN GENERAL */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* TOP SUMMARY METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Patrimonio Total
                </span>
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Coins size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold tracking-tight">
                {formatEUR(calculations.totalNetWorth)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Liquidez total + Inversiones activas
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dinero Líquido
                </span>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <Wallet size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                {formatEUR(calculations.totalLiquidity)}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Proporción:</span>
                <span className="font-bold text-emerald-600">
                  {calculations.liquidityRatio.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Invertido
                </span>
                <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-purple-600 tracking-tight">
                {formatEUR(calculations.totalInvestments)}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Proporción:</span>
                <span className="font-bold text-purple-600">
                  {calculations.investmentRatio.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* INVESTMENT HEALTH GAUGE / CONTROL DE NIVEL DE INVERSIÓN */}
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PieChart className="text-blue-600" size={22} /> Control de Nivel de Inversión y Prudencia
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Evaluación continua para no invertir demasiado capital y mantener un margen seguro de liquidez.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl text-sm font-semibold">
                <span>Límite Deseado:</span>
                <span className="text-blue-600 font-extrabold">{settings.targetInvestmentRatio}%</span>
              </div>
            </div>

            {/* PROGRESS BAR GAUGE */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Wallet size={16} /> Liquidez: {calculations.liquidityRatio.toFixed(1)}% ({formatEUR(calculations.totalLiquidity)})
                </span>
                <span className="text-purple-600 flex items-center gap-1">
                  <TrendingUp size={16} /> Invertido: {calculations.investmentRatio.toFixed(1)}% ({formatEUR(calculations.totalInvestments)})
                </span>
              </div>

              <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden flex p-1 border border-border">
                {/* Liquidity Segment */}
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ width: `${Math.max(2, calculations.liquidityRatio)}%` }}
                  title={`Liquidez ${calculations.liquidityRatio.toFixed(1)}%`}
                >
                  {calculations.liquidityRatio > 15 && `${calculations.liquidityRatio.toFixed(0)}%`}
                </div>
                {/* Investment Segment */}
                <div
                  className={`h-full rounded-r-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold ${
                    calculations.healthStatus === "warning"
                      ? "bg-rose-500"
                      : calculations.healthStatus === "caution"
                      ? "bg-amber-500"
                      : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.max(2, calculations.investmentRatio)}%` }}
                  title={`Inversión ${calculations.investmentRatio.toFixed(1)}%`}
                >
                  {calculations.investmentRatio > 15 && `${calculations.investmentRatio.toFixed(0)}%`}
                </div>

                {/* Target Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-foreground z-10 shadow-md"
                  style={{ left: `${settings.targetInvestmentRatio}%` }}
                  title={`Límite Máximo Objetivo: ${settings.targetInvestmentRatio}%`}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="font-semibold text-foreground">
                  🎯 Marcador Objetivo Máximo ({settings.targetInvestmentRatio}%)
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* HEALTH ADVISORY BANNER */}
            {calculations.healthStatus === "warning" && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">⚠️ Atención: Elevada exposición en inversiones</p>
                  <p className="text-xs mt-1 leading-relaxed">
                    Has superado tu límite fijado del {settings.targetInvestmentRatio}% (actualmente en{" "}
                    <strong>{calculations.investmentRatio.toFixed(1)}%</strong>). Te recomendamos derivar futuros ingresos a tu cuenta de liquidez o fondo de emergencia para no comprometer tu liquidez a corto plazo.
                  </p>
                </div>
              </div>
            )}

            {calculations.healthStatus === "caution" && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 flex items-start gap-3">
                <Info className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">ℹ️ Nivel Moderado: Cerca del límite objetivo</p>
                  <p className="text-xs mt-1 leading-relaxed">
                    Tus inversiones representan un <strong>{calculations.investmentRatio.toFixed(1)}%</strong> de tu patrimonio total. Estás en la zona límite deseada ({settings.targetInvestmentRatio}%).
                  </p>
                </div>
              </div>
            )}

            {calculations.healthStatus === "safe" && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">✅ Distribución Prudente y Equilibrada</p>
                  <p className="text-xs mt-1 leading-relaxed">
                    Mantienes un colchón de liquidez saludable del{" "}
                    <strong>{calculations.liquidityRatio.toFixed(1)}%</strong> ({formatEUR(calculations.totalLiquidity)}). Tus inversiones se mantienen dentro del margen prudente fijado.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIQUIDEZ Y CUENTAS */}
      {activeTab === "liquidity" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wallet className="text-emerald-600" size={22} /> Cuentas Bancarias y Liquidez
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Dinero disponible de forma inmediata (cuentas corrientes, nómina, colchón de seguridad y efectivo).
              </p>
            </div>
            <button
              onClick={handleOpenAddAccount}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              <Plus size={18} /> Añadir Cuenta
            </button>
          </div>

          {/* ACCOUNTS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liquidAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-emerald-500/50 transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                      {acc.type === "bank"
                        ? "Banco"
                        : acc.type === "savings"
                        ? "Ahorro"
                        : "Efectivo"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditAccount(acc)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-foreground">{acc.name}</h3>
                  {acc.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{acc.notes}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Saldo Disponible</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                    {formatEUR(acc.balance)}
                  </p>
                </div>
              </div>
            ))}

            {liquidAccounts.length === 0 && (
              <div className="col-span-full bg-card p-12 text-center rounded-2xl border border-dashed border-border space-y-3">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="font-bold text-foreground">No tienes cuentas agregadas</p>
                <p className="text-sm text-muted-foreground">
                  Añade tus cuentas de banco o reservas para calcular tu liquidez total.
                </p>
                <button
                  onClick={handleOpenAddAccount}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition cursor-pointer"
                >
                  + Añadir primera cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACCIONES AIRBUS */}
      {activeTab === "airbus" && (
        <div className="space-y-8">
          {/* HEADER & EXPLANATION BANNER */}
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Plane className="text-indigo-600" size={26} /> Plan de Acciones Airbus (ESOP)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestión detallada de paquetes anuales, bloqueo de 3 años, cálculo de impuestos e IRPF oficial.
                </p>
              </div>

              <button
                onClick={handleOpenAddAirbus}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                <Plus size={18} /> Registrar Nuevo Paquete
              </button>
            </div>

            {/* DETAILED TAX & ESOP EXPLANATION BOX */}
            <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-950 dark:text-indigo-200 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-700 dark:text-indigo-300">
                <Info size={18} /> ¿Cómo funciona la tributación y el cálculo de plusvalía en Airbus?
              </div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground dark:text-indigo-200/80">
                <li>
                  <strong>Paquetes anuales:</strong> Compras <strong>X</strong> acciones (a precio rebajado P_compra) y la empresa te regala <strong>Y</strong> acciones adicionales. Recibes un total de <strong>N = X + Y</strong> acciones.
                </li>
                <li>
                  <strong>Período de Bloqueo (3 Años):</strong> Las acciones concedidas no se pueden vender hasta transcurridos 3 años desde su adjudicación.
                </li>
                <li>
                  <strong>Cálculo Fiscal e Impuestos:</strong> Al vender (o simular la venta), la plusvalía tributable oficial no usa tu precio de compra reducido, sino el <strong>Precio Oficial de Referencia (P_oficial)</strong> fijado el día de adjudicación.
                </li>
                <li>
                  <strong>Fórmula de Margen Tributable:</strong> Margen = (X + Y) * P_venta - (X + Y) * P_oficial. Sobre ese margen se calcula el IRPF ({settings.taxRate}%).
                </li>
                <li>
                  <strong>Beneficio Real Neto:</strong> Ganancia Neta = Valor de Venta Total - Importe Pagado de tu Bolsillo (X * P_compra) - Impuestos.
                </li>
              </ul>
            </div>

            {/* AIRBUS METRICS PANEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Acciones Totales Recibidas</span>
                <p className="text-2xl font-extrabold text-foreground mt-1">
                  {calculations.totalAirbusShares} <span className="text-xs text-muted-foreground">uds</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pagado de bolsillo: <strong>{formatEUR(calculations.totalAirbusPaidOutOfPocket)}</strong>
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Valor Actual Mercado</span>
                <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                  {formatEUR(calculations.totalAirbusMarketValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base fiscal oficial: <strong>{formatEUR(calculations.totalAirbusOfficialCostBasis)}</strong>
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Margen Tributable Estimado</span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">
                  {formatEUR(calculations.totalAirbusTaxableMargin)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Impuesto IRPF ({settings.taxRate}%): <strong>{formatEUR(calculations.totalAirbusEstimatedTax)}</strong>
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground font-semibold">Ganancia Neta Limpia</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {formatEUR(calculations.totalAirbusNetProfitIfSold)}
                </p>
                <p className="text-xs text-emerald-600 font-bold mt-1">
                  {calculations.totalAirbusPaidOutOfPocket > 0
                    ? `+${((calculations.totalAirbusNetProfitIfSold / calculations.totalAirbusPaidOutOfPocket) * 100).toFixed(1)}% ROI neto`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>

          {/* ANNUAL PACKAGES TABLE */}
          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg">Histórico de Paquetes Anuales</h3>
              <span className="text-xs text-muted-foreground font-medium">
                I.R.P.F. Configurado: {settings.taxRate}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-4">Año / Plan</th>
                    <th className="p-4">Acciones (X + Y)</th>
                    <th className="p-4">Precios (€)</th>
                    <th className="p-4">Inversión Bolsillo</th>
                    <th className="p-4">Valor Mercado</th>
                    <th className="p-4">Margen Tributable</th>
                    <th className="p-4">Estado Lockup</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
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
                      <tr key={pkg.id} className="hover:bg-muted/30 transition">
                        <td className="p-4 font-bold text-foreground">
                          {pkg.year}
                          {pkg.notes && (
                            <p className="text-xs text-muted-foreground font-normal">{pkg.notes}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold">{totalShares}</span>
                          <p className="text-xs text-muted-foreground">
                            {pkg.purchasedShares} compradas + {pkg.bonusShares} regalo
                          </p>
                        </td>
                        <td className="p-4 text-xs space-y-0.5">
                          <p>Compra: <span className="font-semibold">{formatEUR(pkg.purchasePrice)}</span></p>
                          <p>Oficial: <span className="font-semibold text-amber-600">{formatEUR(pkg.officialPrice)}</span></p>
                          <p>Mercado: <span className="font-semibold text-indigo-600">{formatEUR(pkg.marketPrice)}</span></p>
                        </td>
                        <td className="p-4 font-bold text-foreground">
                          {formatEUR(paidOutOfPocket)}
                        </td>
                        <td className="p-4 font-bold text-indigo-600">
                          {formatEUR(mktValue)}
                        </td>
                        <td className="p-4 text-xs space-y-0.5">
                          <p className="font-bold text-amber-600">{formatEUR(taxableMargin)}</p>
                          <p className="text-muted-foreground">IRPF ({settings.taxRate}%): -{formatEUR(estTax)}</p>
                          <p className="font-bold text-emerald-600">Neto: {formatEUR(netBenefit)}</p>
                        </td>
                        <td className="p-4">
                          {pkg.sold ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 size={14} /> Vendida
                            </span>
                          ) : isLocked ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-600" title={`Bloqueada hasta ${pkg.yearGranted + 3}`}>
                              <Lock size={14} /> Bloqueada ({pkg.yearGranted + 3})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-600">
                              <Unlock size={14} /> Disponible
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditAirbus(pkg)}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAirbus(pkg.id)}
                              className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {airbusPackages.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-muted-foreground">
                        No hay paquetes de acciones Airbus registrados. Pulsa "Registrar Nuevo Paquete".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OTRAS INVERSIONES */}
      {activeTab === "other" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-purple-600" size={22} /> Otras Inversiones Diversificadas
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Fondos indexados, criptomonedas, bienes raíces u otras acciones para diversificar tu patrimonio.
              </p>
            </div>
            <button
              onClick={handleOpenAddOther}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition shadow-xs cursor-pointer"
            >
              <Plus size={18} /> Añadir Inversión
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherInvestments.map((item) => {
              const gain = item.currentValue - item.initialValue;
              const gainPercent =
                item.initialValue > 0 ? (gain / item.initialValue) * 100 : 0;

              return (
                <div
                  key={item.id}
                  className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-purple-500/50 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600">
                        {item.category === "crypto"
                          ? "Cripto"
                          : item.category === "funds"
                          ? "Fondo Indexado"
                          : item.category === "stocks"
                          ? "Acciones"
                          : item.category === "real_estate"
                          ? "Inmuebles"
                          : "Otro"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditOther(item)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOther(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Invertido Inicial:</span>
                      <span className="font-semibold">{formatEUR(item.initialValue)}</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Actual</p>
                        <p className="text-2xl font-extrabold text-purple-600 mt-0.5">
                          {formatEUR(item.currentValue)}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          gain >= 0
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {gain >= 0 ? "+" : ""}
                        {gainPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {otherInvestments.length === 0 && (
              <div className="col-span-full bg-card p-12 text-center rounded-2xl border border-dashed border-border space-y-3">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="font-bold text-foreground">Sin otras inversiones</p>
                <p className="text-sm text-muted-foreground">
                  Añade fondos indexados, ETFs o criptomonedas para tener una visión completa.
                </p>
                <button
                  onClick={handleOpenAddOther}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition cursor-pointer"
                >
                  + Añadir primera inversión
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: ACCOUNT --- */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-xl max-w-md w-full space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-lg">
                {editingAccount ? "Editar Cuenta" : "Añadir Cuenta de Liquidez"}
              </h3>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Nombre de la Cuenta / Entidad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BBVA Nómina, MyInvestor Ahorro"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Tipo de Liquidez
                </label>
                <select
                  value={accountForm.type}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="bank">Cuenta Bancaria / Corriente</option>
                  <option value="savings">Cuenta de Ahorro / Colchón</option>
                  <option value="cash">Efectivo / Monedero</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Saldo Disponible (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Notas adicionales
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={accountForm.notes}
                  onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: AIRBUS PACKAGE --- */}
      {showAirbusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-xl max-w-lg w-full space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-lg">
                {editingAirbus ? "Editar Paquete Airbus" : "Registrar Paquete Anual Airbus"}
              </h3>
              <button
                onClick={() => setShowAirbusModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAirbus} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Año del Plan
                  </label>
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
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Año de Adjudicación (Lockup +3 años)
                  </label>
                  <input
                    type="number"
                    required
                    value={airbusForm.yearGranted}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, yearGranted: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Acciones Compradas (X)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 30"
                    value={airbusForm.purchasedShares}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, purchasedShares: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Acciones Regaladas / Bonus (Y)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 15"
                    value={airbusForm.bonusShares}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, bonusShares: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Precio Compra (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Efectivo pagado"
                    value={airbusForm.purchasePrice}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, purchasePrice: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Precio Oficial Ref. (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Base IRPF"
                    value={airbusForm.officialPrice}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, officialPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Precio Mercado/Venta (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Valor actual"
                    value={airbusForm.marketPrice}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, marketPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={airbusForm.sold}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, sold: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-semibold text-xs text-foreground">
                    Este paquete ya ha sido vendido
                  </span>
                </label>
              </div>

              {airbusForm.sold && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Precio Real de Venta (€ por acción)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={airbusForm.soldPrice}
                    onChange={(e) =>
                      setAirbusForm({ ...airbusForm, soldPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Notas / Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej: Plan ESOP 2024"
                  value={airbusForm.notes}
                  onChange={(e) =>
                    setAirbusForm({ ...airbusForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAirbusModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer"
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
          <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-xl max-w-md w-full space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-lg">
                {editingOther ? "Editar Inversión" : "Añadir Inversión"}
              </h3>
              <button
                onClick={() => setShowOtherModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOther} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Nombre del Activo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MSCI World ETF, BTC, Apartamento"
                  value={otherForm.name}
                  onChange={(e) =>
                    setOtherForm({ ...otherForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Categoría
                </label>
                <select
                  value={otherForm.category}
                  onChange={(e) =>
                    setOtherForm({ ...otherForm, category: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="funds">Fondo Indexado / ETF</option>
                  <option value="crypto">Criptomonedas</option>
                  <option value="stocks">Otras Acciones</option>
                  <option value="real_estate">Bienes Raíces / Inmueble</option>
                  <option value="other">Otros Activos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Inversión Inicial (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={otherForm.initialValue}
                    onChange={(e) =>
                      setOtherForm({ ...otherForm, initialValue: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Valor Actual (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={otherForm.currentValue}
                    onChange={(e) =>
                      setOtherForm({ ...otherForm, currentValue: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Notas
                </label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={otherForm.notes}
                  onChange={(e) =>
                    setOtherForm({ ...otherForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 cursor-pointer"
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
          <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-xl max-w-md w-full space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-lg">⚙️ Ajustes del Gestor Financiero</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Porcentaje Máximo Objetivo Invertido (% del patrimonio)
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
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Límite de prudencia para avisarte si estás invirtiendo demasiado dinero.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Retención I.R.P.F. Estimada para Plusvalías (%)
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
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tipo impositivo aplicado al calcular el impuesto sobre el margen tributable de Airbus.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Guardar Ajustes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
