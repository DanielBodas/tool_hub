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
  WorkModality,
} from "./types";
import {
  DEFAULT_GROUPS,
  DEFAULT_CONCEPTS,
  DEFAULT_OFFERS,
  evaluateJobOffers,
  calculateConceptMonetaryValue,
  calculateCommuteAnnualExpense,
} from "./initialData";

type ActiveTab = "comparison" | "all_offers" | "offers_crud" | "settings";
type FilterScope = "all" | "group" | "concept";

export function JobOfferEvaluatorModule() {
  const [groups, setGroups] = useState<ConceptGroup[]>(DEFAULT_GROUPS);
  const [concepts, setConcepts] = useState<Concept[]>(DEFAULT_CONCEPTS);
  const [offers, setOffers] = useState<JobOffer[]>(DEFAULT_OFFERS);

  const [activeTab, setActiveTab] = useState<ActiveTab>("comparison");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 2-Column Side-by-Side Selection State
  const [offerIdA, setOfferIdA] = useState<string>("");
  const [offerIdB, setOfferIdB] = useState<string>("");

  // Granular Filter State
  const [filterScope, setFilterScope] = useState<FilterScope>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedConceptId, setSelectedConceptId] = useState<string>("all");

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);

  const [offerTitle, setOfferTitle] = useState<string>("");
  const [offerCompany, setOfferCompany] = useState<string>("");
  const [offerLocation, setOfferLocation] = useState<string>("");
  const [offerWorkModality, setOfferWorkModality] = useState<WorkModality>("hibrido");
  const [offerOfficeDays, setOfferOfficeDays] = useState<number>(3);
  const [offerIsCurrent, setOfferIsCurrent] = useState<boolean>(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("received");
  const [offerValues, setOfferValues] = useState<Record<string, number | boolean>>({});
  const [offerConceptNotes, setOfferConceptNotes] = useState<Record<string, string>>({});

  // Commute Car Inputs
  const [offerCommuteKm, setOfferCommuteKm] = useState<number>(0);
  const [offerCommuteFuelL100, setOfferCommuteFuelL100] = useState<number>(6.5);
  const [offerFuelPriceEurL, setOfferFuelPriceEurL] = useState<number>(1.55);

  // Concept Modal State
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
  const [conceptName, setConceptName] = useState<string>("");
  const [conceptGroupId, setConceptGroupId] = useState<string>("g_direct");
  const [conceptDescription, setConceptDescription] = useState<string>("");
  const [conceptUnit, setConceptUnit] = useState<UnitType>("EUR_YEAR");
  const [conceptType, setConceptType] = useState<CalculationType>("monetary_direct");
  const [conceptWeight, setConceptWeight] = useState<number>(7);
  const [conceptMonetaryEquivalence, setConceptMonetaryEquivalence] = useState<number>(0);

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

  // Set default 2-column comparison selections when offers load
  useEffect(() => {
    if (offers.length > 0) {
      const current = offers.find((o) => o.isCurrent) || offers[0];
      const nonCurrent = offers.find((o) => o.id !== current.id) || offers[1] || offers[0];

      if (!offerIdA) setOfferIdA(current.id);
      if (!offerIdB) setOfferIdB(nonCurrent.id);
    }
  }, [offers, offerIdA, offerIdB]);

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

  const selectedOfferA = useMemo(() => {
    return offers.find((o) => o.id === offerIdA) || offers[0];
  }, [offers, offerIdA]);

  const selectedOfferB = useMemo(() => {
    return offers.find((o) => o.id === offerIdB) || offers[1] || offers[0];
  }, [offers, offerIdB]);

  const evalResultA = useMemo(() => {
    return evaluationResults.find((r) => r.offerId === offerIdA);
  }, [evaluationResults, offerIdA]);

  const evalResultB = useMemo(() => {
    return evaluationResults.find((r) => r.offerId === offerIdB);
  }, [evaluationResults, offerIdB]);

  // Commute cost computations
  const commuteCostA = useMemo(() => {
    return selectedOfferA ? calculateCommuteAnnualExpense(selectedOfferA) : 0;
  }, [selectedOfferA]);

  const commuteCostB = useMemo(() => {
    return selectedOfferB ? calculateCommuteAnnualExpense(selectedOfferB) : 0;
  }, [selectedOfferB]);

  // Filter concepts based on selection scope
  const filteredConcepts = useMemo(() => {
    if (filterScope === "group" && selectedGroupId !== "all") {
      return concepts.filter((c) => c.groupId === selectedGroupId);
    }
    if (filterScope === "concept" && selectedConceptId !== "all") {
      return concepts.filter((c) => c.id === selectedConceptId);
    }
    return concepts;
  }, [concepts, filterScope, selectedGroupId, selectedConceptId]);

  // Group concepts by ConceptGroup
  const groupedConcepts = useMemo(() => {
    const map = new Map<string, Concept[]>();
    groups.forEach((g) => map.set(g.id, []));
    filteredConcepts.forEach((c) => {
      const list = map.get(c.groupId) || [];
      list.push(c);
      map.set(c.groupId, list);
    });
    return Array.from(map.entries())
      .filter(([_, list]) => list.length > 0)
      .map(([groupId, list]) => ({
        group: groups.find((g) => g.id === groupId) || {
          id: groupId,
          name: "Otros",
          description: "",
          color: "gray",
        },
        concepts: list,
      }));
  }, [groups, filteredConcepts]);

  // Modality helper formatter
  const formatModalityText = (offer?: JobOffer) => {
    if (!offer) return "";
    const city = offer.location ? `${offer.location} • ` : "";
    if (offer.workModality === "remoto") return `${city}100% Remoto`;
    if (offer.workModality === "presencial") return `${city}100% Presencial (5d oficina)`;
    if (offer.workModality === "hibrido") {
      const office = offer.officeDaysPerWeek !== undefined ? offer.officeDaysPerWeek : 3;
      const remote = Math.max(0, 5 - office);
      return `${city}Híbrido (${office}d oficina / ${remote}d teletrabajo)`;
    }
    return offer.location || "";
  };

  // Handle Offer Modal
  const handleOpenOfferModal = (offerToEdit?: JobOffer) => {
    if (offerToEdit) {
      setEditingOffer(offerToEdit);
      setOfferTitle(offerToEdit.title);
      setOfferCompany(offerToEdit.company);
      setOfferLocation(offerToEdit.location || "");
      setOfferWorkModality(offerToEdit.workModality || "hibrido");
      setOfferOfficeDays(
        offerToEdit.officeDaysPerWeek !== undefined ? offerToEdit.officeDaysPerWeek : 3
      );
      setOfferIsCurrent(offerToEdit.isCurrent);
      setOfferStatus(offerToEdit.status);
      setOfferValues(offerToEdit.values || {});
      setOfferConceptNotes(offerToEdit.conceptNotes || {});
      setOfferCommuteKm(offerToEdit.commuteKmOneWay || 0);
      setOfferCommuteFuelL100(offerToEdit.commuteFuelL100 || 6.5);
      setOfferFuelPriceEurL(offerToEdit.fuelPriceEurL || 1.55);
    } else {
      setEditingOffer(null);
      setOfferTitle("");
      setOfferCompany("");
      setOfferLocation("Madrid");
      setOfferWorkModality("hibrido");
      setOfferOfficeDays(3);
      setOfferIsCurrent(offers.length === 0);
      setOfferStatus("received");
      const initialVals: Record<string, number | boolean> = {
        c_telework: 2,
      };
      concepts.forEach((c) => {
        if (initialVals[c.id] === undefined) {
          if (c.unit === "BOOLEAN") initialVals[c.id] = false;
          else if (c.unit === "SCORE_10") initialVals[c.id] = 5;
          else initialVals[c.id] = 0;
        }
      });
      setOfferValues(initialVals);
      setOfferConceptNotes({});
      setOfferCommuteKm(0);
      setOfferCommuteFuelL100(6.5);
      setOfferFuelPriceEurL(1.55);
    }
    setShowOfferModal(true);
  };

  const handleModalityChange = (modality: WorkModality) => {
    setOfferWorkModality(modality);
    let officeDays = 0;
    if (modality === "presencial") officeDays = 5;
    else if (modality === "hibrido") officeDays = offerOfficeDays || 3;
    else if (modality === "remoto") officeDays = 0;

    setOfferOfficeDays(officeDays);

    // Auto update c_telework value
    const teleworkDays = Math.max(0, 5 - officeDays);
    setOfferValues((prev) => ({
      ...prev,
      c_telework: teleworkDays,
    }));
  };

  const handleOfficeDaysChange = (days: number) => {
    setOfferOfficeDays(days);
    const teleworkDays = Math.max(0, 5 - days);
    setOfferValues((prev) => ({
      ...prev,
      c_telework: teleworkDays,
    }));
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

    const calculatedTelework =
      offerWorkModality === "remoto"
        ? 5
        : offerWorkModality === "presencial"
        ? 0
        : Math.max(0, 5 - offerOfficeDays);

    const finalValues = {
      ...offerValues,
      c_telework: calculatedTelework,
    };

    const offerId = editingOffer ? editingOffer.id : `offer_${Date.now()}`;
    const newOffer: JobOffer = {
      id: offerId,
      title: offerTitle,
      company: offerCompany,
      location: offerLocation,
      workModality: offerWorkModality,
      officeDaysPerWeek:
        offerWorkModality === "remoto"
          ? 0
          : offerWorkModality === "presencial"
          ? 5
          : offerOfficeDays,
      isCurrent: offerIsCurrent,
      status: offerIsCurrent ? "current" : offerStatus,
      values: finalValues,
      conceptNotes: offerConceptNotes,
      commuteKmOneWay: Number(offerCommuteKm),
      commuteFuelL100: Number(offerCommuteFuelL100),
      fuelPriceEurL: Number(offerFuelPriceEurL),
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

  // Live estimated commute cost in modal
  const liveCommuteCost = useMemo(() => {
    const tempOffer: JobOffer = {
      id: "temp",
      title: "",
      company: "",
      location: offerLocation,
      workModality: offerWorkModality,
      officeDaysPerWeek:
        offerWorkModality === "remoto"
          ? 0
          : offerWorkModality === "presencial"
          ? 5
          : offerOfficeDays,
      isCurrent: false,
      status: "received",
      values: offerValues,
      commuteKmOneWay: Number(offerCommuteKm),
      commuteFuelL100: Number(offerCommuteFuelL100),
      fuelPriceEurL: Number(offerFuelPriceEurL),
    };
    return calculateCommuteAnnualExpense(tempOffer);
  }, [
    offerLocation,
    offerWorkModality,
    offerOfficeDays,
    offerValues,
    offerCommuteKm,
    offerCommuteFuelL100,
    offerFuelPriceEurL,
  ]);

  // Concept Modal Handlers
  const handleOpenConceptModal = (conceptToEdit?: Concept) => {
    if (conceptToEdit) {
      setEditingConcept(conceptToEdit);
      setConceptName(conceptToEdit.name);
      setConceptGroupId(conceptToEdit.groupId);
      setConceptDescription(conceptToEdit.description);
      setConceptUnit(conceptToEdit.unit);
      setConceptType(conceptToEdit.type);
      setConceptWeight(conceptToEdit.weight);
      setConceptMonetaryEquivalence(conceptToEdit.monetaryEquivalencePerUnit || 0);
    } else {
      setEditingConcept(null);
      setConceptName("");
      setConceptGroupId(groups[0]?.id || "g_direct");
      setConceptDescription("");
      setConceptUnit("EUR_YEAR");
      setConceptType("monetary_direct");
      setConceptWeight(7);
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
      isPositive: true,
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
    if (confirm("¿Eliminar este concepto de la lista de evaluación?")) {
      const updatedConcepts = concepts.filter((c) => c.id !== id);
      saveData(offers, updatedConcepts, groups);
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
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* -------------------- SIMPLE CLEAN HEADER -------------------- */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
            EVALUADOR DE PUESTOS Y OFERTAS DE EMPLEO
          </span>
          <h1 className="text-lg font-black text-foreground tracking-tight">
            Análisis y Comparativa de Empleo
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

      {/* -------------------- MAIN NAVIGATION TABS -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-muted/60 p-1 rounded-2xl border border-border">
        <button
          onClick={() => setActiveTab("comparison")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "comparison"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          1. Comparar 2 Puestos
        </button>

        <button
          onClick={() => setActiveTab("all_offers")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "all_offers"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          2. Visión General ({offers.length})
        </button>

        <button
          onClick={() => setActiveTab("offers_crud")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "offers_crud"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          3. Gestionar Ofertas
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
            activeTab === "settings"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          4. Conceptos y Pesos ({concepts.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 2-COLUMN SIDE-BY-SIDE MINUTIOUS COMPARISON VIEW                     */}
      {/* ========================================================================= */}
      {activeTab === "comparison" && (
        <div className="space-y-4">
          {/* CONTROLS BAR: POSITION SELECTORS & FILTER SCOPES */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-border">
              {/* Position A Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Puesto #1 (Columna Izquierda / Base):
                </label>
                <select
                  value={offerIdA}
                  onChange={(e) => setOfferIdA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-black text-xs text-foreground cursor-pointer"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.isCurrent ? "[ACTUAL] " : ""}
                      {o.title} — {o.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position B Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1">
                  Puesto #2 (Columna Derecha / A Comparar):
                </label>
                <select
                  value={offerIdB}
                  onChange={(e) => setOfferIdB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-black text-xs text-foreground cursor-pointer"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.isCurrent ? "[ACTUAL] " : ""}
                      {o.title} — {o.company}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Granular Filtering Control Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-muted-foreground uppercase text-[10px]">
                  Filtrar Comparativa:
                </span>
                <div className="flex bg-muted p-0.5 rounded-xl border border-border">
                  <button
                    onClick={() => {
                      setFilterScope("all");
                      setSelectedGroupId("all");
                      setSelectedConceptId("all");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black uppercase text-[10px] transition cursor-pointer ${
                      filterScope === "all"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    Todos
                  </button>

                  <button
                    onClick={() => {
                      setFilterScope("group");
                      if (selectedGroupId === "all") setSelectedGroupId(groups[0]?.id || "all");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black uppercase text-[10px] transition cursor-pointer ${
                      filterScope === "group"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    Por Grupo
                  </button>

                  <button
                    onClick={() => {
                      setFilterScope("concept");
                      if (selectedConceptId === "all") setSelectedConceptId(concepts[0]?.id || "all");
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black uppercase text-[10px] transition cursor-pointer ${
                      filterScope === "concept"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    Por Concepto
                  </button>
                </div>
              </div>

              {/* Dynamic Filter Dropdown */}
              {filterScope === "group" && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase">Grupo:</span>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-border bg-background font-bold text-xs"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {filterScope === "concept" && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase">Concepto:</span>
                  <select
                    value={selectedConceptId}
                    onChange={(e) => setSelectedConceptId(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-border bg-background font-bold text-xs"
                  >
                    {concepts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* TOP COMPARISON SUMMARY HEADER CARDS (2 COLUMNS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position 1 Summary */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded-md border border-border">
                  {selectedOfferA?.isCurrent ? "[PUESTO ACTUAL]" : "[PUESTO #1]"}
                </span>
                <span className="text-xs font-black text-primary">
                  {evalResultA?.compositeScore || 0} / 100 PTS
                </span>
              </div>
              <div>
                <h2 className="text-base font-black text-foreground">{selectedOfferA?.title}</h2>
                <p className="text-xs font-bold text-muted-foreground">
                  {selectedOfferA?.company} • {formatModalityText(selectedOfferA)}
                </p>
              </div>

              <div className="bg-muted/40 p-2.5 rounded-xl border border-border text-center">
                <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                  Valor Percibido Anual Neto
                </span>
                <span className="text-xl font-black text-foreground">
                  {formatCurrency(evalResultA?.totalMonetaryValue || 0)}/año
                </span>
              </div>
            </div>

            {/* Position 2 Summary */}
            <div className="bg-card rounded-2xl border border-primary/50 ring-1 ring-primary/20 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-primary text-primary-foreground rounded-md">
                  {selectedOfferB?.isCurrent ? "[PUESTO ACTUAL]" : "[PUESTO #2]"}
                </span>
                <span className="text-xs font-black text-primary">
                  {evalResultB?.compositeScore || 0} / 100 PTS
                </span>
              </div>
              <div>
                <h2 className="text-base font-black text-foreground">{selectedOfferB?.title}</h2>
                <p className="text-xs font-bold text-muted-foreground">
                  {selectedOfferB?.company} • {formatModalityText(selectedOfferB)}
                </p>
              </div>

              <div className="bg-muted/40 p-2.5 rounded-xl border border-border text-center">
                <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                  Valor Percibido Anual Neto
                </span>
                <span className="text-xl font-black text-foreground">
                  {formatCurrency(evalResultB?.totalMonetaryValue || 0)}/año
                </span>

                {/* Net Delta position B vs position A */}
                {evalResultA && evalResultB && (
                  <div className="mt-1">
                    {(() => {
                      const delta = evalResultB.totalMonetaryValue - evalResultA.totalMonetaryValue;
                      const pct = evalResultA.totalMonetaryValue > 0
                        ? Math.round((delta / evalResultA.totalMonetaryValue) * 100)
                        : 0;
                      return (
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                            delta >= 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          Diferencia vs Puesto #1: {delta >= 0 ? "+" : ""}{formatCurrency(delta)}/año ({pct >= 0 ? "+" : ""}{pct}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED CONCEPT-BY-CONCEPT COMPARISON (ROW BY ROW) */}
          <div className="space-y-4">
            {groupedConcepts.map(({ group, concepts: groupConcepts }) => (
              <div key={group.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Group Section Header */}
                <div className="bg-muted/60 px-4 py-2.5 border-b border-border flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    {group.name}
                  </h3>
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                    {groupConcepts.length} Concepto(s)
                  </span>
                </div>

                {/* Concept Rows */}
                <div className="divide-y divide-border/60">
                  {groupConcepts.map((concept) => {
                    const valA = selectedOfferA?.values[concept.id];
                    const noteA = selectedOfferA?.conceptNotes?.[concept.id];
                    const monA = calculateConceptMonetaryValue(concept, valA);

                    const valB = selectedOfferB?.values[concept.id];
                    const noteB = selectedOfferB?.conceptNotes?.[concept.id];
                    const monB = calculateConceptMonetaryValue(concept, valB);

                    const diffMon = monB - monA;

                    return (
                      <div key={concept.id} className="p-4 space-y-3">
                        {/* Concept Title & Weight Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-foreground">
                              {concept.name}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded-md border border-border">
                              Peso: {concept.weight}/10
                            </span>
                          </div>

                          {concept.description && (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {concept.description}
                            </span>
                          )}
                        </div>

                        {/* 2-COLUMN SIDE BY SIDE DATA FOR THIS CONCEPT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Column 1 Data */}
                          <div className="bg-muted/30 rounded-xl p-3 border border-border space-y-1">
                            <div className="text-[9px] font-extrabold uppercase text-muted-foreground">
                              {selectedOfferA?.title}:
                            </div>
                            <div className="flex justify-between items-center font-black text-foreground">
                              <span>Valor:</span>
                              <span>{formatValue(concept, valA)}</span>
                            </div>
                            {monA > 0 && concept.unit !== "EUR_YEAR" && (
                              <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                <span>Aporte Percibido:</span>
                                <span>+{formatCurrency(monA)}/año</span>
                              </div>
                            )}
                            {noteA && (
                              <p className="text-[10px] font-normal text-muted-foreground italic bg-background/60 p-1.5 rounded-md border border-border/40 mt-1">
                                "{noteA}"
                              </p>
                            )}
                          </div>

                          {/* Column 2 Data */}
                          <div className="bg-muted/30 rounded-xl p-3 border border-border space-y-1">
                            <div className="text-[9px] font-extrabold uppercase text-muted-foreground">
                              {selectedOfferB?.title}:
                            </div>
                            <div className="flex justify-between items-center font-black text-foreground">
                              <span>Valor:</span>
                              <span>{formatValue(concept, valB)}</span>
                            </div>
                            {monB > 0 && concept.unit !== "EUR_YEAR" && (
                              <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                <span>Aporte Percibido:</span>
                                <span>+{formatCurrency(monB)}/año</span>
                              </div>
                            )}
                            {noteB && (
                              <p className="text-[10px] font-normal text-muted-foreground italic bg-background/60 p-1.5 rounded-md border border-border/40 mt-1">
                                "{noteB}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Delta / Difference row */}
                        {diffMon !== 0 && concept.unit !== "EUR_YEAR" && (
                          <div className="text-right text-[11px] font-black">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                diffMon > 0
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              Diferencia en {concept.name}: {diffMon > 0 ? "+" : ""}{formatCurrency(diffMon)}/año a favor de {diffMon > 0 ? selectedOfferB?.title : selectedOfferA?.title}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Commute Car Expense Comparison Item */}
            {(commuteCostA > 0 || commuteCostB > 0) && (
              <div className="bg-card rounded-2xl border border-rose-500/30 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="text-xs font-black uppercase text-rose-600 dark:text-rose-400">
                    Desplazamiento en Coche (Gasto Anual de Combustible)
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Gasto Deducido
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 space-y-1">
                    <div className="font-extrabold uppercase text-[9px] text-muted-foreground">
                      {selectedOfferA?.title}:
                    </div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(commuteCostA)}/año
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">
                      {selectedOfferA?.commuteKmOneWay} km ida • {selectedOfferA?.commuteFuelL100} L/100km @ {selectedOfferA?.fuelPriceEurL} €/L
                    </span>
                  </div>

                  <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 space-y-1">
                    <div className="font-extrabold uppercase text-[9px] text-muted-foreground">
                      {selectedOfferB?.title}:
                    </div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(commuteCostB)}/año
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">
                      {selectedOfferB?.commuteKmOneWay} km ida • {selectedOfferB?.commuteFuelL100} L/100km @ {selectedOfferB?.fuelPriceEurL} €/L
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OVERVIEW CARDS FOR ALL OFFERS                                      */}
      {/* ========================================================================= */}
      {activeTab === "all_offers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluationResults.map((result) => {
            const offerObj = offers.find((o) => o.id === result.offerId);
            const isCurrent = result.isCurrent;
            const isWinner = result.rank === 1 && !isCurrent;
            const commuteCost = offerObj ? calculateCommuteAnnualExpense(offerObj) : 0;

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
                        ? "[PUESTO ACTUAL - BASE]"
                        : isWinner
                        ? "[RECOMENDADO #1]"
                        : `[OFERTA #${result.rank}]`}
                    </span>

                    <span className="text-xs font-black text-primary">
                      {result.compositeScore} / 100 PTS
                    </span>
                  </div>

                  <h3 className="text-base font-black text-foreground truncate">
                    {result.offerTitle}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground truncate mb-3">
                    {result.company} • {formatModalityText(offerObj)}
                  </p>

                  <div className="bg-muted/40 rounded-xl p-3 border border-border/60 mb-3 text-center">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase block">
                      Valor Percibido Total
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

                  <div className="space-y-1 text-xs">
                    {concepts.slice(0, 5).map((concept) => {
                      const val = offerObj?.values[concept.id];
                      return (
                        <div key={concept.id} className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground font-semibold truncate pr-2">{concept.name}</span>
                          <span className="font-bold text-foreground">{formatValue(concept, val)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                  <button
                    onClick={() => {
                      setOfferIdB(result.offerId);
                      setActiveTab("comparison");
                    }}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer uppercase"
                  >
                    Comparar en 2 Columnas
                  </button>
                  <button
                    onClick={() => handleOpenOfferModal(offerObj)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer uppercase"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFERS MANAGEMENT                                                 */}
      {/* ========================================================================= */}
      {activeTab === "offers_crud" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-black uppercase text-foreground">
                Gestión de Puestos y Ofertas
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Añade o edita los parámetros, desplazamiento en coche y justificaciones
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
                        [PUESTO ACTUAL BASE]
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {offer.company} • {formatModalityText(offer)}
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
      {/* TAB 4: WEIGHTS & CONCEPT SETTINGS                                        */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-black uppercase text-foreground">
                Ajuste de Criterios y Conceptos de Medición
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Crea o modifica los conceptos con los que quieres evaluar todos tus puestos
              </p>
            </div>
            <button
              onClick={() => handleOpenConceptModal()}
              className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover transition cursor-pointer uppercase"
            >
              + Nuevo Concepto
            </button>
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

                  <div className="pt-2 sm:pt-0 flex gap-1">
                    <button
                      onClick={() => handleOpenConceptModal(concept)}
                      className="px-2 py-1 bg-card hover:bg-muted text-foreground font-extrabold rounded-lg border border-border text-[10px] uppercase cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteConcept(concept.id)}
                      className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold rounded-lg border border-rose-500/20 text-[10px] uppercase cursor-pointer"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / ADD OFFER WITH CAR COMMUTE CALCULATOR                       */}
      {/* ========================================================================= */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5 max-w-2xl w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">
                {editingOffer ? "Editar Datos del Puesto" : "Nueva Oferta de Empleo"}
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
                  Ciudad / Sede
                </label>
                <input
                  type="text"
                  placeholder="Ej. Madrid, Barcelona..."
                  value={offerLocation}
                  onChange={(e) => setOfferLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Modalidad de Trabajo *
                </label>
                <select
                  value={offerWorkModality}
                  onChange={(e) => handleModalityChange(e.target.value as WorkModality)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground cursor-pointer"
                >
                  <option value="presencial">100% Presencial (5d oficina)</option>
                  <option value="hibrido">Híbrido (Oficina + Teletrabajo)</option>
                  <option value="remoto">100% Remoto (0d oficina)</option>
                </select>
              </div>

              {/* Hybrid Days Selector */}
              {offerWorkModality === "hibrido" && (
                <div className="sm:col-span-2 bg-muted/30 p-3 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-black text-foreground uppercase text-xs mb-0.5">
                      Días de Oficina a la Semana:
                    </label>
                    <span className="text-[10px] text-muted-foreground font-semibold block">
                      Determina los viajes presenciales y auto-calcula los días de teletrabajo.
                    </span>
                  </div>

                  <select
                    value={offerOfficeDays}
                    onChange={(e) => handleOfficeDaysChange(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background font-black text-foreground cursor-pointer text-xs shrink-0"
                  >
                    <option value={1}>1 día oficina / 4 días teletrabajo</option>
                    <option value={2}>2 días oficina / 3 días teletrabajo</option>
                    <option value={3}>3 días oficina / 2 días teletrabajo</option>
                    <option value={4}>4 días oficina / 1 día teletrabajo</option>
                  </select>
                </div>
              )}

              <div className="sm:col-span-2 flex items-center pt-2">
                <label className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerIsCurrent}
                    onChange={(e) => setOfferIsCurrent(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  ¿Es tu puesto de trabajo actual? (Punto de partida)
                </label>
              </div>
            </div>

            {/* DEDICATED CAR COMMUTE CALCULATOR SECTION */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-black uppercase text-foreground text-xs">
                  Cálculo de Desplazamiento en Coche (Gasolina / Diésel):
                </h4>
                {liveCommuteCost > 0 && (
                  <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                    Gasto Combustible: -{formatCurrency(liveCommuteCost)}/año
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-0.5">
                    Distancia Ida (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={offerCommuteKm}
                    onChange={(e) => setOfferCommuteKm(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-0.5">
                    Consumo (L/100km)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    value={offerCommuteFuelL100}
                    onChange={(e) => setOfferCommuteFuelL100(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-0.5">
                    Precio Combustible (€/L)
                  </label>
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    value={offerFuelPriceEurL}
                    onChange={(e) => setOfferFuelPriceEurL(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Concept Values & Per-Concept Justification Notes */}
            <div className="pt-2 border-t border-border space-y-3">
              <h4 className="font-black uppercase text-foreground">
                Valores y Justificación por Concepto:
              </h4>

              <div className="space-y-2">
                {concepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="bg-muted/30 p-3 rounded-xl border border-border space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-foreground">
                        {concept.name}{" "}
                        <span className="text-[10px] text-muted-foreground">
                          ({concept.unit})
                        </span>
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
                          className="px-2 py-1 rounded-lg border border-border bg-background font-bold"
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
                          className="w-36 px-2.5 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-right"
                        />
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Añade una justificación o detalle sobre este valor..."
                        value={offerConceptNotes[concept.id] || ""}
                        onChange={(e) =>
                          setOfferConceptNotes({
                            ...offerConceptNotes,
                            [concept.id]: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1 rounded-lg border border-border/60 bg-background/80 font-normal text-[11px] text-foreground"
                      />
                    </div>
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
          <div className="bg-card rounded-2xl border border-border p-5 max-w-lg w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">
                {editingConcept ? "Editar Concepto" : "Nuevo Concepto de Evaluación"}
              </h3>
              <button
                onClick={() => setShowConceptModal(false)}
                className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-black cursor-pointer uppercase"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Nombre del Concepto *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cheque Guardería / Tarjeta Transportes"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Explicación del concepto"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-foreground uppercase mb-1">
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
                  <label className="block font-black text-foreground uppercase mb-1">
                    Peso (Importancia 1-10)
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

              {conceptUnit !== "EUR_YEAR" && (
                <div>
                  <label className="block font-black text-foreground uppercase mb-1">
                    Valoración Anual Equivalente (€)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 1200 por seguro médico o 900€ por día de teletrabajo"
                    value={conceptMonetaryEquivalence}
                    onChange={(e) => setConceptMonetaryEquivalence(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowConceptModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold cursor-pointer uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConcept}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black cursor-pointer uppercase"
              >
                Guardar Concepto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
