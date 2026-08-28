import {
  ConceptGroup,
  Concept,
  JobOffer,
  EvaluationResult,
  ConceptGroupResult,
  DetailedConceptResult,
  PriorityScenario,
  SensitivityAnalysisResult,
  SensitivityInsight,
} from "./types";

export const DEFAULT_GROUPS: ConceptGroup[] = [
  {
    id: "g_direct",
    name: "Economía y Compensación",
    description: "Salario base, bonus, vales comida y aportaciones monetarias directas",
    color: "emerald",
    weight: 30,
    order: 1,
    isActive: true,
  },
  {
    id: "g_flexibility",
    name: "Conciliación y Flexibilidad",
    description: "Teletrabajo, horario, vacaciones y tiempo libre disponible",
    color: "indigo",
    weight: 25,
    order: 2,
    isActive: true,
  },
  {
    id: "g_benefits",
    name: "Beneficios y Salud",
    description: "Seguro médico, plan de pensiones y presupuesto de formación",
    color: "blue",
    weight: 20,
    order: 3,
    isActive: true,
  },
  {
    id: "g_culture",
    name: "Cultura y Desarrollo",
    description: "Proyección profesional, aprendizaje, equipo y estabilidad",
    color: "amber",
    weight: 25,
    order: 4,
    isActive: true,
  },
];

