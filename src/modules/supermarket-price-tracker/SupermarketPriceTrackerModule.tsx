"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  TrendingDown,
  History,
  PlusCircle,
  Settings,
  Store,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  Database,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  Supermarket,
  Brand,
  Product,
  PriceRecord,
  UnitType,
  OfferAssessment,
  OfferAssessmentStatus,
  calculateNormalizedUnitPrice,
  getBaseUnitLabel,
} from "./types";
import {
  INITIAL_SUPERMARKETS,
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_PRICE_RECORDS,
} from "./initialData";

const LOCAL_STORAGE_KEY = "supermarket_price_tracker_data";

export function SupermarketPriceTrackerModule() {
  // Main state
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>(INITIAL_SUPERMARKETS);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [priceRecords, setPriceRecords] = useState<PriceRecord[]>(INITIAL_PRICE_RECORDS);

  const [isSaving, setIsSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<"synced" | "local" | "error">("local");

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"verifier" | "history" | "add" | "settings">("verifier");

  // Mobile Accordion / Collapsible States
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showRecentHistory, setShowRecentHistory] = useState(false);

  // --- 1. VERIFIER STATE ---
  const [verifierProductId, setVerifierProductId] = useState<string>(
    INITIAL_PRODUCTS[0]?.id || ""
  );
  const [verifierBrandId, setVerifierBrandId] = useState<string>("");
  const [verifierSupermarketId, setVerifierSupermarketId] = useState<string>("");
  const [verifierTotalPrice, setVerifierTotalPrice] = useState<string>("");
  const [verifierQuantity, setVerifierQuantity] = useState<string>("1");
  const [verifierUnit, setVerifierUnit] = useState<UnitType>(
    INITIAL_PRODUCTS[0]?.defaultUnit || "L"
  );

  const handleVerifierProductChange = (prodId: string) => {
    setVerifierProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setVerifierUnit(prod.defaultUnit);
    }
    setVerifierBrandId("");
  };

  // --- 2. HISTORY FILTER STATE ---
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState<string>("ALL");
  const [historySupermarketId, setHistorySupermarketId] = useState<string>("ALL");
  const [historyProductId, setHistoryProductId] = useState<string>("ALL");
  const [historyBrandId, setHistoryBrandId] = useState<string>("ALL");
  const [historyOffersOnly, setHistoryOffersOnly] = useState(false);

  // --- 3. ADD RECORD FORM STATE ---
  const [addProductId, setAddProductId] = useState<string>(
    INITIAL_PRODUCTS[0]?.id || ""
  );
  const [addBrandId, setAddBrandId] = useState<string>("");
  const [addSupermarketId, setAddSupermarketId] = useState<string>("");
  const [addDate, setAddDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [addTotalPrice, setAddTotalPrice] = useState<string>("");
  const [addQuantity, setAddQuantity] = useState<string>("1");
  const [addUnit, setAddUnit] = useState<UnitType>(
    INITIAL_PRODUCTS[0]?.defaultUnit || "L"
  );
  const [addIsOffer, setAddIsOffer] = useState<boolean>(false);
  const [addOfferDesc, setAddOfferDesc] = useState<string>("");
  const [addNotes, setAddNotes] = useState<string>("");

  const handleAddProductChange = (prodId: string) => {
    setAddProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setAddUnit(prod.defaultUnit);
    }
    setAddBrandId("");
  };

  // --- 4. SETTINGS / ENTITY MANAGEMENT STATE ---
  const [settingsSection, setSettingsSection] = useState<
    "brands" | "supermarkets" | "products"
  >("brands");

  // Modals / Editors
  const [editingSupermarket, setEditingSupermarket] = useState<Partial<Supermarket> | null>(null);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Data Loading & Persistence
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await fetch("/api/supermarket-price-tracker");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.supermarkets && data.supermarkets.length > 0) {
            setSupermarkets(data.supermarkets);
            setBrands(data.brands || []);
            setProducts(data.products || []);
            setPriceRecords(data.priceRecords || []);
            setDbStatus("synced");

            if (data.products && data.products.length > 0) {
              setVerifierProductId((prev) => prev || data.products[0].id);
              setVerifierUnit((prev) => prev || data.products[0].defaultUnit);
              setAddProductId((prev) => prev || data.products[0].id);
              setAddUnit((prev) => prev || data.products[0].defaultUnit);
            }
            return;
          }
        }
      } catch (e) {
        console.warn("API load error, falling back to LocalStorage:", e);
      }

      if (!isMounted) return;

      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.supermarkets) setSupermarkets(parsed.supermarkets);
          if (parsed.brands) setBrands(parsed.brands);
          if (parsed.products) {
            setProducts(parsed.products);
            if (parsed.products.length > 0) {
              setVerifierProductId((prev) => prev || parsed.products[0].id);
              setVerifierUnit((prev) => prev || parsed.products[0].defaultUnit);
              setAddProductId((prev) => prev || parsed.products[0].id);
              setAddUnit((prev) => prev || parsed.products[0].defaultUnit);
            }
          }
          if (parsed.priceRecords) setPriceRecords(parsed.priceRecords);
        }
      } catch (e) {
        console.error("LocalStorage load error:", e);
      }
      setDbStatus("local");
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveDataToApiAndLocal = async (
    newSupermarkets = supermarkets,
    newBrands = brands,
    newProducts = products,
    newRecords = priceRecords
  ) => {
    setIsSaving(true);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          supermarkets: newSupermarkets,
          brands: newBrands,
          products: newProducts,
          priceRecords: newRecords,
        })
      );
    } catch (e) {
      console.error("Error saving to LocalStorage:", e);
    }

    try {
      const res = await fetch("/api/supermarket-price-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "full_sync",
          supermarkets: newSupermarkets,
          brands: newBrands,
          products: newProducts,
          priceRecords: newRecords,
        }),
      });
      if (res.ok) {
        setDbStatus("synced");
      } else {
        setDbStatus("local");
      }
    } catch (e) {
      console.warn("API sync error:", e);
      setDbStatus("local");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm("¿Estás seguro de restablecer los datos por defecto? Se sobrescribirán tus cambios.")) {
      setSupermarkets(INITIAL_SUPERMARKETS);
      setBrands(INITIAL_BRANDS);
      setProducts(INITIAL_PRODUCTS);
      setPriceRecords(INITIAL_PRICE_RECORDS);
      saveDataToApiAndLocal(
        INITIAL_SUPERMARKETS,
        INITIAL_BRANDS,
        INITIAL_PRODUCTS,
        INITIAL_PRICE_RECORDS
      );
    }
  };

  // --- LINKING & DYNAMIC FILTERING HELPERS ---
  const getEligibleBrands = (supermarketId?: string, productId?: string) => {
    return brands.filter((b) => {
      if (
        supermarketId &&
        b.supermarketIds &&
        b.supermarketIds.length > 0 &&
        !b.supermarketIds.includes(supermarketId)
      ) {
        return false;
      }
      if (
        productId &&
        b.productIds &&
        b.productIds.length > 0 &&
        !b.productIds.includes(productId)
      ) {
        return false;
      }
      return true;
    });
  };

  const getEligibleSupermarkets = (brandId?: string) => {
    if (!brandId) return supermarkets;
    const brand = brands.find((b) => b.id === brandId);
    if (!brand || !brand.supermarketIds || brand.supermarketIds.length === 0) {
      return supermarkets;
    }
    return supermarkets.filter((sm) => brand.supermarketIds.includes(sm.id));
  };

  // --- OFFER EVALUATOR CALCULATION ENGINE ---
  const currentOfferAssessment = useMemo<OfferAssessment | null>(() => {
    if (!verifierProductId || !verifierTotalPrice || parseFloat(verifierTotalPrice) <= 0) {
      return null;
    }

    const priceVal = parseFloat(verifierTotalPrice);
    const qtyVal = parseFloat(verifierQuantity) || 1;
    const currentUnitVal = calculateNormalizedUnitPrice(priceVal, qtyVal, verifierUnit);
    const baseUnitLabel = getBaseUnitLabel(verifierUnit);

    let relevantRecords = priceRecords.filter((r) => r.productId === verifierProductId);

    if (verifierBrandId) {
      const brandFiltered = relevantRecords.filter((r) => r.brandId === verifierBrandId);
      if (brandFiltered.length > 0) {
        relevantRecords = brandFiltered;
      }
    }

    if (relevantRecords.length === 0) {
      return {
        status: "SIN_DATOS",
        currentUnitPrice: currentUnitVal,
        historicalMinUnitPrice: 0,
        historicalAvgUnitPrice: 0,
        historicalMaxUnitPrice: 0,
        diffVsMinPercent: 0,
        diffVsAvgPercent: 0,
        baseUnitLabel,
        message: "No hay registros históricos previos para este producto. ¡Regístralo para empezar!",
      };
    }

    const unitPrices = relevantRecords.map((r) => r.unitPrice);
    const minUnit = Math.min(...unitPrices);
    const maxUnit = Math.max(...unitPrices);
    const avgUnit = unitPrices.reduce((acc, curr) => acc + curr, 0) / unitPrices.length;

    const diffVsMinPercent = Math.round(((currentUnitVal - minUnit) / minUnit) * 100);
    const diffVsAvgPercent = Math.round(((currentUnitVal - avgUnit) / avgUnit) * 100);

    let status: OfferAssessmentStatus = "BUEN_PRECIO";
    let message = "";

    if (currentUnitVal <= minUnit * 1.02) {
      status = "CHOLLO";
      message = `¡OFERTAAZO REAL! El precio por unidad (${currentUnitVal.toFixed(2)}${baseUnitLabel}) está un ${Math.abs(diffVsAvgPercent)}% por debajo de la media habitual (${avgUnit.toFixed(2)}${baseUnitLabel}) y en el MÍNIMO HISTÓRICO.`;
    } else if (currentUnitVal < avgUnit) {
      status = "BUEN_PRECIO";
      message = `¡Buen Precio! Está un ${Math.abs(diffVsAvgPercent)}% más barato que la media habitual (${avgUnit.toFixed(2)}${baseUnitLabel}), pero sobre el mínimo histórico (${minUnit.toFixed(2)}${baseUnitLabel}).`;
    } else {
      status = "FALSA_OFERTA";
      message = `⚠️ ¡CUIDADO CON LA FALSA OFERTA! El precio (${currentUnitVal.toFixed(2)}${baseUnitLabel}) es un ${diffVsAvgPercent}% MÁS CARO que la media habitual (${avgUnit.toFixed(2)}${baseUnitLabel}). No te dejes engañar por el cartel.`;
    }

    return {
      status,
      currentUnitPrice: currentUnitVal,
      historicalMinUnitPrice: minUnit,
      historicalAvgUnitPrice: avgUnit,
      historicalMaxUnitPrice: maxUnit,
      diffVsMinPercent,
      diffVsAvgPercent,
      baseUnitLabel,
      message,
    };
  }, [
    verifierProductId,
    verifierBrandId,
    verifierTotalPrice,
    verifierQuantity,
    verifierUnit,
    priceRecords,
  ]);

  // --- ADD RECORD HANDLER ---
  const handleAddPriceRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductId || !addTotalPrice || parseFloat(addTotalPrice) <= 0) {
      alert("Por favor introduce un producto y un precio válido.");
      return;
    }

    const priceVal = parseFloat(addTotalPrice);
    const qtyVal = parseFloat(addQuantity) || 1;
    const computedUnitPrice = calculateNormalizedUnitPrice(priceVal, qtyVal, addUnit);

    const newRecord: PriceRecord = {
      id: "pr-" + Date.now(),
      productId: addProductId,
      brandId: addBrandId,
      supermarketId: addSupermarketId,
      date: addDate || new Date().toISOString().split("T")[0],
      totalPrice: priceVal,
      quantity: qtyVal,
      unit: addUnit,
      unitPrice: computedUnitPrice,
      isOffer: addIsOffer,
      offerDescription: addOfferDesc.trim() || undefined,
      notes: addNotes.trim() || undefined,
    };

    const updated = [newRecord, ...priceRecords];
    setPriceRecords(updated);
    saveDataToApiAndLocal(supermarkets, brands, products, updated);

    setAddTotalPrice("");
    setAddOfferDesc("");
    setAddNotes("");
    setAddIsOffer(false);
    alert("¡Precio registrado correctamente con historial actualizado!");
  };

  const handleDeleteRecord = (recordId: string) => {
    if (confirm("¿Estás seguro de eliminar este registro del historial?")) {
      const updated = priceRecords.filter((r) => r.id !== recordId);
      setPriceRecords(updated);
      saveDataToApiAndLocal(supermarkets, brands, products, updated);
    }
  };

  // --- FILTERED HISTORY LIST ---
  const filteredHistory = useMemo(() => {
    return priceRecords.filter((record) => {
      if (historyProductId !== "ALL" && record.productId !== historyProductId) return false;
      if (historySupermarketId !== "ALL" && record.supermarketId !== historySupermarketId) return false;
      if (historyBrandId !== "ALL" && record.brandId !== historyBrandId) return false;
      if (historyOffersOnly && !record.isOffer) return false;

      if (historyCategory !== "ALL") {
        const prod = products.find((p) => p.id === record.productId);
        if (!prod || prod.category !== historyCategory) return false;
      }

      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const prod = products.find((p) => p.id === record.productId);
        const br = brands.find((b) => b.id === record.brandId);
        const sm = supermarkets.find((s) => s.id === record.supermarketId);

        const prodMatch = prod?.name.toLowerCase().includes(query);
        const brandMatch = br?.name.toLowerCase().includes(query);
        const smMatch = sm?.name.toLowerCase().includes(query);
        const notesMatch = record.notes?.toLowerCase().includes(query);
        const offerMatch = record.offerDescription?.toLowerCase().includes(query);

        if (!prodMatch && !brandMatch && !smMatch && !notesMatch && !offerMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    priceRecords,
    historyProductId,
    historySupermarketId,
    historyBrandId,
    historyOffersOnly,
    historyCategory,
    historySearch,
    products,
    brands,
    supermarkets,
  ]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (historySearch) count++;
    if (historyCategory !== "ALL") count++;
    if (historySupermarketId !== "ALL") count++;
    if (historyProductId !== "ALL") count++;
    if (historyBrandId !== "ALL") count++;
    if (historyOffersOnly) count++;
    return count;
  }, [
    historySearch,
    historyCategory,
    historySupermarketId,
    historyProductId,
    historyBrandId,
    historyOffersOnly,
  ]);

  // --- SETTINGS EDITORS HANDLERS ---
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name?.trim()) return;

    let updatedBrands: Brand[];
    if (editingBrand.id) {
      updatedBrands = brands.map((b) => (b.id === editingBrand.id ? (editingBrand as Brand) : b));
    } else {
      const newBrand: Brand = {
        id: "brand-" + Date.now(),
        name: editingBrand.name.trim(),
        supermarketIds: editingBrand.supermarketIds || [],
        productIds: editingBrand.productIds || [],
        notes: editingBrand.notes || "",
      };
      updatedBrands = [...brands, newBrand];
    }

    setBrands(updatedBrands);
    saveDataToApiAndLocal(supermarkets, updatedBrands, products, priceRecords);
    setEditingBrand(null);
  };

  const handleDeleteBrand = (brandId: string) => {
    if (confirm("¿Eliminar esta marca? Se mantendrán los registros existentes sin marca asociada.")) {
      const updated = brands.filter((b) => b.id !== brandId);
      setBrands(updated);
      saveDataToApiAndLocal(supermarkets, updated, products, priceRecords);
    }
  };

  const handleSaveSupermarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupermarket || !editingSupermarket.name?.trim()) return;

    let updatedSM: Supermarket[];
    if (editingSupermarket.id) {
      updatedSM = supermarkets.map((s) => (s.id === editingSupermarket.id ? (editingSupermarket as Supermarket) : s));
    } else {
      const newSM: Supermarket = {
        id: "sm-" + Date.now(),
        name: editingSupermarket.name.trim(),
        color: editingSupermarket.color || "#00A859",
        notes: editingSupermarket.notes || "",
      };
      updatedSM = [...supermarkets, newSM];
    }

    setSupermarkets(updatedSM);
    saveDataToApiAndLocal(updatedSM, brands, products, priceRecords);
    setEditingSupermarket(null);
  };

  const handleDeleteSupermarket = (smId: string) => {
    if (confirm("¿Eliminar este supermercado?")) {
      const updated = supermarkets.filter((s) => s.id !== smId);
      setSupermarkets(updated);
      saveDataToApiAndLocal(updated, brands, products, priceRecords);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim()) return;

    let updatedProd: Product[];
    if (editingProduct.id) {
      updatedProd = products.map((p) => (p.id === editingProduct.id ? (editingProduct as Product) : p));
    } else {
      const newProd: Product = {
        id: "prod-" + Date.now(),
        name: editingProduct.name.trim(),
        category: editingProduct.category || "General",
        defaultUnit: editingProduct.defaultUnit || "L",
        notes: editingProduct.notes || "",
      };
      updatedProd = [...products, newProd];
    }

    setProducts(updatedProd);
    saveDataToApiAndLocal(supermarkets, brands, updatedProd, priceRecords);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (prodId: string) => {
    if (confirm("¿Eliminar este producto?")) {
      const updated = products.filter((p) => p.id !== prodId);
      setProducts(updated);
      saveDataToApiAndLocal(supermarkets, brands, updated, priceRecords);
    }
  };

  const verifierRecords = useMemo(() => {
    if (!verifierProductId) return [];
    return priceRecords.filter((r) => r.productId === verifierProductId);
  }, [priceRecords, verifierProductId]);

  return (
    <div className="space-y-2 max-w-7xl mx-auto px-1 sm:px-3 py-1 text-foreground min-w-0">

      {/* SLEEK STICKY CAPSULE TAB BAR WITH INTEGRATED ACTIONS */}
      <div className="sticky top-9 z-30 bg-background/95 backdrop-blur-md pt-0.5 pb-1 flex items-center justify-between border-b border-border/40 gap-1 select-none">
        <div className="flex items-center gap-0.5 bg-card p-0.5 rounded-xl border border-border/80 shadow-2xs flex-1 max-w-md">
          <button
            onClick={() => setActiveTab("verifier")}
            className={`flex-1 py-1 px-1.5 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 min-w-0 ${
              activeTab === "verifier"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles size={12} className="shrink-0" />
            <span className="truncate">Verificador</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1 px-1.5 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 min-w-0 ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History size={12} className="shrink-0" />
            <span className="truncate">Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className={`flex-1 py-1 px-1.5 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 min-w-0 ${
              activeTab === "add"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PlusCircle size={12} className="shrink-0" />
            <span className="truncate">Registrar</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-1 px-1.5 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 min-w-0 ${
              activeTab === "settings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings size={12} className="shrink-0" />
            <span className="truncate">Ajustes</span>
          </button>
        </div>

        {/* Sync / Defaults quick action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => saveDataToApiAndLocal()}
            disabled={isSaving}
            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              dbStatus === "synced"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
            }`}
            title="Sincronizar MongoDB"
          >
            <Database size={12} className={isSaving ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleResetToDefaults}
            className="p-1.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-[10px] font-bold transition-all border border-border/60"
            title="Cargar datos de ejemplo"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VERIFICADOR DE OFERTA EN TIEMPO REAL (ULTRA COMPACT) */}
      {/* ========================================================================= */}
      {activeTab === "verifier" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start min-w-0">

          {/* INPUT FORM PANEL */}
          <div className="lg:col-span-5 bg-card rounded-2xl border border-border/80 p-2.5 shadow-2xs space-y-2 min-w-0">
            <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
              <h3 className="text-xs font-black text-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> ¿Esta oferta vale la pena?
              </h3>
            </div>

            <div className="space-y-2">
              {/* Product Select */}
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  1. Producto *
                </label>
                <select
                  value={verifierProductId}
                  onChange={(e) => handleVerifierProductChange(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supermarket & Brand Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                    2. Super
                  </label>
                  <select
                    value={verifierSupermarketId}
                    onChange={(e) => setVerifierSupermarketId(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                  >
                    <option value="">Cualquiera</option>
                    {supermarkets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                    3. Marca
                  </label>
                  <select
                    value={verifierBrandId}
                    onChange={(e) => setVerifierBrandId(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                  >
                    <option value="">Cualquiera</option>
                    {getEligibleBrands(verifierSupermarketId, verifierProductId).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Format Row */}
              <div className="grid grid-cols-12 gap-1.5">
                <div className="col-span-6">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Precio Total (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.49"
                    value={verifierTotalPrice}
                    onChange={(e) => setVerifierTotalPrice(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-2 py-1 text-xs font-black focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Cant.
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1"
                    value={verifierQuantity}
                    onChange={(e) => setVerifierQuantity(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Unidad
                  </label>
                  <select
                    value={verifierUnit}
                    onChange={(e) => setVerifierUnit(e.target.value as UnitType)}
                    className="w-full bg-background border border-border/80 rounded-xl px-1 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-center"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="ud">ud</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* EVALUATION RESULTS PANEL */}
          <div className="lg:col-span-7 space-y-2 min-w-0">
            {currentOfferAssessment ? (
              <div
                className={`rounded-2xl border p-2.5 sm:p-3 transition-all shadow-2xs ${
                  currentOfferAssessment.status === "CHOLLO"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100"
                    : currentOfferAssessment.status === "BUEN_PRECIO"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100"
                    : currentOfferAssessment.status === "FALSA_OFERTA"
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100"
                    : "bg-muted/30 border-border text-foreground"
                }`}
              >
                {/* STATUS BADGE HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-current/10 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {currentOfferAssessment.status === "CHOLLO" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {currentOfferAssessment.status === "BUEN_PRECIO" && (
                      <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    {currentOfferAssessment.status === "FALSA_OFERTA" && (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    {currentOfferAssessment.status === "SIN_DATOS" && (
                      <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}

                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-wider opacity-80 block">
                        DIAGNÓSTICO
                      </span>
                      <h2 className="text-xs sm:text-sm font-black leading-tight truncate">
                        {currentOfferAssessment.status === "CHOLLO" && "🟢 CHOLLO REAL"}
                        {currentOfferAssessment.status === "BUEN_PRECIO" && "🟡 PRECIO ACEPTABLE"}
                        {currentOfferAssessment.status === "FALSA_OFERTA" && "🔴 FALSA OFERTA / ENGAÑO"}
                        {currentOfferAssessment.status === "SIN_DATOS" && "⚪ SIN REGISTROS PREVIOS"}
                      </h2>
                    </div>
                  </div>

                  <span className="text-xs sm:text-base font-black px-2 py-0.5 rounded-lg bg-background/80 shadow-2xs border border-current/20 shrink-0">
                    {currentOfferAssessment.currentUnitPrice.toFixed(2)} {currentOfferAssessment.baseUnitLabel}
                  </span>
                </div>

                {/* VERDICT MESSAGE */}
                <p className="text-[10px] sm:text-xs font-semibold mb-2 leading-tight">
                  {currentOfferAssessment.message}
                </p>

                {/* METRICS COMPARISON GRID */}
                {currentOfferAssessment.status !== "SIN_DATOS" && (
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <div className="bg-background/80 backdrop-blur-xs rounded-lg p-1 border border-current/15 text-center min-w-0">
                      <span className="text-[8px] font-extrabold uppercase text-muted-foreground block truncate">
                        MÍNIMO
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 truncate block">
                        {currentOfferAssessment.historicalMinUnitPrice.toFixed(2)} {currentOfferAssessment.baseUnitLabel}
                      </span>
                    </div>

                    <div className="bg-background/80 backdrop-blur-xs rounded-lg p-1 border border-current/15 text-center min-w-0">
                      <span className="text-[8px] font-extrabold uppercase text-muted-foreground block truncate">
                        MEDIO
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-amber-600 dark:text-amber-400 truncate block">
                        {currentOfferAssessment.historicalAvgUnitPrice.toFixed(2)} {currentOfferAssessment.baseUnitLabel}
                      </span>
                    </div>

                    <div className="bg-background/80 backdrop-blur-xs rounded-lg p-1 border border-current/15 text-center min-w-0">
                      <span className="text-[8px] font-extrabold uppercase text-muted-foreground block truncate">
                        MÁXIMO
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-rose-600 dark:text-rose-400 truncate block">
                        {currentOfferAssessment.historicalMaxUnitPrice.toFixed(2)} {currentOfferAssessment.baseUnitLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-dashed border-border p-4 text-center flex flex-col items-center justify-center space-y-1">
                <ShoppingCart className="w-6 h-6 text-muted-foreground/40 animate-pulse" />
                <h4 className="font-extrabold text-xs text-foreground">
                  Introduce precio para analizar
                </h4>
                <p className="text-[9px] text-muted-foreground max-w-xs">
                  Escribe el precio total y la cantidad para verificar en segundos si es un chollo o un engaño.
                </p>
              </div>
            )}

            {/* COLLAPSIBLE HISTORICAL SUMMARY FOR SELECTED PRODUCT */}
            {verifierProductId && verifierRecords.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-2xs">
                <button
                  onClick={() => setShowRecentHistory(!showRecentHistory)}
                  className="w-full p-2 bg-muted/20 hover:bg-muted/40 flex items-center justify-between text-[10px] font-black uppercase text-foreground transition-all"
                >
                  <span className="flex items-center gap-1">
                    <History className="w-3 h-3 text-primary" /> Histórico del Producto ({verifierRecords.length})
                  </span>
                  {showRecentHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showRecentHistory && (
                  <div className="divide-y divide-border/50 p-1.5 space-y-1">
                    {verifierRecords.slice(0, 4).map((rec) => {
                      const sm = supermarkets.find((s) => s.id === rec.supermarketId);
                      const br = brands.find((b) => b.id === rec.brandId);
                      const unitLabel = getBaseUnitLabel(rec.unit);

                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between gap-1.5 p-1 rounded-lg text-[10px] min-w-0"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sm?.color || "#888" }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-foreground truncate block">
                                {sm?.name || "Super"} • {br?.name || "General"}
                              </span>
                              <span className="text-[9px] text-muted-foreground truncate block">
                                {rec.date} {rec.isOffer && `• 🏷️ ${rec.offerDescription || "Oferta"}`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-foreground block text-[10px]">
                              {rec.totalPrice.toFixed(2)}€
                            </span>
                            <span className="text-[9px] font-extrabold text-primary block">
                              {rec.unitPrice.toFixed(2)} {unitLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTÓRICO Y BÚSQUEDA AVANZADA DE PRECIOS */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-2 min-w-0">

          {/* COLLAPSIBLE FILTERS TOOLBAR */}
          <div className="bg-card rounded-2xl border border-border/80 p-2.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-1.5 border-b border-border/50 pb-1.5">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="text-xs font-black text-foreground flex items-center gap-1"
              >
                <Filter size={12} className="text-primary" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-primary/20 text-primary">
                    {activeFilterCount}
                  </span>
                )}
                {showMobileFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setHistorySearch("");
                    setHistoryCategory("ALL");
                    setHistorySupermarketId("ALL");
                    setHistoryProductId("ALL");
                    setHistoryBrandId("ALL");
                    setHistoryOffersOnly(false);
                  }}
                  className="text-[10px] font-extrabold text-primary hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Always visible quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, nota u oferta..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-xl pl-8 pr-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Collapsible advanced filters */}
            {(showMobileFilters || activeFilterCount > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 border-t border-border/40">
                <select
                  value={historyProductId}
                  onChange={(e) => setHistoryProductId(e.target.value)}
                  className="bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="ALL">Todos los Productos</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={historySupermarketId}
                  onChange={(e) => setHistorySupermarketId(e.target.value)}
                  className="bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="ALL">Todos los Supers</option>
                  {supermarkets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={historyBrandId}
                  onChange={(e) => setHistoryBrandId(e.target.value)}
                  className="bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="ALL">Todas las Marcas</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <select
                  value={historyCategory}
                  onChange={(e) => setHistoryCategory(e.target.value)}
                  className="bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <label className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 bg-background border border-border/80 rounded-xl px-1.5 py-1 cursor-pointer text-xs font-bold select-none hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={historyOffersOnly}
                    onChange={(e) => setHistoryOffersOnly(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>🏷️ Solo Ofertas</span>
                </label>
              </div>
            )}
          </div>

          {/* RECORDS TABLE / LIST */}
          <div className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-2xs">
            <div className="p-2 bg-muted/20 border-b border-border/60 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Registros ({filteredHistory.length})
              </span>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="divide-y divide-border/60">
                {filteredHistory.map((rec) => {
                  const prod = products.find((p) => p.id === rec.productId);
                  const sm = supermarkets.find((s) => s.id === rec.supermarketId);
                  const br = brands.find((b) => b.id === rec.brandId);
                  const baseUnitLabel = getBaseUnitLabel(rec.unit);

                  return (
                    <div
                      key={rec.id}
                      className="p-2 hover:bg-muted/30 transition-all flex items-center justify-between gap-1.5 min-w-0"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: sm?.color || "#888" }}
                          title={sm?.name}
                        />

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-black text-xs text-foreground truncate">
                              {prod?.name || "Producto"}
                            </span>
                            {rec.isOffer && (
                              <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                                🏷️ {rec.offerDescription || "Oferta"}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap font-medium">
                            <span>🏪 {sm?.name || "S/S"}</span>
                            <span>•</span>
                            <span>🏷️ {br?.name || "General"}</span>
                            <span>•</span>
                            <span>📅 {rec.date}</span>
                          </div>

                          {rec.notes && (
                            <p className="text-[9px] text-muted-foreground/80 italic truncate">
                              &ldquo;{rec.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-foreground">
                            {rec.totalPrice.toFixed(2)}€
                          </div>
                          <div className="text-[9px] font-extrabold text-primary">
                            {rec.unitPrice.toFixed(2)} {baseUnitLabel} ({rec.quantity} {rec.unit})
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-xs font-semibold">
                No hay registros que coincidan con los filtros.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REGISTRAR UN NUEVO PRECIO (MINIMAL VERTICAL SCROLL) */}
      {/* ========================================================================= */}
      {activeTab === "add" && (
        <div className="max-w-md mx-auto bg-card rounded-2xl border border-border/80 p-3 shadow-2xs space-y-2 min-w-0">
          <div className="border-b border-border/50 pb-1.5">
            <h3 className="text-xs font-black text-foreground flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5 text-primary" /> Registrar Nuevo Precio
            </h3>
          </div>

          <form onSubmit={handleAddPriceRecord} className="space-y-2">
            {/* Product Select */}
            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                Producto *
              </label>
              <select
                value={addProductId}
                onChange={(e) => handleAddProductChange(e.target.value)}
                required
                className="w-full bg-background border border-border/80 rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Supermarket & Brand Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Supermercado *
                </label>
                <select
                  value={addSupermarketId}
                  onChange={(e) => setAddSupermarketId(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="">Selecciona Super</option>
                  {getEligibleSupermarkets(addBrandId).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Marca
                </label>
                <select
                  value={addBrandId}
                  onChange={(e) => setAddBrandId(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="">Marca General</option>
                  {getEligibleBrands(addSupermarketId, addProductId).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Price Row */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Precio Total (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 2.49"
                  value={addTotalPrice}
                  onChange={(e) => setAddTotalPrice(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-2 py-1 text-xs font-black focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Quantity & Unit Row */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Cantidad
                </label>
                <input
                  type="number"
                  step="any"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Unidad
                </label>
                <select
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value as UnitType)}
                  className="w-full bg-background border border-border/80 rounded-xl px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="ud">ud</option>
                </select>
              </div>
            </div>

            {/* Offer details */}
            <div className="bg-muted/20 rounded-xl p-2 border border-border/60 space-y-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold select-none">
                <input
                  type="checkbox"
                  checked={addIsOffer}
                  onChange={(e) => setAddIsOffer(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>🏷️ Es Precio de Oferta</span>
              </label>

              {addIsOffer && (
                <input
                  type="text"
                  placeholder="Ej: Oferta 3x2, 2ª unidad al 50%..."
                  value={addOfferDesc}
                  onChange={(e) => setAddOfferDesc(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mb-0.5">
                Notas (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Garrafa 3L..."
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
            >
              <PlusCircle size={13} /> Guardar Precio
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONFIGURACIÓN, TIENDAS, MARCAS Y SUS ENLACES */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-2 min-w-0">

          {/* SUB-PILLS NAVIGATION */}
          <div className="flex items-center gap-1 bg-card p-0.5 rounded-xl border border-border/80 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setSettingsSection("brands")}
              className={`flex-1 sm:flex-initial px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${
                settingsSection === "brands"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tag size={11} /> Marcas ({brands.length})
            </button>

            <button
              onClick={() => setSettingsSection("supermarkets")}
              className={`flex-1 sm:flex-initial px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${
                settingsSection === "supermarkets"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store size={11} /> Supers ({supermarkets.length})
            </button>

            <button
              onClick={() => setSettingsSection("products")}
              className={`flex-1 sm:flex-initial px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 shrink-0 ${
                settingsSection === "products"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package size={11} /> Productos ({products.length})
            </button>
          </div>

          {/* 1. BRANDS SECTION (WITH SUPERMARKET & PRODUCT LINKING) */}
          {settingsSection === "brands" && (
            <div className="bg-card rounded-2xl border border-border/80 p-2.5 shadow-2xs space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                <h3 className="text-xs font-black text-foreground flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Marcas y Tiendas Vinculadas
                </h3>

                <button
                  onClick={() =>
                    setEditingBrand({
                      name: "",
                      supermarketIds: [],
                      productIds: [],
                      notes: "",
                    })
                  }
                  className="px-2 py-1 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  <PlusCircle size={11} /> Nueva Marca
                </button>
              </div>

              {/* LIST OF BRANDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {brands.map((b) => {
                  const linkedSMs = supermarkets.filter((s) => b.supermarketIds?.includes(s.id));
                  const linkedProds = products.filter((p) => b.productIds?.includes(p.id));

                  return (
                    <div
                      key={b.id}
                      className="bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/60 p-2 flex flex-col justify-between gap-1 transition-all min-w-0"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-black text-xs text-foreground flex items-center gap-1 truncate">
                            <Tag size={11} className="text-primary shrink-0" /> {b.name}
                          </h4>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => setEditingBrand(b)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(b.id)}
                              className="p-1 text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Linked Supermarkets */}
                        <div className="text-[10px] text-muted-foreground truncate">
                          <span className="font-bold text-foreground">Tienda: </span>
                          {linkedSMs.length > 0 ? (
                            <span className="inline-flex flex-wrap gap-1 mt-0.5">
                              {linkedSMs.map((sm) => (
                                <span
                                  key={sm.id}
                                  className="px-1.5 py-0.2 rounded font-extrabold text-white text-[8px]"
                                  style={{ backgroundColor: sm.color }}
                                >
                                  {sm.name}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="italic">Todas las tiendas</span>
                          )}
                        </div>

                        {/* Linked Products */}
                        <div className="text-[10px] text-muted-foreground truncate">
                          <span className="font-bold text-foreground">Productos: </span>
                          {linkedProds.length > 0 ? (
                            <span className="text-foreground font-semibold">
                              {linkedProds.map((p) => p.name).join(", ")}
                            </span>
                          ) : (
                            <span className="italic">Todos los productos</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SUPERMARKETS SECTION */}
          {settingsSection === "supermarkets" && (
            <div className="bg-card rounded-2xl border border-border/80 p-2.5 shadow-2xs space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                <h3 className="text-xs font-black text-foreground flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-primary" /> Supermercados
                </h3>

                <button
                  onClick={() =>
                    setEditingSupermarket({
                      name: "",
                      color: "#00A859",
                      notes: "",
                    })
                  }
                  className="px-2 py-1 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  <PlusCircle size={11} /> Nuevo Super
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {supermarkets.map((sm) => (
                  <div
                    key={sm.id}
                    className="bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/60 p-2 flex items-center justify-between gap-1 min-w-0"
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sm.color }}
                      />
                      <span className="font-black text-xs text-foreground truncate">
                        {sm.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditingSupermarket(sm)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupermarket(sm.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. PRODUCTS SECTION */}
          {settingsSection === "products" && (
            <div className="bg-card rounded-2xl border border-border/80 p-2.5 shadow-2xs space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                <h3 className="text-xs font-black text-foreground flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-primary" /> Productos
                </h3>

                <button
                  onClick={() =>
                    setEditingProduct({
                      name: "",
                      category: "Lácteos",
                      defaultUnit: "L",
                      notes: "",
                    })
                  }
                  className="px-2 py-1 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  <PlusCircle size={11} /> Nuevo Producto
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/60 p-2 flex flex-col justify-between gap-1 min-w-0"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-xs text-foreground truncate">{p.name}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-primary/10 text-primary">
                          {p.category}
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground">
                          Base: {p.defaultUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE OPTIMIZED MODALS */}
      {/* ========================================================================= */}

      {/* BRAND EDITOR MODAL */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 [touch-action:pan-y]">
          <div className="bg-card border border-border rounded-2xl p-3.5 max-w-md w-full shadow-2xl space-y-2.5 max-h-[85dvh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <h3 className="font-black text-xs sm:text-sm text-foreground">
                {editingBrand.id ? "Editar Marca" : "Nueva Marca"}
              </h3>
              <button
                onClick={() => setEditingBrand(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-2">
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Hacendado, Nestlé..."
                  value={editingBrand.name || ""}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  required
                  className="w-full bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold"
                />
              </div>

              {/* Supermarket Multi-Select Toggles */}
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Exclusividad de Supermercado
                </label>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {supermarkets.map((sm) => {
                    const isChecked = editingBrand.supermarketIds?.includes(sm.id) || false;
                    return (
                      <label
                        key={sm.id}
                        className="flex items-center justify-between p-1 rounded-xl border border-border/60 bg-muted/20 cursor-pointer text-xs font-bold hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sm.color }}
                          />
                          <span className="truncate">{sm.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = editingBrand.supermarketIds || [];
                            const updated = e.target.checked
                              ? [...current, sm.id]
                              : current.filter((id) => id !== sm.id);
                            setEditingBrand({ ...editingBrand, supermarketIds: updated });
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Product Multi-Select Toggles */}
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Productos Disponibles
                </label>
                <div className="space-y-1 bg-muted/10 p-1 rounded-xl border border-border/60 max-h-28 overflow-y-auto">
                  {products.map((p) => {
                    const isChecked = editingBrand.productIds?.includes(p.id) || false;
                    return (
                      <label
                        key={p.id}
                        className="flex items-center justify-between p-1 rounded-lg text-xs font-bold hover:bg-muted/40 cursor-pointer"
                      >
                        <span className="truncate">{p.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = editingBrand.productIds || [];
                            const updated = e.target.checked
                              ? [...current, p.id]
                              : current.filter((id) => id !== p.id);
                            setEditingBrand({ ...editingBrand, productIds: updated });
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-2.5 py-1 bg-muted text-muted-foreground rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                  Guardar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERMARKET EDITOR MODAL */}
      {editingSupermarket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 [touch-action:pan-y]">
          <div className="bg-card border border-border rounded-2xl p-3.5 max-w-xs w-full shadow-2xl space-y-2.5 min-w-0">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <h3 className="font-black text-xs sm:text-sm text-foreground">
                {editingSupermarket.id ? "Editar Super" : "Nuevo Super"}
              </h3>
              <button
                onClick={() => setEditingSupermarket(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveSupermarket} className="space-y-2">
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mercadona"
                  value={editingSupermarket.name || ""}
                  onChange={(e) =>
                    setEditingSupermarket({ ...editingSupermarket, name: e.target.value })
                  }
                  required
                  className="w-full bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Color
                </label>
                <input
                  type="color"
                  value={editingSupermarket.color || "#00A859"}
                  onChange={(e) =>
                    setEditingSupermarket({ ...editingSupermarket, color: e.target.value })
                  }
                  className="w-full h-8 rounded-xl border border-border p-1 bg-background cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingSupermarket(null)}
                  className="px-2.5 py-1 bg-muted text-muted-foreground rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT EDITOR MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 [touch-action:pan-y]">
          <div className="bg-card border border-border rounded-2xl p-3.5 max-w-xs w-full shadow-2xl space-y-2.5 min-w-0">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <h3 className="font-black text-xs sm:text-sm text-foreground">
                {editingProduct.id ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-2">
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aceite de Oliva"
                  value={editingProduct.name || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  required
                  className="w-full bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Categoría
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lácteos, Frescos..."
                  value={editingProduct.category || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                  Unidad Base
                </label>
                <select
                  value={editingProduct.defaultUnit || "L"}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      defaultUnit: e.target.value as UnitType,
                    })
                  }
                  className="w-full bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold"
                >
                  <option value="kg">kg (Kilogramos)</option>
                  <option value="g">g (Gramos)</option>
                  <option value="L">L (Litros)</option>
                  <option value="ml">ml (Mililitros)</option>
                  <option value="ud">ud (Unidades)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-2.5 py-1 bg-muted text-muted-foreground rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
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
