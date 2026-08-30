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
  // Retribución directa
  {
    id: "c_salary_base",
    groupId: "g_direct",
    name: "Salario Base Bruto",
    description: "Sueldo fijo anual bruto en contrato",
    unit: "EUR_YEAR",
    category: "tangible",
    weight: 10,
    isPositive: true,
  },
  {
    id: "c_bonus_annual",
    groupId: "g_direct",
    name: "Bonus / Variable Estimado",
    description: "Compensación variable anual esperada",
    unit: "EUR_YEAR",
    category: "tangible",
    weight: 8,
    isPositive: true,
  },
  {
    id: "c_company_benefits",
    groupId: "g_direct",
    name: "Beneficios Económicos de Empresa",
    description: "Cheques beneficio o retribución flexible anual aportada",
    unit: "EUR_YEAR",
    category: "tangible",
    weight: 6,
    isPositive: true,
  },

  // Beneficios y Salud
  {
    id: "c_canteen",
    groupId: "g_benefits",
    name: "Comedor",
    description: "Opción de comedor o ayuda de comida en la empresa",
    unit: "CATEGORICAL",
    category: "both",
    weight: 7,
    isPositive: true,
    options: [
      { id: "canteen_free", label: "Comida gratis / Ticket Restaurante total", score: 10, value: 1800 },
      { id: "canteen_subsidized", label: "Comedor subvencionando parte del menú", score: 7, value: 900 },
      { id: "canteen_tupper_space", label: "Oficina con office para llevar tupper", score: 3, value: 0 },
      { id: "canteen_none", label: "Sin facilidades ni espacio de comedor", score: 0, value: 0 },
    ],
  },
  {
    id: "c_health_insurance",
    groupId: "g_benefits",
    name: "Seguro Médico Privado",
    description: "Cobertura médica privada financiada por la empresa",
    unit: "BOOLEAN",
    category: "tangible",
    monetaryEquivalencePerUnit: 1200, // Valor estimado anual de la póliza
    weight: 7,
    isPositive: true,
  },
  {
    id: "c_pension_plan",
    groupId: "g_benefits",
    name: "Plan de Pensiones",
    description: "Aportación directa anual de la empresa al plan de empleo",
    unit: "EUR_YEAR",
    category: "tangible",
    weight: 6,
    isPositive: true,
  },

  // Flexibilidad y Conciliación
  {
    id: "c_telework",
    groupId: "g_flexibility",
    name: "Días de Teletrabajo Semanales",
    description: "Modalidad de trabajo remoto vs oficina presencial",
    unit: "CATEGORICAL",
    category: "intangible",
    weight: 9,
    isPositive: true,
    options: [
      { id: "telework_100_remote", label: "100% Remoto (5 días teletrabajo)", score: 10 },
      { id: "telework_4d", label: "4 días teletrabajo / 1 día oficina", score: 8 },
      { id: "telework_3d", label: "3 días teletrabajo / 2 días oficina", score: 6 },
      { id: "telework_2d", label: "2 días teletrabajo / 3 días oficina", score: 4 },
      { id: "telework_1d", label: "1 día teletrabajo / 4 días oficina", score: 2 },
      { id: "telework_0d", label: "100% Presencial (5 días oficina)", score: 0 },
    ],
  },
  {
    id: "c_vacation_days",
    groupId: "g_flexibility",
    name: "Días de Vacaciones / Año",
    description: "Días laborables retribuidos de descanso anual",
    unit: "DAYS_YEAR",
    category: "intangible",
    weight: 8,
    isPositive: true,
  },
  {
    id: "c_commute",
    groupId: "g_flexibility",
    name: "Desplazamiento Diario",
    description: "Tangible (gasolina/gasto que resta salario) e Intangible (tiempo desperdiciado)",
    unit: "MINUTES_DAY",
    category: "both",
    weight: 8,
    isPositive: false,
  },

  // Cultura y Futuro
  {
    id: "c_stability",
    groupId: "g_culture",
    name: "Estabilidad",
    description: "Seguridad, solvencia y solidez del puesto y la empresa",
    unit: "CATEGORICAL",
    category: "intangible",
    weight: 9,
    isPositive: true,
    options: [
      { id: "stab_high", label: "Alta estabilidad (Empresa muy consolidada / Contrato indefinido)", score: 10 },
      { id: "stab_med", label: "Estabilidad media (Sector estable / Crecimiento sostenido)", score: 6 },
      { id: "stab_low", label: "Baja estabilidad / Startup en fase inicial", score: 2 },
    ],
  },
  {
    id: "c_future_plan",
    groupId: "g_culture",
    name: "Plan de Futuro",
    description: "Proyección profesional, aprendizaje y plan de carrera",
    unit: "CATEGORICAL",
    category: "intangible",
    weight: 8,
    isPositive: true,
    options: [
      { id: "fut_excel", label: "Excelente plan de carrera y formación continua", score: 10 },
      { id: "fut_good", label: "Buen recorrido profesional y crecimiento regular", score: 7 },
      { id: "fut_flat", label: "Poca proyección / Puesto estático sin ascenso", score: 2 },
    ],
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
      c_canteen: "canteen_tupper_space",
      c_health_insurance: false,
      c_pension_plan: 0,
      c_telework: "telework_2d",
      c_vacation_days: 23,
      c_commute: 50,
      c_stability: "stab_high",
      c_future_plan: "fut_good",
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
      c_canteen: "canteen_free",
      c_health_insurance: true,
      c_pension_plan: 1500,
      c_telework: "telework_100_remote",
      c_vacation_days: 26,
      c_commute: 0,
      c_stability: "stab_high",
      c_future_plan: "fut_excel",
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
      c_canteen: "canteen_subsidized",
      c_health_insurance: true,
      c_pension_plan: 2000,
      c_telework: "telework_2d",
      c_vacation_days: 24,
      c_commute: 35,
      c_stability: "stab_med",
      c_future_plan: "fut_excel",
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
  rawValue: number | boolean | string | undefined
): number {
  if (rawValue === undefined || rawValue === null) return 0;

  // Only tangible or both categories contribute to monetary real salary
  if (concept.category !== "tangible" && concept.category !== "both") {
    return 0;
  }

  // Handle CATEGORICAL unit or concepts with predefined options
  if (concept.unit === "CATEGORICAL" || (concept.options && concept.options.length > 0)) {
    const selectedOpt = concept.options?.find((o) => o.id === String(rawValue));
    if (selectedOpt) {
      if (selectedOpt.value !== undefined) return selectedOpt.value;
      if (concept.monetaryEquivalencePerUnit) {
        return selectedOpt.score * concept.monetaryEquivalencePerUnit;
      }
    }
  }

  if (concept.unit === "EUR_YEAR") {
    return typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
  }

  if (concept.unit === "EUR_MONTH") {
    return typeof rawValue === "number" ? rawValue * 12 : (Number(rawValue) || 0) * 12;
  }

  if (concept.unit === "BOOLEAN") {
    const multiplier = concept.monetaryEquivalencePerUnit ?? 0;
    return rawValue === true || rawValue === 1 || rawValue === "true" ? multiplier : 0;
  }

  if (concept.monetaryEquivalencePerUnit) {
    const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
    return numeric * concept.monetaryEquivalencePerUnit;
  }

  return 0;
}

