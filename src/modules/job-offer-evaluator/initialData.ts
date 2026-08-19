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
    description: "Salario, bonus y compensaciones económicas líquidas o directas",
    color: "emerald",
  },
  {
    id: "g_flexibility",
    name: "Flexibilidad y Conciliación",
    description: "Teletrabajo, vacaciones y tiempos de desplazamiento",
    color: "indigo",
  },
  {
    id: "g_benefits",
    name: "Beneficios y Salud",
    description: "Seguros médicos, planes de pensiones y cheques beneficio",
    color: "blue",
  },
  {
    id: "g_culture",
    name: "Cultura y Futuro",
    description: "Desarrollo profesional, ambiente de equipo y proyección",
    color: "amber",
  },
];

export const DEFAULT_CONCEPTS: Concept[] = [
  {
    id: "c_salary_base",
    groupId: "g_direct",
    name: "Salario Base Bruto",
    description: "Sueldo fijo anual bruto en contrato",
    unit: "EUR_YEAR",
    type: "monetary_direct",
    weight: 10,
    isPositive: true,
  },
  {
    id: "c_bonus_annual",
    groupId: "g_direct",
    name: "Bonus / Variable Estimado",
    description: "Compensación variable anual esperada por objetivos",
    unit: "EUR_YEAR",
    type: "monetary_direct",
    weight: 8,
    isPositive: true,
  },
  {
    id: "c_meal_vouchers",
    groupId: "g_direct",
    name: "Subvención Comedor / Cheque Gourmet",
    description: "Importe mensual equivalente en tickets restaurante / tarjeta comedor",
    unit: "EUR_MONTH",
    type: "monetary_calculated",
    monetaryEquivalencePerUnit: 12, // 12 months = annual value
    weight: 6,
    isPositive: true,
  },
  {
    id: "c_telework",
    groupId: "g_flexibility",
    name: "Días de Teletrabajo / Semana",
    description: "Días semanales trabajando desde casa",
    unit: "DAYS_WEEK",
    type: "monetary_calculated",
    monetaryEquivalencePerUnit: 900, // ~900€ anuales ahorrados por día semanal en transporte y tiempo
    weight: 9,
    isPositive: true,
  },
  {
    id: "c_vacation",
    groupId: "g_flexibility",
    name: "Días de Vacaciones / Año",
    description: "Días laborables retribuidos de descanso anual",
    unit: "DAYS_YEAR",
    type: "monetary_calculated",
    monetaryEquivalencePerUnit: 160, // Valor monetario estimado por día laborable de descanso extra
    weight: 7,
    isPositive: true,
  },
  {
    id: "c_commute",
    groupId: "g_flexibility",
    name: "Desplazamiento Diario (Minutos)",
    description: "Minutos de ida y vuelta al lugar de trabajo por día presencial",
    unit: "MINUTES_DAY",
    type: "monetary_calculated",
    monetaryEquivalencePerUnit: -25, // Impacto monetario negativo estimado por minuto diario de trayecto
    weight: 6,
    isPositive: false,
  },
  {
    id: "c_health",
    groupId: "g_benefits",
    name: "Seguro Médico Privado",
    description: "Cobertura médica privada financiada por la empresa",
    unit: "BOOLEAN",
    type: "monetary_calculated",
    monetaryEquivalencePerUnit: 1200, // Valor de mercado anual de la póliza
    weight: 7,
    isPositive: true,
  },
  {
    id: "c_pension",
    groupId: "g_benefits",
    name: "Plan de Pensiones (Aportación Empresa)",
    description: "Aportación directa anual de la empresa al plan de empleo",
    unit: "EUR_YEAR",
    type: "monetary_direct",
    weight: 6,
    isPositive: true,
  },
  {
    id: "c_training",
    groupId: "g_benefits",
    name: "Presupuesto de Formación",
    description: "Fondo anual disponible para cursos, conferencias y certificaciones",
    unit: "EUR_YEAR",
    type: "monetary_direct",
    weight: 5,
    isPositive: true,
  },
  {
    id: "c_growth",
    groupId: "g_culture",
    name: "Proyección y Plan de Carrera",
    description: "Oportunidades reales de ascenso y aprendizaje técnico (1 al 10)",
    unit: "SCORE_10",
    type: "weighted_score",
    weight: 9,
    isPositive: true,
  },
  {
    id: "c_environment",
    groupId: "g_culture",
    name: "Ambiente de Trabajo y Estabilidad",
    description: "Cultura de empresa, relaciones con equipo y solidez (1 al 10)",
    unit: "SCORE_10",
    type: "weighted_score",
    weight: 8,
    isPositive: true,
  },
];

export const DEFAULT_OFFERS: JobOffer[] = [
  {
    id: "puesto_actual",
    title: "Senior Developer",
    company: "Empresa Actual S.L.",
    location: "Madrid (Híbrido 3d presencial)",
    isCurrent: true,
    status: "current",
    notes: "Mi posición actual. Conozco el equipo y los procesos.",
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
  },
  {
    id: "oferta_tech_corp",
    title: "Lead Software Engineer",
    company: "Global Tech Solutions",
    location: "Madrid (Remoto 100%)",
    isCurrent: false,
    status: "received",
    notes: "Oferta formal recibida. 100% en remoto, excelente paquete de beneficios.",
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
  },
  {
    id: "oferta_fintech",
    title: "Senior Systems Architect",
    company: "Fintech Innovators",
    location: "Madrid (Presencial 3d)",
    isCurrent: false,
    status: "negotiating",
    notes: "Segunda ronda finalizada. Salario base más alto, requiere presencia física.",
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
  },
];

