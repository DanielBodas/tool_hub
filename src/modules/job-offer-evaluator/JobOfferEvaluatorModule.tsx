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
} from "./initialData";

type ActiveTab = "comparison" | "offers" | "settings";

export function JobOfferEvaluatorModule() {
  const [groups, setGroups] = useState<ConceptGroup[]>(DEFAULT_GROUPS);
  const [concepts, setConcepts] = useState<Concept[]>(DEFAULT_CONCEPTS);
  const [offers, setOffers] = useState<JobOffer[]>(DEFAULT_OFFERS);

  const [activeTab, setActiveTab] = useState<ActiveTab>("comparison");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);

  const [offerTitle, setOfferTitle] = useState<string>("");
  const [offerCompany, setOfferCompany] = useState<string>("");
  const [offerLocation, setOfferLocation] = useState<string>("");
  const [offerIsCurrent, setOfferIsCurrent] = useState<boolean>(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("received");
  const [offerValues, setOfferValues] = useState<Record<string, number | boolean>>({});

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const hasLocalData = loadFromLocalStorage();
      try {
        const res = await fetch("/api/job-offer-evaluator");
        if (res.ok) {
          const data = await res.json();
          if (!data.isFallback && data.offers && data.offers.length > 0) {
            setOffers(data.offers);
            if (data.concepts) setConcepts(data.concepts);
            if (data.groups) setGroups(data.groups);
          } else if (!hasLocalData) {
            if (data.offers) setOffers(data.offers);
            if (data.concepts) setConcepts(data.concepts);
            if (data.groups) setGroups(data.groups);
          }
        }
      } catch {
        // Fallback to local storage
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
      // ignore
    }
    return false;
  }

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

      if (res.ok) setStatusMessage("Guardado");
      else setStatusMessage("Guardado local");
    } catch {
      setStatusMessage("Guardado local");
    } finally {
      setTimeout(() => setStatusMessage(""), 2000);
    }
  };

  const evaluationResults = useMemo(() => {
    return evaluateJobOffers(offers, concepts, groups);
  }, [offers, concepts, groups]);

  const currentOffer = useMemo(() => {
    return offers.find((o) => o.isCurrent) || offers[0];
  }, [offers]);

  const currentEval = useMemo(() => {
    return evaluationResults.find((r) => r.isCurrent) || evaluationResults[0];
  }, [evaluationResults]);

  // Handle Offer Modal
  const handleOpenOfferModal = (offerToEdit?: JobOffer) => {
    if (offerToEdit) {
      setEditingOffer(offerToEdit);
      setOfferTitle(offerToEdit.title);
      setOfferCompany(offerToEdit.company);
      setOfferLocation(offerToEdit.location);
      setOfferIsCurrent(offerToEdit.isCurrent);
      setOfferStatus(offerToEdit.status);
      setOfferValues(offerToEdit.values || {});
    } else {
      setEditingOffer(null);
      setOfferTitle("");
      setOfferCompany("");
      setOfferLocation("");
      setOfferIsCurrent(offers.length === 0);
      setOfferStatus("received");
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
      alert("Introduce el título del puesto y el nombre de la empresa.");
      return;
    }

    let updatedOffers = [...offers];

    if (offerIsCurrent) {
      updatedOffers = updatedOffers.map((o) => ({
        ...o,
        isCurrent: false,
        status: o.status === "current" ? ("received" as OfferStatus) : o.status,
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
    if (confirm("¿Eliminar esta oferta?")) {
      const updated = offers.filter((o) => o.id !== id);
      saveData(updated, concepts, groups);
    }
  };

  const handleConceptWeightChange = (conceptId: string, newWeight: number) => {
    const updatedConcepts = concepts.map((c) =>
      c.id === conceptId ? { ...c, weight: newWeight } : c
    );
    saveData(offers, updatedConcepts, groups);
  };

  const handleConceptEquivalenceChange = (conceptId: string, newEq: number) => {
    const updatedConcepts = concepts.map((c) =>
      c.id === conceptId ? { ...c, monetaryEquivalencePerUnit: newEq } : c
    );
    saveData(offers, updatedConcepts, groups);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatValue = (concept: Concept, rawVal: number | boolean | undefined) => {
    if (rawVal === undefined || rawVal === null) return "-";
    if (concept.unit === "BOOLEAN") return rawVal ? "SÍ" : "NO";
    const num = Number(rawVal);
    switch (concept.unit) {
      case "EUR_YEAR":
        return `${formatCurrency(num)}/año`;
      case "EUR_MONTH":
        return `${formatCurrency(num)}/mes`;
      case "DAYS_YEAR":
        return `${num} días/año`;
      case "DAYS_WEEK":
        return `${num} días/sem`;
      case "MINUTES_DAY":
        return `${num} min/día`;
      case "SCORE_10":
        return `${num}/10`;
      default:
        return `${num}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs font-black uppercase text-muted-foreground tracking-widest">
          Cargando evaluador...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* -------------------- SIMPLE CLEAN HEADER -------------------- */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-2xs flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
            COMPARADOR DE EMPLEO
          </span>
          <h1 className="text-lg font-black text-foreground tracking-tight">
            Valoración de Ofertas de Trabajo
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              {statusMessage}
            </span>
          )}
          <button
            onClick={() => handleOpenOfferModal()}
            className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover transition cursor-pointer uppercase tracking-wider"
          >
            + Nueva Oferta
          </button>
        </div>
      </div>

      {/* -------------------- TOP SIMPLE NAVIGATION TABS -------------------- */}
      <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab("comparison")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "comparison"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          1. Comparativa ({offers.length})
        </button>

        <button
          onClick={() => setActiveTab("offers")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "offers"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          2. Gestionar Ofertas
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "settings"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          3. Ajuste de Pesos
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STREAMLINED COMPARISON VIEW                                        */}
      {/* ========================================================================= */}
      {activeTab === "comparison" && (
        <div className="space-y-4">
          {/* Main Offers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluationResults.map((result) => {
              const offerObj = offers.find((o) => o.id === result.offerId);
              const isCurrent = result.isCurrent;
              const isWinner = result.rank === 1 && !isCurrent;

              return (
                <div
                  key={result.offerId}
                  className={`bg-card rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                    isWinner
                      ? "border-primary/60 ring-2 ring-primary/20"
                      : isCurrent
                      ? "border-emerald-500/50"
                      : "border-border"
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : isWinner
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isCurrent
                          ? "[PUESTO ACTUAL]"
                          : isWinner
                          ? "[RECOMENDADO #1]"
                          : `[OFERTA #${result.rank}]`}
                      </span>

                      <span className="text-xs font-black text-primary">
                        {result.compositeScore} / 100 PTS
                      </span>
                    </div>

                    {/* Offer Title & Company */}
                    <h3 className="text-base font-black text-foreground truncate">
                      {result.offerTitle}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground truncate mb-3">
                      {result.company} {offerObj?.location ? `• ${offerObj.location}` : ""}
                    </p>

                    {/* KEY FINANCIAL HIGHLIGHT */}
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/60 mb-3 text-center">
                      <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                        Valor Percibido Total (Salario + Beneficios)
                      </span>
                      <div className="text-xl font-black text-foreground mt-0.5">
                        {formatCurrency(result.totalMonetaryValue)}
                        <span className="text-xs font-bold text-muted-foreground">/año</span>
                      </div>

                      {!isCurrent && (
                        <div
                          className={`mt-1.5 text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                            result.deltaMonetaryVsCurrent >= 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {result.deltaMonetaryVsCurrent >= 0 ? "+" : ""}
                          {formatCurrency(result.deltaMonetaryVsCurrent)}/año ({result.deltaPercentVsCurrent > 0 ? "+" : ""}
                          {result.deltaPercentVsCurrent}%)
                        </div>
                      )}
                    </div>

                    {/* Key Values List */}
                    <div className="space-y-1.5 text-xs">
                      {concepts.slice(0, 6).map((concept) => {
                        const val = offerObj?.values[concept.id];
                        const monVal = calculateConceptMonetaryValue(concept, val);

                        return (
                          <div
                            key={concept.id}
                            className="flex justify-between items-center py-1 border-b border-border/40"
                          >
                            <span className="font-bold text-muted-foreground truncate pr-2">
                              {concept.name}
                            </span>
                            <div className="text-right shrink-0">
                              <span className="font-black text-foreground">
                                {formatValue(concept, val)}
                              </span>
                              {monVal > 0 && concept.unit !== "EUR_YEAR" && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                  +{formatCurrency(monVal)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 mt-3 border-t border-border/60 flex justify-between items-center">
                    <button
                      onClick={() => handleOpenOfferModal(offerObj)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer uppercase"
                    >
                      Editar Datos
                    </button>
                    {offerObj?.isCurrent ? (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                        Puesto Base
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteOffer(result.offerId)}
                        className="text-xs font-bold text-rose-500 hover:underline cursor-pointer uppercase"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OFFERS MANAGEMENT                                                 */}
      {/* ========================================================================= */}
      {activeTab === "offers" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-black uppercase text-foreground">
                Gestión de Puestos y Ofertas
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Añade o edita los parámetros de cada oferta laboral
              </p>
            </div>
            <button
              onClick={() => handleOpenOfferModal()}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover transition cursor-pointer uppercase"
            >
              + Nueva Oferta
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-foreground">{offer.title}</h3>
                    {offer.isCurrent && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/30">
                        [PUESTO ACTUAL]
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {offer.company} • {offer.location || "Sin ubicación"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenOfferModal(offer)}
                    className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-black hover:bg-muted/80 border border-border cursor-pointer uppercase"
                  >
                    Editar
                  </button>
                  {!offer.isCurrent && (
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-black hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer uppercase"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEIGHTS & MONETIZATION SETTINGS                                   */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-black uppercase text-foreground">
              Ajuste de Criterios y Valoración (€)
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Configura cuántos Euros al año te aporta cada beneficio y qué importancia tiene (1 a 10)
            </p>
          </div>

          <div className="space-y-3">
            {concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-muted/30 rounded-xl p-3 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="max-w-md">
                  <h4 className="font-black text-foreground">{concept.name}</h4>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    {concept.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {/* Monetary equivalency adjust */}
                  {concept.unit !== "EUR_YEAR" && (
                    <div>
                      <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                        Valor Anual (€/unidad)
                      </label>
                      <input
                        type="number"
                        value={concept.monetaryEquivalencePerUnit || 0}
                        onChange={(e) =>
                          handleConceptEquivalenceChange(concept.id, Number(e.target.value))
                        }
                        className="w-28 px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-xs"
                      />
                    </div>
                  )}

                  {/* Weight adjust */}
                  <div>
                    <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                      Peso (1 a 10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={concept.weight}
                      onChange={(e) =>
                        handleConceptWeightChange(concept.id, Number(e.target.value))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / ADD OFFER                                                  */}
      {/* ========================================================================= */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5 max-w-xl w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">
                {editingOffer ? "Editar Oferta" : "Nueva Oferta"}
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-black cursor-pointer uppercase"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Título del Puesto *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Software Engineer"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tech Company"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Ubicación / Modalidad
                </label>
                <input
                  type="text"
                  placeholder="Ej. Madrid (Remoto)"
                  value={offerLocation}
                  onChange={(e) => setOfferLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerIsCurrent}
                    onChange={(e) => setOfferIsCurrent(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  ¿Es tu puesto de trabajo actual?
                </label>
              </div>
            </div>

            {/* Concept Values */}
            <div className="pt-2 border-t border-border space-y-2">
              <h4 className="font-black uppercase text-foreground">Valores de la Oferta:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {concepts.map((concept) => (
                  <div key={concept.id} className="bg-muted/30 p-2 rounded-xl border border-border">
                    <label className="block font-bold text-foreground mb-1">
                      {concept.name} <span className="text-[10px] text-muted-foreground">({concept.unit})</span>
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
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background font-bold"
                      >
                        <option value="false">NO (No incluido)</option>
                        <option value="true">SÍ (Incluido)</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={
                          offerValues[concept.id] !== undefined
                            ? Number(offerValues[concept.id])
                            : ""
                        }
                        onChange={(e) =>
                          setOfferValues({
                            ...offerValues,
                            [concept.id]: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold cursor-pointer uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOffer}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black cursor-pointer uppercase"
              >
                Guardar Oferta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
