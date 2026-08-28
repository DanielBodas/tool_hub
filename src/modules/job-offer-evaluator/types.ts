export type ConceptType = "economic" | "objective" | "subjective" | "mixed";

export type PreferenceDirection = "MORE_IS_BETTER" | "LESS_IS_BETTER" | "IDEAL";

export type CalculationType = "monetary_direct" | "weighted_score" | "monetary_calculated";

export type UnitType =
  | "EUR_YEAR"       // €/año
  | "EUR_MONTH"      // €/mes
  | "DAYS_YEAR"      // días/año
  | "DAYS_WEEK"      // días/semana
  | "SCORE_10"       // Puntuación 1-10
  | "BOOLEAN"        // Sí / No
  | "MINUTES_DAY"    // minutos/día (desplazamiento)
  | "PERCENT"        // %
  | "CUSTOM";        // Personalizado

export interface ConceptGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  weight: number; // 0 to 100 (% weight of group in total evaluation)
  order: number;
  isActive: boolean;
}

export interface Concept {
  id: string;
  groupId: string;
  name: string;
  description: string;
  unit: UnitType;
  conceptType: ConceptType;
  weightWithinGroup: number; // 0 to 100 (% weight of concept within its group)
  order: number;
  isActive: boolean;
  preferenceDirection: PreferenceDirection;
  idealValue?: number; // Target value if preferenceDirection === "IDEAL"
  isVeto?: boolean; // Is mandatory / veto criterion
  vetoThreshold?: number; // Minimum (for MORE_IS_BETTER) or Maximum (for LESS_IS_BETTER) allowed value
  vetoType?: "min" | "max";
  isMonetaryTotal?: boolean; // Does this concept contribute to quantifiable Total Annual Monetary Value?
  monetaryEquivalencePerUnit?: number; // Annual monetary multiplier
  // Backward compatibility alias for legacy code
  weight?: number;
  type?: CalculationType;
  isPositive?: boolean;
}

export type OfferStatus =
  | "current"       // Puesto Actual
  | "received"      // Oferta Recibida
  | "negotiating"   // En Negociación
  | "interviewing"  // En Proceso
  | "accepted"      // Oferta Aceptada
  | "discarded";    // Descartada

export type WorkModality = "presencial" | "hibrido" | "remoto";

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  workModality?: WorkModality;
  officeDaysPerWeek?: number;
  isCurrent: boolean;
  status: OfferStatus;
  notes?: string;
  values: Record<string, number | boolean>;
  conceptScores?: Record<string, number>; // Direct 0-100 score override for subjective/mixed concepts
  conceptNotes?: Record<string, string>; // Justification / notes per concept value
  commuteKmOneWay?: number;
  commuteFuelL100?: number;
  fuelPriceEurL?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailedConceptResult {
  conceptId: string;
  conceptName: string;
  groupId: string;
  groupName: string;
  conceptType: ConceptType;
  groupWeight: number; // % group weight
  weightWithinGroup: number; // % concept weight within group
  globalWeight: number; // % real global weight (groupWeight * weightWithinGroup / 100)
  rawValue: number | boolean | undefined;
  score100: number; // 0 to 100 normalized concept score
  contributionPoints: number; // score100 * (globalWeight / 100)
  annualMonetaryValue: number;
  isVeto: boolean;
  failsVeto: boolean;
  vetoReason?: string;
}

export interface ConceptGroupResult {
  groupId: string;
  groupName: string;
  color: string;
  groupWeight: number; // %
  totalMonetaryValue: number;
  score100: number; // 0 to 100 weighted score of group
  contributionPoints: number; // score100 * (groupWeight / 100)
  conceptResults: DetailedConceptResult[];
}

export interface EvaluationResult {
  offerId: string;
  offerTitle: string;
  company: string;
  isCurrent: boolean;
  status: OfferStatus;
  totalMonetaryValue: number;
  compositeScore: number; // 0 to 100
  deltaMonetaryVsCurrent: number;
  deltaPercentVsCurrent: number;
  deltaScoreVsCurrent: number;
  failsVeto: boolean;
  vetoReasons: string[];
  strengths: Array<{ conceptName: string; score100: number; contributionPoints: number }>;
  weaknesses: Array<{ conceptName: string; score100: number; contributionPoints: number }>;
  groupResults: ConceptGroupResult[];
  rank: number;
}

export interface PriorityScenario {
  id: string;
  name: string;
  description: string;
  groupWeights: Record<string, number>;
  conceptWeights: Record<string, number>; // key: conceptId, value: weightWithinGroup
}

export interface SensitivityInsight {
  groupId: string;
  groupName: string;
  conceptId?: string;
  conceptName?: string;
  currentWeight: number;
  requiredWeight: number;
  impactDescription: string;
}

export interface SensitivityAnalysisResult {
  leaderOfferId: string;
  leaderTitle: string;
  runnerUpOfferId?: string;
  runnerUpTitle?: string;
  scoreGap: number;
  robustnessStatus: "ROBUSTO" | "SENSIBLE";
  robustnessDescription: string;
  insights: SensitivityInsight[];
}
