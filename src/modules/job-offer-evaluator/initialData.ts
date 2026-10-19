import {
  ConceptGroup,
  Concept,
  JobOffer,
  EvaluationResult,
  ConceptGroupResult,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
} from "./types";

export const DEFAULT_GROUPS: ConceptGroup[] = [
  {
    id: "g_direct",
    name: "Retribución Directa",
    description: "Salario fijo, bonus con probabilidad, comisiones y equity",
    color: "emerald",
  },
  {
    id: "g_flexibility",
    name: "Flexibilidad y Conciliación",
    description: "Teletrabajo, días de vacaciones extra, desplazamiento y flexibilidad horaria",
    color: "indigo",
  },
  {
    id: "g_benefits",
    name: "Beneficios y Seguridad",
    description: "Seguro médico privado, plan de pensiones, cheques comida y otros beneficios",
    color: "blue",
  },
  {
    id: "g_culture",
    name: "Cultura y Futuro",
    description: "Desarrollo profesional, aprendizaje, manager, cultura, autonomía, estabilidad e interés del puesto",
    color: "amber",
  },
];

export const DEFAULT_CONCEPTS: Concept[] = [
  // 1. Retribución Directa
  {
    id: "c_salary_base",
    groupId: "g_direct",
    name: "Salario Base Bruto",
    description: "Sueldo fijo anual bruto especificado en contrato (€/año)",
    category: "economic",
    calculationType: "direct_monetary",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "EUR_YEAR",
  },
  {
    id: "c_bonus_annual",
    groupId: "g_direct",
    name: "Bonus Variable Estimado",
    description: "Bonus máximo multiplicado por la probabilidad esperada de cobro (%)",
    category: "economic",
    calculationType: "bonus_probability",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "EUR_YEAR",
  },
  {
    id: "c_commissions",
    groupId: "g_direct",
    name: "Comisiones Estimadas",
    description: "Comisiones brutas anuales esperadas por ventas u objetivos (€/año)",
    category: "economic",
    calculationType: "direct_monetary",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "EUR_YEAR",
  },
  {
    id: "c_equity",
    groupId: "g_direct",
    name: "Equity / Stock Options / RSU",
    description: "Valor anual estimado de las acciones o participaciones otorgadas (€/año)",
    category: "economic",
    calculationType: "direct_monetary",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "EUR_YEAR",
  },

  // 2. Flexibilidad y Conciliación
  {
    id: "c_telework",
    groupId: "g_flexibility",
    name: "Teletrabajo (Días/Semana)",
    description: "Valor económico anual del teletrabajo según días a la semana",
    category: "economic",
    calculationType: "telework_days",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "DAYS_WEEK",
  },
  {
    id: "c_vacation",
    groupId: "g_flexibility",
    name: "Días de Vacaciones / Año",
    description: "Días laborables de vacaciones retribuidas en comparación con la referencia",
    category: "economic",
    calculationType: "vacation_days",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "DAYS_YEAR",
  },
  {
    id: "c_commute",
    groupId: "g_flexibility",
    name: "Desplazamiento Diario",
    description: "Coste anual estimado del tiempo de desplazamiento en trayectos presenciales (negativo)",
    category: "economic",
    calculationType: "commute_time",
    maxPersonalValue: 0,
    isPositive: false,
    unit: "MINUTES_DAY",
  },
  {
    id: "c_flexibility_schedule",
    groupId: "g_flexibility",
    name: "Flexibilidad Horaria y Jornada",
    description: "Libertad de horarios, jornada intensiva en verano u opciones de conciliación (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 3000,
    isPositive: true,
    unit: "SCORE_10",
  },

  // 3. Beneficios y Seguridad
  {
    id: "c_health",
    groupId: "g_benefits",
    name: "Seguro Médico Privado",
    description: "Valor económico anual asignado por el usuario a la póliza de seguro médico",
    category: "economic",
    calculationType: "user_valued_benefit",
    maxPersonalValue: 1200,
    isPositive: true,
    unit: "BOOLEAN",
  },
  {
    id: "c_pension",
    groupId: "g_benefits",
    name: "Plan de Pensiones (Empresa)",
    description: "Aportación directa anual de la empresa al plan de empleo de pensiones",
    category: "economic",
    calculationType: "direct_monetary",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "EUR_YEAR",
  },
  {
    id: "c_meal",
    groupId: "g_benefits",
    name: "Ayuda Comida / Ticket Restaurante",
    description: "Valor económico anual estimado de la subvención para comida",
    category: "economic",
    calculationType: "user_valued_benefit",
    maxPersonalValue: 1200,
    isPositive: true,
    unit: "BOOLEAN",
  },
  {
    id: "c_other_benefits",
    groupId: "g_benefits",
    name: "Otros Beneficios (Gimnasio, Transporte...)",
    description: "Suma anual de otros beneficios de la oferta (gimnasio, coche, etc.)",
    category: "economic",
    calculationType: "direct_monetary",
    maxPersonalValue: 0,
    isPositive: true,
    unit: "EUR_YEAR",
  },

  // 4. Cultura y Futuro
  {
    id: "c_growth",
    groupId: "g_culture",
    name: "Desarrollo Profesional y Proyección",
    description: "Oportunidades reales de ascenso, carrera y aprendizaje técnico (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 10000,
    isPositive: true,
    unit: "SCORE_10",
  },
  {
    id: "c_learning",
    groupId: "g_culture",
    name: "Aprendizaje y Presupuesto Formación",
    description: "Cursos, conferencias y tiempo dedicado al aprendizaje tecnológico (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 4000,
    isPositive: true,
    unit: "SCORE_10",
  },
  {
    id: "c_manager",
    groupId: "g_culture",
    name: "Calidad del Manager y Liderazgo",
    description: "Estilo de gestión, mentoría y confianza con el responsable directo (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 6000,
    isPositive: true,
    unit: "SCORE_10",
  },
  {
    id: "c_culture",
    groupId: "g_culture",
    name: "Cultura y Ambiente de Equipo",
    description: "Valores de la empresa, buen clima de trabajo y colegialidad (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 3000,
    isPositive: true,
    unit: "SCORE_10",
  },
  {
    id: "c_autonomy",
    groupId: "g_culture",
    name: "Autonomía e Impacto",
    description: "Grado de independencia en la toma de decisiones y peso del trabajo (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 5000,
    isPositive: true,
    unit: "SCORE_10",
  },
  {
    id: "c_stability",
    groupId: "g_culture",
    name: "Estabilidad y Seguridad Laboral",
    description: "Solidez financiera de la empresa y estabilidad de la posición (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 8000,
    isPositive: true,
    unit: "SCORE_10",
  },
  {
    id: "c_interest",
    groupId: "g_culture",
    name: "Interés del Puesto y Reto Técnico",
    description: "Nivel de motivación, innovación y atracción por las tareas diarias (0-10)",
    category: "subjective",
    calculationType: "subjective_score",
    maxPersonalValue: 7000,
    isPositive: true,
    unit: "SCORE_10",
  },
];