export const DEFAULT_CONCEPTS: Concept[] = [
  // ECONOMÍA (Group weight: 30%)
  {
    id: "c_salary_base",
    groupId: "g_direct",
    name: "Salario Base Bruto",
    description: "Sueldo fijo anual bruto (€/año)",
    unit: "EUR_YEAR",
    conceptType: "economic",
    weightWithinGroup: 60, // Global weight = 30% * 60% = 18%
    order: 1,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    isMonetaryTotal: true,
    isVeto: false,
    vetoThreshold: 40000,
    vetoType: "min",
  },
  {
    id: "c_bonus_annual",
    groupId: "g_direct",
    name: "Bonus / Variable Estimado",
    description: "Compensación variable anual esperada (€/año)",
    unit: "EUR_YEAR",
    conceptType: "economic",
    weightWithinGroup: 25, // Global weight = 30% * 25% = 7.5%
    order: 2,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    isMonetaryTotal: true,
  },
  {
    id: "c_meal_vouchers",
    groupId: "g_direct",
    name: "Subvención Comedor / Cheque Gourmet",
    description: "Importe mensual en tarjeta restaurante (€/mes)",
    unit: "EUR_MONTH",
    conceptType: "economic",
    weightWithinGroup: 15, // Global weight = 30% * 15% = 4.5%
    order: 3,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    isMonetaryTotal: true,
    monetaryEquivalencePerUnit: 12, // 12 months per year
  },

  // CONCILIACIÓN Y FLEXIBILIDAD (Group weight: 25%)
  {
    id: "c_telework",
    groupId: "g_flexibility",
    name: "Días de Teletrabajo / Semana",
    description: "Días semanales trabajando en remoto",
    unit: "DAYS_WEEK",
    conceptType: "objective",
    weightWithinGroup: 50, // Global weight = 25% * 50% = 12.5%
    order: 1,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    idealValue: 5,
    isVeto: false,
    vetoThreshold: 1,
    vetoType: "min",
  },
  {
    id: "c_vacation",
    groupId: "g_flexibility",
    name: "Días de Vacaciones / Año",
    description: "Días laborables retribuidos de descanso anual",
    unit: "DAYS_YEAR",
    conceptType: "objective",
    weightWithinGroup: 30, // Global weight = 25% * 30% = 7.5%
    order: 2,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
  },
  {
    id: "c_commute",
    groupId: "g_flexibility",
    name: "Desplazamiento Diario (Minutos)",
    description: "Minutos ida y vuelta al lugar de trabajo por día presencial",
    unit: "MINUTES_DAY",
    conceptType: "objective",
    weightWithinGroup: 20, // Global weight = 25% * 20% = 5.0%
    order: 3,
    isActive: true,
    preferenceDirection: "LESS_IS_BETTER",
    isVeto: false,
    vetoThreshold: 60,
    vetoType: "max",
  },

  // BENEFICIOS Y SALUD (Group weight: 20%)
  {
    id: "c_health",
    groupId: "g_benefits",
    name: "Seguro Médico Privado",
    description: "Cobertura médica privada financiada por la empresa",
    unit: "BOOLEAN",
    conceptType: "economic",
    weightWithinGroup: 40, // Global weight = 20% * 40% = 8.0%
    order: 1,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    isMonetaryTotal: true,
    monetaryEquivalencePerUnit: 1200,
  },
  {
    id: "c_pension",
    groupId: "g_benefits",
    name: "Plan de Pensiones (Aportación Empresa)",
    description: "Aportación directa anual de la empresa al plan (€/año)",
    unit: "EUR_YEAR",
    conceptType: "economic",
    weightWithinGroup: 35, // Global weight = 20% * 35% = 7.0%
    order: 2,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    isMonetaryTotal: true,
  },
  {
    id: "c_training",
    groupId: "g_benefits",
    name: "Presupuesto de Formación",
    description: "Fondo anual para cursos, conferencias y certs (€/año)",
    unit: "EUR_YEAR",
    conceptType: "economic",
    weightWithinGroup: 25, // Global weight = 20% * 25% = 5.0%
    order: 3,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
    isMonetaryTotal: true,
  },

  // CULTURA Y DESARROLLO (Group weight: 25%)
  {
    id: "c_growth",
    groupId: "g_culture",
    name: "Proyección y Plan de Carrera",
    description: "Oportunidades reales de ascenso y aprendizaje técnico",
    unit: "SCORE_10",
    conceptType: "subjective",
    weightWithinGroup: 60, // Global weight = 25% * 60% = 15.0%
    order: 1,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
  },
  {
    id: "c_environment",
    groupId: "g_culture",
    name: "Ambiente de Trabajo y Estabilidad",
    description: "Cultura de equipo, liderazgo y solidez de la empresa",
    unit: "SCORE_10",
    conceptType: "subjective",
    weightWithinGroup: 40, // Global weight = 25% * 40% = 10.0%
    order: 2,
    isActive: true,
    preferenceDirection: "MORE_IS_BETTER",
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
      c_meal_vouchers: 0,
      c_telework: 2,
      c_vacation: 23,
      c_commute: 50,
      c_health: false,
      c_pension: 0,
      c_training: 500,
      c_growth: 6,
      c_environment: 7,
    },
    conceptScores: {
      c_growth: 60,
      c_environment: 70,
    },
    conceptNotes: {
      c_growth: "Proyecto estable pero pocas oportunidades de promocionar pronto.",
      c_environment: "Buen ambiente entre compañeros.",
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
      c_meal_vouchers: 220,
      c_telework: 5,
      c_vacation: 26,
      c_commute: 0,
      c_health: true,
      c_pension: 1500,
      c_training: 2000,
      c_growth: 8,
      c_environment: 8,
    },
    conceptScores: {
      c_growth: 85,
      c_environment: 80,
    },
    conceptNotes: {
      c_growth: "Posición de liderazgo con equipo a cargo y tecnología punta.",
      c_environment: "Muy buenas valoraciones en Glassdoor.",
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
      c_meal_vouchers: 180,
      c_telework: 2,
      c_vacation: 24,
      c_commute: 35,
      c_health: true,
      c_pension: 2000,
      c_training: 1000,
      c_growth: 9,
      c_environment: 6,
    },
    conceptScores: {
      c_growth: 90,
      c_environment: 60,
    },
    conceptNotes: {
      c_growth: "Alta complejidad técnica en infraestructura financiera.",
      c_environment: "Ritmo muy exigente y horas extras frecuentes.",
    },
  },
];

