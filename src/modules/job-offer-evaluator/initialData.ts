import {
  ConceptGroup,
  Concept,
  JobOffer,
  EvaluationResult,
  ConceptGroupResult,
} from "./types";

export const DEFAULT_GROUPS: ConceptGroup[] = [
  {
    id: "g_direct",
    name: "Retribución Directa",
    description: "Salario base, bonus y beneficios económicos directos de la empresa",
    color: "emerald",
  },
  {
    id: "g_benefits",
    name: "Beneficios y Salud",
    description: "Comedor, seguro médico privado y plan de pensiones",
    color: "blue",
  },
  {
    id: "g_flexibility",
    name: "Flexibilidad y Conciliación",
    description: "Teletrabajo, vacaciones y tiempo/gasto de desplazamiento",
    color: "indigo",
  },
  {
    id: "g_culture",
    name: "Cultura y Futuro",
    description: "Estabilidad laboral y plan de futuro en la empresa",
    color: "amber",
  },
];

export const DEFAULT_CONCEPTS: Concept[] = [
  // Retribución directa (100% Tangibles -> Poner Dinero €/año)
  {
    id: "c_salary_base",
    groupId: "g_direct",
    name: "Salario Base Bruto",
    description: "Sueldo fijo anual bruto en contrato",
    category: "tangible",
    weight: 10,
  },
  {
    id: "c_bonus_annual",
    groupId: "g_direct",
    name: "Bonus / Variable Estimado",
    description: "Compensación variable anual esperada",
    category: "tangible",
    weight: 8,
  },
  {
    id: "c_company_benefits",
    groupId: "g_direct",
    name: "Beneficios de la Empresa",
    description: "Cheques beneficio o retribución flexible anual aportada",
    category: "tangible",
    weight: 6,
  },

  // Beneficios y Salud (Tangibles y Ambos)
  {
    id: "c_canteen",
    groupId: "g_benefits",
    name: "Comedor",
    description: "Comida gratis = 10 pts, Llevar tupper = 0 pts + Valor en dinero del ticket/menú",
    category: "both",
    weight: 7,
  },
  {
    id: "c_health_insurance",
    groupId: "g_benefits",
    name: "Seguro Médico Privado",
    description: "Valor estimado o coste de la póliza médica privada financiada",
    category: "tangible",
    weight: 7,
  },
  {
    id: "c_pension_plan",
    groupId: "g_benefits",
    name: "Plan de Pensiones",
    description: "Aportación directa anual de la empresa al plan de empleo",
    category: "tangible",
    weight: 6,
  },

  // Flexibilidad y Conciliación (Intangibles y Ambos)
  {
    id: "c_telework",
    groupId: "g_flexibility",
    name: "Días de Teletrabajo Semanales",
    description: "100% Remoto = 10 pts, 3 días oficina = 4 pts, Oficina 5 días = 0 pts",
    category: "intangible",
    weight: 9,
  },
  {
    id: "c_vacation_days",
    groupId: "g_flexibility",
    name: "Días de Vacaciones",
    description: "Días anuales de vacaciones (Puntuación de felicidad 0-10)",
    category: "intangible",
    weight: 8,
  },
  {
    id: "c_commute",
    groupId: "g_flexibility",
    name: "Desplazamiento Diario",
    description: "Gasto de gasolina restado del salario (€/año) y valoración de tiempo de viaje (0-10)",
    category: "both",
    weight: 8,
  },

  // Cultura y Futuro (100% Intangibles -> Puntuación 0-10)
  {
    id: "c_stability",
    groupId: "g_culture",
    name: "Estabilidad Laboral",
    description: "Seguridad y solidez del puesto y la empresa (0-10 pts)",
    category: "intangible",
    weight: 9,
  },
  {
    id: "c_future_plan",
    groupId: "g_culture",
    name: "Plan de Futuro",
    description: "Proyección profesional, aprendizaje y ascenso (0-10 pts)",
    category: "intangible",
    weight: 8,
  },
];