export const DEFAULT_OFFERS: JobOffer[] = [
  {
    id: "currentSituation",
    title: "Puesto Actual",
    company: "Empresa Actual S.L.",
    location: "Madrid",
    workModality: "hibrido",
    officeDaysPerWeek: 3,
    isCurrent: true,
    status: "current",
    notes: "Situación laboral actual empleada como referencia.",
    commuteKmOneWay: 20,
    commuteFuelL100: 6.5,
    fuelPriceEurL: 1.55,
    values: {
      c_salary_base: 65000,
      c_bonus_annual: 5000,
      c_bonus_annual_prob: 80,
      c_commissions: 0,
      c_equity: 0,
      c_telework: 2,
      c_vacation: 23,
      c_commute: 40,
      c_flexibility_schedule: 6,
      c_health: true,
      c_health_user_val: 1200,
      c_pension: 1000,
      c_meal: false,
      c_other_benefits: 0,
      c_growth: 6,
      c_learning: 6,
      c_manager: 6,
      c_culture: 6,
      c_autonomy: 7,
      c_stability: 8,
      c_interest: 7,
    },
  },
  {
    id: "oferta_a",
    title: "Oferta A (Tech Corp)",
    company: "Global Tech Solutions",
    location: "Madrid",
    workModality: "hibrido",
    officeDaysPerWeek: 2,
    isCurrent: false,
    status: "received",
    notes: "Oferta A: 70.000€ base, 3 días teletrabajo, excelente desarrollo.",
    commuteKmOneWay: 15,
    commuteFuelL100: 6.5,
    fuelPriceEurL: 1.55,
    values: {
      c_salary_base: 70000,
      c_bonus_annual: 10000,
      c_bonus_annual_prob: 70, // 7.000 €
      c_commissions: 0,
      c_equity: 0,
      c_telework: 3,           // 3 * 46 * 30 = 4.140 €
      c_vacation: 27,          // (27 - 22) * 150 = 750 €
      c_commute: 60,           // -2.760 €
      c_flexibility_schedule: 8,
      c_health: true,
      c_health_user_val: 1000, // 1.000 €
      c_pension: 2000,         // 2.000 €
      c_meal: true,
      c_meal_user_val: 1000,
      c_other_benefits: 0,
      c_growth: 8,             // 10.000 * 8/10 = 8.000 €
      c_learning: 8,
      c_manager: 7,            // 6.000 * 7/10 = 4.200 €
      c_culture: 5,            // 3.000 * 5/10 = 1.500 €
      c_autonomy: 8,
      c_stability: 9,          // 8.000 * 9/10 = 7.200 €
      c_interest: 8,
    },
  },
  {
    id: "oferta_b",
    title: "Oferta B (Fintech)",
    company: "Fintech Innovators",
    location: "Madrid",
    workModality: "presencial",
    officeDaysPerWeek: 4,
    isCurrent: false,
    status: "negotiating",
    notes: "Oferta B: Mayor salario bruto base (75.000€), pero menos flexibilidad.",
    commuteKmOneWay: 25,
    commuteFuelL100: 7.0,
    fuelPriceEurL: 1.55,
    values: {
      c_salary_base: 75000,
      c_bonus_annual: 10000,
      c_bonus_annual_prob: 50, // 5.000 €
      c_commissions: 0,
      c_equity: 2000,
      c_telework: 1,           // 1 * 46 * 30 = 1.380 €
      c_vacation: 24,          // (24 - 22) * 150 = 300 €
      c_commute: 90,           // -4.140 €
      c_flexibility_schedule: 5,
      c_health: true,
      c_health_user_val: 1000,
      c_pension: 1500,
      c_meal: false,
      c_other_benefits: 500,
      c_growth: 4,             // 10.000 * 4/10 = 4.000 €
      c_learning: 5,
      c_manager: 6,            // 6.000 * 6/10 = 3.600 €
      c_culture: 6,            // 3.000 * 6/10 = 1.800 €
      c_autonomy: 6,
      c_stability: 6,          // 8.000 * 6/10 = 4.800 €
      c_interest: 6,
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

  const workingWeeksPerYear = 46;
  const presencialDaysPerYear = presencialDaysPerWeek * workingWeeksPerYear;

  const kmPerYear = presencialDaysPerYear * (kmOneWay * 2);
  const fuelL100 = offer.commuteFuelL100 || 6.5;
  const fuelPriceEurL = offer.fuelPriceEurL || 1.55;

  const totalLitres = (kmPerYear / 100) * fuelL100;
  return Math.round(totalLitres * fuelPriceEurL);
}

export function calculateConceptMonetaryValue(
  concept: Concept,
  offer: JobOffer,
  userPrefs: UserPreferences = DEFAULT_USER_PREFERENCES
): number {
  if (!offer || !offer.values) return 0;

  const rawVal = offer.values[concept.id];

  // 1. Direct Monetary
  if (concept.calculationType === "direct_monetary") {
    if (typeof rawVal === "number") return rawVal;
    if (typeof rawVal === "boolean") return rawVal ? concept.maxPersonalValue || 0 : 0;
    return 0;
  }

  // 2. Bonus with Probability
  if (concept.calculationType === "bonus_probability") {
    const bonusMax = typeof rawVal === "number" ? rawVal : 0;
    const probKey = `${concept.id}_prob`;
    const probVal = offer.values[probKey] !== undefined ? Number(offer.values[probKey]) : 100;
    const probRatio = Math.max(0, Math.min(100, probVal)) / 100;
    return Math.round(bonusMax * probRatio);
  }

  // 3. User Valued Benefit
  if (concept.calculationType === "user_valued_benefit") {
    const customUserValKey = `${concept.id}_user_val`;
    const customUserVal = offer.values[customUserValKey];
    const benefitValue =
      typeof customUserVal === "number" ? customUserVal : concept.maxPersonalValue || 0;

    if (typeof rawVal === "boolean") {
      return rawVal ? benefitValue : 0;
    }
    if (typeof rawVal === "number") {
      return rawVal > 0 ? (rawVal === 1 ? benefitValue : rawVal) : 0;
    }
    return 0;
  }

  // 4. Telework Days
  if (concept.calculationType === "telework_days") {
    const teleworkDays = typeof rawVal === "number" ? rawVal : 0;
    const weeks = userPrefs.workingWeeksPerYear || 46;
    const dayVal = userPrefs.teleworkDayValue || 30;
    return Math.round(teleworkDays * weeks * dayVal);
  }

  // 5. Commute Time Cost (Negative)
  if (concept.calculationType === "commute_time") {
    const commuteMinsDaily = typeof rawVal === "number" ? rawVal : 0;
    if (commuteMinsDaily <= 0) return 0;

    let presencialDays = 0;
    if (offer.workModality === "remoto") {
      presencialDays = 0;
    } else if (offer.workModality === "presencial") {
      presencialDays = 5;
    } else if (offer.workModality === "hibrido") {
      presencialDays = offer.officeDaysPerWeek !== undefined ? offer.officeDaysPerWeek : 3;
    } else {
      const teleworkDays = typeof offer.values["c_telework"] === "number" ? offer.values["c_telework"] : 0;
      presencialDays = Math.max(0, 5 - teleworkDays);
    }

    const weeks = userPrefs.workingWeeksPerYear || 46;
    const hourVal = userPrefs.freeTimeHourValue || 20;
    const hoursDaily = commuteMinsDaily / 60;

    const annualCost = presencialDays * weeks * hoursDaily * hourVal;
    return -Math.round(annualCost);
  }

  // 6. Vacation Days vs Baseline Reference
  if (concept.calculationType === "vacation_days") {
    const vacationDays = typeof rawVal === "number" ? rawVal : 0;
    const refDays = userPrefs.vacationReferenceDays || 22;
    const dayVal = userPrefs.vacationDayValue || 150;
    const diffDays = vacationDays - refDays;
    return Math.round(diffDays * dayVal);
  }

  // 7. Subjective / Intangible 0-10 Rating
  if (concept.calculationType === "subjective_score") {
    const maxVal = concept.maxPersonalValue || 0;
    if (maxVal === 0) return 0;

    const rating = typeof rawVal === "number" ? Math.max(0, Math.min(10, rawVal)) : 0;

    if (concept.isPositive) {
      return Math.round((maxVal * rating) / 10);
    } else {
      return -Math.round((maxVal * (10 - rating)) / 10);
    }
  }

  return 0;
}

export function calculateConceptMonetaryValueSimple(
  concept: Concept,
  rawValue: number | boolean | undefined,
  userPrefs: UserPreferences = DEFAULT_USER_PREFERENCES
): number {
  const dummyOffer: JobOffer = {
    id: "dummy",
    title: "",
    company: "",
    location: "",
    isCurrent: false,
    status: "received",
    values: { [concept.id]: rawValue !== undefined ? rawValue : 0 },
  };
  return calculateConceptMonetaryValue(concept, dummyOffer, userPrefs);
}

export function calculateConceptNormalizedScore(
  concept: Concept,
  offer: JobOffer,
  userPrefs: UserPreferences = DEFAULT_USER_PREFERENCES
): number {
  const rawVal = offer.values[concept.id];
  if (rawVal === undefined || rawVal === null) return 0;

  if (concept.calculationType === "subjective_score") {
    return typeof rawVal === "number" ? Math.min(10, Math.max(0, rawVal)) : 0;
  }

  if (concept.calculationType === "telework_days") {
    const days = typeof rawVal === "number" ? rawVal : 0;
    return Math.min(10, (days / 5) * 10);
  }

  if (concept.calculationType === "vacation_days") {
    const days = typeof rawVal === "number" ? rawVal : 0;
    const ref = userPrefs.vacationReferenceDays || 22;
    return Math.min(10, Math.max(0, ((days - ref + 5) / 10) * 10));
  }

  if (concept.calculationType === "commute_time") {
    const mins = typeof rawVal === "number" ? rawVal : 0;
    return Math.max(0, 10 - (mins / 60) * 10);
  }

  if (typeof rawVal === "boolean") {
    return rawVal ? 10 : 0;
  }

  const num = Number(rawVal);
  if (isNaN(num)) return 0;

  return Math.min(10, Math.max(0, (num / 70000) * 10));
}

export function evaluateJobOffers(
  offers: JobOffer[],
  concepts: Concept[],
  groups: ConceptGroup[],
  userPrefs: UserPreferences = DEFAULT_USER_PREFERENCES
): EvaluationResult[] {
  const currentOffer = offers.find((o) => o.isCurrent) || offers[0];

  let currentTotalMonetary = 0;
  let currentCompositeScore = 0;

  const rawResults = offers.map((offer) => {
    let totalMonetary = 0;
    let economicMonetary = 0;
    let intangibleMonetary = 0;

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
      const monVal = calculateConceptMonetaryValue(concept, offer, userPrefs);
      const score10 = calculateConceptNormalizedScore(concept, offer, userPrefs);

      totalMonetary += monVal;

      if (concept.category === "economic") {
        economicMonetary += monVal;
      } else {
        intangibleMonetary += monVal;
      }

      const weight = concept.maxPersonalValue > 0 ? concept.maxPersonalValue : 1000;
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
      economicMonetaryValue: economicMonetary,
      intangibleMonetaryValue: intangibleMonetary,
      compositeScore,
      deltaMonetaryVsCurrent: 0,
      deltaPercentVsCurrent: 0,
      deltaScoreVsCurrent: 0,
      groupResults,
      rank: 1,
    };
  });

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

  const sorted = [...resultsWithDeltas].sort((a, b) => {
    if (b.totalMonetaryValue !== a.totalMonetaryValue) {
      return b.totalMonetaryValue - a.totalMonetaryValue;
    }
    return b.compositeScore - a.compositeScore;
  });

  return sorted.map((res, index) => ({
    ...res,
    rank: index + 1,
  }));
}
