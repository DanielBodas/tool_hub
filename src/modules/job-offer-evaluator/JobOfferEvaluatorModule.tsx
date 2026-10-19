"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ConceptGroup,
  Concept,
  JobOffer,
  EvaluationResult,
  UnitType,
  ConceptType,
  PreferenceDirection,
  OfferStatus,
  WorkModality,
  PriorityScenario,
  SensitivityAnalysisResult,
  DetailedConceptResult,
} from "./types";
import {
  DEFAULT_GROUPS,
  DEFAULT_CONCEPTS,
  DEFAULT_OFFERS,
  PRESET_TEMPLATES,
  evaluateJobOffers,
  analyzeSensitivity,
  calculateCommuteAnnualExpense,
} from "./initialData";

type ActiveTab = "all_offers" | "comparison" | "offers_crud" | "settings";
type FilterScope = "all" | "group" | "concept";

export function JobOfferEvaluatorModule() {
  const [groups, setGroups] = useState<ConceptGroup[]>(DEFAULT_GROUPS);
  const [concepts, setConcepts] = useState<Concept[]>(DEFAULT_CONCEPTS);
  const [offers, setOffers] = useState<JobOffer[]>(DEFAULT_OFFERS);
  const [scenarios, setScenarios] = useState<PriorityScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("default");

  const [activeTab, setActiveTab] = useState<ActiveTab>("all_offers");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Side-by-Side Comparison State
  const [offerIdA, setOfferIdA] = useState<string>("");
  const [offerIdB, setOfferIdB] = useState<string>("");

  // Filter & Collapse States
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [collapsedSettingsGroups, setCollapsedSettingsGroups] = useState<Record<string, boolean>>({});

  // Score Explanation Modal State
  const [selectedExplanationOfferId, setSelectedExplanationOfferId] = useState<string | null>(null);

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
  const [offerConceptScores, setOfferConceptScores] = useState<Record<string, number>>({});
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
  const [conceptType, setConceptType] = useState<ConceptType>("objective");
  const [conceptWeightWithinGroup, setConceptWeightWithinGroup] = useState<number>(25);
  const [conceptPreferenceDirection, setConceptPreferenceDirection] = useState<PreferenceDirection>("MORE_IS_BETTER");
  const [conceptIdealValue, setConceptIdealValue] = useState<number>(3);
  const [conceptIsVeto, setConceptIsVeto] = useState<boolean>(false);
  const [conceptVetoThreshold, setConceptVetoThreshold] = useState<number>(0);
  const [conceptVetoType, setConceptVetoType] = useState<"min" | "max">("min");
  const [conceptIsMonetaryTotal, setConceptIsMonetaryTotal] = useState<boolean>(true);
  const [conceptMonetaryEquivalence, setConceptMonetaryEquivalence] = useState<number>(0);

  // Group Modal State
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<ConceptGroup | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [groupDescription, setGroupDescription] = useState<string>("");
  const [groupWeight, setGroupWeight] = useState<number>(25);
  const [groupColor, setGroupColor] = useState<string>("emerald");

  // Load Initial Data
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
          if (parsed.scenarios) setScenarios(parsed.scenarios);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  // Set default comparison offers
  useEffect(() => {
    if (offers.length > 0) {
      const current = offers.find((o) => o.isCurrent) || offers[0];
      const nonCurrent = offers.find((o) => o.id !== current.id) || offers[1] || current;
      setOfferIdA(current.id);
      setOfferIdB(nonCurrent.id);
    }
  }, [offers]);

  const saveData = (
    newOffers: JobOffer[],
    newConcepts: Concept[],
    newGroups: ConceptGroup[],
    newScenarios?: PriorityScenario[]
  ) => {
    setOffers(newOffers);
    setConcepts(newConcepts);
    setGroups(newGroups);
    if (newScenarios) setScenarios(newScenarios);

    // Persist to local storage
    try {
      localStorage.setItem(
        "job_offers_data",
        JSON.stringify({
          offers: newOffers,
          concepts: newConcepts,
          groups: newGroups,
          scenarios: newScenarios || scenarios,
        })
      );
    } catch {
      // ignore
    }

    // Persist to API
    fetch("/api/job-offer-evaluator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "full_sync",
        offers: newOffers,
        concepts: newConcepts,
        groups: newGroups,
      }),
    })
      .then((r) => {
        if (r.ok) {
          setStatusMessage("Guardado");
          setTimeout(() => setStatusMessage(""), 2000);
        }
      })
      .catch(() => {});
  };

  // Group Weight Sum Validation
  const groupWeightSum = useMemo(() => {
    return groups
      .filter((g) => g.isActive !== false)
      .reduce((acc, g) => acc + (g.weight || 0), 0);
  }, [groups]);

  // Concept Weight Sum Validation per Group
  const conceptWeightSumsPerGroup = useMemo(() => {
    const sums: Record<string, number> = {};
    groups.forEach((g) => {
      const activeGroupConcepts = concepts.filter(
        (c) => c.groupId === g.id && c.isActive !== false
      );
      sums[g.id] = activeGroupConcepts.reduce(
        (acc, c) => acc + (c.weightWithinGroup || 0),
        0
      );
    });
    return sums;
  }, [groups, concepts]);

  // Double Counting Detector Warnings
  const doubleCountingWarnings = useMemo(() => {
    const warnings: string[] = [];
    const nameMap: Record<string, string[]> = {};

    concepts.forEach((c) => {
      if (c.isActive === false) return;
      const normalizedName = c.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();

      // Check common overlapping terms
      if (normalizedName.includes("salario") || normalizedName.includes("retribucion") || normalizedName.includes("sueldo")) {
        nameMap["salario"] = nameMap["salario"] || [];
        nameMap["salario"].push(c.name);
      }
      if (normalizedName.includes("bonus") || normalizedName.includes("variable")) {
        nameMap["variable"] = nameMap["variable"] || [];
        nameMap["variable"].push(c.name);
      }
      if (normalizedName.includes("teletrabajo") || normalizedName.includes("remoto") || normalizedName.includes("homeoffice")) {
        nameMap["teletrabajo"] = nameMap["teletrabajo"] || [];
        nameMap["teletrabajo"].push(c.name);
      }
    });

    Object.entries(nameMap).forEach(([key, list]) => {
      if (list.length > 1) {
        warnings.push(
          `Los conceptos (${list.join(", ")}) parecen estar relacionados. Comprueba que no estés valorando el mismo factor dos veces.`
        );
      }
    });

    return warnings;
  }, [concepts]);

  // Dynamic Evaluation Results
  const evaluationResults = useMemo(() => {
    return evaluateJobOffers(offers, concepts, groups);
  }, [offers, concepts, groups]);

  // Sensitivity Analysis
  const sensitivityAnalysis = useMemo(() => {
    return analyzeSensitivity(evaluationResults, groups);
  }, [evaluationResults, groups]);

  const selectedOfferA = useMemo(
    () => offers.find((o) => o.id === offerIdA),
    [offers, offerIdA]
  );
  const selectedOfferB = useMemo(
    () => offers.find((o) => o.id === offerIdB),
    [offers, offerIdB]
  );

  const evalA = useMemo(
    () => evaluationResults.find((r) => r.offerId === offerIdA),
    [evaluationResults, offerIdA]
  );
  const evalB = useMemo(
    () => evaluationResults.find((r) => r.offerId === offerIdB),
    [evaluationResults, offerIdB]
  );

  const explanationOffer = useMemo(
    () => evaluationResults.find((r) => r.offerId === selectedExplanationOfferId),
    [evaluationResults, selectedExplanationOfferId]
  );

  const toggleSettingsGroupCollapse = (groupId: string) => {
    setCollapsedSettingsGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Group CRUD Handlers
  const handleOpenGroupModal = (groupToEdit?: ConceptGroup) => {
    if (groupToEdit) {
      setEditingGroup(groupToEdit);
      setGroupName(groupToEdit.name);
      setGroupDescription(groupToEdit.description || "");
      setGroupWeight(groupToEdit.weight || 25);
      setGroupColor(groupToEdit.color || "emerald");
    } else {
      setEditingGroup(null);
      setGroupName("");
      setGroupDescription("");
      setGroupWeight(25);
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
      weight: Number(groupWeight),
      order: editingGroup ? editingGroup.order : groups.length + 1,
      isActive: editingGroup ? editingGroup.isActive !== false : true,
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
      if (!confirm(`Este grupo contiene ${conceptsInGroup.length} concepto(s). ¿Reasignar a "${targetGroup?.name}" y eliminar el grupo?`))
        return;
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

  const handleToggleGroupActive = (groupId: string) => {
    const updatedGroups = groups.map((g) =>
      g.id === groupId ? { ...g, isActive: !g.isActive } : g
    );
    saveData(offers, concepts, updatedGroups);
  };

  // Concept CRUD Handlers
  const handleOpenConceptModal = (conceptToEdit?: Concept, defaultGroupId?: string) => {
    if (conceptToEdit) {
      setEditingConcept(conceptToEdit);
      setConceptName(conceptToEdit.name);
      setConceptGroupId(conceptToEdit.groupId);
      setConceptDescription(conceptToEdit.description);
      setConceptUnit(conceptToEdit.unit);
      setConceptType(conceptToEdit.conceptType || "objective");
      setConceptWeightWithinGroup(conceptToEdit.weightWithinGroup || 25);
      setConceptPreferenceDirection(conceptToEdit.preferenceDirection || "MORE_IS_BETTER");
      setConceptIdealValue(conceptToEdit.idealValue || 3);
      setConceptIsVeto(!!conceptToEdit.isVeto);
      setConceptVetoThreshold(conceptToEdit.vetoThreshold || 0);
      setConceptVetoType(conceptToEdit.vetoType || "min");
      setConceptIsMonetaryTotal(conceptToEdit.isMonetaryTotal !== false);
      setConceptMonetaryEquivalence(conceptToEdit.monetaryEquivalencePerUnit || 0);
    } else {
      setEditingConcept(null);
      setConceptName("");
      setConceptGroupId(defaultGroupId || groups[0]?.id || "g_direct");
      setConceptDescription("");
      setConceptUnit("EUR_YEAR");
      setConceptType("objective");
      setConceptWeightWithinGroup(25);
      setConceptPreferenceDirection("MORE_IS_BETTER");
      setConceptIdealValue(3);
      setConceptIsVeto(false);
      setConceptVetoThreshold(0);
      setConceptVetoType("min");
      setConceptIsMonetaryTotal(true);
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
      conceptType,
      weightWithinGroup: Number(conceptWeightWithinGroup),
      order: editingConcept ? editingConcept.order : concepts.length + 1,
      isActive: editingConcept ? editingConcept.isActive !== false : true,
      preferenceDirection: conceptPreferenceDirection,
      idealValue: conceptPreferenceDirection === "IDEAL" ? Number(conceptIdealValue) : undefined,
      isVeto: conceptIsVeto,
      vetoThreshold: conceptIsVeto ? Number(conceptVetoThreshold) : undefined,
      vetoType: conceptIsVeto ? conceptVetoType : undefined,
      isMonetaryTotal: conceptIsMonetaryTotal,
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
    if (confirm("¿Eliminar este concepto?")) {
      const updatedConcepts = concepts.filter((c) => c.id !== id);
      saveData(offers, updatedConcepts, groups);
    }
  };

  const handleToggleConceptActive = (conceptId: string) => {
    const updatedConcepts = concepts.map((c) =>
      c.id === conceptId ? { ...c, isActive: !c.isActive } : c
    );
    saveData(offers, updatedConcepts, groups);
  };

  const handleApplyPresetTemplate = (templateId: string) => {
    const tpl = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    const updatedGroups = groups.map((g) => ({
      ...g,
      weight: (tpl.groupWeights as Record<string, number>)[g.id] ?? g.weight,
    }));

    saveData(offers, concepts, updatedGroups);
    setStatusMessage(`Plantilla "${tpl.name}" aplicada`);
    setTimeout(() => setStatusMessage(""), 2000);
  };

  // Offer CRUD Handlers
  const handleOpenOfferModal = (offerToEdit?: JobOffer) => {
    if (offerToEdit) {
      setEditingOffer(offerToEdit);
      setOfferTitle(offerToEdit.title);
      setOfferCompany(offerToEdit.company);
      setOfferLocation(offerToEdit.location || "");
      setOfferWorkModality(offerToEdit.workModality || "hibrido");
      setOfferOfficeDays(offerToEdit.officeDaysPerWeek !== undefined ? offerToEdit.officeDaysPerWeek : 3);
      setOfferIsCurrent(!!offerToEdit.isCurrent);
      setOfferStatus(offerToEdit.status || "received");
      setOfferValues({ ...offerToEdit.values });
      setOfferConceptScores({ ...(offerToEdit.conceptScores || {}) });
      setOfferConceptNotes({ ...(offerToEdit.conceptNotes || {}) });
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
      setOfferIsCurrent(false);
      setOfferStatus("received");

      const defaultVals: Record<string, number | boolean> = {};
      const defaultScores: Record<string, number> = {};
      concepts.forEach((c) => {
        defaultVals[c.id] = c.unit === "BOOLEAN" ? false : c.unit === "SCORE_10" ? 7 : 0;
        if (c.conceptType === "subjective" || c.conceptType === "mixed") {
          defaultScores[c.id] = 70;
        }
      });
      setOfferValues(defaultVals);
      setOfferConceptScores(defaultScores);
      setOfferConceptNotes({});
      setOfferCommuteKm(0);
      setOfferCommuteFuelL100(6.5);
      setOfferFuelPriceEurL(1.55);
    }
    setShowOfferModal(true);
  };

  const handleSaveOffer = () => {
    if (!offerTitle.trim() || !offerCompany.trim()) {
      alert("Introduce el puesto y la empresa de la oferta.");
      return;
    }

    const offerId = editingOffer ? editingOffer.id : `offer_${Date.now()}`;
    const updatedOffer: JobOffer = {
      id: offerId,
      title: offerTitle,
      company: offerCompany,
      location: offerLocation,
      workModality: offerWorkModality,
      officeDaysPerWeek: offerOfficeDays,
      isCurrent: offerIsCurrent,
      status: offerStatus,
      values: offerValues,
      conceptScores: offerConceptScores,
      conceptNotes: offerConceptNotes,
      commuteKmOneWay: Number(offerCommuteKm),
      commuteFuelL100: Number(offerCommuteFuelL100),
      fuelPriceEurL: Number(offerFuelPriceEurL),
    };

    let updatedOffers = [...offers];
    if (offerIsCurrent) {
      updatedOffers = updatedOffers.map((o) => ({
        ...o,
        isCurrent: o.id === offerId,
        status: o.id === offerId ? "current" : o.status === "current" ? "received" : o.status,
      }));
    }

    if (editingOffer) {
      updatedOffers = updatedOffers.map((o) => (o.id === offerId ? updatedOffer : o));
    } else {
      updatedOffers.push(updatedOffer);
    }

    saveData(updatedOffers, concepts, groups);
    setShowOfferModal(false);
  };

  const handleDeleteOffer = (id: string) => {
    if (offers.length <= 1) {
      alert("Debe existir al menos una oferta.");
      return;
    }
    if (confirm("¿Eliminar esta oferta de empleo?")) {
      const updatedOffers = offers.filter((o) => o.id !== id);
      saveData(updatedOffers, concepts, groups);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatModalityText = (offer?: JobOffer) => {
    if (!offer) return "";
    if (offer.workModality === "remoto") return "100% Remoto";
    if (offer.workModality === "presencial") return "100% Presencial";
    return `Híbrido (${offer.officeDaysPerWeek ?? 3} días oficina)`;
  };

  const formatUnitLabel = (unit: UnitType) => {
    switch (unit) {
      case "EUR_YEAR":
        return "€/año";
      case "EUR_MONTH":
        return "€/mes";
      case "DAYS_YEAR":
        return "días/año";
      case "DAYS_WEEK":
        return "días/semana";
      case "SCORE_10":
        return "pts (1-10)";
      case "BOOLEAN":
        return "Sí / No";
      case "MINUTES_DAY":
        return "min/día";
      case "PERCENT":
        return "%";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* -------------------- BRAND & ACTIONS HEADER -------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card rounded-2xl border border-border p-4 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block">
            EVALUADOR DE PUESTOS Y OFERTAS DE EMPLEO
          </span>
          <h1 className="text-lg font-black text-foreground tracking-tight">
            Análisis Ponderado y Comparativa de Empleo
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

      {/* -------------------- WEIGHT VALIDATION ALERT BANNER -------------------- */}
      {groupWeightSum !== 100 && (
        <div className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-xs font-bold">
          <span>
            ⚠ Los pesos de los grupos suman {groupWeightSum}%.{" "}
            {groupWeightSum < 100
              ? `Faltan ${100 - groupWeightSum} puntos porcentuales.`
              : `Sobran ${groupWeightSum - 100} puntos porcentuales.`}
          </span>
          <button
            onClick={() => setActiveTab("settings")}
            className="underline font-black cursor-pointer uppercase"
          >
            Ajustar Pesos
          </button>
        </div>
      )}

      {/* -------------------- DOUBLE COUNTING ALERT BANNER -------------------- */}
      {doubleCountingWarnings.length > 0 && (
        <div className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 p-3 rounded-2xl space-y-1 text-xs">
          {doubleCountingWarnings.map((warning, idx) => (
            <div key={idx} className="font-bold">
              ⚠ {warning}
            </div>
          ))}
        </div>
      )}

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
          <span className="hidden sm:inline">2. Comparativa Frente a Frente</span>
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
          <span className="sm:hidden">4. Conceptos ({concepts.length})</span>
          <span className="hidden sm:inline">4. Conceptos y Pesos ({concepts.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW CARDS FOR ALL OFFERS                                      */}
      {/* ========================================================================= */}
      {activeTab === "all_offers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluationResults.map((result) => {
            const offerObj = offers.find((o) => o.id === result.offerId);
            const isCurrent = result.isCurrent;
            const isWinner = result.rank === 1 && !result.failsVeto && !isCurrent;

            return (
              <div
                key={result.offerId}
                className={`bg-card rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                  isWinner
                    ? "border-primary/60 ring-2 ring-primary/20"
                    : isCurrent
                    ? "border-emerald-500/50"
                    : result.failsVeto
                    ? "border-rose-500/50"
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
                          : result.failsVeto
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isCurrent
                        ? "[PUESTO ACTUAL - BASE]"
                        : isWinner
                        ? "[RECOMENDADO #1]"
                        : result.failsVeto
                        ? "[INCUMPLE VETO]"
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

                  {/* Veto Failure Warning */}
                  {result.failsVeto && (
                    <div className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 p-2.5 rounded-xl mb-3 text-xs space-y-1">
                      <div className="font-black uppercase text-[10px]">
                        ⚠ NO CUMPLE CRITERIOS IMPRESCINDIBLES
                      </div>
                      {result.vetoReasons.map((reason, i) => (
                        <div key={i} className="font-semibold text-[11px]">
                          • {reason}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-muted/40 rounded-xl p-3 border border-border/60 mb-3 text-center">
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase block">
                      Valor Económico Anual
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

                  {/* Top Strengths & Weaknesses */}
                  <div className="space-y-2 mb-4">
                    {result.strengths.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">
                          Principales Fortalezas:
                        </span>
                        {result.strengths.map((s, i) => (
                          <div key={i} className="text-xs font-semibold text-foreground flex justify-between">
                            <span>✓ {s.conceptName}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {s.score100}/100 ({s.contributionPoints} pts)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.weaknesses.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide block">
                          Principales Debilidades:
                        </span>
                        {result.weaknesses.map((w, i) => (
                          <div key={i} className="text-xs font-semibold text-foreground flex justify-between">
                            <span>⚠ {w.conceptName}</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {w.score100}/100 ({w.contributionPoints} pts)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center gap-2">
                  <button
                    onClick={() => setSelectedExplanationOfferId(result.offerId)}
                    className="text-xs font-black text-primary hover:underline cursor-pointer uppercase"
                  >
                    ¿Por qué {result.compositeScore} pts?
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
      {/* TAB 2: SIDE-BY-SIDE COMPARISON & SENSITIVITY                              */}
      {/* ========================================================================= */}
      {activeTab === "comparison" && (
        <div className="space-y-4">
          {/* COMPARISON PICKER HEADER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card rounded-2xl border border-border p-4">
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase mb-1">
                Oferta A (Comparar)
              </label>
              <select
                value={offerIdA}
                onChange={(e) => setOfferIdA(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground text-xs"
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.isCurrent ? "📌 [ACTUAL] " : ""}
                    {o.title} - {o.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase mb-1">
                Oferta B (Comparar)
              </label>
              <select
                value={offerIdB}
                onChange={(e) => setOfferIdB(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground text-xs"
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.isCurrent ? "📌 [ACTUAL] " : ""}
                    {o.title} - {o.company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SENSITIVITY & ROBUSTNESS INSIGHTS CALLOUT */}
          {sensitivityAnalysis && (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  ANÁLISIS DE SENSIBILIDAD Y ROBUSTEZ
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    sensitivityAnalysis.robustnessStatus === "ROBUSTO"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  RESULTADO {sensitivityAnalysis.robustnessStatus}
                </span>
              </div>

              <p className="text-xs font-semibold text-foreground">
                {sensitivityAnalysis.robustnessDescription}
              </p>

              {sensitivityAnalysis.insights.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase">
                    ¿Qué tendría que cambiar para que ganara la otra oferta?
                  </span>
                  {sensitivityAnalysis.insights.map((insight, idx) => (
                    <div key={idx} className="text-xs font-bold text-primary">
                      💡 {insight.impactDescription}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DETAILED SIDE-BY-SIDE MATRIX TABLE */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-black text-[10px]">
                    <th className="p-3">Criterio / Concepto</th>
                    <th className="p-3">Peso Grupo</th>
                    <th className="p-3">Peso Concepto</th>
                    <th className="p-3">Peso Global Real</th>
                    <th className="p-3 text-center">{selectedOfferA?.title || "Oferta A"}</th>
                    <th className="p-3 text-center">{selectedOfferB?.title || "Oferta B"}</th>
                    <th className="p-3 text-center">Ganador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-semibold">
                  {groups.map((group) => {
                    const groupConcepts = concepts.filter(
                      (c) => c.groupId === group.id && c.isActive !== false
                    );
                    const resAGroup = evalA?.groupResults.find((g) => g.groupId === group.id);
                    const resBGroup = evalB?.groupResults.find((g) => g.groupId === group.id);

                    return (
                      <React.Fragment key={group.id}>
                        {/* GROUP HEADER ROW */}
                        <tr className="bg-muted/30 font-black text-foreground">
                          <td className="p-3 uppercase">{group.name}</td>
                          <td className="p-3 text-primary">{group.weight}%</td>
                          <td className="p-3 text-muted-foreground">-</td>
                          <td className="p-3 text-muted-foreground">{group.weight}%</td>
                          <td className="p-3 text-center">
                            {resAGroup?.score100 ?? 0}/100 ({resAGroup?.contributionPoints ?? 0} pts)
                          </td>
                          <td className="p-3 text-center">
                            {resBGroup?.score100 ?? 0}/100 ({resBGroup?.contributionPoints ?? 0} pts)
                          </td>
                          <td className="p-3 text-center font-black">
                            {(resAGroup?.score100 ?? 0) > (resBGroup?.score100 ?? 0)
                              ? "A"
                              : (resBGroup?.score100 ?? 0) > (resAGroup?.score100 ?? 0)
                              ? "B"
                              : "="}
                          </td>
                        </tr>

                        {/* CONCEPT ROWS */}
                        {groupConcepts.map((concept) => {
                          const cA = resAGroup?.conceptResults.find(
                            (c) => c.conceptId === concept.id
                          );
                          const cB = resBGroup?.conceptResults.find(
                            (c) => c.conceptId === concept.id
                          );

                          const scoreA = cA?.score100 ?? 0;
                          const scoreB = cB?.score100 ?? 0;
                          const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "=";

                          return (
                            <tr key={concept.id} className="hover:bg-muted/20">
                              <td className="p-3 pl-6 text-foreground">
                                {concept.name}
                                {concept.isVeto && (
                                  <span className="ml-1.5 text-[9px] font-black text-rose-500 uppercase">
                                    [VETO]
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-muted-foreground">{group.weight}%</td>
                              <td className="p-3 text-muted-foreground">{concept.weightWithinGroup}%</td>
                              <td className="p-3 font-bold text-foreground">
                                {((group.weight * concept.weightWithinGroup) / 100).toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">
                                <div>{scoreA}/100</div>
                                <div className="text-[10px] text-muted-foreground">
                                  +{cA?.contributionPoints ?? 0} pts
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <div>{scoreB}/100</div>
                                <div className="text-[10px] text-muted-foreground">
                                  +{cB?.contributionPoints ?? 0} pts
                                </div>
                              </td>
                              <td
                                className={`p-3 text-center font-black ${
                                  winner === "A"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : winner === "B"
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {winner}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFERS LIST & CRUD MANAGEMENT                                       */}
      {/* ========================================================================= */}
      {activeTab === "offers_crud" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
              Listado Completo de Ofertas ({offers.length})
            </h2>
            <button
              onClick={() => handleOpenOfferModal()}
              className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover cursor-pointer uppercase"
            >
              + Añadir Oferta
            </button>
          </div>

          <div className="divide-y divide-border/60">
            {offers.map((offer) => {
              const evalRes = evaluationResults.find((r) => r.offerId === offer.id);
              return (
                <div key={offer.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {offer.isCurrent && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          PUESTO ACTUAL
                        </span>
                      )}
                      <h3 className="text-sm font-black text-foreground">{offer.title}</h3>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {offer.company} • {formatModalityText(offer)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-black text-primary">
                        {evalRes?.compositeScore ?? 0} / 100 PTS
                      </div>
                      <div className="text-[11px] font-bold text-muted-foreground">
                        {formatCurrency(evalRes?.totalMonetaryValue ?? 0)}/año
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenOfferModal(offer)}
                        className="px-3 py-1 rounded-lg bg-muted text-foreground font-bold text-xs hover:bg-muted/80 cursor-pointer uppercase"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/25 cursor-pointer uppercase"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GROUPS & CONCEPTS CONFIGURATION                                    */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* INITIAL TEMPLATES SELECTOR */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest block">
              PLANTILLAS INICIALES DE PONDERACIÓN
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {PRESET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyPresetTemplate(tpl.id)}
                  className="p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 text-left transition cursor-pointer space-y-1"
                >
                  <div className="text-xs font-black text-foreground">{tpl.name}</div>
                  <div className="text-[10px] font-semibold text-muted-foreground leading-tight">
                    {tpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* GROUPS & CONCEPTS MANAGEMENT */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-wider">
                  Configuración de Grupos y Pesos ({groups.length})
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Los pesos de los grupos activos deben sumar exactamente 100%.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenGroupModal()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover cursor-pointer uppercase"
                >
                  + Crear Grupo
                </button>
              </div>
            </div>

            {/* GROUPS LIST & CONCEPTS */}
            <div className="space-y-4">
              {groups.map((group) => {
                const groupConcepts = concepts.filter((c) => c.groupId === group.id);
                const isCollapsed = collapsedSettingsGroups[group.id];
                const conceptSum = conceptWeightSumsPerGroup[group.id] || 0;

                return (
                  <div key={group.id} className="border border-border rounded-xl p-3 space-y-3 bg-muted/20">
                    {/* GROUP HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSettingsGroupCollapse(group.id)}
                          className="font-black text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                        >
                          {isCollapsed ? "►" : "▼"}
                        </button>
                        <h3 className="text-sm font-black text-foreground uppercase">{group.name}</h3>
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Peso Grupo: {group.weight}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            conceptSum === 100
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          Conceptos: {conceptSum}%
                        </span>

                        <button
                          onClick={() => handleOpenConceptModal(undefined, group.id)}
                          className="px-2.5 py-1 bg-muted text-foreground font-bold text-xs rounded-lg hover:bg-muted/80 cursor-pointer uppercase"
                        >
                          + Concepto
                        </button>
                        <button
                          onClick={() => handleOpenGroupModal(group)}
                          className="px-2.5 py-1 bg-muted text-foreground font-bold text-xs rounded-lg hover:bg-muted/80 cursor-pointer uppercase"
                        >
                          Editar Grupo
                        </button>
                      </div>
                    </div>

                    {/* CONCEPTS LIST INSIDE GROUP */}
                    {!isCollapsed && (
                      <div className="divide-y divide-border/60 pt-2 border-t border-border/60">
                        {groupConcepts.map((concept) => {
                          const globalRealWeight = (
                            (group.weight * concept.weightWithinGroup) /
                            100
                          ).toFixed(1);

                          return (
                            <div
                              key={concept.id}
                              className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-foreground">{concept.name}</span>
                                  {concept.isVeto && (
                                    <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">
                                      VETO ({concept.vetoType === "max" ? "<=" : ">="} {concept.vetoThreshold})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  Tipo: {concept.conceptType} • Unidad: {formatUnitLabel(concept.unit)} • Dirección: {concept.preferenceDirection}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-xs font-bold text-muted-foreground">
                                    Peso en Grupo: {concept.weightWithinGroup}%
                                  </span>
                                  <span className="text-[10px] font-black text-primary block">
                                    Peso Global Real: {globalRealWeight}%
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleOpenConceptModal(concept)}
                                  className="px-2 py-1 bg-muted text-foreground font-bold text-[11px] rounded hover:bg-muted/80 cursor-pointer uppercase"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteConcept(concept.id)}
                                  className="px-2 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[11px] rounded hover:bg-rose-500/25 cursor-pointer uppercase"
                                >
                                  Eliminar
                                </button>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCORE EXPLANATION ("¿Por qué esta oferta tiene X puntos?")         */}
      {/* ========================================================================= */}
      {selectedExplanationOfferId && explanationOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-primary uppercase">
                  DESGLOSE COMPLETO DE PUNTUACIÓN
                </span>
                <h2 className="text-lg font-black text-foreground">
                  ¿Por qué {explanationOffer.offerTitle} tiene {explanationOffer.compositeScore} puntos?
                </h2>
              </div>
              <button
                onClick={() => setSelectedExplanationOfferId(null)}
                className="text-muted-foreground hover:text-foreground font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {explanationOffer.groupResults.map((gRes) => (
                <div key={gRes.groupId} className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center font-black">
                    <span className="text-xs uppercase text-foreground">{gRes.groupName} ({gRes.groupWeight}%)</span>
                    <span className="text-xs text-primary">{gRes.score100} / 100 PTS (+{gRes.contributionPoints} pts finales)</span>
                  </div>

                  <div className="divide-y divide-border/60 text-xs font-semibold pt-1 border-t border-border/40">
                    {gRes.conceptResults.map((cRes) => (
                      <div key={cRes.conceptId} className="py-1.5 flex justify-between items-center">
                        <div>
                          <div className="text-foreground">{cRes.conceptName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Peso global real: {cRes.globalWeight.toFixed(1)}% | Valoración: {cRes.score100}/100
                          </div>
                        </div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{cRes.contributionPoints} pts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border text-right">
              <button
                onClick={() => setSelectedExplanationOfferId(null)}
                className="px-5 py-2 bg-primary text-primary-foreground font-black rounded-xl text-xs uppercase cursor-pointer"
              >
                Cerrar Desglose
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFER FORM (ADD/EDIT)                                               */}
      {/* ========================================================================= */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <h2 className="text-base font-black text-foreground uppercase border-b border-border pb-2">
              {editingOffer ? "Editar Oferta de Empleo" : "Añadir Nueva Oferta"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-black text-foreground uppercase mb-1">Título del Puesto</label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">Empresa</label>
                <input
                  type="text"
                  value={offerCompany}
                  onChange={(e) => setOfferCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">Modalidad de Trabajo</label>
                <select
                  value={offerWorkModality}
                  onChange={(e) => setOfferWorkModality(e.target.value as WorkModality)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                >
                  <option value="remoto">100% Remoto</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="presencial">100% Presencial</option>
                </select>
              </div>

              {offerWorkModality === "hibrido" && (
                <div>
                  <label className="block font-black text-foreground uppercase mb-1">Días Oficina / Semana</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={offerOfficeDays}
                    onChange={(e) => setOfferOfficeDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                  />
                </div>
              )}
            </div>

            {/* CONCEPT VALUES EDITING */}
            <div className="space-y-3 pt-2 border-t border-border">
              <span className="text-[10px] font-black text-primary uppercase block">
                VALORES Y PUNTUACIONES POR CONCEPTO
              </span>

              <div className="space-y-3">
                {concepts.map((concept) => {
                  const val = offerValues[concept.id];
                  const scoreOverride = offerConceptScores[concept.id];

                  return (
                    <div key={concept.id} className="p-3 bg-muted/20 border border-border rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-foreground">{concept.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{concept.conceptType}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                            Valor Real ({formatUnitLabel(concept.unit)})
                          </label>
                          {concept.unit === "BOOLEAN" ? (
                            <select
                              value={val ? "true" : "false"}
                              onChange={(e) =>
                                setOfferValues((prev) => ({
                                  ...prev,
                                  [concept.id]: e.target.value === "true",
                                }))
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground"
                            >
                              <option value="true">Sí (Incluido)</option>
                              <option value="false">No (No Incluido)</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              value={typeof val === "number" ? val : 0}
                              onChange={(e) =>
                                setOfferValues((prev) => ({
                                  ...prev,
                                  [concept.id]: Number(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground"
                            />
                          )}
                        </div>

                        {(concept.conceptType === "subjective" || concept.conceptType === "mixed") && (
                          <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                              Puntuación Subjetiva Directa (0-100)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scoreOverride ?? 70}
                              onChange={(e) =>
                                setOfferConceptScores((prev) => ({
                                  ...prev,
                                  [concept.id]: Number(e.target.value),
                                }))
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOffer}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase cursor-pointer"
              >
                Guardar Oferta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONCEPT FORM (ADD/EDIT)                                            */}
      {/* ========================================================================= */}
      {showConceptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <h2 className="text-base font-black text-foreground uppercase border-b border-border pb-2">
              {editingConcept ? "Editar Concepto de Evaluación" : "Crear Nuevo Concepto"}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-foreground uppercase mb-1">Nombre del Concepto</label>
                <input
                  type="text"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">Grupo al que Pertenece</label>
                <select
                  value={conceptGroupId}
                  onChange={(e) => setConceptGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-foreground uppercase mb-1">Tipo de Concepto</label>
                  <select
                    value={conceptType}
                    onChange={(e) => setConceptType(e.target.value as ConceptType)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                  >
                    <option value="economic">Económico</option>
                    <option value="objective">Objetivo</option>
                    <option value="subjective">Subjetivo</option>
                    <option value="mixed">Mixto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-foreground uppercase mb-1">Peso en Grupo (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={conceptWeightWithinGroup}
                    onChange={(e) => setConceptWeightWithinGroup(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-foreground uppercase mb-1">Dirección de Preferencia</label>
                  <select
                    value={conceptPreferenceDirection}
                    onChange={(e) => setConceptPreferenceDirection(e.target.value as PreferenceDirection)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                  >
                    <option value="MORE_IS_BETTER">Más es Mejor</option>
                    <option value="LESS_IS_BETTER">Menos es Mejor</option>
                    <option value="IDEAL">Valor Ideal Target</option>
                  </select>
                </div>

                {conceptPreferenceDirection === "IDEAL" && (
                  <div>
                    <label className="block font-black text-foreground uppercase mb-1">Valor Target Ideal</label>
                    <input
                      type="number"
                      value={conceptIdealValue}
                      onChange={(e) => setConceptIdealValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                    />
                  </div>
                )}
              </div>

              {/* VETO CONFIGURATION */}
              <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vetoCheck"
                    checked={conceptIsVeto}
                    onChange={(e) => setConceptIsVeto(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="vetoCheck" className="font-black text-foreground uppercase cursor-pointer">
                    Es Criterio de Veto / Imprescindible
                  </label>
                </div>

                {conceptIsVeto && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Regla de Veto
                      </label>
                      <select
                        value={conceptVetoType}
                        onChange={(e) => setConceptVetoType(e.target.value as "min" | "max")}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground"
                      >
                        <option value="min">Mínimo Exigido (Descalifica si es menor)</option>
                        <option value="max">Máximo Permitido (Descalifica si es mayor)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Valor Límite de Veto
                      </label>
                      <input
                        type="number"
                        value={conceptVetoThreshold}
                        onChange={(e) => setConceptVetoThreshold(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowConceptModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConcept}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase cursor-pointer"
              >
                Guardar Concepto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GROUP FORM (ADD/EDIT)                                              */}
      {/* ========================================================================= */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-4">
            <h2 className="text-base font-black text-foreground uppercase border-b border-border pb-2">
              {editingGroup ? "Editar Grupo de Conceptos" : "Crear Grupo de Conceptos"}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-foreground uppercase mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">Peso del Grupo en Total (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={groupWeight}
                  onChange={(e) => setGroupWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-bold text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase cursor-pointer"
              >
                Guardar Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