// Calculation engine functions
export function calculateConceptMonetaryValue(
  concept: Concept,
  rawValue: number | boolean | undefined
): number {
  if (rawValue === undefined || rawValue === null) return 0;

  if (concept.type === "monetary_direct") {
    return typeof rawValue === "number" ? rawValue : 0;
  }

  if (concept.type === "monetary_calculated") {
    const multiplier = concept.monetaryEquivalencePerUnit ?? 1;
    if (concept.unit === "BOOLEAN") {
      return rawValue === true || rawValue === 1 ? multiplier : 0;
    }
    const numeric = typeof rawValue === "number" ? rawValue : 0;
    return numeric * multiplier;
  }

  // Weighted score has no direct monetary addition (monetary = 0, computed in score)
  return 0;
}

export function calculateConceptNormalizedScore(
  concept: Concept,
  rawValue: number | boolean | undefined
): number {
  if (rawValue === undefined || rawValue === null) return 0;

  let val = 0;
  if (typeof rawValue === "boolean") {
    val = rawValue ? 10 : 0;
  } else {
    val = Number(rawValue);
  }

  // Normalize based on unit
  let score = 0;
  switch (concept.unit) {
    case "SCORE_10":
      score = Math.min(10, Math.max(0, val));
      break;
    case "BOOLEAN":
      score = val ? 10 : 0;
      break;
    case "DAYS_WEEK":
      score = Math.min(10, (val / 5) * 10);
      break;
    case "DAYS_YEAR":
      // Baseline 22 days -> 5 pts, 30 days -> 10 pts
      score = Math.min(10, Math.max(0, ((val - 20) / 10) * 10));
      break;
    case "MINUTES_DAY":
      // 0 min -> 10 pts, 60+ min -> 0 pts
      score = Math.max(0, 10 - (val / 60) * 10);
      break;
    case "EUR_YEAR":
    case "EUR_MONTH":
    default:
      // Monetanized scores use value scaling relative to 50k baseline
      const annualApprox =
        concept.unit === "EUR_MONTH" ? val * 12 : val;
      score = Math.min(10, Math.max(0, (annualApprox / 70000) * 10));
      break;
  }

  if (!concept.isPositive) {
    score = 10 - score;
  }

  return score;
}

export function evaluateJobOffers(
  offers: JobOffer[],
  concepts: Concept[],
  groups: ConceptGroup[]
): EvaluationResult[] {
  const currentOffer = offers.find((o) => o.isCurrent) || offers[0];

  // Pre-calculate baseline values for current position if available
  let currentTotalMonetary = 0;
  let currentCompositeScore = 0;

  const rawResults = offers.map((offer) => {
    let totalMonetary = 0;
    let weightedScoreSum = 0;
    let totalWeights = 0;

    const groupResultsMap: Record<
      string,
      { totalMonetary: number; weightedScoreSum: number; weightSum: number }
    > = {};

    groups.forEach((g) => {
      groupResultsMap[g.id] = { totalMonetary: 0, weightedScoreSum: 0, weightSum: 0 };
    });

    concepts.forEach((concept) => {
      const rawVal = offer.values[concept.id];
      const monVal = calculateConceptMonetaryValue(concept, rawVal);
      const score10 = calculateConceptNormalizedScore(concept, rawVal);

      totalMonetary += monVal;

      const weight = concept.weight || 1;
      weightedScoreSum += score10 * weight;
      totalWeights += weight;

      if (groupResultsMap[concept.groupId]) {
        groupResultsMap[concept.groupId].totalMonetary += monVal;
        groupResultsMap[concept.groupId].weightedScoreSum += score10 * weight;
        groupResultsMap[concept.groupId].weightSum += weight;
      }
    });

    const compositeScore =
      totalWeights > 0 ? Math.round((weightedScoreSum / (totalWeights * 10)) * 100) : 0;

    if (offer.id === currentOffer?.id) {
      currentTotalMonetary = totalMonetary;
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
        totalMonetaryValue: gData ? gData.totalMonetary : 0,
        score100: gScore100,
      };
    });

    return {
      offerId: offer.id,
      offerTitle: offer.title,
      company: offer.company,
      isCurrent: !!offer.isCurrent,
      status: offer.status,
      totalMonetaryValue: totalMonetary,
      compositeScore,
      deltaMonetaryVsCurrent: 0,
      deltaPercentVsCurrent: 0,
      deltaScoreVsCurrent: 0,
      groupResults,
      rank: 1,
    };
  });

  // Calculate deltas and ranking
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

  // Sort by composite score (or monetary if equal) to determine ranking
  const sorted = [...resultsWithDeltas].sort((a, b) => {
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
