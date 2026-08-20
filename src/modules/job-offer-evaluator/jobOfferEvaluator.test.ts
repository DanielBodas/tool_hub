import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CONCEPTS,
  DEFAULT_GROUPS,
  calculateConceptMonetaryValue,
  evaluateJobOffers,
} from "./initialData";
import {
  Concept,
  JobOffer,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
} from "./types";

describe("Job Offer Evaluator - Personal Equivalent Salary System", () => {
  // Test 1: Salario directo
  it("1. Direct salary produces exact euro value", () => {
    const salaryConcept: Concept = {
      id: "c_salary",
      groupId: "g_direct",
      name: "Salario Base",
      description: "",
      category: "economic",
      calculationType: "direct_monetary",
      maxPersonalValue: 0,
      isPositive: true,
      unit: "EUR_YEAR",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_salary: 70000 },
    };

    const val = calculateConceptMonetaryValue(salaryConcept, offer);
    assert.equal(val, 70000);
  });

  // Test 2: Bonus con probabilidad
  it("2. Bonus with probability percentage calculates correctly", () => {
    const bonusConcept: Concept = {
      id: "c_bonus",
      groupId: "g_direct",
      name: "Bonus Variable",
      description: "",
      category: "economic",
      calculationType: "bonus_probability",
      maxPersonalValue: 0,
      isPositive: true,
      unit: "EUR_YEAR",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: {
        c_bonus: 10000,
        c_bonus_prob: 70, // 70% probability -> 7.000 €
      },
    };

    const val = calculateConceptMonetaryValue(bonusConcept, offer);
    assert.equal(val, 7000);
  });

  // Test 3: Teletrabajo
  it("3. Telework calculates based on days, weeks, and daily personal value", () => {
    const teleworkConcept: Concept = {
      id: "c_telework",
      groupId: "g_flexibility",
      name: "Teletrabajo",
      description: "",
      category: "economic",
      calculationType: "telework_days",
      maxPersonalValue: 0,
      isPositive: true,
      unit: "DAYS_WEEK",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_telework: 3 }, // 3 days/week
    };

    const userPrefs: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      teleworkDayValue: 30, // 30 €/day
      workingWeeksPerYear: 46, // 46 weeks/year
    };

    // 3 * 46 * 30 = 4.140 €
    const val = calculateConceptMonetaryValue(teleworkConcept, offer, userPrefs);
    assert.equal(val, 4140);
  });

  // Test 4: Desplazamiento (Commute)
  it("4. Commute time produces negative annual cost", () => {
    const commuteConcept: Concept = {
      id: "c_commute",
      groupId: "g_flexibility",
      name: "Desplazamiento",
      description: "",
      category: "economic",
      calculationType: "commute_time",
      maxPersonalValue: 0,
      isPositive: false,
      unit: "MINUTES_DAY",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      workModality: "hibrido",
      officeDaysPerWeek: 3, // 3 office days
      isCurrent: false,
      status: "received",
      values: { c_commute: 60 }, // 60 minutes daily
    };

    const userPrefs: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      workingWeeksPerYear: 46,
      freeTimeHourValue: 20, // 20 €/hour
    };

    // 3 days * 46 weeks * (60/60 h) * 20 €/h = -2.760 €
    const val = calculateConceptMonetaryValue(commuteConcept, offer, userPrefs);
    assert.equal(val, -2760);
  });

  // Test 5: Vacaciones
  it("5. Extra vacation days vs reference converts to positive euro value", () => {
    const vacationConcept: Concept = {
      id: "c_vacation",
      groupId: "g_flexibility",
      name: "Vacaciones",
      description: "",
      category: "economic",
      calculationType: "vacation_days",
      maxPersonalValue: 0,
      isPositive: true,
      unit: "DAYS_YEAR",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_vacation: 27 }, // 27 days
    };

    const userPrefs: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      vacationReferenceDays: 22,
      vacationDayValue: 150, // 150 €/day
    };

    // (27 - 22) * 150 = 750 €
    const val = calculateConceptMonetaryValue(vacationConcept, offer, userPrefs);
    assert.equal(val, 750);
  });

  // Test 6: Concepto intangible
  it("6. Intangible concept scales maxPersonalValue by 0-10 rating", () => {
    const growthConcept: Concept = {
      id: "c_growth",
      groupId: "g_culture",
      name: "Desarrollo Profesional",
      description: "",
      category: "subjective",
      calculationType: "subjective_score",
      maxPersonalValue: 10000, // 10.000 €
      isPositive: true,
      unit: "SCORE_10",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_growth: 8 }, // 8/10 rating
    };

    // 10.000 * 8 / 10 = 8.000 €
    const val = calculateConceptMonetaryValue(growthConcept, offer);
    assert.equal(val, 8000);
  });

  // Test 7: Concepto negativo / penalización
  it("7. Negative concept / penalty calculates missing part cost correctly", () => {
    const penaltyConcept: Concept = {
      id: "c_bad_stability",
      groupId: "g_culture",
      name: "Mala Estabilidad",
      description: "",
      category: "subjective",
      calculationType: "subjective_score",
      maxPersonalValue: 10000,
      isPositive: false, // Penalty concept
      unit: "SCORE_10",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_bad_stability: 4 }, // 4/10 stability (6/10 missing penalty)
    };

    // -10.000 * (10 - 4) / 10 = -6.000 €
    const val = calculateConceptMonetaryValue(penaltyConcept, offer);
    assert.equal(val, -6000);
  });

  // Test 8: Subtotales por grupo
  it("8. Group subtotals sum up concept values belonging to that group", () => {
    const concepts: Concept[] = [
      {
        id: "c_salary",
        groupId: "g_direct",
        name: "Salario",
        description: "",
        category: "economic",
        calculationType: "direct_monetary",
        maxPersonalValue: 0,
        isPositive: true,
        unit: "EUR_YEAR",
      },
      {
        id: "c_bonus",
        groupId: "g_direct",
        name: "Bonus",
        description: "",
        category: "economic",
        calculationType: "bonus_probability",
        maxPersonalValue: 0,
        isPositive: true,
        unit: "EUR_YEAR",
      },
    ];

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: {
        c_salary: 70000,
        c_bonus: 10000,
        c_bonus_prob: 70, // 7000
      },
    };

    const results = evaluateJobOffers([offer], concepts, DEFAULT_GROUPS);
    const directGroup = results[0].groupResults.find((g) => g.groupId === "g_direct");
    assert.equal(directGroup?.totalMonetaryValue, 77000);
  });

  // Test 9: Total de oferta (Salario equivalente personal completo)
  it("9. Complete offer total matches exact sum of all economic, time, and subjective concepts", () => {
    const offer: JobOffer = {
      id: "prompt_example",
      title: "Oferta Ejemplo Prompt",
      company: "Empresa",
      location: "Madrid",
      workModality: "hibrido",
      officeDaysPerWeek: 3,
      isCurrent: false,
      status: "received",
      values: {
        c_salary_base: 70000,
        c_bonus_annual: 10000,
        c_bonus_annual_prob: 70, // +7.000
        c_telework: 3,           // +4.140
        c_vacation: 27,          // +750
        c_commute: 60,           // -2.760
        c_health: true,          // +1.000
        c_pension: 2000,         // +2.000
        c_growth: 8,             // +8.000
        c_manager: 7,            // +4.200
        c_culture: 5,            // +1.500
        c_stability: 9,          // +7.200
      },
    };

    const results = evaluateJobOffers([offer], DEFAULT_CONCEPTS, DEFAULT_GROUPS);
    // 70000 (base) + 7000 (bonus) + 4140 (telework) + 750 (vacation) - 2760 (commute) + 1000 (health) + 2000 (pension) + 8000 (growth) + 4200 (manager) + 1500 (culture) + 7200 (stability) = 103.230 €
    assert.equal(results[0].totalMonetaryValue, 103230);
  });

  // Test 10: Comparación oferta A vs B
  it("10. Offer A vs Offer B comparison calculates deltas accurately", () => {
    const offerA: JobOffer = {
      id: "a",
      title: "Oferta A",
      company: "A",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_salary_base: 70000 },
    };

    const offerB: JobOffer = {
      id: "b",
      title: "Oferta B",
      company: "B",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_salary_base: 75000 },
    };

    const results = evaluateJobOffers([offerA, offerB], DEFAULT_CONCEPTS, DEFAULT_GROUPS);
    const resA = results.find((r) => r.offerId === "a");
    const resB = results.find((r) => r.offerId === "b");

    assert.equal(resB!.totalMonetaryValue - resA!.totalMonetaryValue, 5000);
  });

  // Test 11: Comparación oferta vs situación actual
  it("11. Current situation is treated as a standard offer and calculates deltas vs current", () => {
    const current: JobOffer = {
      id: "current",
      title: "Puesto Actual",
      company: "Actual",
      location: "Madrid",
      isCurrent: true,
      status: "current",
      values: { c_salary_base: 60000 },
    };

    const offerA: JobOffer = {
      id: "a",
      title: "Oferta A",
      company: "A",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_salary_base: 70000 },
    };

    const results = evaluateJobOffers([current, offerA], DEFAULT_CONCEPTS, DEFAULT_GROUPS);
    const resA = results.find((r) => r.offerId === "a");

    assert.equal(resA?.deltaMonetaryVsCurrent, 10000);
  });

  // Test 12: No double weighting
  it("12. Verifies formula is purely value_max * rating / 10 without secondary weight multiplier", () => {
    const concept: Concept = {
      id: "c_growth",
      groupId: "g_culture",
      name: "Desarrollo",
      description: "",
      category: "subjective",
      calculationType: "subjective_score",
      maxPersonalValue: 10000,
      isPositive: true,
      unit: "SCORE_10",
    };

    const offer: JobOffer = {
      id: "o1",
      title: "Dev",
      company: "Company",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_growth: 8 },
    };

    const val = calculateConceptMonetaryValue(concept, offer);
    // Exactly 10.000 * 8 / 10 = 8.000 € (No extra weight multiplier)
    assert.equal(val, 8000);
  });

  // Test 13: Preference change reactivity
  it("13. Changing personal preference updates all offers using that concept", () => {
    const teleworkConcept: Concept = {
      id: "c_telework",
      groupId: "g_flexibility",
      name: "Teletrabajo",
      description: "",
      category: "economic",
      calculationType: "telework_days",
      maxPersonalValue: 0,
      isPositive: true,
      unit: "DAYS_WEEK",
    };

    const offerA: JobOffer = {
      id: "a",
      title: "Dev A",
      company: "A",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_telework: 2 },
    };

    const offerB: JobOffer = {
      id: "b",
      title: "Dev B",
      company: "B",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: { c_telework: 4 },
    };

    const prefs1: UserPreferences = { ...DEFAULT_USER_PREFERENCES, teleworkDayValue: 30, workingWeeksPerYear: 46 };
    const prefs2: UserPreferences = { ...DEFAULT_USER_PREFERENCES, teleworkDayValue: 50, workingWeeksPerYear: 46 };

    const valA1 = calculateConceptMonetaryValue(teleworkConcept, offerA, prefs1); // 2 * 46 * 30 = 2760
    const valB1 = calculateConceptMonetaryValue(teleworkConcept, offerB, prefs1); // 4 * 46 * 30 = 5520

    const valA2 = calculateConceptMonetaryValue(teleworkConcept, offerA, prefs2); // 2 * 46 * 50 = 4600
    const valB2 = calculateConceptMonetaryValue(teleworkConcept, offerB, prefs2); // 4 * 46 * 50 = 9200

    assert.equal(valA1, 2760);
    assert.equal(valB1, 5520);
    assert.equal(valA2, 4600);
    assert.equal(valB2, 9200);
  });

  // Test 14: Offer with lower base salary winning via higher personal value
  it("14. Offer with lower base salary can rank higher if personal value in intangibles/flexibility is higher", () => {
    const concepts: Concept[] = [
      {
        id: "c_salary_base",
        groupId: "g_direct",
        name: "Salario Base",
        description: "",
        category: "economic",
        calculationType: "direct_monetary",
        maxPersonalValue: 0,
        isPositive: true,
        unit: "EUR_YEAR",
      },
      {
        id: "c_telework",
        groupId: "g_flexibility",
        name: "Teletrabajo",
        description: "",
        category: "economic",
        calculationType: "telework_days",
        maxPersonalValue: 0,
        isPositive: true,
        unit: "DAYS_WEEK",
      },
      {
        id: "c_growth",
        groupId: "g_culture",
        name: "Desarrollo",
        description: "",
        category: "subjective",
        calculationType: "subjective_score",
        maxPersonalValue: 10000,
        isPositive: true,
        unit: "SCORE_10",
      },
    ];

    // Offer A: Lower salary (60.000 €), 5 days telework (6.900 €), Growth 10/10 (10.000 €) = 76.900 €
    const offerA: JobOffer = {
      id: "offer_a",
      title: "Lower Base Salary Dev",
      company: "Flex Corp",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: {
        c_salary_base: 60000,
        c_telework: 5, // 5 * 46 * 30 = 6900
        c_growth: 10,  // 10.000 * 10/10 = 10000
      },
    };

    // Offer B: Higher salary (65.000 €), 0 days telework (0 €), Growth 2/10 (2.000 €) = 67.000 €
    const offerB: JobOffer = {
      id: "offer_b",
      title: "Higher Base Salary Dev",
      company: "Rigid Corp",
      location: "Madrid",
      isCurrent: false,
      status: "received",
      values: {
        c_salary_base: 65000,
        c_telework: 0,
        c_growth: 2,
      },
    };

    const results = evaluateJobOffers([offerA, offerB], concepts, DEFAULT_GROUPS);

    // Offer A ranks #1 despite having 5.000 € lower base salary!
    assert.equal(results[0].offerId, "offer_a");
    assert.equal(results[0].rank, 1);
    assert.equal(results[0].totalMonetaryValue, 76900);
    assert.equal(results[1].totalMonetaryValue, 67000);
  });
});