export function calculateConceptNormalizedScore(
  concept: Concept,
  rawValue: number | boolean | string | undefined,
  offer?: JobOffer
): number {
  if (rawValue === undefined || rawValue === null) return 0;

  // Handle CATEGORICAL options first
  if (concept.unit === "CATEGORICAL" || (concept.options && concept.options.length > 0)) {
    const selectedOpt = concept.options?.find((o) => o.id === String(rawValue));
    if (selectedOpt) {
      return Math.min(10, Math.max(0, selectedOpt.score));
    }
  }

  if (concept.id === "c_telework") {
    let officeDays = 3;
    if (offer) {
      if (offer.workModality === "remoto") officeDays = 0;
      else if (offer.workModality === "presencial") officeDays = 5;
      else if (offer.officeDaysPerWeek !== undefined) officeDays = offer.officeDaysPerWeek;
      else if (typeof rawValue === "number") officeDays = Math.max(0, 5 - rawValue);
    } else if (typeof rawValue === "number") {
      officeDays = Math.max(0, 5 - rawValue);
    }

    return Math.min(10, Math.max(0, (5 - officeDays) * 2));
  }

  let val = 0;
  if (typeof rawValue === "boolean") {
    val = rawValue ? 10 : 0;
  } else {
    val = Number(rawValue) || 0;
  }

  let score = 0;
  switch (concept.unit) {
    case "SCORE_10":
      score = Math.min(10, Math.max(0, val));
      break;
    case "BOOLEAN":
      score = val ? 10 : 0;
      break;
    case "DAYS_WEEK":
      score = Math.min(10, Math.max(0, (val / 5) * 10));
      break;
    case "DAYS_YEAR":
      score = Math.min(10, Math.max(0, ((val - 20) / 10) * 10));
      break;
    case "MINUTES_DAY":
      score = Math.max(0, 10 - (val / 60) * 10);
      break;
    case "EUR_YEAR":
    case "EUR_MONTH":
    default:
      const annualApprox = concept.unit === "EUR_MONTH" ? val * 12 : val;
      score = Math.min(10, Math.max(0, (annualApprox / 70000) * 10));
      break;
  }

  if (!concept.isPositive) {
    score = 10 - score;
  }

  return Math.round(score * 10) / 10;
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
      const rawVal = offer.values[concept.id];
      const tangVal = calculateConceptTangibleValue(concept, rawVal);
      const score10 = calculateConceptNormalizedScore(concept, rawVal, offer);

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
