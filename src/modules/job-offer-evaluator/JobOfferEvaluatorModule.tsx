"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ConceptGroup,
  Concept,
  JobOffer,
  EvaluationResult,
  UnitType,
  ConceptCategory,
  ConceptCalculationType,
  OfferStatus,
  WorkModality,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
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
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  const [activeTab, setActiveTab] = useState<ActiveTab>("all_offers");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Side-by-Side Selection State for Comparator View
  const [offerIdA, setOfferIdA] = useState<string>("");
  const [offerIdB, setOfferIdB] = useState<string>("");
  const [showPickerA, setShowPickerA] = useState<boolean>(false);
  const [showPickerB, setShowPickerB] = useState<boolean>(false);

  // Granular Filter State
  const [filterScope, setFilterScope] = useState<FilterScope>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedConceptId, setSelectedConceptId] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [collapsedSettingsGroups, setCollapsedSettingsGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const isCurrentlyCollapsed = prev[groupId] !== false;
      return {
        ...prev,
        [groupId]: !isCurrentlyCollapsed,
      };
    });
  };

  const toggleSettingsGroupCollapse = (groupId: string) => {
    setCollapsedSettingsGroups((prev) => {
      const isCurrentlyCollapsed = prev[groupId] !== false;
      return {
        ...prev,
        [groupId]: !isCurrentlyCollapsed,
      };
    });
  };

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

  // Commute Fuel Inputs
  const [offerCommuteKm, setOfferCommuteKm] = useState<number>(0);
  const [offerCommuteFuelL100, setOfferCommuteFuelL100] = useState<number>(6.5);
  const [offerFuelPriceEurL, setOfferFuelPriceEurL] = useState<number>(1.55);

  // Concept Modal State
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
  const [conceptName, setConceptName] = useState<string>("");
  const [conceptGroupId, setConceptGroupId] = useState<string>("g_direct");
  const [conceptDescription, setConceptDescription] = useState<string>("");
  const [conceptCategory, setConceptCategory] = useState<ConceptCategory>("subjective");
  const [conceptCalcType, setConceptCalcType] = useState<ConceptCalculationType>("subjective_score");
  const [conceptUnit, setConceptUnit] = useState<UnitType>("SCORE_10");
  const [conceptMaxVal, setConceptMaxVal] = useState<number>(5000);
  const [conceptIsPositive, setConceptIsPositive] = useState<boolean>(true);

  // Group Modal State
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<ConceptGroup | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [groupDescription, setGroupDescription] = useState<string>("");
  const [groupColor, setGroupColor] = useState<string>("emerald");

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
            if (data.userPrefs) setUserPrefs(data.userPrefs);
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
          if (parsed.userPrefs) setUserPrefs(parsed.userPrefs);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  // Set default comparison selections when offers load
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
    updatedGroups: ConceptGroup[],
    updatedUserPrefs: UserPreferences = userPrefs
  ) => {
    setOffers(updatedOffers);
    setConcepts(updatedConcepts);
    setGroups(updatedGroups);
    setUserPrefs(updatedUserPrefs);

    try {
      localStorage.setItem(
        "job_offers_data",
        JSON.stringify({
          offers: updatedOffers,
          concepts: updatedConcepts,
          groups: updatedGroups,
          userPrefs: updatedUserPrefs,
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
          userPrefs: updatedUserPrefs,
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
    return evaluateJobOffers(offers, concepts, groups, userPrefs);
  }, [offers, concepts, groups, userPrefs]);

  const currentSituationOffer = useMemo(() => {
    return offers.find((o) => o.isCurrent) || offers[0];
  }, [offers]);

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

  const evalResultCurrent = useMemo(() => {
    return evaluationResults.find((r) => r.isCurrent);
  }, [evaluationResults]);

  // Commute fuel cost computations
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

  // Offer Modal Handlers
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
        c_salary_base: 70000,
        c_bonus_annual: 10000,
        c_bonus_annual_prob: 70,
        c_telework: 3,
        c_vacation: 27,
        c_commute: 60,
        c_health: true,
        c_health_user_val: 1000,
        c_pension: 2000,
        c_growth: 8,
        c_manager: 7,
        c_culture: 5,
        c_stability: 9,
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

  // Concept Modal Handlers
  const handleOpenConceptModal = (conceptToEdit?: Concept) => {
    if (conceptToEdit) {
      setEditingConcept(conceptToEdit);
      setConceptName(conceptToEdit.name);
      setConceptGroupId(conceptToEdit.groupId);
      setConceptDescription(conceptToEdit.description);
      setConceptCategory(conceptToEdit.category || "subjective");
      setConceptCalcType(conceptToEdit.calculationType || "subjective_score");
      setConceptUnit(conceptToEdit.unit);
      setConceptMaxVal(conceptToEdit.maxPersonalValue || 5000);
      setConceptIsPositive(conceptToEdit.isPositive !== false);
    } else {
      setEditingConcept(null);
      setConceptName("");
      setConceptGroupId(groups[0]?.id || "g_culture");
      setConceptDescription("");
      setConceptCategory("subjective");
      setConceptCalcType("subjective_score");
      setConceptUnit("SCORE_10");
      setConceptMaxVal(5000);
      setConceptIsPositive(true);
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
      category: conceptCategory,
      calculationType: conceptCalcType,
      maxPersonalValue: Number(conceptMaxVal),
      isPositive: conceptIsPositive,
      unit: conceptUnit,
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

  const handleConceptMaxValChange = (conceptId: string, newMaxVal: number) => {
    const updatedConcepts = concepts.map((c) =>
      c.id === conceptId ? { ...c, maxPersonalValue: newMaxVal } : c
    );
    saveData(offers, updatedConcepts, groups);
  };

  const handleMoveConceptToGroup = (conceptId: string, newGroupId: string) => {
    const updatedConcepts = concepts.map((c) =>
      c.id === conceptId ? { ...c, groupId: newGroupId } : c
    );
    saveData(offers, updatedConcepts, groups);
  };

  // Group Management Handlers
  const handleOpenGroupModal = (groupToEdit?: ConceptGroup) => {
    if (groupToEdit) {
      setEditingGroup(groupToEdit);
      setGroupName(groupToEdit.name);
      setGroupDescription(groupToEdit.description || "");
      setGroupColor(groupToEdit.color || "emerald");
    } else {
      setEditingGroup(null);
      setGroupName("");
      setGroupDescription("");
      setGroupColor("emerald");
    }
    setShowGroupModal(true);
  };

  const handleSaveGroup = () => {
    if (!groupName.trim()) {
      alert("Introduce un nombre para el grupo.");
      return;
    }

    const groupId = editingGroup ? editingGroup.id : `g_${Date.now()}`;
    const newGroup: ConceptGroup = {
      id: groupId,
      name: groupName,
      description: groupDescription,
      color: groupColor,
    };

    let updatedGroups = [...groups];
    if (editingGroup) {
      updatedGroups = updatedGroups.map((g) => (g.id === groupId ? newGroup : g));
    } else {
      updatedGroups.push(newGroup);
    }

    saveData(offers, concepts, updatedGroups);
    setShowGroupModal(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (groups.length <= 1) {
      alert("Debe existir al menos un grupo de conceptos.");
      return;
    }

    const conceptsInGroup = concepts.filter((c) => c.groupId === groupId);
    const targetGroup = groups.find((g) => g.id !== groupId);

    if (conceptsInGroup.length > 0) {
      const confirmMessage = `Este grupo contiene ${conceptsInGroup.length} concepto(s). ¿Deseas reasignarlos a "${targetGroup?.name}" y eliminar el grupo?`;
      if (!confirm(confirmMessage)) return;
    } else {
      if (!confirm("¿Eliminar este grupo de conceptos?")) return;
    }

    let updatedConcepts = [...concepts];
    if (conceptsInGroup.length > 0 && targetGroup) {
      updatedConcepts = updatedConcepts.map((c) =>
        c.groupId === groupId ? { ...c, groupId: targetGroup.id } : c
      );
    }

    const updatedGroups = groups.filter((g) => g.id !== groupId);
    saveData(offers, updatedConcepts, updatedGroups);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatValue = (concept: Concept, offer?: JobOffer) => {
    if (!offer || !offer.values) return "Sin especificar";
    const rawVal = offer.values[concept.id];
    if (rawVal === undefined || rawVal === null) return "Sin especificar";

    if (concept.calculationType === "bonus_probability") {
      const probVal = offer.values[`${concept.id}_prob`];
      const probStr = probVal !== undefined ? ` (${probVal}% prob)` : "";
      return `${formatCurrency(Number(rawVal))}${probStr}`;
    }

    if (concept.calculationType === "user_valued_benefit") {
      const customVal = offer.values[`${concept.id}_user_val`];
      const userValStr = customVal ? ` (Valor: ${formatCurrency(Number(customVal))}/año)` : "";
      if (typeof rawVal === "boolean") return rawVal ? `SÍ${userValStr}` : "NO";
      return rawVal ? `Incluido${userValStr}` : "No incluido";
    }

    if (concept.unit === "BOOLEAN") return rawVal ? "SÍ (Incluido)" : "NO (No incluido)";

    const num = Number(rawVal);
    if (isNaN(num)) return "0";

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
      {/* -------------------- HEADER -------------------- */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
            EVALUADOR BASADO EN SALARIO EQUIVALENTE PERSONAL
          </span>
          <h1 className="text-lg font-black text-foreground tracking-tight">
            Valoración y Comparativa de Ofertas
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
          onClick={() => setActiveTab("all_offers")}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer text-center ${
            activeTab === "all_offers"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="sm:hidden">1. General ({offers.length})</span>
          <span className="hidden sm:inline">1. Visión General ({offers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("comparison")}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer text-center ${
            activeTab === "comparison"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="sm:hidden">2. Comparativa</span>
          <span className="hidden sm:inline">2. Comparativa 3 Niveles</span>
        </button>

        <button
          onClick={() => setActiveTab("offers_crud")}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer text-center ${
            activeTab === "offers_crud"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="sm:hidden">3. Ofertas</span>
          <span className="hidden sm:inline">3. Gestionar Ofertas</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`py-2 px-1.5 sm:px-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition cursor-pointer text-center ${
            activeTab === "settings"
              ? "bg-card text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="sm:hidden">4. Preferencias ({concepts.length})</span>
          <span className="hidden sm:inline">4. Valor Máximo y Criterios ({concepts.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 3-LEVEL COMPARATOR VIEW (TOTAL, GROUPS, CONCEPT BY CONCEPT)        */}
      {/* ========================================================================= */}
      {activeTab === "comparison" && (
        <div className="space-y-4">
          {/* VISUAL SELECTOR CARDS FOR COMPARISON */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
              Selecciona los 2 Puestos a Comparar (frente a frente o vs Puesto Actual):
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Position 1 (Base / Left) Compact Card */}
              <div className="bg-muted/40 p-2.5 sm:p-3 rounded-xl border border-border flex flex-col justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground block break-words">
                    PUESTO #1 (BASE)
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs font-black text-foreground break-words">
                      {selectedOfferA?.title || "Seleccionar Puesto"}
                    </span>
                    {selectedOfferA?.isCurrent && (
                      <span className="text-[8px] sm:text-[9px] font-black uppercase px-1 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded shrink-0">
                        [SITUACIÓN ACTUAL]
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground break-words">
                    {selectedOfferA?.company}
                  </p>
                </div>

                <button
                  onClick={() => setShowPickerA(true)}
                  className="w-full px-2 py-1 sm:px-2.5 sm:py-1.5 bg-card hover:bg-muted text-foreground font-black text-[9px] sm:text-[10px] uppercase border border-border rounded-lg cursor-pointer shrink-0 transition text-center"
                >
                  [CAMBIAR]
                </button>
              </div>

              {/* Position 2 (Comparison / Right) Compact Card */}
              <div className="bg-primary/5 p-2.5 sm:p-3 rounded-xl border border-primary/30 flex flex-col justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-primary block break-words">
                    PUESTO #2 (OFERTA)
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs font-black text-foreground break-words">
                      {selectedOfferB?.title || "Seleccionar Puesto"}
                    </span>
                    {selectedOfferB?.isCurrent && (
                      <span className="text-[8px] sm:text-[9px] font-black uppercase px-1 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded shrink-0">
                        [SITUACIÓN ACTUAL]
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground break-words">
                    {selectedOfferB?.company}
                  </p>
                </div>

                <button
                  onClick={() => setShowPickerB(true)}
                  className="w-full px-2 py-1 sm:px-2.5 sm:py-1.5 bg-primary text-primary-foreground font-black text-[9px] sm:text-[10px] uppercase rounded-lg cursor-pointer shrink-0 transition hover:bg-primary-hover text-center"
                >
                  [CAMBIAR]
                </button>
              </div>
            </div>

            {/* Explanatory Banner line */}
            {selectedOfferA && selectedOfferB && (
              <div className="p-3 bg-muted/30 rounded-xl border border-border text-xs font-bold text-foreground">
                {(() => {
                  const salaryA = Number(selectedOfferA.values["c_salary_base"] || 0);
                  const salaryB = Number(selectedOfferB.values["c_salary_base"] || 0);
                  const salaryDiff = salaryB - salaryA;
                  const equivA = evalResultA?.totalMonetaryValue || 0;
                  const equivB = evalResultB?.totalMonetaryValue || 0;
                  const equivDiff = equivB - equivA;

                  if (salaryDiff > 0 && equivDiff < 0) {
                    return (
                      <span className="text-amber-600 dark:text-amber-400">
                        💡 {selectedOfferB.title} paga {formatCurrency(salaryDiff)} más de salario bruto, pero para ti {selectedOfferA.title} tiene {formatCurrency(Math.abs(equivDiff))}/año más de valor equivalente personal.
                      </span>
                    );
                  } else if (salaryDiff < 0 && equivDiff > 0) {
                    return (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        💡 {selectedOfferA.title} paga {formatCurrency(Math.abs(salaryDiff))} más de salario bruto, pero para ti {selectedOfferB.title} tiene {formatCurrency(equivDiff)}/año más de valor equivalente personal.
                      </span>
                    );
                  } else {
                    return (
                      <span>
                        💡 Diferencia de Salario Bruto: {salaryDiff >= 0 ? "+" : ""}{formatCurrency(salaryDiff)} | Diferencia de Salario Equivalente Personal: {equivDiff >= 0 ? "+" : ""}{formatCurrency(equivDiff)}/año a favor de {equivDiff >= 0 ? selectedOfferB.title : selectedOfferA.title}.
                      </span>
                    );
                  }
                })()}
              </div>
            )}
          </div>

          {/* ---------------- NIVEL 1 — TOTAL (SALARIO EQUIVALENTE PERSONAL) ---------------- */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h2 className="text-xs font-black uppercase text-foreground tracking-wider">
                Nivel 1 — Total: Salario Equivalente Personal
              </h2>
              <span className="text-[10px] font-extrabold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                KPI PRINCIPAL
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-extrabold">
                    <th className="py-2 pr-2">Concepto Global</th>
                    <th className="py-2 px-2 text-center">{selectedOfferA?.title}</th>
                    <th className="py-2 px-2 text-center">{selectedOfferB?.title}</th>
                    <th className="py-2 pl-2 text-center">Diferencia (B vs A)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {/* Row: Salario Bruto */}
                  <tr>
                    <td className="py-2 pr-2 font-bold text-foreground">Salario Bruto Fijo</td>
                    <td className="py-2 px-2 text-center font-bold">
                      {formatCurrency(Number(selectedOfferA?.values["c_salary_base"] || 0))}
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      {formatCurrency(Number(selectedOfferB?.values["c_salary_base"] || 0))}
                    </td>
                    <td className="py-2 pl-2 text-center font-bold text-muted-foreground">
                      {(() => {
                        const diff = Number(selectedOfferB?.values["c_salary_base"] || 0) - Number(selectedOfferA?.values["c_salary_base"] || 0);
                        return `${diff >= 0 ? "+" : ""}${formatCurrency(diff)}`;
                      })()}
                    </td>
                  </tr>

                  {/* Row: Valor Económico Total */}
                  <tr>
                    <td className="py-2 pr-2 font-bold text-foreground">Valor Económico Directo</td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(evalResultA?.economicMonetaryValue || 0)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(evalResultB?.economicMonetaryValue || 0)}
                    </td>
                    <td className="py-2 pl-2 text-center font-bold text-muted-foreground">
                      {(() => {
                        const diff = (evalResultB?.economicMonetaryValue || 0) - (evalResultA?.economicMonetaryValue || 0);
                        return `${diff >= 0 ? "+" : ""}${formatCurrency(diff)}`;
                      })()}
                    </td>
                  </tr>

                  {/* Row: Valor Intangible y Conciliación */}
                  <tr>
                    <td className="py-2 pr-2 font-bold text-foreground">Valor Intangible / Conciliación</td>
                    <td className="py-2 px-2 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(evalResultA?.intangibleMonetaryValue || 0)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(evalResultB?.intangibleMonetaryValue || 0)}
                    </td>
                    <td className="py-2 pl-2 text-center font-bold text-muted-foreground">
                      {(() => {
                        const diff = (evalResultB?.intangibleMonetaryValue || 0) - (evalResultA?.intangibleMonetaryValue || 0);
                        return `${diff >= 0 ? "+" : ""}${formatCurrency(diff)}`;
                      })()}
                    </td>
                  </tr>

                  {/* HERO ROW: SALARIO EQUIVALENTE PERSONAL */}
                  <tr className="bg-primary/10 font-black text-sm text-foreground">
                    <td className="py-3 pr-2 uppercase">Salario Equivalente Personal</td>
                    <td className="py-3 px-2 text-center text-primary text-base">
                      {formatCurrency(evalResultA?.totalMonetaryValue || 0)}/año
                    </td>
                    <td className="py-3 px-2 text-center text-primary text-base">
                      {formatCurrency(evalResultB?.totalMonetaryValue || 0)}/año
                    </td>
                    <td className="py-3 pl-2 text-center">
                      {(() => {
                        const diff = (evalResultB?.totalMonetaryValue || 0) - (evalResultA?.totalMonetaryValue || 0);
                        return (
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              diff >= 0
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {diff >= 0 ? "+" : ""}{formatCurrency(diff)}/año
                          </span>
                        );
                      })()}
                    </td>
                  </tr>

                  {/* Row: Score (0-100) */}
                  <tr>
                    <td className="py-2 pr-2 font-bold text-muted-foreground uppercase text-[10px]">Puntuación Secundaria (Score)</td>
                    <td className="py-2 px-2 text-center font-black text-primary">
                      {evalResultA?.compositeScore || 0} / 100 PTS
                    </td>
                    <td className="py-2 px-2 text-center font-black text-primary">
                      {evalResultB?.compositeScore || 0} / 100 PTS
                    </td>
                    <td className="py-2 pl-2 text-center font-bold text-muted-foreground">
                      {(() => {
                        const diff = (evalResultB?.compositeScore || 0) - (evalResultA?.compositeScore || 0);
                        return `${diff >= 0 ? "+" : ""}${diff} pts`;
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------- NIVEL 2 — GRUPOS (SUBTOTALES & QUIÉN GANA) ---------------- */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h2 className="text-xs font-black uppercase text-foreground tracking-wider border-b border-border pb-2">
              Nivel 2 — Comparativa por Grupos de Análisis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map((group) => {
                const groupA = evalResultA?.groupResults.find((g) => g.groupId === group.id);
                const groupB = evalResultB?.groupResults.find((g) => g.groupId === group.id);

                const valA = groupA?.totalMonetaryValue || 0;
                const valB = groupB?.totalMonetaryValue || 0;
                const diff = valB - valA;

                const winner = diff > 0 ? selectedOfferB?.title : diff < 0 ? selectedOfferA?.title : "Empate";

                return (
                  <div key={group.id} className="bg-muted/30 rounded-xl p-3 border border-border space-y-2">
                    <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
                      <h3 className="font-black text-foreground text-xs uppercase">{group.name}</h3>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          diff !== 0
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {diff !== 0 ? `Gana: ${winner}` : "Sin diferencia"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground block truncate">
                          {selectedOfferA?.title}
                        </span>
                        <span className="font-black text-foreground">
                          {formatCurrency(valA)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground block truncate">
                          {selectedOfferB?.title}
                        </span>
                        <span className="font-black text-foreground">
                          {formatCurrency(valB)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                          Diferencia
                        </span>
                        <span
                          className={`font-black ${
                            diff > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : diff < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- NIVEL 3 — CONCEPTO A CONCEPTO ---------------- */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-foreground tracking-wider bg-card p-3 rounded-xl border border-border">
              Nivel 3 — Desglose Concepto a Concepto
            </h2>

            {groupedConcepts.map(({ group, concepts: groupConcepts }) => {
              const isCollapsed = collapsedGroups[group.id] !== false;
              return (
                <div key={group.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="bg-muted/60 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-border flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      {group.name} ({groupConcepts.length})
                    </h3>

                    <button
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="shrink-0 whitespace-nowrap px-2 py-1 rounded-md bg-card hover:bg-muted text-foreground text-[10px] font-black uppercase border border-border cursor-pointer transition"
                    >
                      {isCollapsed ? "[+ VER CONCEPTOS]" : "[- OCULTAR]"}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-border/60">
                      {groupConcepts.map((concept) => {
                        const valA = selectedOfferA ? calculateConceptMonetaryValue(concept, selectedOfferA, userPrefs) : 0;
                        const valB = selectedOfferB ? calculateConceptMonetaryValue(concept, selectedOfferB, userPrefs) : 0;
                        const diff = valB - valA;

                        return (
                          <div key={concept.id} className="p-3 sm:p-4 space-y-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                              <div>
                                <span className="font-black text-foreground text-xs">{concept.name}</span>
                                {concept.maxPersonalValue > 0 && (
                                  <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                                    Valor máx personal: {formatCurrency(concept.maxPersonalValue)}/año
                                  </span>
                                )}
                              </div>

                              {diff !== 0 && (
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                    diff > 0
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  Diferencia: {diff > 0 ? selectedOfferB?.title : selectedOfferA?.title} {diff > 0 ? "+" : ""}{formatCurrency(diff)}/año
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-muted/30 p-2.5 rounded-xl border border-border space-y-0.5">
                                <div className="text-[9px] font-extrabold text-muted-foreground uppercase">{selectedOfferA?.title}</div>
                                <div className="font-bold text-foreground">{formatValue(concept, selectedOfferA)}</div>
                                <div className="font-black text-emerald-600 dark:text-emerald-400 text-[11px]">
                                  {valA >= 0 ? "+" : ""}{formatCurrency(valA)}/año
                                </div>
                              </div>

                              <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/30 space-y-0.5">
                                <div className="text-[9px] font-extrabold text-primary uppercase">{selectedOfferB?.title}</div>
                                <div className="font-bold text-foreground">{formatValue(concept, selectedOfferB)}</div>
                                <div className="font-black text-emerald-600 dark:text-emerald-400 text-[11px]">
                                  {valB >= 0 ? "+" : ""}{formatCurrency(valB)}/año
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
                        ? "[SITUACIÓN ACTUAL]"
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

                  <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 mb-3 text-center">
                    <span className="text-[9px] font-black text-primary uppercase block">
                      Salario Equivalente Personal
                    </span>
                    <div className="text-2xl font-black text-foreground mt-0.5">
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
                        vs Actual: {result.deltaMonetaryVsCurrent >= 0 ? "+" : ""}
                        {formatCurrency(result.deltaMonetaryVsCurrent)}/año ({result.deltaPercentVsCurrent > 0 ? "+" : ""}
                        {result.deltaPercentVsCurrent}%)
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-border/40">
                      <span className="text-muted-foreground font-semibold">Salario Bruto Fijo</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(Number(offerObj?.values["c_salary_base"] || 0))}
                      </span>
                    </div>
                    {concepts.slice(1, 6).map((concept) => (
                      <div key={concept.id} className="flex justify-between py-0.5 border-b border-border/40">
                        <span className="text-muted-foreground font-semibold truncate pr-2">{concept.name}</span>
                        <span className="font-bold text-foreground">{formatValue(concept, offerObj)}</span>
                      </div>
                    ))}
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
                    Comparar en 3 Niveles
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
                Añade o edita los parámetros económicos, intangibles y tu situación laboral actual
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
                        [SITUACIÓN ACTUAL]
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
      {/* TAB 4: PREFERENCES, MAX PERSONAL VALUES & CONCEPT SETTINGS               */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-6">
          {/* USER GLOBAL PREFERENCES SECTION */}
          <div className="bg-muted/30 p-4 rounded-2xl border border-border space-y-3">
            <h2 className="text-sm font-black uppercase text-foreground">
              Configuración de Preferencias Personales Basadas en Tiempo
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Define cuánto vale para ti el teletrabajo, tus vacaciones o tu tiempo libre para auto-calcular el impacto económico exacto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">
                  Valor 1 día de teletrabajo (€/día)
                </label>
                <input
                  type="number"
                  value={userPrefs.teleworkDayValue}
                  onChange={(e) =>
                    saveData(offers, concepts, groups, {
                      ...userPrefs,
                      teleworkDayValue: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background font-black text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">
                  Semanas laborales al año
                </label>
                <input
                  type="number"
                  value={userPrefs.workingWeeksPerYear}
                  onChange={(e) =>
                    saveData(offers, concepts, groups, {
                      ...userPrefs,
                      workingWeeksPerYear: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background font-black text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">
                  Valor 1 hora de tiempo libre (€/h)
                </label>
                <input
                  type="number"
                  value={userPrefs.freeTimeHourValue}
                  onChange={(e) =>
                    saveData(offers, concepts, groups, {
                      ...userPrefs,
                      freeTimeHourValue: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background font-black text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">
                  Valor 1 día extra vacaciones (€/día)
                </label>
                <input
                  type="number"
                  value={userPrefs.vacationDayValue}
                  onChange={(e) =>
                    saveData(offers, concepts, groups, {
                      ...userPrefs,
                      vacationDayValue: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background font-black text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-muted-foreground mb-1">
                  Vacaciones de referencia (Días/año)
                </label>
                <input
                  type="number"
                  value={userPrefs.vacationReferenceDays}
                  onChange={(e) =>
                    saveData(offers, concepts, groups, {
                      ...userPrefs,
                      vacationReferenceDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background font-black text-foreground text-xs"
                />
              </div>
            </div>
          </div>

          {/* CONCEPT GROUPS AND MAX PERSONAL VALUES */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-black uppercase text-foreground">
                  Valor Máximo Para Mí (€/año) por Concepto Intangible
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">
                  ¿Cuánto valor tendría para ti disfrutar de este beneficio o condición en su mejor situación?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenGroupModal()}
                  className="px-3 py-1.5 bg-muted text-foreground font-black text-xs rounded-xl hover:bg-muted/80 border border-border cursor-pointer uppercase shrink-0"
                >
                  + Nuevo Grupo
                </button>
                <button
                  onClick={() => handleOpenConceptModal()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover cursor-pointer uppercase shrink-0"
                >
                  + Nuevo Concepto
                </button>
              </div>
            </div>

            {groups.map((group) => {
              const groupConcepts = concepts.filter((c) => c.groupId === group.id);
              const isCollapsed = collapsedSettingsGroups[group.id] !== false;

              return (
                <div key={group.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="bg-muted/60 p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                          {group.name}
                        </h3>
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap bg-muted px-1.5 py-0.5 rounded border border-border">
                          {groupConcepts.length} {groupConcepts.length === 1 ? "concepto" : "conceptos"}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0">
                      <button
                        onClick={() => toggleSettingsGroupCollapse(group.id)}
                        className="px-2 py-1 rounded-md bg-card hover:bg-muted text-foreground text-[10px] font-black uppercase border border-border cursor-pointer transition"
                      >
                        {isCollapsed ? "[+ VER CONCEPTOS]" : "[- OCULTAR]"}
                      </button>
                      <button
                        onClick={() => handleOpenGroupModal(group)}
                        className="px-2 py-1 rounded-md bg-card hover:bg-muted text-foreground text-[10px] font-black uppercase border border-border cursor-pointer transition"
                      >
                        Editar Grupo
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-border/60 p-2 sm:p-3 space-y-2">
                      {groupConcepts.map((concept) => (
                        <div
                          key={concept.id}
                          className="bg-muted/20 rounded-xl p-3 border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-foreground">{concept.name}</h4>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                                {concept.category === "economic" ? "Económico" : "Intangible"}
                              </span>
                            </div>
                            {concept.description && (
                              <p className="text-[11px] text-muted-foreground font-semibold">
                                {concept.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                            <div>
                              <label className="block text-[9px] font-extrabold uppercase text-muted-foreground mb-0.5">
                                Grupo
                              </label>
                              <select
                                value={concept.groupId}
                                onChange={(e) => handleMoveConceptToGroup(concept.id, e.target.value)}
                                className="px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-xs cursor-pointer max-w-[140px]"
                              >
                                {groups.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {concept.category === "subjective" && (
                              <div>
                                <label className="block text-[9px] font-black uppercase text-primary mb-0.5">
                                  VALOR MÁXIMO PARA MÍ (€/año)
                                </label>
                                <input
                                  type="number"
                                  step={500}
                                  value={concept.maxPersonalValue || 0}
                                  onChange={(e) =>
                                    handleConceptMaxValChange(concept.id, Number(e.target.value))
                                  }
                                  className="w-28 px-2 py-1 rounded-lg border border-primary/40 bg-background font-black text-foreground text-xs"
                                />
                              </div>
                            )}

                            <div className="pt-3 md:pt-0 flex gap-1">
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POSITION PICKER A                                                 */}
      {/* ========================================================================= */}
      {showPickerA && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-4 max-w-md w-full space-y-3 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="text-xs font-black uppercase text-foreground">
                Seleccionar Puesto #1 (Base / Izquierda)
              </h3>
              <button
                onClick={() => setShowPickerA(false)}
                className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-black cursor-pointer uppercase text-[10px]"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-1.5 max-h-[60dvh] overflow-y-auto pr-1">
              {offers.map((offer) => {
                const isSelected = offer.id === offerIdA;
                return (
                  <button
                    key={`pick_a_${offer.id}`}
                    onClick={() => {
                      setOfferIdA(offer.id);
                      setShowPickerA(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? "bg-muted text-foreground border-primary font-black shadow-2xs"
                        : "bg-background/60 text-muted-foreground border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-foreground">{offer.title}</span>
                        {offer.isCurrent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md">
                            [SITUACIÓN ACTUAL]
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {offer.company} • {formatModalityText(offer)}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="text-[9px] font-black uppercase text-primary px-2 py-0.5 bg-primary/10 rounded-md shrink-0">
                        ACTIVO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POSITION PICKER B                                                 */}
      {/* ========================================================================= */}
      {showPickerB && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-4 max-w-md w-full space-y-3 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="text-xs font-black uppercase text-primary">
                Seleccionar Puesto #2 (Comparar / Derecha)
              </h3>
              <button
                onClick={() => setShowPickerB(false)}
                className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-black cursor-pointer uppercase text-[10px]"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-1.5 max-h-[60dvh] overflow-y-auto pr-1">
              {offers.map((offer) => {
                const isSelected = offer.id === offerIdB;
                return (
                  <button
                    key={`pick_b_${offer.id}`}
                    onClick={() => {
                      setOfferIdB(offer.id);
                      setShowPickerB(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? "bg-primary/10 text-foreground border-primary font-black shadow-2xs"
                        : "bg-background/60 text-muted-foreground border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-foreground">{offer.title}</span>
                        {offer.isCurrent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md">
                            [SITUACIÓN ACTUAL]
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {offer.company} • {formatModalityText(offer)}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="text-[9px] font-black uppercase text-primary px-2 py-0.5 bg-primary/15 rounded-md shrink-0">
                        ACTIVO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / ADD OFFER WITH AUTOMATIC CALCULATORS                       */}
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
                      Días Presenciales en Oficina a la Semana:
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
                  ¿Es tu puesto de trabajo actual? (Situación Actual)
                </label>
              </div>
            </div>

            {/* CONCEPT VALUES FORM */}
            <div className="pt-2 border-t border-border space-y-3">
              <h4 className="font-black uppercase text-foreground">
                Entrada de Parámetros de la Oferta:
              </h4>

              <div className="space-y-2">
                {concepts.map((concept) => {
                  const val = offerValues[concept.id];

                  return (
                    <div
                      key={concept.id}
                      className="bg-muted/30 p-3 rounded-xl border border-border space-y-1.5"
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <label className="font-bold text-foreground block">
                            {concept.name}{" "}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({concept.unit})
                            </span>
                          </label>
                          {concept.category === "subjective" && (
                            <span className="text-[9px] text-primary font-bold block">
                              Valor Máx: {formatCurrency(concept.maxPersonalValue)}/año
                            </span>
                          )}
                        </div>

                        {concept.calculationType === "bonus_probability" ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                                Bonus Máx (€)
                              </span>
                              <input
                                type="number"
                                value={val !== undefined ? Number(val) : ""}
                                onChange={(e) =>
                                  setOfferValues({
                                    ...offerValues,
                                    [concept.id]: Number(e.target.value),
                                  })
                                }
                                className="w-24 px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-right"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                                Probabilidad (%)
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={
                                  offerValues[`${concept.id}_prob`] !== undefined
                                    ? Number(offerValues[`${concept.id}_prob`])
                                    : 100
                                }
                                onChange={(e) =>
                                  setOfferValues({
                                    ...offerValues,
                                    [`${concept.id}_prob`]: Number(e.target.value),
                                  })
                                }
                                className="w-16 px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-right"
                              />
                            </div>
                          </div>
                        ) : concept.calculationType === "user_valued_benefit" ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={val ? "true" : "false"}
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
                            <div>
                              <span className="text-[9px] font-extrabold uppercase text-muted-foreground block">
                                Mi Valoración (€/año)
                              </span>
                              <input
                                type="number"
                                value={
                                  offerValues[`${concept.id}_user_val`] !== undefined
                                    ? Number(offerValues[`${concept.id}_user_val`])
                                    : concept.maxPersonalValue || 1200
                                }
                                onChange={(e) =>
                                  setOfferValues({
                                    ...offerValues,
                                    [`${concept.id}_user_val`]: Number(e.target.value),
                                  })
                                }
                                className="w-24 px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-right"
                              />
                            </div>
                          </div>
                        ) : concept.unit === "BOOLEAN" ? (
                          <select
                            value={val ? "true" : "false"}
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
                        ) : concept.unit === "SCORE_10" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={10}
                              value={val !== undefined ? Number(val) : 5}
                              onChange={(e) =>
                                setOfferValues({
                                  ...offerValues,
                                  [concept.id]: Number(e.target.value),
                                })
                              }
                              className="w-24 accent-primary"
                            />
                            <span className="font-black text-foreground text-sm min-w-[32px]">
                              {val !== undefined ? Number(val) : 5}/10
                            </span>
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={val !== undefined ? Number(val) : ""}
                            onChange={(e) =>
                              setOfferValues({
                                ...offerValues,
                                [concept.id]: Number(e.target.value),
                              })
                            }
                            className="w-32 px-2.5 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-right"
                          />
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Añade una nota o justificación sobre este concepto..."
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
                  );
                })}
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

      {/* MODAL: ADD / EDIT GROUP */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-5 max-w-md w-full max-h-[90dvh] overflow-y-auto space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">
                {editingGroup ? "Editar Grupo" : "Nuevo Grupo de Conceptos"}
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-black cursor-pointer uppercase"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Retribución Directa"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Propósito del grupo"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold cursor-pointer uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black cursor-pointer uppercase"
              >
                Guardar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CONCEPT */}
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
                  Grupo Pertenece *
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
                <label className="block font-black text-foreground uppercase mb-1">
                  Nombre del Concepto *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Plan de Carrera / Autonomía"
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
                  placeholder="Explicación del criterio"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-foreground uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={conceptCategory}
                    onChange={(e) => setConceptCategory(e.target.value as ConceptCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground cursor-pointer"
                  >
                    <option value="economic">economic (Directo de la oferta)</option>
                    <option value="subjective">subjective (Valoración personal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-foreground uppercase mb-1">
                    Tipo de Impacto
                  </label>
                  <select
                    value={conceptIsPositive ? "positive" : "negative"}
                    onChange={(e) => setConceptIsPositive(e.target.value === "positive")}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground cursor-pointer"
                  >
                    <option value="positive">positivo (Beneficio / Suma)</option>
                    <option value="negative">negative (Penalización / Coste)</option>
                  </select>
                </div>
              </div>

              {conceptCategory === "subjective" && (
                <div>
                  <label className="block font-black text-primary uppercase mb-1">
                    VALOR MÁXIMO PARA MÍ (€/año) *
                  </label>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-1">
                    ¿Cuánto valor tendría para ti disfrutar de este beneficio o condición en su mejor situación?
                  </p>
                  <input
                    type="number"
                    step={500}
                    value={conceptMaxVal}
                    onChange={(e) => setConceptMaxVal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-primary/50 bg-background font-black text-foreground"
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
