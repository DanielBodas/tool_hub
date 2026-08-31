"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ConceptGroup,
  Concept,
  JobOffer,
  ConceptCategory,
  ConceptOption,
  OfferStatus,
  WorkModality,
} from "./types";
import {
  DEFAULT_GROUPS,
  DEFAULT_CONCEPTS,
  DEFAULT_OFFERS,
  evaluateJobOffers,
  calculateConceptTangibleValue,
  calculateConceptNormalizedScore,
  calculateCommuteAnnualExpense,
} from "./initialData";

type ActiveTab = "comparison" | "all_offers" | "offers_crud" | "settings";
type FilterScope = "all" | "group" | "concept";

export function JobOfferEvaluatorModule() {
  const [groups, setGroups] = useState<ConceptGroup[]>(DEFAULT_GROUPS);
  const [concepts, setConcepts] = useState<Concept[]>(DEFAULT_CONCEPTS);
  const [offers, setOffers] = useState<JobOffer[]>(DEFAULT_OFFERS);

  const [activeTab, setActiveTab] = useState<ActiveTab>("all_offers");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 2-Column Side-by-Side Selection State
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
  const [offerIsCurrent, setOfferIsCurrent] = useState<boolean>(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("received");
  const [offerValues, setOfferValues] = useState<Record<string, number | boolean | string>>({});
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
  const [conceptCategory, setConceptCategory] = useState<ConceptCategory>("tangible");
  const [conceptWeight, setConceptWeight] = useState<number>(7);
  const [conceptOptions, setConceptOptions] = useState<ConceptOption[]>([]);

  // Group Modal State
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<ConceptGroup | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [groupDescription, setGroupDescription] = useState<string>("");
  const [groupColor, setGroupColor] = useState<string>("emerald");

  // Total weights across all active concepts for calculation of score contribution
  const totalConceptWeights = useMemo(() => {
    return concepts.reduce((sum, c) => sum + (c.weight || 1), 0);
  }, [concepts]);

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
      setOfferIsCurrent(offers.length === 0);
      setOfferStatus("received");
      const initialVals: Record<string, number | boolean | string> = {};
      concepts.forEach((c) => {
        if (c.options && c.options.length > 0) {
          initialVals[c.id] = c.options[0].id;
        } else if (c.category === "tangible") {
          initialVals[c.id] = 0;
        } else if (c.category === "intangible") {
          initialVals[c.id] = 5;
        } else if (c.category === "both") {
          initialVals[`${c.id}_money`] = 0;
          initialVals[`${c.id}_score`] = 5;
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

  const getDerivedModalityFromTelework = (
    teleworkValue: number | boolean | string | undefined,
    teleConcept?: Concept
  ): { workModality: WorkModality; officeDaysPerWeek: number } => {
    const valStr = String(teleworkValue ?? "");
    if (valStr === "tw_remoto") return { workModality: "remoto", officeDaysPerWeek: 0 };
    if (valStr === "tw_presencial") return { workModality: "presencial", officeDaysPerWeek: 5 };
    if (valStr === "tw_h4_o1") return { workModality: "hibrido", officeDaysPerWeek: 1 };
    if (valStr === "tw_h3_o2") return { workModality: "hibrido", officeDaysPerWeek: 2 };
    if (valStr === "tw_h2_o3") return { workModality: "hibrido", officeDaysPerWeek: 3 };
    if (valStr === "tw_h1_o4") return { workModality: "hibrido", officeDaysPerWeek: 4 };

    let score = 5;
    if (teleConcept?.options && teleConcept.options.length > 0) {
      const foundOpt = teleConcept.options.find((o) => o.id === valStr);
      if (foundOpt) score = foundOpt.score;
    } else if (typeof teleworkValue === "number") {
      score = teleworkValue;
    }

    if (score >= 10) return { workModality: "remoto", officeDaysPerWeek: 0 };
    if (score <= 0) return { workModality: "presencial", officeDaysPerWeek: 5 };
    const officeDays = Math.max(1, Math.min(4, Math.round((10 - score) / 2)));
    return { workModality: "hibrido", officeDaysPerWeek: officeDays };
  };

  const handleSaveOffer = () => {
    if (!offerTitle.trim() || !offerCompany.trim()) {
      alert("Introduce el título del puesto y el nombre de la empresa.");
      return;
    }

    const teleConcept = concepts.find((c) => c.id === "c_telework");
    const { workModality: derivedModality, officeDaysPerWeek: derivedOfficeDays } = getDerivedModalityFromTelework(
      offerValues["c_telework"],
      teleConcept
    );

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
      workModality: derivedModality,
      officeDaysPerWeek: derivedOfficeDays,
      isCurrent: offerIsCurrent,
      status: offerIsCurrent ? "current" : offerStatus,
      values: offerValues,
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
    const teleConcept = concepts.find((c) => c.id === "c_telework");
    const { workModality: derivedModality, officeDaysPerWeek: derivedOfficeDays } = getDerivedModalityFromTelework(
      offerValues["c_telework"],
      teleConcept
    );

    const tempOffer: JobOffer = {
      id: "temp",
      title: "",
      company: "",
      location: offerLocation,
      workModality: derivedModality,
      officeDaysPerWeek: derivedOfficeDays,
      isCurrent: false,
      status: "received",
      values: offerValues,
      commuteKmOneWay: Number(offerCommuteKm),
      commuteFuelL100: Number(offerCommuteFuelL100),
      fuelPriceEurL: Number(offerFuelPriceEurL),
    };
    return calculateCommuteAnnualExpense(tempOffer);
  }, [
    concepts,
    offerLocation,
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
      setConceptCategory(conceptToEdit.category || "tangible");
      setConceptWeight(conceptToEdit.weight);
      setConceptOptions(conceptToEdit.options ? [...conceptToEdit.options] : []);
    } else {
      setEditingConcept(null);
      setConceptName("");
      setConceptGroupId(groups[0]?.id || "g_direct");
      setConceptDescription("");
      setConceptCategory("tangible");
      setConceptWeight(7);
      setConceptOptions([]);
    }
    setShowConceptModal(true);
  };

  const handleAddConceptOption = () => {
    const newOpt: ConceptOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: "",
      score: 5,
      value: conceptCategory === "intangible" ? undefined : 0,
    };
    setConceptOptions((prev) => [...prev, newOpt]);
  };

  const handleUpdateConceptOption = (
    index: number,
    field: keyof ConceptOption,
    val: string | number | undefined
  ) => {
    setConceptOptions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteConceptOption = (index: number) => {
    setConceptOptions((prev) => prev.filter((_, i) => i !== index));
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
      weight: Number(conceptWeight),
      options: conceptOptions.length > 0 ? conceptOptions : undefined,
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

  const formatCategoryBadge = (category: ConceptCategory) => {
    if (category === "tangible") {
      return (
        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/30">
          Tangible (Dinero €/año)
        </span>
      );
    }
    if (category === "intangible") {
      return (
        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-500/30">
          Intangible (Puntuación 0-10)
        </span>
      );
    }
    return (
      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded border border-amber-500/30">
        Dinero + Puntuación
      </span>
    );
  };

  const formatValue = (
    concept: Concept,
    vals: Record<string, number | boolean | string> | undefined
  ) => {
    if (!vals) return "Sin especificar";

    if (concept.options && concept.options.length > 0) {
      const selectedOptId = vals[concept.id];
      const opt = concept.options.find((o) => o.id === String(selectedOptId));
      if (opt) {
        if (opt.value !== undefined && opt.value > 0) {
          return `${opt.label} (${formatCurrency(opt.value)}/año • ${opt.score}/10 pts)`;
        }
        return `${opt.label} (${opt.score}/10 pts)`;
      }
    }

    if (concept.category === "tangible") {
      const raw = vals[concept.id];
      const num = typeof raw === "number" ? raw : Number(raw) || 0;
      return `${formatCurrency(num)}/año`;
    }

    if (concept.category === "intangible") {
      const raw = vals[concept.id];
      const num = typeof raw === "number" ? raw : Number(raw) || 0;
      return `${num}/10 pts`;
    }

    if (concept.category === "both") {
      const moneyRaw = vals[`${concept.id}_money`] ?? vals[concept.id];
      const scoreRaw = vals[`${concept.id}_score`];
      const money = typeof moneyRaw === "number" ? moneyRaw : Number(moneyRaw) || 0;
      const score = typeof scoreRaw === "number" ? scoreRaw : Number(scoreRaw) || 0;
      return `${formatCurrency(money)}/año • ${score}/10 pts`;
    }

    return "Sin especificar";
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
          <span className="hidden sm:inline">4. Configurar Conceptos ({concepts.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARALLEL 2-COLUMN SIDE-BY-SIDE COMPARISON VIEW                      */}
      {/* ========================================================================= */}
      {activeTab === "comparison" && (
        <div className="space-y-4">
          {/* VISUAL EXECUTIVE SELECTOR TOGGLE CARDS */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
              Selecciona los 2 Puestos a Comparar Frente a Frente:
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
                        [ACTUAL]
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
                    PUESTO #2 (COMPARAR)
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs font-black text-foreground break-words">
                      {selectedOfferB?.title || "Seleccionar Puesto"}
                    </span>
                    {selectedOfferB?.isCurrent && (
                      <span className="text-[8px] sm:text-[9px] font-black uppercase px-1 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded shrink-0">
                        [ACTUAL]
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

            {/* Granular Filtering Control Row */}
            <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-muted-foreground uppercase text-[10px]">
                  Filtrar Conceptos:
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
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Position 1 Summary */}
            <div className="bg-card rounded-2xl border border-border p-2.5 sm:p-4 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border inline-block break-words">
                    {selectedOfferA?.isCurrent ? "[ACTUAL]" : "[PUESTO #1]"}
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-primary shrink-0">
                    Puntuación: {evalResultA?.compositeScore || 0} / 100 PTS
                  </span>
                </div>
                <div>
                  <h2 className="text-xs sm:text-base font-black text-foreground break-words">{selectedOfferA?.title}</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground break-words">
                    {selectedOfferA?.company} • {formatModalityText(selectedOfferA)}
                  </p>
                </div>
              </div>

              <div className="bg-muted/40 p-2 sm:p-2.5 rounded-xl border border-border text-center">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase text-muted-foreground block break-words">
                  Salario Real (Suma Tangibles)
                </span>
                <span className="text-sm sm:text-xl font-black text-foreground block break-words">
                  {formatCurrency(evalResultA?.totalTangibleValue || 0)}/año
                </span>
              </div>
            </div>

            {/* Position 2 Summary */}
            <div className="bg-card rounded-2xl border border-primary/50 ring-1 ring-primary/20 p-2.5 sm:p-4 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 bg-primary text-primary-foreground rounded inline-block break-words">
                    {selectedOfferB?.isCurrent ? "[ACTUAL]" : "[PUESTO #2]"}
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-primary shrink-0">
                    Puntuación: {evalResultB?.compositeScore || 0} / 100 PTS
                  </span>
                </div>
                <div>
                  <h2 className="text-xs sm:text-base font-black text-foreground break-words">{selectedOfferB?.title}</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground break-words">
                    {selectedOfferB?.company} • {formatModalityText(selectedOfferB)}
                  </p>
                </div>
              </div>

              <div className="bg-muted/40 p-2 sm:p-2.5 rounded-xl border border-border text-center">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase text-muted-foreground block break-words">
                  Salario Real (Suma Tangibles)
                </span>
                <span className="text-sm sm:text-xl font-black text-foreground block break-words">
                  {formatCurrency(evalResultB?.totalTangibleValue || 0)}/año
                </span>

                {/* Net Delta position B vs position A */}
                {evalResultA && evalResultB && (
                  <div className="mt-1">
                    {(() => {
                      const delta = evalResultB.totalTangibleValue - evalResultA.totalTangibleValue;
                      const pct = evalResultA.totalTangibleValue > 0
                        ? Math.round((delta / evalResultA.totalTangibleValue) * 100)
                        : 0;
                      return (
                        <span
                          className={`text-[9px] sm:text-xs font-black px-1.5 py-0.5 rounded inline-block break-words ${
                            delta >= 0
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          Dif Salario Real: {delta >= 0 ? "+" : ""}{formatCurrency(delta)}/año ({pct >= 0 ? "+" : ""}{pct}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* PARALLEL CONCEPT-BY-CONCEPT COMPARISON MATRIX */}
          <div className="space-y-4">
            {groupedConcepts.map(({ group, concepts: groupConcepts }) => {
              const isCollapsed = collapsedGroups[group.id] !== false;
              return (
              <div key={group.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Group Section Header */}
                <div className="bg-muted/60 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-border flex items-center justify-between gap-2">
                  <div className="min-w-0 pr-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground break-words leading-tight">
                      {group.name}{" "}
                      <span className="text-[10px] font-extrabold text-muted-foreground uppercase whitespace-nowrap">
                        ({groupConcepts.length})
                      </span>
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="shrink-0 whitespace-nowrap px-2 py-1 rounded-md bg-card hover:bg-muted text-foreground text-[10px] font-black uppercase border border-border cursor-pointer transition"
                  >
                    {isCollapsed ? "[+ VER CONCEPTOS]" : "[- OCULTAR]"}
                  </button>
                </div>

                {/* Concept Rows - Strict Parallel Alignment */}
                {!isCollapsed && (
                <div className="divide-y divide-border/60">
                  {groupConcepts.map((concept) => {
                    const noteA = selectedOfferA?.conceptNotes?.[concept.id];
                    const tangA = calculateConceptTangibleValue(concept, selectedOfferA?.values);
                    const scoreA10 = calculateConceptNormalizedScore(concept, selectedOfferA?.values, selectedOfferA);
                    const ptsA = totalConceptWeights > 0 ? Math.round(((scoreA10 * concept.weight) / totalConceptWeights) * 10) / 10 : 0;

                    const noteB = selectedOfferB?.conceptNotes?.[concept.id];
                    const tangB = calculateConceptTangibleValue(concept, selectedOfferB?.values);
                    const scoreB10 = calculateConceptNormalizedScore(concept, selectedOfferB?.values, selectedOfferB);
                    const ptsB = totalConceptWeights > 0 ? Math.round(((scoreB10 * concept.weight) / totalConceptWeights) * 10) / 10 : 0;

                    const diffTangible = tangB - tangA;

                    return (
                      <div key={concept.id} className="p-4 space-y-2">
                        {/* Row Header: Concept Title, Category & Description */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-foreground">
                              {concept.name}
                            </span>
                            {formatCategoryBadge(concept.category)}
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

                        {/* STRICT PARALLEL 2-COLUMN LAYOUT */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                          {/* Left Column: Position 1 Value */}
                          <div className="rounded-xl p-2 sm:p-3 border border-border bg-muted/30 space-y-1">
                            <div className="text-[9px] font-extrabold uppercase text-muted-foreground flex justify-between">
                              <span>{selectedOfferA?.title}</span>
                              <span className="font-semibold text-muted-foreground/80">Puesto #1</span>
                            </div>

                            <div className="flex justify-between items-center font-black text-foreground pt-0.5">
                              <span className="text-muted-foreground font-semibold text-[11px]">Valor:</span>
                              <span className="text-foreground">
                                {formatValue(concept, selectedOfferA?.values)}
                              </span>
                            </div>

                            {/* EXACT POINTS CONTRIBUTED TO TOTAL 0-100 SCORE */}
                            <div className="flex justify-between items-center font-extrabold text-primary text-[10px] pt-1 border-t border-border/40">
                              <span>Suma a Puntuación Final:</span>
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                +{ptsA} pts / 100
                              </span>
                            </div>

                            {noteA ? (
                              <p className="text-[10px] font-normal text-muted-foreground italic bg-background/60 p-1.5 rounded-md border border-border/40 mt-1">
                                "{noteA}"
                              </p>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/60 italic block pt-0.5">
                                Sin nota de justificación
                              </span>
                            )}
                          </div>

                          {/* Right Column: Position 2 Value */}
                          <div className="rounded-xl p-2 sm:p-3 border border-primary/30 bg-primary/5 space-y-1">
                            <div className="text-[9px] font-extrabold uppercase text-muted-foreground flex justify-between">
                              <span>{selectedOfferB?.title}</span>
                              <span className="font-semibold text-primary">Puesto #2</span>
                            </div>

                            <div className="flex justify-between items-center font-black text-foreground pt-0.5">
                              <span className="text-muted-foreground font-semibold text-[11px]">Valor:</span>
                              <span className="text-foreground">
                                {formatValue(concept, selectedOfferB?.values)}
                              </span>
                            </div>

                            {/* EXACT POINTS CONTRIBUTED TO TOTAL 0-100 SCORE */}
                            <div className="flex justify-between items-center font-extrabold text-primary text-[10px] pt-1 border-t border-primary/20">
                              <span>Suma a Puntuación Final:</span>
                              <span className="bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                                +{ptsB} pts / 100
                              </span>
                            </div>

                            {noteB ? (
                              <p className="text-[10px] font-normal text-muted-foreground italic bg-background/60 p-1.5 rounded-md border border-border/40 mt-1">
                                "{noteB}"
                              </p>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/60 italic block pt-0.5">
                                Sin nota de justificación
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delta / Difference line below parallel cards */}
                        {diffTangible !== 0 && (concept.category === "tangible" || concept.category === "both") && (
                          <div className="text-right text-[11px] font-black pt-1">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                diffTangible > 0
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              Diferencia Tangible en {concept.name}: {diffTangible > 0 ? "+" : ""}{formatCurrency(diffTangible)}/año a favor de {diffTangible > 0 ? selectedOfferB?.title : selectedOfferA?.title}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
            })}

            {/* Commute Car Expense Comparison Item */}
            {(commuteCostA > 0 || commuteCostB > 0) && (
              <div className="bg-card rounded-2xl border border-rose-500/30 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="text-xs font-black uppercase text-rose-600 dark:text-rose-400">
                    Desplazamiento Diario en Coche (Gasolina Tangible que resta del salario)
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Gasto Tangible Restado
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="bg-rose-500/10 p-2 sm:p-3 rounded-xl border border-rose-500/20 space-y-1">
                    <div className="font-extrabold uppercase text-[9px] text-muted-foreground">
                      {selectedOfferA?.title}:
                    </div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(commuteCostA)}/año
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">
                      {selectedOfferA?.commuteKmOneWay || 0} km ida • {selectedOfferA?.commuteFuelL100 || 0} L/100km @ {selectedOfferA?.fuelPriceEurL || 0} €/L
                    </span>
                  </div>

                  <div className="bg-rose-500/10 p-2 sm:p-3 rounded-xl border border-rose-500/20 space-y-1">
                    <div className="font-extrabold uppercase text-[9px] text-muted-foreground">
                      {selectedOfferB?.title}:
                    </div>
                    <div className="text-base font-black text-rose-600 dark:text-rose-400">
                      -{formatCurrency(commuteCostB)}/año
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold block">
                      {selectedOfferB?.commuteKmOneWay || 0} km ida • {selectedOfferB?.commuteFuelL100 || 0} L/100km @ {selectedOfferB?.fuelPriceEurL || 0} €/L
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
                      Puntuación: {result.compositeScore} / 100 PTS
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
                      Salario Real (Suma Tangibles)
                    </span>
                    <div className="text-xl font-black text-foreground mt-0.5">
                      {formatCurrency(result.totalTangibleValue)}
                      <span className="text-xs font-bold text-muted-foreground">/año</span>
                    </div>

                    {!isCurrent && (
                      <div
                        className={`mt-1.5 text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                          result.deltaTangibleVsCurrent >= 0
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {result.deltaTangibleVsCurrent >= 0 ? "+" : ""}
                        {formatCurrency(result.deltaTangibleVsCurrent)}/año ({result.deltaPercentVsCurrent > 0 ? "+" : ""}
                        {result.deltaPercentVsCurrent}%)
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    {concepts.slice(0, 5).map((concept) => {
                      return (
                        <div key={concept.id} className="flex justify-between py-0.5 border-b border-border/40">
                          <span className="text-muted-foreground font-semibold truncate pr-2">{concept.name}</span>
                          <span className="font-bold text-foreground">{formatValue(concept, offerObj?.values)}</span>
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
      {/* TAB 4: WEIGHTS & CONCEPT SETTINGS (GROUPED BY SECTION)                    */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-black uppercase text-foreground">
                Configuración de Grupos y Conceptos de Medición
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Organiza tus criterios en grupos de análisis, clasifícalos como Tangibles o Intangibles y ajusta sus pesos u opciones
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenGroupModal()}
                className="px-3 py-1.5 bg-muted text-foreground font-black text-xs rounded-xl hover:bg-muted/80 border border-border transition cursor-pointer uppercase shrink-0"
              >
                + Nuevo Grupo
              </button>
              <button
                onClick={() => handleOpenConceptModal()}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary-hover transition cursor-pointer uppercase shrink-0"
              >
                + Nuevo Concepto
              </button>
            </div>
          </div>

          {/* Render Groups and their corresponding Concepts */}
          <div className="space-y-4">
            {groups.map((group) => {
              const groupConcepts = concepts.filter((c) => c.groupId === group.id);
              const isCollapsed = collapsedSettingsGroups[group.id] !== false;

              return (
                <div key={group.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  {/* Group Header */}
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

                    <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
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
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase border border-rose-500/20 cursor-pointer transition"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>

                  {/* Group Concepts List */}
                  {!isCollapsed && (
                    groupConcepts.length > 0 ? (
                      <div className="divide-y divide-border/60 p-2 sm:p-3 space-y-2">
                      {groupConcepts.map((concept) => {
                        const totalAllWeights = concepts.reduce((acc, c) => acc + (c.weight || 1), 0);
                        const weightPct = totalAllWeights > 0 ? Math.round((concept.weight / totalAllWeights) * 100) : 0;

                        return (
                          <div
                            key={concept.id}
                            className="bg-card rounded-xl p-3 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs hover:border-border transition"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-foreground text-sm">{concept.name}</h4>
                                {formatCategoryBadge(concept.category)}
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
                                  Peso: {concept.weight}/10 (~{weightPct}%)
                                </span>
                                {concept.options && concept.options.length > 0 && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                    {concept.options.length} opciones de selección
                                  </span>
                                )}
                              </div>

                              {concept.description && (
                                <p className="text-[11px] text-muted-foreground font-semibold">
                                  {concept.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleOpenConceptModal(concept)}
                                className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-extrabold rounded-xl border border-border text-xs uppercase cursor-pointer transition"
                              >
                                Editar Concepto
                              </button>
                              <button
                                onClick={() => handleDeleteConcept(concept.id)}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-extrabold rounded-xl border border-rose-500/20 text-xs uppercase cursor-pointer transition"
                              >
                                Borrar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground italic font-medium">
                      No hay conceptos en este grupo. Asigna o crea un nuevo concepto para este grupo.
                    </div>
                  ))}
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
                            [ACTUAL]
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
                            [ACTUAL]
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
                Valores del Puesto por Concepto:
              </h4>

              <div className="space-y-2">
                {concepts.map((concept) => {
                  return (
                    <div
                      key={concept.id}
                      className="bg-muted/30 p-3 rounded-xl border border-border space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="font-black text-foreground text-xs">
                              {concept.name}
                            </label>
                            {formatCategoryBadge(concept.category)}
                          </div>
                          {concept.description && (
                            <span className="text-[10px] text-muted-foreground font-semibold block">
                              {concept.description}
                            </span>
                          )}
                        </div>

                        {/* DYNAMIC FORM FIELD BASED STRICTLY ON NATURE OR DICTIONARY OPTIONS */}
                        <div className="flex items-center gap-2 shrink-0">
                          {concept.options && concept.options.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                                Opción:
                              </span>
                              <select
                                value={
                                  offerValues[concept.id] !== undefined
                                    ? String(offerValues[concept.id])
                                    : concept.options[0]?.id || ""
                                }
                                onChange={(e) =>
                                  setOfferValues({
                                    ...offerValues,
                                    [concept.id]: e.target.value,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground text-xs cursor-pointer max-w-[280px] truncate"
                              >
                                {concept.options.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}{" "}
                                    {opt.value !== undefined && opt.value > 0
                                      ? `(${formatCurrency(opt.value)}/año • ${opt.score}/10 pts)`
                                      : `(${opt.score}/10 pts)`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <>
                              {concept.category === "tangible" && (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    placeholder="0"
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
                                    className="w-32 px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground text-right text-xs"
                                  />
                                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                                    €/año
                                  </span>
                                </div>
                              )}

                              {concept.category === "intangible" && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                                    Puntuación:
                                  </span>
                                  <select
                                    value={
                                      offerValues[concept.id] !== undefined
                                        ? Number(offerValues[concept.id])
                                        : 5
                                    }
                                    onChange={(e) =>
                                      setOfferValues({
                                        ...offerValues,
                                        [concept.id]: Number(e.target.value),
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground text-xs cursor-pointer"
                                  >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                      <option key={num} value={num}>
                                        {num} / 10 pts {num === 10 ? "(Excelente)" : num === 0 ? "(Pésimo)" : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {concept.category === "both" && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                                      Dinero:
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={
                                        offerValues[`${concept.id}_money`] !== undefined
                                          ? Number(offerValues[`${concept.id}_money`])
                                          : offerValues[concept.id] !== undefined
                                          ? Number(offerValues[concept.id])
                                          : ""
                                      }
                                      onChange={(e) =>
                                        setOfferValues({
                                          ...offerValues,
                                          [`${concept.id}_money`]: Number(e.target.value),
                                        })
                                      }
                                      className="w-28 px-2.5 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-right text-xs"
                                    />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                      €/año
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                                      Puntuación:
                                    </span>
                                    <select
                                      value={
                                        offerValues[`${concept.id}_score`] !== undefined
                                          ? Number(offerValues[`${concept.id}_score`])
                                          : 5
                                      }
                                      onChange={(e) =>
                                        setOfferValues({
                                          ...offerValues,
                                          [`${concept.id}_score`]: Number(e.target.value),
                                        })
                                      }
                                      className="px-2 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-xs cursor-pointer"
                                    >
                                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <option key={num} value={num}>
                                          {num}/10 pts
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
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

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT GROUP                                                  */}
      {/* ========================================================================= */}
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
                  placeholder="Ej. Retribución Directa / Beneficios y Salud"
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
                  placeholder="Descripción o propósito del grupo"
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

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CONCEPT WITH EDITABLE DICTIONARY OPTIONS                */}
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
                  1. Grupo Pertenece *
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
                  2. Nombre del Concepto *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Salario, Comedor, Teletrabajo..."
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-bold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  3. Descripción
                </label>
                <input
                  type="text"
                  placeholder="Explicación o notas del concepto"
                  value={conceptDescription}
                  onChange={(e) => setConceptDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold text-foreground"
                />
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  4. Tipo / Naturaleza del Concepto *
                </label>
                <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setConceptCategory("tangible")}
                    className={`py-2 px-2 rounded-lg font-black text-xs uppercase transition cursor-pointer text-center ${
                      conceptCategory === "tangible"
                        ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tangible
                  </button>
                  <button
                    type="button"
                    onClick={() => setConceptCategory("intangible")}
                    className={`py-2 px-2 rounded-lg font-black text-xs uppercase transition cursor-pointer text-center ${
                      conceptCategory === "intangible"
                        ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-2xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Intangible
                  </button>
                  <button
                    type="button"
                    onClick={() => setConceptCategory("both")}
                    className={`py-2 px-2 rounded-lg font-black text-xs uppercase transition cursor-pointer text-center ${
                      conceptCategory === "both"
                        ? "bg-card text-amber-600 dark:text-amber-400 shadow-2xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ambos
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold block mt-1">
                  {conceptCategory === "tangible" && "Pones el dinero en €/año."}
                  {conceptCategory === "intangible" && "Valoras de 0 a 10 puntos."}
                  {conceptCategory === "both" && "Pones el dinero en €/año Y valoras de 0 a 10 puntos."}
                </span>
              </div>

              <div>
                <label className="block font-black text-foreground uppercase mb-1">
                  5. Peso (Importancia 1 a 10)
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

              {/* EDITABLE CATEGORY OPTIONS (RESTRICTED strictly TO INTANGIBLE CONCEPTS) */}
              {conceptCategory === "intangible" && (
                <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-3 pt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="block font-black uppercase text-foreground text-xs">
                        Opciones Seleccionables (Categorías de Evaluación):
                      </span>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        Crea las categorías fijas que se podrán elegir en las ofertas con la puntuación (0-10) que para ti representa cada una
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddConceptOption}
                      className="px-2.5 py-1 bg-primary text-primary-foreground font-black text-[10px] uppercase rounded-lg hover:bg-primary-hover cursor-pointer shrink-0"
                    >
                      + Añadir Opción
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[30dvh] overflow-y-auto pr-1">
                    {conceptOptions.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className="bg-card p-2.5 rounded-xl border border-border space-y-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Nombre de la opción (ej: Remoto 5 días / Hybrid 3d casa 2d oficina)"
                            value={opt.label}
                            onChange={(e) => handleUpdateConceptOption(idx, "label", e.target.value)}
                            className="flex-1 px-2.5 py-1 rounded-lg border border-border bg-background font-bold text-foreground text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteConceptOption(idx)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-lg text-[10px] uppercase cursor-pointer shrink-0"
                          >
                            Borrar
                          </button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                              Valoración:
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={opt.score}
                              onChange={(e) =>
                                handleUpdateConceptOption(idx, "score", Number(e.target.value))
                              }
                              className="w-16 px-2 py-0.5 rounded-lg border border-border bg-background font-bold text-foreground text-center text-xs"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">/ 10 pts</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {conceptOptions.length === 0 && (
                      <div className="text-center py-2 text-xs text-muted-foreground italic font-medium">
                        Sin opciones prefijadas. Se elegirá una puntuación numérica directa (0 a 10) en cada puesto.
                      </div>
                    )}
                  </div>
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
