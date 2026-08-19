"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ConceptGroup,
  Concept,
  JobOffer,
  EvaluationResult,
  UnitType,
  CalculationType,
  OfferStatus,
} from "./types";
import {
  DEFAULT_GROUPS,
  DEFAULT_CONCEPTS,
  DEFAULT_OFFERS,
  evaluateJobOffers,
  calculateConceptMonetaryValue,
  calculateConceptNormalizedScore,
} from "./initialData";

type ActiveTab = "summary" | "offers" | "concepts" | "matrix";

export function JobOfferEvaluatorModule() {
  const [groups, setGroups] = useState<ConceptGroup[]>(DEFAULT_GROUPS);
  const [concepts, setConcepts] = useState<Concept[]>(DEFAULT_CONCEPTS);
  const [offers, setOffers] = useState<JobOffer[]>(DEFAULT_OFFERS);

  const [activeTab, setActiveTab] = useState<ActiveTab>("summary");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Modal / Form States
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);

  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);

  // Form Field States for Offer
  const [offerTitle, setOfferTitle] = useState<string>("");
  const [offerCompany, setOfferCompany] = useState<string>("");
  const [offerLocation, setOfferLocation] = useState<string>("");
  const [offerIsCurrent, setOfferIsCurrent] = useState<boolean>(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("received");
  const [offerNotes, setOfferNotes] = useState<string>("");
  const [offerValues, setOfferValues] = useState<Record<string, number | boolean>>({});

  // Form Field States for Concept
  const [conceptName, setConceptName] = useState<string>("");
  const [conceptGroupId, setConceptGroupId] = useState<string>("g_direct");
  const [conceptDescription, setConceptDescription] = useState<string>("");
  const [conceptUnit, setConceptUnit] = useState<UnitType>("EUR_YEAR");
  const [conceptType, setConceptType] = useState<CalculationType>("monetary_direct");
  const [conceptWeight, setConceptWeight] = useState<number>(7);
  const [conceptIsPositive, setConceptIsPositive] = useState<boolean>(true);
  const [conceptMonetaryEquivalence, setConceptMonetaryEquivalence] = useState<number>(0);

  // Load initial data from API or localStorage
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const hasLocalData = loadFromLocalStorage();
      try {
        const res = await fetch("/api/job-offer-evaluator");
        if (res.ok) {
          const data = await res.json();
          // If server data is valid and not a fallback default, update state
          if (!data.isFallback && data.offers && data.offers.length > 0) {
            setOffers(data.offers);
            if (data.concepts && data.concepts.length > 0) setConcepts(data.concepts);
            if (data.groups && data.groups.length > 0) setGroups(data.groups);
          } else if (!hasLocalData) {
            if (data.offers) setOffers(data.offers);
            if (data.concepts) setConcepts(data.concepts);
            if (data.groups) setGroups(data.groups);
          }
        }
      } catch {
        // Kept local storage data if network fails
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  function loadFromLocalStorage(): boolean {
    try {
      const stored = localStorage.getItem("job_offers_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.offers && parsed.offers.length > 0) {
          setOffers(parsed.offers);
          if (parsed.concepts) setConcepts(parsed.concepts);
          if (parsed.groups) setGroups(parsed.groups);
          return true;
        }
      }
    } catch {
      // Use defaults
    }
    return false;
  }

  // Save data to API and LocalStorage
  const saveData = async (
    updatedOffers: JobOffer[],
    updatedConcepts: Concept[],
    updatedGroups: ConceptGroup[]
  ) => {
    setOffers(updatedOffers);
    setConcepts(updatedConcepts);
    setGroups(updatedGroups);

    try {
      localStorage.setItem(
        "job_offers_data",
        JSON.stringify({
          offers: updatedOffers,
          concepts: updatedConcepts,
          groups: updatedGroups,
        })
      );
    } catch {
      // ignore
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/job-offer-evaluator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "full_sync",
          offers: updatedOffers,
          concepts: updatedConcepts,
          groups: updatedGroups,
        }),
      });

      if (res.ok) {
        setStatusMessage("Guardado correctamente");
      } else {
        setStatusMessage("Guardado localmente");
      }
    } catch {
      setStatusMessage("Guardado localmente");
    } finally {
      setTimeout(() => setStatusMessage(""), 2500);
      setIsSyncing(false);
    }
  };

  // Evaluation calculations
  const evaluationResults = useMemo(() => {
    return evaluateJobOffers(offers, concepts, groups);
  }, [offers, concepts, groups]);

  const currentOffer = useMemo(() => {
    return offers.find((o) => o.isCurrent) || offers[0];
  }, [offers]);

  const topRankedOffer = useMemo(() => {
    const topResult = evaluationResults[0];
    return offers.find((o) => o.id === topResult?.offerId) || currentOffer;
  }, [evaluationResults, offers, currentOffer]);

  // Handle Offer Modal Open
  const handleOpenOfferModal = (offerToEdit?: JobOffer) => {
    if (offerToEdit) {
      setEditingOffer(offerToEdit);
      setOfferTitle(offerToEdit.title);
      setOfferCompany(offerToEdit.company);
      setOfferLocation(offerToEdit.location);
      setOfferIsCurrent(offerToEdit.isCurrent);
      setOfferStatus(offerToEdit.status);
      setOfferNotes(offerToEdit.notes || "");
      setOfferValues(offerToEdit.values || {});
    } else {
      setEditingOffer(null);
      setOfferTitle("");
      setOfferCompany("");
      setOfferLocation("");
      setOfferIsCurrent(offers.length === 0);
      setOfferStatus("received");
      setOfferNotes("");
      const initialVals: Record<string, number | boolean> = {};
      concepts.forEach((c) => {
        if (c.unit === "BOOLEAN") initialVals[c.id] = false;
        else if (c.unit === "SCORE_10") initialVals[c.id] = 5;
        else initialVals[c.id] = 0;
      });
      setOfferValues(initialVals);
    }
    setShowOfferModal(true);
  };

  const handleSaveOffer = () => {
    if (!offerTitle.trim() || !offerCompany.trim()) {
      alert("Por favor, introduce el título del puesto y el nombre de la empresa.");
      return;
    }

    let updatedOffers = [...offers];

    // If marked as current position, unset other offers as current
    if (offerIsCurrent) {
      updatedOffers = updatedOffers.map((o) => ({
        ...o,
        isCurrent: false,
        status: o.status === "current" ? "received" : o.status,
      }));
    }

    const offerId = editingOffer ? editingOffer.id : `offer_${Date.now()}`;
    const newOffer: JobOffer = {
      id: offerId,
      title: offerTitle,
      company: offerCompany,
      location: offerLocation,
      isCurrent: offerIsCurrent,
      status: offerIsCurrent ? "current" : offerStatus,
      notes: offerNotes,
      values: offerValues,
      updatedAt: new Date().toISOString(),
    };

    if (editingOffer) {
      updatedOffers = updatedOffers.map((o) => (o.id === offerId ? newOffer : o));
    } else {
      updatedOffers.push(newOffer);
    }

    saveData(updatedOffers, concepts, groups);
    setShowOfferModal(false);
  };

  const handleDeleteOffer = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta oferta?")) {
      const updated = offers.filter((o) => o.id !== id);
      saveData(updated, concepts, groups);
    }
  };

  const handleSetCurrentOffer = (id: string) => {
    const updated = offers.map((o) => ({
      ...o,
      isCurrent: o.id === id,
      status: o.id === id ? ("current" as OfferStatus) : o.status === "current" ? "received" as OfferStatus : o.status,
    }));
    saveData(updated, concepts, groups);
  };

  // Handle Concept Modal Open
  const handleOpenConceptModal = (conceptToEdit?: Concept) => {
    if (conceptToEdit) {
      setEditingConcept(conceptToEdit);
      setConceptName(conceptToEdit.name);
      setConceptGroupId(conceptToEdit.groupId);
      setConceptDescription(conceptToEdit.description);
      setConceptUnit(conceptToEdit.unit);
      setConceptType(conceptToEdit.type);
      setConceptWeight(conceptToEdit.weight);
      setConceptIsPositive(conceptToEdit.isPositive);
      setConceptMonetaryEquivalence(conceptToEdit.monetaryEquivalencePerUnit || 0);
    } else {
      setEditingConcept(null);
      setConceptName("");
      setConceptGroupId(groups[0]?.id || "g_direct");
      setConceptDescription("");
      setConceptUnit("EUR_YEAR");
      setConceptType("monetary_direct");
      setConceptWeight(7);
      setConceptIsPositive(true);
      setConceptMonetaryEquivalence(0);
    }
    setShowConceptModal(true);
  };

  const handleSaveConcept = () => {
    if (!conceptName.trim()) {
      alert("Introduce un nombre para el concepto.");
      return;
    }

    const conceptId = editingConcept ? editingConcept.id : `c_${Date.now()}`;
    const newConcept: Concept = {
      id: conceptId,
      groupId: conceptGroupId,
      name: conceptName,
      description: conceptDescription,
      unit: conceptUnit,
      type: conceptType,
      weight: Number(conceptWeight),
      isPositive: conceptIsPositive,
      monetaryEquivalencePerUnit: Number(conceptMonetaryEquivalence),
    };

    let updatedConcepts = [...concepts];
    if (editingConcept) {
      updatedConcepts = updatedConcepts.map((c) => (c.id === conceptId ? newConcept : c));
    } else {
      updatedConcepts.push(newConcept);
    }

    saveData(offers, updatedConcepts, groups);
    setShowConceptModal(false);
  };

  const handleDeleteConcept = (id: string) => {
    if (confirm("¿Deseas eliminar este concepto? Se eliminará de todas las comparaciones.")) {
      const updatedConcepts = concepts.filter((c) => c.id !== id);
      const updatedOffers = offers.map((o) => {
        const newVals = { ...o.values };
        delete newVals[id];
        return { ...o, values: newVals };
      });
      saveData(updatedOffers, updatedConcepts, groups);
    }
  };

  // Helper formatting functions (Without Emojis / Icons)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatConceptValue = (concept: Concept, val: number | boolean | undefined) => {
    if (val === undefined || val === null) return "N/D";
    if (concept.unit === "BOOLEAN") {
      return val ? "SÍ (Incluido)" : "NO (No incluido)";
    }
    const num = Number(val);
    switch (concept.unit) {
      case "EUR_YEAR":
        return `${formatCurrency(num)}/año`;
      case "EUR_MONTH":
        return `${formatCurrency(num)}/mes`;
      case "DAYS_YEAR":
        return `${num} días/año`;
      case "DAYS_WEEK":
        return `${num} días/semana`;
      case "MINUTES_DAY":
        return `${num} min/día`;
      case "SCORE_10":
        return `${num} / 10`;
      default:
        return `${num}`;
    }
  };

  const getStatusBadge = (status: OfferStatus, isCurrent: boolean) => {
    if (isCurrent) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          [PUESTO ACTUAL]
        </span>
      );
    }
    switch (status) {
      case "received":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            [OFERTA RECIBIDA]
          </span>
        );
      case "negotiating":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            [EN NEGOCIACIÓN]
          </span>
        );
      case "interviewing":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            [EN PROCESO]
          </span>
        );
      case "accepted":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white border border-emerald-700">
            [ACEPTADA]
          </span>
        );
      case "discarded":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            [DESCARTADA]
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
            [EVALUANDO]
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Cargando panel de evaluación...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* -------------------- HEADER DASHBOARD BAR -------------------- */}
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-border p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
              CARRERA Y EMPLEO
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              [SISTEMA DE PONDERACIÓN MULTI-PARAMÉTRICO]
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight mt-0.5">
            Evaluador de Ofertas de Empleo
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {statusMessage && (
            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              {statusMessage}
            </span>
          )}
          <button
            onClick={() => handleOpenOfferModal()}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider"
          >
            + Nueva Oferta
          </button>
        </div>
      </div>

      {/* -------------------- SEGMENTED NAVIGATION TABS (WITHOUT ICONS) -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border/80">
        <button
          onClick={() => setActiveTab("summary")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "summary"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          1. Resumen y Comparativa
        </button>

        <button
          onClick={() => setActiveTab("offers")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "offers"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          2. Ofertas y Puestos ({offers.length})
        </button>

        <button
          onClick={() => setActiveTab("concepts")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "concepts"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          3. Ponderaciones ({concepts.length})
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "matrix"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-card/40"
          }`}
        >
          4. Análisis Detallado
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE SUMMARY & COMPARISON                                     */}
      {/* ========================================================================= */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          {/* Executive Overview KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Top Recommendation KPI */}
            <div className="bg-card rounded-2xl border border-primary/30 p-3.5 shadow-2xs relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  [MEJOR OPCIÓN GLOBAL]
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-primary/10 text-primary">
                  RANK #1
                </span>
              </div>
              <h3 className="text-base font-black text-foreground truncate">
                {topRankedOffer?.title}
              </h3>
              <p className="text-xs font-semibold text-muted-foreground truncate">
                {topRankedOffer?.company}
              </p>
              <div className="mt-3 pt-2 border-t border-border/60 flex justify-between items-end">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Puntuación Ponderada
                  </span>
                  <span className="text-lg font-black text-primary">
                    {evaluationResults[0]?.compositeScore || 0} / 100 pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Valor Percibido
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(evaluationResults[0]?.totalMonetaryValue || 0)}/año
                  </span>
                </div>
              </div>
            </div>

            {/* Current Position Baseline KPI */}
            <div className="bg-card rounded-2xl border border-border p-3.5 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  [PUESTO ACTUAL]
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  BASE
                </span>
              </div>
              <h3 className="text-base font-black text-foreground truncate">
                {currentOffer?.title || "Sin definir"}
              </h3>
              <p className="text-xs font-semibold text-muted-foreground truncate">
                {currentOffer?.company || "N/A"}
              </p>
              <div className="mt-3 pt-2 border-t border-border/60 flex justify-between items-end">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Puntuación
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {evaluationResults.find((r) => r.isCurrent)?.compositeScore || 0} / 100 pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Valor Total Actual
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {formatCurrency(evaluationResults.find((r) => r.isCurrent)?.totalMonetaryValue || 0)}/año
                  </span>
                </div>
              </div>
            </div>

            {/* Maximum Monetary Advantage KPI */}
            <div className="bg-card rounded-2xl border border-border p-3.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-1">
                [MÁXIMA GANANCIA ANUAL]
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatCurrency(
                  Math.max(...evaluationResults.map((r) => r.deltaMonetaryVsCurrent), 0)
                )}
                /año
              </div>
              <p className="text-[11px] font-bold text-muted-foreground mt-1">
                Incremento percibido sobre salario y beneficios actuales
              </p>
              <div className="mt-2 text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md inline-block">
                +{Math.max(...evaluationResults.map((r) => r.deltaPercentVsCurrent), 0)}% mejoía
              </div>
            </div>

            {/* Total Evaluated Offers KPI */}
            <div className="bg-card rounded-2xl border border-border p-3.5 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                  [OFERTAS REGISTRADAS]
                </span>
                <div className="text-2xl font-black text-foreground mt-1">
                  {offers.length} <span className="text-xs font-extrabold text-muted-foreground">Puestos</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border/60 text-[10px] font-bold text-muted-foreground">
                Evaluadas bajo {concepts.length} conceptos y 4 grupos de ponderación
              </div>
            </div>
          </div>

          {/* Leaderboard Comparison Cards */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                [RANKING Y COMPARATIVA GENERAL DE OFERTAS]
              </h2>
              <span className="text-xs font-bold text-muted-foreground">
                Ordenado por Puntuación Ponderada
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {evaluationResults.map((result) => {
                const offerObj = offers.find((o) => o.id === result.offerId);
                const isWinner = result.rank === 1 && !result.isCurrent;

                return (
                  <div
                    key={result.offerId}
                    className={`bg-card rounded-2xl border p-4 transition-all shadow-2xs ${
                      isWinner
                        ? "border-primary/50 ring-1 ring-primary/30"
                        : result.isCurrent
                        ? "border-emerald-500/40"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                            isWinner
                              ? "bg-primary text-primary-foreground"
                              : result.isCurrent
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          #{result.rank}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-foreground">
                              {result.offerTitle}
                            </h3>
                            {getStatusBadge(result.status, result.isCurrent)}
                            {isWinner && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground">
                                [RECOMENDADA]
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-muted-foreground">
                            {result.company} • {offerObj?.location || "Sin ubicación"}
                          </p>
                        </div>
                      </div>

                      {/* Right KPIs for Card */}
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                            Valor Percibido Anual
                          </span>
                          <span className="text-base font-black text-foreground">
                            {formatCurrency(result.totalMonetaryValue)}
                          </span>
                        </div>

                        <div className="text-right pl-3 border-l border-border/60">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                            Puntuación Ponderada
                          </span>
                          <span className="text-lg font-black text-primary">
                            {result.compositeScore} <span className="text-xs font-bold text-muted-foreground">/100</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Delta Row */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-muted-foreground text-[10px] uppercase font-extrabold">
                          Nivel de Ajuste a tus Criterios
                        </span>
                        <div className="flex items-center gap-2">
                          {!result.isCurrent && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.2 rounded-md ${
                                result.deltaMonetaryVsCurrent >= 0
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {result.deltaMonetaryVsCurrent >= 0 ? "+" : ""}
                              {formatCurrency(result.deltaMonetaryVsCurrent)}/año ({result.deltaPercentVsCurrent > 0 ? "+" : ""}
                              {result.deltaPercentVsCurrent}%)
                            </span>
                          )}
                          <span className="font-black text-foreground text-xs">
                            {result.compositeScore}%
                          </span>
                        </div>
                      </div>

                      {/* Bar Gauge */}
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isWinner
                              ? "bg-primary"
                              : result.isCurrent
                              ? "bg-emerald-500"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${Math.max(5, result.compositeScore)}%` }}
                        />
                      </div>

                      {/* Group Scores Breakdown Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        {result.groupResults.map((gr) => (
                          <div
                            key={gr.groupId}
                            className="bg-muted/40 rounded-xl p-2 border border-border/50 text-center"
                          >
                            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block truncate">
                              {gr.groupName}
                            </span>
                            <div className="flex justify-between items-center mt-1 text-xs font-black">
                              <span className="text-foreground">{gr.score100} pts</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(gr.totalMonetaryValue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JOB OFFERS MANAGEMENT                                             */}
      {/* ========================================================================= */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                [ADMINISTRACIÓN DE PUESTOS Y OFERTAS]
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Gestiona y edita los valores de cada oferta para realizar comparativas precisas
              </p>
            </div>
            <button
              onClick={() => handleOpenOfferModal()}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              + Añadir Oferta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offers.map((offer) => {
              const res = evaluationResults.find((r) => r.offerId === offer.id);

              return (
                <div
                  key={offer.id}
                  className={`bg-card rounded-2xl border p-4 shadow-2xs flex flex-col justify-between gap-3 ${
                    offer.isCurrent ? "border-emerald-500/40" : "border-border"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-base font-black text-foreground truncate">
                        {offer.title}
                      </h3>
                      {getStatusBadge(offer.status, offer.isCurrent)}
                    </div>

                    <p className="text-xs font-bold text-muted-foreground mb-1">
                      {offer.company} • {offer.location || "Ubicación sin especificar"}
                    </p>

                    {offer.notes && (
                      <p className="text-[11px] font-semibold text-muted-foreground/80 bg-muted/40 p-2 rounded-xl border border-border/50 my-2">
                        {offer.notes}
                      </p>
                    )}

                    {/* Quick Metric Snapshot */}
                    <div className="mt-3 pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                          Valor Percibido
                        </span>
                        <span className="font-black text-foreground">
                          {formatCurrency(res?.totalMonetaryValue || 0)}/año
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                          Puntuación Total
                        </span>
                        <span className="font-black text-primary">
                          {res?.compositeScore || 0} / 100 pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    {!offer.isCurrent ? (
                      <button
                        onClick={() => handleSetCurrentOffer(offer.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20 cursor-pointer"
                      >
                        [Marcar Puesto Actual]
                      </button>
                    ) : (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                        [Puesto Base]
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenOfferModal(offer)}
                        className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border cursor-pointer uppercase tracking-wider"
                      >
                        Editar
                      </button>
                      {!offer.isCurrent && (
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs border border-rose-500/20 cursor-pointer uppercase tracking-wider"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONCEPTS & WEIGHTS CONFIGURATION                                  */}
      {/* ========================================================================= */}
      {activeTab === "concepts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                [CONFIGURACIÓN DE CONCEPTOS Y PONDERACIONES]
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Ajusta el peso y valor económico asignado a cada parámetro según tus prioridades de vida
              </p>
            </div>
            <button
              onClick={() => handleOpenConceptModal()}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              + Nuevo Concepto
            </button>
          </div>

          <div className="space-y-4">
            {groups.map((group) => {
              const groupConcepts = concepts.filter((c) => c.groupId === group.id);

              return (
                <div
                  key={group.id}
                  className="bg-card rounded-2xl border border-border p-4 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        [{group.name}]
                      </span>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg border border-border">
                      {groupConcepts.length} Conceptos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {groupConcepts.map((concept) => (
                      <div
                        key={concept.id}
                        className="bg-muted/30 rounded-xl border border-border/60 p-3 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-black text-foreground">
                              {concept.name}
                            </h4>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                              PESO: {concept.weight}/10
                            </span>
                          </div>

                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                            {concept.description}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
                            <span className="bg-card px-2 py-0.5 rounded-md border border-border/60 text-foreground">
                              Unidad: {concept.unit}
                            </span>
                            {concept.monetaryEquivalencePerUnit !== 0 && (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                Valoración: {formatCurrency(concept.monetaryEquivalencePerUnit || 0)} / unidad
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenConceptModal(concept)}
                            className="px-2 py-0.5 rounded-md bg-card hover:bg-muted text-foreground text-[10px] font-extrabold border border-border cursor-pointer uppercase"
                          >
                            Editar Criterio
                          </button>
                          <button
                            onClick={() => handleDeleteConcept(concept.id)}
                            className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-extrabold border border-rose-500/20 cursor-pointer uppercase"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DETAILED COMPARATIVE MATRIX                                       */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                [MATRIZ DETALLADA DE COMPARACIÓN POR CONCEPTO]
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Análisis lado a lado de todos los puestos para identificar ventajas y desventajas puntuales
              </p>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-card rounded-2xl border border-border overflow-x-auto shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="p-3 w-1/4">Concepto / Parámetro</th>
                  <th className="p-3 w-28 text-center">Peso</th>
                  {offers.map((offer) => (
                    <th
                      key={offer.id}
                      className={`p-3 text-center ${
                        offer.isCurrent ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    >
                      <span className="block text-xs font-black text-foreground">
                        {offer.title}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground block">
                        {offer.company}
                      </span>
                      <div className="mt-1">{getStatusBadge(offer.status, offer.isCurrent)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {groups.map((group) => {
                  const groupConcepts = concepts.filter((c) => c.groupId === group.id);
                  if (groupConcepts.length === 0) return null;

                  return (
                    <React.Fragment key={group.id}>
                      {/* Group Divider Row */}
                      <tr className="bg-muted/30">
                        <td
                          colSpan={2 + offers.length}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary"
                        >
                          [{group.name}]
                        </td>
                      </tr>

                      {/* Concept Rows */}
                      {groupConcepts.map((concept) => {
                        // Find max/best value for highlighting
                        const valuesArray = offers.map((o) => {
                          const val = o.values[concept.id];
                          return {
                            offerId: o.id,
                            raw: val,
                            monetary: calculateConceptMonetaryValue(concept, val),
                            score10: calculateConceptNormalizedScore(concept, val),
                          };
                        });

                        const maxScore = Math.max(...valuesArray.map((v) => v.score10));

                        return (
                          <tr key={concept.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-foreground block">
                                {concept.name}
                              </span>
                              <span className="text-[10px] font-semibold text-muted-foreground block">
                                {concept.description}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-extrabold text-[10px]">
                                {concept.weight}/10
                              </span>
                            </td>

                            {offers.map((offer) => {
                              const val = offer.values[concept.id];
                              const monVal = calculateConceptMonetaryValue(concept, val);
                              const score10 = calculateConceptNormalizedScore(concept, val);
                              const isBest = score10 === maxScore && offers.length > 1;

                              return (
                                <td
                                  key={offer.id}
                                  className={`p-3 text-center ${
                                    isBest ? "bg-primary/5 font-black" : ""
                                  }`}
                                >
                                  <div className="font-black text-foreground">
                                    {formatConceptValue(concept, val)}
                                  </div>

                                  {monVal !== 0 && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                      {formatCurrency(monVal)}/año
                                    </span>
                                  )}

                                  {isBest && (
                                    <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.2 rounded-md inline-block mt-1">
                                      [MEJOR]
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {/* TOTAL SUMMARY ROW IN MATRIX */}
                <tr className="bg-primary/10 border-t-2 border-primary/40 font-black">
                  <td className="p-3 text-sm text-foreground uppercase tracking-wider">
                    VALOR TOTAL PERCIBIDO Y PUNTUACIÓN
                  </td>
                  <td className="p-3 text-center text-xs text-muted-foreground">
                    CÁLCULO
                  </td>
                  {offers.map((offer) => {
                    const res = evaluationResults.find((r) => r.offerId === offer.id);
                    return (
                      <td key={offer.id} className="p-3 text-center">
                        <div className="text-sm text-foreground font-black">
                          {formatCurrency(res?.totalMonetaryValue || 0)}/año
                        </div>
                        <div className="text-xs text-primary font-black mt-0.5">
                          {res?.compositeScore || 0} / 100 PTS
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT JOB OFFER                                              */}
      {/* ========================================================================= */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5 max-w-2xl w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  [{editingOffer ? "EDITAR PUESTO" : "NUEVA OFERTA"}]
                </span>
                <h3 className="text-base font-black text-foreground">
                  {editingOffer ? editingOffer.title : "Añadir Oferta o Puesto de Trabajo"}
                </h3>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 font-black text-xs text-muted-foreground hover:text-foreground cursor-pointer uppercase"
              >
                Cerrar
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Título del Puesto *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Senior Frontend Developer"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-bold focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Acme Corp"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-bold focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Ubicación / Modalidad
                </label>
                <input
                  type="text"
                  placeholder="Ej. Madrid (Remoto 100%)"
                  value={offerLocation}
                  onChange={(e) => setOfferLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-bold focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Estado de la Oferta
                </label>
                <select
                  value={offerStatus}
                  onChange={(e) => setOfferStatus(e.target.value as OfferStatus)}
                  disabled={offerIsCurrent}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-bold focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="received">Oferta Recibida</option>
                  <option value="negotiating">En Negociación</option>
                  <option value="interviewing">En Proceso</option>
                  <option value="accepted">Oferta Aceptada</option>
                  <option value="discarded">Descartada</option>
                </select>
              </div>
            </div>

            {/* Current Position Checkbox */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block uppercase">
                  ¿Es tu puesto de trabajo actual?
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Se utilizará como base de comparación para calcular las ganancias relativas
                </span>
              </div>
              <input
                type="checkbox"
                checked={offerIsCurrent}
                onChange={(e) => setOfferIsCurrent(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Concept Values Inputs grouped by Category */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                [VALORES POR CONCEPTO PARA ESTE PUESTO]
              </h4>

              {groups.map((group) => {
                const groupConcepts = concepts.filter((c) => c.groupId === group.id);
                if (groupConcepts.length === 0) return null;

                return (
                  <div
                    key={group.id}
                    className="bg-muted/30 p-3 rounded-xl border border-border/60 space-y-2"
                  >
                    <span className="text-[10px] font-black uppercase text-primary block">
                      [{group.name}]
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {groupConcepts.map((concept) => (
                        <div key={concept.id} className="bg-card p-2.5 rounded-lg border border-border/60">
                          <label className="block font-bold text-foreground mb-1">
                            {concept.name}{" "}
                            <span className="text-[10px] text-muted-foreground">({concept.unit})</span>
                          </label>

                          {concept.unit === "BOOLEAN" ? (
                            <select
                              value={offerValues[concept.id] ? "true" : "false"}
                              onChange={(e) =>
                                setOfferValues({
                                  ...offerValues,
                                  [concept.id]: e.target.value === "true",
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background font-bold text-xs"
                            >
                              <option value="false">NO (No incluido)</option>
                              <option value="true">SÍ (Incluido)</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={offerValues[concept.id] !== undefined ? Number(offerValues[concept.id]) : ""}
                              onChange={(e) =>
                                setOfferValues({
                                  ...offerValues,
                                  [concept.id]: Number(e.target.value),
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-xs text-foreground focus:ring-1 focus:ring-primary"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="text-xs">
              <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                Notas / Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Añade detalles sobre el horario, equipo, impresiones..."
                value={offerNotes}
                onChange={(e) => setOfferNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-semibold focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOffer}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Guardar Puesto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CONCEPT                                                */}
      {/* ========================================================================= */}
      {showConceptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5 max-w-lg w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  [{editingConcept ? "EDITAR CRITERIO" : "NUEVO CRITERIO"}]
                </span>
                <h3 className="text-base font-black text-foreground">
                  {editingConcept ? editingConcept.name : "Añadir Concepto de Evaluación"}
                </h3>
              </div>
              <button
                onClick={() => setShowConceptModal(false)}
                className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 font-black text-xs text-muted-foreground hover:text-foreground cursor-pointer uppercase"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Nombre del Parámetro *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cheque Guardería"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Grupo de Categoría
                </label>
                <select
                  value={conceptGroupId}
                  onChange={(e) => setConceptGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground cursor-pointer"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  placeholder="Explicación del beneficio o criterio"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={conceptUnit}
                    onChange={(e) => setConceptUnit(e.target.value as UnitType)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground cursor-pointer"
                  >
                    <option value="EUR_YEAR">€/año</option>
                    <option value="EUR_MONTH">€/mes</option>
                    <option value="DAYS_YEAR">días/año</option>
                    <option value="DAYS_WEEK">días/semana</option>
                    <option value="MINUTES_DAY">minutos/día</option>
                    <option value="SCORE_10">Puntuación 1-10</option>
                    <option value="BOOLEAN">Sí / No</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                    Importancia (Peso 1-10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={conceptWeight}
                    onChange={(e) => setConceptWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                  />
                </div>
              </div>

              {/* Monetary Equivalency Value */}
              <div>
                <label className="block font-black text-foreground uppercase tracking-wider mb-1">
                  Valoración Económica Anual por Unidad (€)
                </label>
                <input
                  type="number"
                  placeholder="Ej. 1200 para seguro médico o 900€ por día de teletrabajo"
                  value={conceptMonetaryEquivalence}
                  onChange={(e) => setConceptMonetaryEquivalence(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Indica la cantidad en Euros al año que este beneficio te aporta o ahorra directamente.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowConceptModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConcept}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Guardar Criterio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
