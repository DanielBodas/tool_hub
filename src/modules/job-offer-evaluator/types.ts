export type ConceptCategory = "tangible" | "intangible" | "both";

export type UnitType =
  | "EUR_YEAR"       // €/año
  | "SCORE_10"       // Puntuación 0-10
  | "CATEGORICAL";   // Legacy compatibility

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
  category: ConceptCategory; // tangible (dinero €/año), intangible (puntuación 0-10), or both
  weight: number; // 1 to 10 (Importance weight)
  unit?: UnitType; // Optional legacy field
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
  location: string;                       // City / Location
  workModality?: WorkModality;            // Structured Modality
  officeDaysPerWeek?: number;             // On-site days (0 for remote, 5 for office, 1-4 for hybrid)
  isCurrent: boolean;
  status: OfferStatus;
  notes?: string;
  values: Record<string, number | boolean | string>;
  conceptNotes?: Record<string, string>; // Justification / notes per concept value
  commuteKmOneWay?: number;               // Distance in km (one-way)
  commuteFuelL100?: number;              // Car fuel consumption in L/100km
  fuelPriceEurL?: number;                // Fuel price in €/L
  createdAt?: string;
  updatedAt?: string;
}

export interface ConceptGroupResult {
  groupId: string;
  groupName: string;
  color: string;
  totalTangibleValue: number;
  score100: number;
}

export interface EvaluationResult {
  offerId: string;
  offerTitle: string;
  company: string;
  isCurrent: boolean;
  status: OfferStatus;
  totalTangibleValue: number;  // Salario real (suma de tangibles reales en €/año)
  compositeScore: number;      // Puntuación global del puesto (0-100 pts)
  deltaTangibleVsCurrent: number;
  deltaPercentVsCurrent: number;
  deltaScoreVsCurrent: number;
  groupResults: ConceptGroupResult[];
  rank: number;
}
