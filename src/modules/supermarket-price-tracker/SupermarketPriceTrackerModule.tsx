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

  // Update default unit when verifier product changes
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

      // LocalStorage fallback
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
    // 1. Save to LocalStorage
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

    // 2. Sync to API
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
        message: "No hay registros históricos previos para este producto. ¡Regístralo para empezar el seguimiento!",
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

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-1 sm:px-3 py-2 text-foreground">

      {/* HEADER BAR */}
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                Histórico de Precios & Verificador de Ofertas
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Ahorro Inteligente
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consulta si una oferta es chollo real o falso descuento comparando el precio por kg/L/unidad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => saveDataToApiAndLocal()}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              dbStatus === "synced"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
            }`}
            title="Sincronizar datos con Base de Datos MongoDB"
          >
            <Database size={13} className={isSaving ? "animate-spin" : ""} />
            <span>{isSaving ? "Guardando..." : dbStatus === "synced" ? "BD Conectada" : "Guardar BD"}</span>
          </button>

          <button
            onClick={handleResetToDefaults}
            className="px-2.5 py-1.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all border border-border/60 flex items-center gap-1"
            title="Restablecer datos de ejemplo"
          >
            <RefreshCw size={12} />
            <span className="hidden sm:inline">Ejemplos</span>
          </button>
        </div>
      </div>

      {/* SEGMENTED NAVIGATION TABS */}
      <div className="flex items-center justify-between bg-card p-1 rounded-2xl border border-border/80 shadow-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("verifier")}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === "verifier"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Sparkles size={14} /> 🛒 Verificador Oferta
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <History size={14} /> 📈 Histórico ({priceRecords.length})
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === "add"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <PlusCircle size={14} /> ➕ Registrar Precio
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === "settings"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Settings size={14} /> ⚙️ Tiendas & Marcas
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VERIFICADOR DE OFERTA EN TIEMPO REAL */}
      {/* ========================================================================= */}
      {activeTab === "verifier" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* INPUT FORM PANEL */}
          <div className="lg:col-span-5 bg-card rounded-2xl border border-border/80 p-4 shadow-sm space-y-4">
            <div className="border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> ¿Esta oferta vale la pena?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Introduce el precio y formato que ves en la etiqueta del supermercado para analizar si es un chollo o un engaño.
              </p>
            </div>

            <div className="space-y-3">
              {/* Product Select */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  1. Producto a comprobar *
                </label>
                <select
                  value={verifierProductId}
                  onChange={(e) => handleVerifierProductChange(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supermarket Select */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  2. Supermercado (Opcional)
                </label>
                <select
                  value={verifierSupermarketId}
                  onChange={(e) => setVerifierSupermarketId(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Cualquier Supermercado</option>
                  {supermarkets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Select (Filtered by eligible brands) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  3. Marca (Opcional)
                </label>
                <select
                  value={verifierBrandId}
                  onChange={(e) => setVerifierBrandId(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Cualquier Marca</option>
                  {getEligibleBrands(verifierSupermarketId, verifierProductId).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Format Row */}
              <div className="grid grid-cols-12 gap-2 pt-1">
                <div className="col-span-5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                    Precio Total (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 2.49"
                    value={verifierTotalPrice}
                    onChange={(e) => setVerifierTotalPrice(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1"
                    value={verifierQuantity}
                    onChange={(e) => setVerifierQuantity(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                    Unidad
                  </label>
                  <select
                    value={verifierUnit}
                    onChange={(e) => setVerifierUnit(e.target.value as UnitType)}
                    className="w-full bg-background border border-border/80 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          <div className="lg:col-span-7 space-y-4">
            {currentOfferAssessment ? (
              <div
                className={`rounded-2xl border p-5 transition-all shadow-md ${
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
                <div className="flex items-center justify-between gap-2 border-b border-current/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    {currentOfferAssessment.status === "CHOLLO" && (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                    )}
                    {currentOfferAssessment.status === "BUEN_PRECIO" && (
                      <TrendingDown className="w-7 h-7 text-amber-600 shrink-0" />
                    )}
                    {currentOfferAssessment.status === "FALSA_OFERTA" && (
                      <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0" />
                    )}
                    {currentOfferAssessment.status === "SIN_DATOS" && (
                      <HelpCircle className="w-7 h-7 text-muted-foreground shrink-0" />
                    )}

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                        DIAGNÓSTICO DE PRECIO
                      </span>
                      <h2 className="text-base sm:text-lg font-black leading-tight">
                        {currentOfferAssessment.status === "CHOLLO" && "🟢 CHOLLO REAL / EXCELENTE PRECIO"}
                        {currentOfferAssessment.status === "BUEN_PRECIO" && "🟡 PRECIO ACEPTABLE / BUENA COMPRA"}
                        {currentOfferAssessment.status === "FALSA_OFERTA" && "🔴 FALSA OFERTA / ENGAÑO"}
                        {currentOfferAssessment.status === "SIN_DATOS" && "⚪ SIN HISTORIAL PREVIO"}
                      </h2>
                    </div>
                  </div>

                  <span className="text-xl sm:text-2xl font-black px-3 py-1 rounded-xl bg-background/80 shadow-xs border border-current/20">
                    {currentOfferAssessment.currentUnitPrice.toFixed(2)} {currentOfferAssessment.baseUnitLabel}
                  </span>
                </div>

                {/* VERDICT MESSAGE */}
                <p className="text-xs sm:text-sm font-semibold mb-4 leading-relaxed">
                  {currentOfferAssessment.message}
                </p>

                {/* METRICS COMPARISON GRID */}
                {currentOfferAssessment.status !== "SIN_DATOS" && (
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="bg-background/80 backdrop-blur-xs rounded-xl p-2.5 border border-current/15 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                        MÍNIMO HISTÓRICO
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {currentOfferAssessment.historicalMinUnitPrice.toFixed(2)}{" "}
                        {currentOfferAssessment.baseUnitLabel}
                      </span>
                    </div>

                    <div className="bg-background/80 backdrop-blur-xs rounded-xl p-2.5 border border-current/15 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                        PRECIO MEDIO HABITUAL
                      </span>
                      <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                        {currentOfferAssessment.historicalAvgUnitPrice.toFixed(2)}{" "}
                        {currentOfferAssessment.baseUnitLabel}
                      </span>
                    </div>

                    <div className="bg-background/80 backdrop-blur-xs rounded-xl p-2.5 border border-current/15 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                        MÁXIMO REGISTRADO
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                        {currentOfferAssessment.historicalMaxUnitPrice.toFixed(2)}{" "}
                        {currentOfferAssessment.baseUnitLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center flex flex-col items-center justify-center space-y-2">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/40 animate-pulse" />
                <h4 className="font-extrabold text-sm text-foreground">
                  Introduce un precio para evaluar la oferta
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Selecciona un producto e ingresa el precio total y la cantidad para verificar en segundos si estás ahorrando o pagando más.
                </p>
              </div>
            )}

            {/* HISTORICAL SUMMARY FOR SELECTED PRODUCT */}
            {verifierProductId && (
              <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-primary" /> Registros Históricos Recientes de este Producto
                </h4>

                <div className="space-y-1.5">
                  {priceRecords
                    .filter((r) => r.productId === verifierProductId)
                    .slice(0, 5)
                    .map((rec) => {
                      const sm = supermarkets.find((s) => s.id === rec.supermarketId);
                      const br = brands.find((b) => b.id === rec.brandId);
                      const unitLabel = getBaseUnitLabel(rec.unit);

                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between gap-2 bg-muted/20 hover:bg-muted/40 p-2 rounded-xl border border-border/50 text-xs transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: sm?.color || "#888" }}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-foreground truncate block">
                                {sm?.name || "Supermercado"} • {br?.name || "Marca general"}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                {rec.date} {rec.isOffer && `• 🏷️ ${rec.offerDescription || "Oferta"}`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-foreground block">
                              {rec.totalPrice.toFixed(2)}€ ({rec.quantity} {rec.unit})
                            </span>
                            <span className="text-[10px] font-extrabold text-primary block">
                              {rec.unitPrice.toFixed(2)} {unitLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTÓRICO Y BÚSQUEDA AVANZADA DE PRECIOS */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-4">

          {/* FILTERS TOOLBAR */}
          <div className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Filter size={14} className="text-primary" /> Filtrar Histórico de Precios
              </span>
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
                Limpiar Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {/* Search text */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar texto/nota..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl pl-8 pr-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Product */}
              <select
                value={historyProductId}
                onChange={(e) => setHistoryProductId(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">Todos los Productos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Supermarket */}
              <select
                value={historySupermarketId}
                onChange={(e) => setHistorySupermarketId(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">Todos los Supermercados</option>
                {supermarkets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Brand */}
              <select
                value={historyBrandId}
                onChange={(e) => setHistoryBrandId(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">Todas las Marcas</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Category */}
              <select
                value={historyCategory}
                onChange={(e) => setHistoryCategory(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="ALL">Todas las Categorías</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Offers toggle */}
              <label className="flex items-center justify-center gap-1.5 bg-background border border-border/80 rounded-xl px-2 py-1.5 cursor-pointer text-xs font-bold select-none hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={historyOffersOnly}
                  onChange={(e) => setHistoryOffersOnly(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>🏷️ Solo Ofertas</span>
              </label>
            </div>
          </div>

          {/* RECORDS TABLE / LIST */}
          <div className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-sm">
            <div className="p-3 bg-muted/20 border-b border-border/60 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Registros encontrados ({filteredHistory.length})
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
                      className="p-3 hover:bg-muted/30 transition-all flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-[200px] flex-1">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: sm?.color || "#888" }}
                          title={sm?.name}
                        />

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-foreground">
                              {prod?.name || "Producto desconocido"}
                            </span>
                            {rec.isOffer && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                🏷️ {rec.offerDescription || "Oferta"}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap font-medium">
                            <span>🏪 {sm?.name || "S/S"}</span>
                            <span>•</span>
                            <span>🏷️ {br?.name || "General"}</span>
                            <span>•</span>
                            <span>📅 {rec.date}</span>
                          </div>

                          {rec.notes && (
                            <p className="text-[10px] text-muted-foreground/80 italic">
                              &ldquo;{rec.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-black text-foreground">
                            {rec.totalPrice.toFixed(2)}€
                          </div>
                          <div className="text-[10px] font-extrabold text-primary">
                            {rec.unitPrice.toFixed(2)} {baseUnitLabel} ({rec.quantity} {rec.unit})
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs font-semibold">
                No hay registros que coincidan con los filtros seleccionados.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REGISTRAR UN NUEVO PRECIO */}
      {/* ========================================================================= */}
      {activeTab === "add" && (
        <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
              <PlusCircle className="w-5 h-5 text-primary" /> Registrar Nuevo Precio
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Guarda el precio observado en el supermercado para mantener el historial actualizado.
            </p>
          </div>

          <form onSubmit={handleAddPriceRecord} className="space-y-3">
            {/* Product Select */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                Producto *
              </label>
              <select
                value={addProductId}
                onChange={(e) => handleAddProductChange(e.target.value)}
                required
                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Supermarket & Brand Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  Supermercado *
                </label>
                <select
                  value={addSupermarketId}
                  onChange={(e) => setAddSupermarketId(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Selecciona Supermercado</option>
                  {getEligibleSupermarkets(addBrandId).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  Marca
                </label>
                <select
                  value={addBrandId}
                  onChange={(e) => setAddBrandId(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Marca Blanca / General</option>
                  {getEligibleBrands(addSupermarketId, addProductId).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date, Price, Quantity */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 sm:col-span-4">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="col-span-7 sm:col-span-4">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  Precio Total (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 2.49"
                  value={addTotalPrice}
                  onChange={(e) => setAddTotalPrice(e.target.value)}
                  required
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  step="any"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                  Unidad
                </label>
                <select
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value as UnitType)}
                  className="w-full bg-background border border-border/80 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            <div className="bg-muted/20 rounded-xl p-3 border border-border/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none">
                <input
                  type="checkbox"
                  checked={addIsOffer}
                  onChange={(e) => setAddIsOffer(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>🏷️ Marcar como Precio de Oferta / Promoción</span>
              </label>

              {addIsOffer && (
                <input
                  type="text"
                  placeholder="Ej: Oferta 3x2, Segunda unidad al 50%..."
                  value={addOfferDesc}
                  onChange={(e) => setAddOfferDesc(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                Notas Adicionales (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Formato ahorro garrafa 3L..."
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle size={15} /> Guardar Registro de Precio
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONFIGURACIÓN, TIENDAS, MARCAS Y SUS ENLACES */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-4">

          {/* SUB-PILLS NAVIGATION */}
          <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border/80 w-fit">
            <button
              onClick={() => setSettingsSection("brands")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                settingsSection === "brands"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tag size={12} /> Marcas ({brands.length})
            </button>

            <button
              onClick={() => setSettingsSection("supermarkets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                settingsSection === "supermarkets"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store size={12} /> Supermercados ({supermarkets.length})
            </button>

            <button
              onClick={() => setSettingsSection("products")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                settingsSection === "products"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package size={12} /> Productos ({products.length})
            </button>
          </div>

          {/* 1. BRANDS SECTION (WITH SUPERMARKET & PRODUCT LINKING) */}
          {settingsSection === "brands" && (
            <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-primary" /> Marcas y Vinculación con Tiendas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configura las marcas y restringe opcionalmente en qué supermercados y productos existen.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingBrand({
                      name: "",
                      supermarketIds: [],
                      productIds: [],
                      notes: "",
                    })
                  }
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <PlusCircle size={13} /> Nueva Marca
                </button>
              </div>

              {/* LIST OF BRANDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {brands.map((b) => {
                  const linkedSMs = supermarkets.filter((s) => b.supermarketIds?.includes(s.id));
                  const linkedProds = products.filter((p) => b.productIds?.includes(p.id));

                  return (
                    <div
                      key={b.id}
                      className="bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/60 p-3 flex flex-col justify-between gap-2 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-xs text-foreground flex items-center gap-1.5">
                            <Tag size={12} className="text-primary" /> {b.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingBrand(b)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(b.id)}
                              className="p-1 text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Linked Supermarkets */}
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">Exclusiva de: </span>
                          {linkedSMs.length > 0 ? (
                            <span className="inline-flex flex-wrap gap-1 mt-0.5">
                              {linkedSMs.map((sm) => (
                                <span
                                  key={sm.id}
                                  className="px-1.5 py-0.2 rounded font-extrabold text-white text-[9px]"
                                  style={{ backgroundColor: sm.color }}
                                >
                                  {sm.name}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="italic">Disponible en todos los supermercados</span>
                          )}
                        </div>

                        {/* Linked Products */}
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">Aplica a: </span>
                          {linkedProds.length > 0 ? (
                            <span className="text-foreground font-semibold">
                              {linkedProds.map((p) => p.name).join(", ")}
                            </span>
                          ) : (
                            <span className="italic">Aplica a cualquier producto</span>
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
            <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-primary" /> Supermercados
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Añade o modifica los supermercados donde sueles comprar.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingSupermarket({
                      name: "",
                      color: "#00A859",
                      notes: "",
                    })
                  }
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <PlusCircle size={13} /> Nuevo Supermercado
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {supermarkets.map((sm) => (
                  <div
                    key={sm.id}
                    className="bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/60 p-3 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: sm.color }}
                      />
                      <span className="font-black text-xs text-foreground truncate">
                        {sm.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingSupermarket(sm)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupermarket(sm.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. PRODUCTS SECTION */}
          {settingsSection === "products" && (
            <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary" /> Catálogo de Productos
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define los productos habituales de tu cesta de la compra.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingProduct({
                      name: "",
                      category: "Lácteos",
                      defaultUnit: "L",
                      notes: "",
                    })
                  }
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <PlusCircle size={13} /> Nuevo Producto
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/60 p-3 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-xs text-foreground">{p.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 text-muted-foreground hover:text-rose-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                          {p.category}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground">
                          Unidad base: {p.defaultUnit}
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
      {/* MODALS FOR EDITING ENTITIES */}
      {/* ========================================================================= */}

      {/* BRAND EDITOR MODAL */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-sm text-foreground">
              {editingBrand.id ? "Editar Marca" : "Añadir Nueva Marca"}
            </h3>

            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Hacendado, Nestlé..."
                  value={editingBrand.name || ""}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  required
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              {/* Supermarket Multi-Select Toggles */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Exclusividad de Supermercado
                </label>
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  Marca los supermercados donde se vende esta marca. Si no marcas ninguno, estará disponible en todos.
                </p>

                <div className="space-y-1.5">
                  {supermarkets.map((sm) => {
                    const isChecked = editingBrand.supermarketIds?.includes(sm.id) || false;
                    return (
                      <label
                        key={sm.id}
                        className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20 cursor-pointer text-xs font-bold hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sm.color }}
                          />
                          <span>{sm.name}</span>
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
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Productos Disponibles para esta Marca
                </label>
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  Selecciona los productos que ofrece esta marca (si no marcas ninguno, se permite para todos los productos).
                </p>

                <div className="space-y-1 bg-muted/10 p-2 rounded-xl border border-border/60 max-h-36 overflow-y-auto">
                  {products.map((p) => {
                    const isChecked = editingBrand.productIds?.includes(p.id) || false;
                    return (
                      <label
                        key={p.id}
                        className="flex items-center justify-between p-1.5 rounded-lg text-xs font-bold hover:bg-muted/40 cursor-pointer"
                      >
                        <span>{p.name} ({p.category})</span>
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-black text-sm text-foreground">
              {editingSupermarket.id ? "Editar Supermercado" : "Añadir Supermercado"}
            </h3>

            <form onSubmit={handleSaveSupermarket} className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
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
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Color Distintivo
                </label>
                <input
                  type="color"
                  value={editingSupermarket.color || "#00A859"}
                  onChange={(e) =>
                    setEditingSupermarket({ ...editingSupermarket, color: e.target.value })
                  }
                  className="w-full h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSupermarket(null)}
                  className="px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-black text-sm text-foreground">
              {editingProduct.id ? "Editar Producto" : "Añadir Producto"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aceite de Oliva Virgen Extra"
                  value={editingProduct.name || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  required
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lácteos, Frescos, Limpieza..."
                  value={editingProduct.category || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, category: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground mb-1">
                  Unidad por Defecto
                </label>
                <select
                  value={editingProduct.defaultUnit || "L"}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      defaultUnit: e.target.value as UnitType,
                    })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="kg">kg (Kilogramos)</option>
                  <option value="g">g (Gramos)</option>
                  <option value="L">L (Litros)</option>
                  <option value="ml">ml (Mililitros)</option>
                  <option value="ud">ud (Unidades)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
