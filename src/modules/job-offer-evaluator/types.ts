export type CalculationType = "monetary_direct" | "weighted_score" | "monetary_calculated";

export type UnitType =
  | "EUR_YEAR"       // €/año
  | "EUR_MONTH"      // €/mes
  | "DAYS_YEAR"      // días/año
  | "DAYS_WEEK"      // días/semana
  | "SCORE_10"       // Puntuación 1-10
  | "BOOLEAN"        // Sí / No
  | "MINUTES_DAY";   // minutos/día (desplazamiento)

export interface ConceptGroup {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Concept {
  id: string;
  groupId: string;
  name: string;
  description: string;
  unit: UnitType;
  type: CalculationType;
  weight: number; // 1 to 10 (Importance weight)
  isPositive: boolean; // true if higher is better, false if lower is better
  monetaryEquivalencePerUnit?: number; // annual monetary equivalency multiplier
}

export type OfferStatus =
  | "current"       // Puesto Actual
  | "received"      // Oferta Recibida
  | "negotiating"   // En Negociación
  | "interviewing"  // En Proceso
  | "accepted"      // Oferta Aceptada
  | "discarded";    // Descartada

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  isCurrent: boolean;
  status: OfferStatus;
  notes?: string;
  values: Record<string, number | boolean>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConceptGroupResult {
  groupId: string;
  groupName: string;
  color: string;
  totalMonetaryValue: number;
  score100: number;
}

export interface EvaluationResult {
  offerId: string;
  offerTitle: string;
  company: string;
  isCurrent: boolean;
  status: OfferStatus;
  totalMonetaryValue: number;
  compositeScore: number;
  deltaMonetaryVsCurrent: number;
  deltaPercentVsCurrent: number;
  deltaScoreVsCurrent: number;
  groupResults: ConceptGroupResult[];
  rank: number;
}