export const DEFAULT_OFFERS: JobOffer[] = [
  {
    id: "puesto_actual",
    title: "Senior Developer",
    company: "Empresa Actual S.L.",
    location: "Madrid",
    workModality: "hibrido",
    officeDaysPerWeek: 3,
    isCurrent: true,
    status: "current",
    notes: "Mi posición actual. Conozco el equipo y los procesos.",
    commuteKmOneWay: 25,
    commuteFuelL100: 6.8,
    fuelPriceEurL: 1.55,
    values: {
      c_salary_base: 45000,
      c_bonus_annual: 3000,
      c_company_benefits: 500,
      c_canteen_money: 0,
      c_canteen_score: 3,
      c_health_insurance: 0,
      c_pension_plan: 0,
      c_telework: 4, // 2d telework / 3d office
      c_vacation_days: 6, // 23 días
      c_commute_money: 0,
      c_commute_score: 5,
      c_stability: 9,
      c_future_plan: 7,
    },
  },
  {
    id: "oferta_tech_corp",
    title: "Lead Software Engineer",
    company: "Global Tech Solutions",
    location: "Madrid",
    workModality: "remoto",
    officeDaysPerWeek: 0,
    isCurrent: false,
    status: "received",
    notes: "Oferta formal recibida. 100% en remoto, excelente paquete de beneficios.",
    commuteKmOneWay: 0,
    commuteFuelL100: 6.5,
    fuelPriceEurL: 1.55,
    values: {
      c_salary_base: 58000,
      c_bonus_annual: 6000,
      c_company_benefits: 2000,
      c_canteen_money: 1800,
      c_canteen_score: 10,
      c_health_insurance: 1200,
      c_pension_plan: 1500,
      c_telework: 10, // 100% remoto
      c_vacation_days: 9, // 26 días
      c_commute_money: 0,
      c_commute_score: 10,
      c_stability: 9,
      c_future_plan: 10,
    },
  },
  {
    id: "oferta_fintech",
    title: "Senior Systems Architect",
    company: "Fintech Innovators",
    location: "Madrid",
    workModality: "hibrido",
    officeDaysPerWeek: 3,
    isCurrent: false,
    status: "negotiating",
    notes: "Segunda ronda finalizada. Salario base más alto, requiere presencia física.",
    commuteKmOneWay: 18,
    commuteFuelL100: 7.2,
    fuelPriceEurL: 1.55,
    values: {
      c_salary_base: 64000,
      c_bonus_annual: 8000,
      c_company_benefits: 1000,
      c_canteen_money: 900,
      c_canteen_score: 7,
      c_health_insurance: 1200,
      c_pension_plan: 2000,
      c_telework: 4,
      c_vacation_days: 7,
      c_commute_money: 0,
      c_commute_score: 6,
      c_stability: 6,
      c_future_plan: 9,
    },
  },
];

export function calculateCommuteAnnualExpense(offer: JobOffer): number {
  const kmOneWay = offer.commuteKmOneWay || 0;
  if (kmOneWay <= 0) return 0;

  let presencialDaysPerWeek = 0;
  if (offer.workModality === "remoto") {
    presencialDaysPerWeek = 0;
  } else if (offer.workModality === "presencial") {
    presencialDaysPerWeek = 5;
  } else if (offer.workModality === "hibrido") {
    presencialDaysPerWeek = offer.officeDaysPerWeek !== undefined ? offer.officeDaysPerWeek : 3;
  } else {
    const teleworkDays = typeof offer.values["c_telework"] === "number" ? offer.values["c_telework"] : 0;
    presencialDaysPerWeek = Math.max(0, 5 - teleworkDays);
  }

  if (presencialDaysPerWeek <= 0) return 0;

  const workingWeeksPerYear = 44; // 220 working days / 5 = 44 weeks
  const presencialDaysPerYear = presencialDaysPerWeek * workingWeeksPerYear;

  const kmPerYear = presencialDaysPerYear * (kmOneWay * 2);
  const fuelL100 = offer.commuteFuelL100 || 6.5;
  const fuelPriceEurL = offer.fuelPriceEurL || 1.55;

  const totalLitres = (kmPerYear / 100) * fuelL100;
  const annualCost = totalLitres * fuelPriceEurL;

  return Math.round(annualCost);
}

export function calculateConceptTangibleValue(
  concept: Concept,
  offerValues: Record<string, number | boolean | string> | undefined
): number {
  if (!offerValues) return 0;

  if (concept.category === "tangible") {
    const rawVal = offerValues[concept.id];
    return typeof rawVal === "number" ? rawVal : Number(rawVal) || 0;
  }

  if (concept.category === "both") {
    const rawMoney = offerValues[`${concept.id}_money`];
    if (rawMoney !== undefined && rawMoney !== null) {
      return typeof rawMoney === "number" ? rawMoney : Number(rawMoney) || 0;
    }
    const rawVal = offerValues[concept.id];
    return typeof rawVal === "number" ? rawVal : Number(rawVal) || 0;
  }

  return 0;
}

