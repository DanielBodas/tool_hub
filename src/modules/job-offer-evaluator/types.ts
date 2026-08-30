export type ConceptCategory = "tangible" | "intangible" | "both";

export type UnitType =
  | "EUR_YEAR"       // €/año
  | "EUR_MONTH"      // €/mes
  | "DAYS_YEAR"      // días/año
  | "DAYS_WEEK"      // días/semana (días presenciales o teletrabajo)
  | "SCORE_10"       // Puntuación 1-10
  | "BOOLEAN"        // Sí / No
  | "MINUTES_DAY"    // minutos/día (desplazamiento)
  | "CATEGORICAL";   // Opciones categóricas con puntuación/valor asignado

export interface ConceptOption {
  id: string;
  label: string;      // ej: "100% Remoto", "Comida gratis", "Llevar tupper", "3 días oficina"
  score: number;      // Puntuación 0-10
  value?: number;     // Valor económico opcional €/año
}

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
  category: ConceptCategory; // tangible (dinero), intangible (puntuación/felicidad), or both
  weight: number; // 1 to 10 (Importance weight)
  isPositive: boolean; // true if higher is better, false if lower is better
  monetaryEquivalencePerUnit?: number; // annual monetary equivalency multiplier if applicable
  minLabel?: string; // Meaning of 0 / minimum score (e.g., "5 días en oficina", "Tupper de casa")
  maxLabel?: string; // Meaning of 10 / maximum score (e.g., "100% Remoto", "Comida gratis en restaurante")
  options?: ConceptOption[]; // Lista de opciones categóricas personalizadas
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