export const PRESET_TEMPLATES = [
  {
    id: "balanced",
    name: "Equilibrado (Estándar)",
    description: "Distribución armónica entre Economía (30%), Conciliación (25%), Desarrollo (25%) y Salud (20%).",
    groupWeights: {
      g_direct: 30,
      g_flexibility: 25,
      g_benefits: 20,
      g_culture: 25,
    },
  },
  {
    id: "economic",
    name: "Prioridad Económica",
    description: "Enfocado al máximo impacto salarial e ingresos monetarios (Economía 50%).",
    groupWeights: {
      g_direct: 50,
      g_flexibility: 15,
      g_benefits: 20,
      g_culture: 15,
    },
  },
  {
    id: "career",
    name: "Carrera y Aprendizaje",
    description: "Prioriza el desarrollo técnico, proyección y reputación de la empresa (Cultura 45%).",
    groupWeights: {
      g_direct: 25,
      g_flexibility: 15,
      g_benefits: 15,
      g_culture: 45,
    },
  },
  {
    id: "quality_life",
    name: "Calidad de Vida y Conciliación",
    description: "Prioriza el teletrabajo, vacaciones, cercanía y flexibilidad horaria (Conciliación 45%).",
    groupWeights: {
      g_direct: 20,
      g_flexibility: 45,
      g_benefits: 15,
      g_culture: 20,
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

  const workingWeeksPerYear = 44;
  const presencialDaysPerYear = presencialDaysPerWeek * workingWeeksPerYear;
  const kmPerYear = presencialDaysPerYear * (kmOneWay * 2);
  const fuelL100 = offer.commuteFuelL100 || 6.5;
  const fuelPriceEurL = offer.fuelPriceEurL || 1.55;

  const totalLitres = (kmPerYear / 100) * fuelL100;
  const annualCost = totalLitres * fuelPriceEurL;

  return Math.round(annualCost);
}

export function calculateConceptMonetaryValue(
  concept: Concept,
  rawValue: number | boolean | undefined
): number {
  if (rawValue === undefined || rawValue === null || !concept.isMonetaryTotal) return 0;

  if (concept.unit === "EUR_YEAR") {
    return typeof rawValue === "number" ? rawValue : 0;
  }

  if (concept.unit === "EUR_MONTH") {
    const numeric = typeof rawValue === "number" ? rawValue : 0;
    const multiplier = concept.monetaryEquivalencePerUnit ?? 12;
    return numeric * multiplier;
  }

  if (concept.unit === "BOOLEAN") {
    const multiplier = concept.monetaryEquivalencePerUnit ?? 0;
    return rawValue === true || rawValue === 1 ? multiplier : 0;
  }

  if (concept.monetaryEquivalencePerUnit && concept.monetaryEquivalencePerUnit > 0) {
    const numeric = typeof rawValue === "number" ? rawValue : 0;
    return numeric * concept.monetaryEquivalencePerUnit;
  }

  return 0;
}

export function calculateConceptNormalizedScore(
  concept: Concept,
  rawValue: number | boolean | undefined,
  directScore: number | undefined,
  allValuesForConcept: (number | boolean | undefined)[]
): number {
  // If user entered an explicit 0-100 direct score override
  if (directScore !== undefined && directScore !== null && !isNaN(directScore)) {
    return Math.min(100, Math.max(0, directScore));
  }

  if (rawValue === undefined || rawValue === null) return 0;

  const numVal = typeof rawValue === "boolean" ? (rawValue ? 1 : 0) : Number(rawValue);

  // Preference direction: IDEAL
  if (concept.preferenceDirection === "IDEAL" && concept.idealValue !== undefined) {
    const ideal = concept.idealValue;
    const diff = Math.abs(numVal - ideal);
    const maxDiff = Math.max(ideal, 5); // baseline distance scale
    const score = Math.max(0, 100 - (diff / maxDiff) * 100);
    return Math.round(score);
  }

  // Economic concepts using Min-Max Normalization across active offers
  if (concept.conceptType === "economic" || concept.unit === "EUR_YEAR" || concept.unit === "EUR_MONTH") {
    const numericValues = allValuesForConcept
      .map((v) => {
        if (v === undefined || v === null) return 0;
        if (typeof v === "boolean") return v ? 1 : 0;
        return Number(v);
      })
      .filter((v) => !isNaN(v));

    if (numericValues.length === 0) return 100;

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (max === min) return 100; // All offers share exact same value -> assign 100 pts

    let score = ((numVal - min) / (max - min)) * 100;
    if (concept.preferenceDirection === "LESS_IS_BETTER") {
      score = ((max - numVal) / (max - min)) * 100;
    }
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // Objective / Unit-based normalization
  let score = 0;
  switch (concept.unit) {
    case "SCORE_10":
      score = numVal * 10;
      break;
    case "BOOLEAN":
      score = numVal ? 100 : 0;
      break;
    case "DAYS_WEEK":
      score = Math.min(100, (numVal / 5) * 100);
      break;
    case "DAYS_YEAR":
      // Baseline 22 days -> 50 pts, 32 days -> 100 pts
      score = Math.min(100, Math.max(0, ((numVal - 20) / 10) * 100));
      break;
    case "MINUTES_DAY":
      // 0 min -> 100 pts, 60 min -> 0 pts
      score = Math.max(0, 100 - (numVal / 60) * 100);
      break;
    case "PERCENT":
      score = Math.min(100, Math.max(0, numVal));
      break;
    default:
      score = Math.min(100, Math.max(0, numVal * 10));
      break;
  }

  if (concept.preferenceDirection === "LESS_IS_BETTER") {
    score = 100 - score;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function checkConceptVeto(
  concept: Concept,
  rawValue: number | boolean | undefined
): { failsVeto: boolean; reason?: string } {
  if (!concept.isVeto || concept.vetoThreshold === undefined || rawValue === undefined || rawValue === null) {
    return { failsVeto: false };
  }

  const numVal = typeof rawValue === "boolean" ? (rawValue ? 1 : 0) : Number(rawValue);
  const threshold = concept.vetoThreshold;

  if (concept.vetoType === "max" || concept.preferenceDirection === "LESS_IS_BETTER") {
    if (numVal > threshold) {
      return {
        failsVeto: true,
        reason: `${concept.name}: ${numVal} supera el máximo permitido (${threshold})`,
      };
    }
  } else {
    // Default to min threshold
    if (numVal < threshold) {
      return {
        failsVeto: true,
        reason: `${concept.name}: ${numVal} no alcanza el mínimo imprescindible (${threshold})`,
      };
    }
  }

  return { failsVeto: false };
}

export function evaluateJobOffers(
  offers: JobOffer[],
  concepts: Concept[],
  groups: ConceptGroup[]
): EvaluationResult[] {
  const activeGroups = groups.filter((g) => g.isActive !== false);
  const activeConcepts = concepts.filter((c) => c.isActive !== false);

  const currentOffer = offers.find((o) => o.isCurrent) || offers[0];

  let currentTotalMonetary = 0;
  let currentCompositeScore = 0;

  // Pre-extract concept raw values across all active offers for min-max normalization
  const conceptValuesMap: Record<string, (number | boolean | undefined)[]> = {};
  activeConcepts.forEach((c) => {
    conceptValuesMap[c.id] = offers.map((o) => o.values[c.id]);
  });

  const rawResults = offers.map((offer) => {
    let totalMonetary = 0;
    let compositeScoreAcc = 0;
    const vetoReasons: string[] = [];

    const groupMap: Record<
      string,
      {
        totalMonetary: number;
        conceptResults: DetailedConceptResult[];
      }
    > = {};

    activeGroups.forEach((g) => {
      groupMap[g.id] = { totalMonetary: 0, conceptResults: [] };
    });

    activeConcepts.forEach((concept) => {
      const group = activeGroups.find((g) => g.id === concept.groupId);
      const groupWeight = group?.weight || 0;
      const weightWithinGroup = concept.weightWithinGroup || 0;
      const globalWeight = (groupWeight * weightWithinGroup) / 100; // e.g., 30 * 60 / 100 = 18 (%)

      const rawVal = offer.values[concept.id];
      const directScore = offer.conceptScores?.[concept.id];
      const monVal = calculateConceptMonetaryValue(concept, rawVal);
      const score100 = calculateConceptNormalizedScore(
        concept,
        rawVal,
        directScore,
        conceptValuesMap[concept.id] || []
      );

      const contributionPoints = (score100 * globalWeight) / 100;
      compositeScoreAcc += contributionPoints;
      totalMonetary += monVal;

      const vetoCheck = checkConceptVeto(concept, rawVal);
      if (vetoCheck.failsVeto && vetoCheck.reason) {
        vetoReasons.push(vetoCheck.reason);
      }

      const detailedConcept: DetailedConceptResult = {
        conceptId: concept.id,
        conceptName: concept.name,
        groupId: concept.groupId,
        groupName: group?.name || "",
        conceptType: concept.conceptType || "objective",
        groupWeight,
        weightWithinGroup,
        globalWeight,
        rawValue: rawVal,
        score100,
        contributionPoints: Number(contributionPoints.toFixed(2)),
        annualMonetaryValue: monVal,
        isVeto: !!concept.isVeto,
        failsVeto: vetoCheck.failsVeto,
        vetoReason: vetoCheck.reason,
      };

      if (groupMap[concept.groupId]) {
        groupMap[concept.groupId].totalMonetary += monVal;
        groupMap[concept.groupId].conceptResults.push(detailedConcept);
      }
    });

    // Subtract commute fuel expense
    const commuteExpense = calculateCommuteAnnualExpense(offer);
    totalMonetary -= commuteExpense;
    if (groupMap["g_flexibility"]) {
      groupMap["g_flexibility"].totalMonetary -= commuteExpense;
    }

    const roundedCompositeScore = Math.round(compositeScoreAcc);

    if (offer.id === currentOffer?.id) {
      currentTotalMonetary = totalMonetary;
      currentCompositeScore = roundedCompositeScore;
    }

    // Build Group Results
    const groupResults: ConceptGroupResult[] = activeGroups.map((g) => {
      const gData = groupMap[g.id] || { totalMonetary: 0, conceptResults: [] };
      let gScoreSum = 0;
      let gWeightSum = 0;

      gData.conceptResults.forEach((cr) => {
        gScoreSum += cr.score100 * cr.weightWithinGroup;
        gWeightSum += cr.weightWithinGroup;
      });

      const gScore100 = gWeightSum > 0 ? Math.round(gScoreSum / gWeightSum) : 0;
      const contributionPoints = Number(((gScore100 * g.weight) / 100).toFixed(2));

      return {
        groupId: g.id,
        groupName: g.name,
        color: g.color,
        groupWeight: g.weight,
        totalMonetaryValue: gData.totalMonetary,
        score100: gScore100,
        contributionPoints,
        conceptResults: gData.conceptResults,
      };
    });

    // Extract Top Strengths (score >= 75) and Weaknesses (score < 60)
    const allDetailed = Object.values(groupMap).flatMap((g) => g.conceptResults);
    const sortedByContrib = [...allDetailed].sort(
      (a, b) => b.contributionPoints - a.contributionPoints
    );

    const strengths = sortedByContrib
      .filter((c) => c.score100 >= 70)
      .slice(0, 3)
      .map((c) => ({
        conceptName: c.conceptName,
        score100: c.score100,
        contributionPoints: c.contributionPoints,
      }));

    const weaknesses = [...allDetailed]
      .filter((c) => c.score100 < 60)
      .sort((a, b) => a.score100 - b.score100)
      .slice(0, 3)
      .map((c) => ({
        conceptName: c.conceptName,
        score100: c.score100,
        contributionPoints: c.contributionPoints,
      }));

    return {
      offerId: offer.id,
      offerTitle: offer.title,
      company: offer.company,
      isCurrent: !!offer.isCurrent,
      status: offer.status,
      totalMonetaryValue: totalMonetary,
      compositeScore: roundedCompositeScore,
      deltaMonetaryVsCurrent: 0,
      deltaPercentVsCurrent: 0,
      deltaScoreVsCurrent: 0,
      failsVeto: vetoReasons.length > 0,
      vetoReasons,
      strengths,
      weaknesses,
      groupResults,
      rank: 1,
    };
  });

  // Calculate Deltas against Current Position
  const resultsWithDeltas = rawResults.map((res) => {
    const deltaMonetary = res.totalMonetaryValue - currentTotalMonetary;
    const deltaPct =
      currentTotalMonetary > 0
        ? Math.round((deltaMonetary / currentTotalMonetary) * 100)
        : 0;
    const deltaScore = res.compositeScore - currentCompositeScore;

    return {
      ...res,
      deltaMonetaryVsCurrent: deltaMonetary,
      deltaPercentVsCurrent: deltaPct,
      deltaScoreVsCurrent: deltaScore,
    };
  });

  // Sort ranking: Non-vetoed offers with higher score first, vetoed offers ranked last
  const sorted = [...resultsWithDeltas].sort((a, b) => {
    if (a.failsVeto !== b.failsVeto) {
      return a.failsVeto ? 1 : -1;
    }
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    return b.totalMonetaryValue - a.totalMonetaryValue;
  });

  return sorted.map((res, index) => ({
    ...res,
    rank: index + 1,
  }));
}

export function analyzeSensitivity(
  evaluationResults: EvaluationResult[],
  groups: ConceptGroup[]
): SensitivityAnalysisResult {
  const activeOffers = evaluationResults.filter((r) => !r.failsVeto);
  const leader = activeOffers[0] || evaluationResults[0];

  if (!leader || evaluationResults.length < 2) {
    return {
      leaderOfferId: leader?.offerId || "",
      leaderTitle: leader?.offerTitle || "",
      scoreGap: 0,
      robustnessStatus: "ROBUSTO",
      robustnessDescription: "No hay suficientes ofertas comparables para realizar un análisis de sensibilidad.",
      insights: [],
    };
  }

  const runnerUp = activeOffers[1] || evaluationResults[1];
  const scoreGap = leader.compositeScore - runnerUp.compositeScore;

  const insights: SensitivityInsight[] = [];

  // Compare group contributions between Leader and Runner Up
  leader.groupResults.forEach((leaderGroup) => {
    const runnerGroup = runnerUp.groupResults.find((g) => g.groupId === leaderGroup.groupId);
    if (!runnerGroup) return;

    const groupDef = groups.find((g) => g.id === leaderGroup.groupId);
    if (!groupDef) return;

    const runnerScore = runnerGroup.score100;
    const leaderScore = leaderGroup.score100;

    // If runner-up scores higher in this group, calculate required weight shift
    if (runnerScore > leaderScore) {
      const scoreDiff = runnerScore - leaderScore; // e.g. 90 - 70 = 20 pts
      // Extra points gained per 1% weight increase = scoreDiff / 100
      const extraWeightNeeded = Math.ceil((scoreGap / scoreDiff) * 100);
      const targetGroupWeight = groupDef.weight + extraWeightNeeded;

      if (targetGroupWeight <= 70) {
        insights.push({
          groupId: groupDef.id,
          groupName: groupDef.name,
          currentWeight: groupDef.weight,
          requiredWeight: targetGroupWeight,
          impactDescription: `Si el peso de "${groupDef.name}" aumentase del ${groupDef.weight}% al ~${targetGroupWeight}%, ${runnerUp.offerTitle} superaría a ${leader.offerTitle}.`,
        });
      }
    }
  });

  const isSensitive = scoreGap <= 5 || insights.length > 0;

  return {
    leaderOfferId: leader.offerId,
    leaderTitle: leader.offerTitle,
    runnerUpOfferId: runnerUp.offerId,
    runnerUpTitle: runnerUp.offerTitle,
    scoreGap,
    robustnessStatus: isSensitive ? "SENSIBLE" : "ROBUSTO",
    robustnessDescription: isSensitive
      ? `La ventaja de ${leader.offerTitle} sobre ${runnerUp.offerTitle} es estrecha (${scoreGap} pts) o depende marcadamente de los pesos asignados.`
      : `${leader.offerTitle} mantiene la primera posición de forma sólida ante variaciones moderadas de pesos (+${scoreGap} pts de diferencia).`,
    insights,
  };
}