export function calculateConceptNormalizedScore(
  concept: Concept,
  offerValues: Record<string, number | boolean | string> | undefined,
  offer?: JobOffer
): number {
  if (!offerValues) return 0;

  if (concept.id === "c_telework") {
    let officeDays = 3;
    if (offer) {
      if (offer.workModality === "remoto") officeDays = 0;
      else if (offer.workModality === "presencial") officeDays = 5;
      else if (offer.officeDaysPerWeek !== undefined) officeDays = offer.officeDaysPerWeek;
    }
    return Math.min(10, Math.max(0, (5 - officeDays) * 2));
  }

  let rawScore: unknown;
  if (concept.category === "both") {
    rawScore = offerValues[`${concept.id}_score`];
    if (rawScore === undefined) rawScore = offerValues[concept.id];
  } else {
    rawScore = offerValues[concept.id];
  }

  if (rawScore === undefined || rawScore === null) return 0;

  if (concept.category === "tangible") {
    const numEuro = typeof rawScore === "number" ? rawScore : Number(rawScore) || 0;
    return Math.min(10, Math.max(0, (numEuro / 70000) * 10));
  }

  const numScore = typeof rawScore === "number" ? rawScore : Number(rawScore) || 0;
  return Math.min(10, Math.max(0, numScore));
}

export function evaluateJobOffers(
  offers: JobOffer[],
  concepts: Concept[],
  groups: ConceptGroup[]
): EvaluationResult[] {
  const currentOffer = offers.find((o) => o.isCurrent) || offers[0];

  let currentTotalTangible = 0;
  let currentCompositeScore = 0;

  const rawResults = offers.map((offer) => {
    let totalTangible = 0;
    let weightedScoreSum = 0;
    let totalWeights = 0;

    const groupResultsMap: Record<
      string,
      { totalTangible: number; weightedScoreSum: number; weightSum: number }
    > = {};

    groups.forEach((g) => {
      groupResultsMap[g.id] = { totalTangible: 0, weightedScoreSum: 0, weightSum: 0 };
    });

    concepts.forEach((concept) => {
      const tangVal = calculateConceptTangibleValue(concept, offer.values);
      const score10 = calculateConceptNormalizedScore(concept, offer.values, offer);

      totalTangible += tangVal;

      const weight = concept.weight || 1;
      weightedScoreSum += score10 * weight;
      totalWeights += weight;

      if (groupResultsMap[concept.groupId]) {
        groupResultsMap[concept.groupId].totalTangible += tangVal;
        groupResultsMap[concept.groupId].weightedScoreSum += score10 * weight;
        groupResultsMap[concept.groupId].weightSum += weight;
      }
    });

    // Deduct car commute fuel expense from real salary (totalTangible)
    const commuteExpense = calculateCommuteAnnualExpense(offer);
    totalTangible -= commuteExpense;
    if (groupResultsMap["g_flexibility"]) {
      groupResultsMap["g_flexibility"].totalTangible -= commuteExpense;
    }

    const compositeScore =
      totalWeights > 0 ? Math.round((weightedScoreSum / (totalWeights * 10)) * 100) : 0;

    if (offer.id === currentOffer?.id) {
      currentTotalTangible = totalTangible;
      currentCompositeScore = compositeScore;
    }

    const groupResults: ConceptGroupResult[] = groups.map((g) => {
      const gData = groupResultsMap[g.id];
      const gScore100 =
        gData && gData.weightSum > 0
          ? Math.round((gData.weightedScoreSum / (gData.weightSum * 10)) * 100)
          : 0;

      return {
        groupId: g.id,
        groupName: g.name,
        color: g.color,
        totalTangibleValue: gData ? gData.totalTangible : 0,
        score100: gScore100,
      };
    });

    return {
      offerId: offer.id,
      offerTitle: offer.title,
      company: offer.company,
      isCurrent: !!offer.isCurrent,
      status: offer.status,
      totalTangibleValue: totalTangible,
      compositeScore,
      deltaTangibleVsCurrent: 0,
      deltaPercentVsCurrent: 0,
      deltaScoreVsCurrent: 0,
      groupResults,
      rank: 1,
    };
  });

  // Calculate deltas and ranking
  const resultsWithDeltas = rawResults.map((res) => {
    const deltaTangible = res.totalTangibleValue - currentTotalTangible;
    const deltaPct =
      currentTotalTangible > 0
        ? Math.round((deltaTangible / currentTotalTangible) * 100)
        : 0;
    const deltaScore = res.compositeScore - currentCompositeScore;

    return {
      ...res,
      deltaTangibleVsCurrent: deltaTangible,
      deltaPercentVsCurrent: deltaPct,
      deltaScoreVsCurrent: deltaScore,
    };
  });

  // Sort by composite score (or tangible money if equal) to determine ranking
  const sorted = [...resultsWithDeltas].sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    return b.totalTangibleValue - a.totalTangibleValue;
  });

  return sorted.map((res, index) => ({
    ...res,
    rank: index + 1,
  }));
}
