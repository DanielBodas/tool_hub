export type ConceptCategory = "economic" | "subjective";

export type ConceptCalculationType =
  | "direct_monetary"      // Salario base, pensión, importes directos (€/año)
  | "bonus_probability"    // Bonus con importe máximo y % probabilidad de cobro
  | "user_valued_benefit"  // Seguro médico, ayuda comida (valor personal €/año asignado por el usuario)
  | "telework_days"        // Días de teletrabajo/semana
  | "commute_time"         // Minutos de desplazamiento/día (coste de tiempo libre)
  | "vacation_days"        // Días de vacaciones/año (vs referencia)
  | "subjective_score";    // Concepto intangible (0-10) valorado según valor máximo personal

export type CalculationType = ConceptCalculationType; // Alias for backward compatibility

export type ConceptNature = "positive" | "negative";

export type UnitType =
  | "EUR_YEAR"       // €/año
  | "EUR_MONTH"      // €/mes
  | "PERCENT"        // %
  | "DAYS_YEAR"      // días/año
  | "DAYS_WEEK"      // días/semana
  | "SCORE_10"       // Puntuación 0-10
  | "BOOLEAN"        // Sí / No
  | "MINUTES_DAY";   // minutos/día (desplazamiento)

export interface UserPreferences {
  teleworkDayValue: number;        // Valor personal de un día de teletrabajo (€/día), ej. 30 €
  workingWeeksPerYear: number;     // Semanas laborales al año, ej. 46 semanas
  freeTimeHourValue: number;       // Valor personal de una hora de tiempo libre (€/hora), ej. 20 €
  vacationDayValue: number;        // Valor personal de un día adicional de vacaciones (€/día), ej. 150 €
  vacationReferenceDays: number;   // Días de vacaciones de referencia/base, ej. 22 días
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  teleworkDayValue: 30,
  workingWeeksPerYear: 46,
  freeTimeHourValue: 20,
  vacationDayValue: 150,
  vacationReferenceDays: 22,
};

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
  category: ConceptCategory;
  calculationType: ConceptCalculationType;
  maxPersonalValue: number; // Valor máximo para el usuario (€/año) - "VALOR MÁXIMO PARA MÍ"
  isPositive: boolean;      // true para beneficios/positivos, false para penalizaciones/costes
  unit: UnitType;
  weight?: number;          // Obsoleto (mapeado a maxPersonalValue para compatibilidad)
  monetaryEquivalencePerUnit?: number;
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
  location: string;                       // Ciudad / Ubicación
  workModality?: WorkModality;            // Modalidad
  officeDaysPerWeek?: number;             // Días presenciales en oficina (0-5)
  isCurrent: boolean;
  status: OfferStatus;
  notes?: string;
  values: Record<string, number | boolean>;
  conceptNotes?: Record<string, string>; // Notas/Justificaciones por concepto
  commuteKmOneWay?: number;               // Distancia en km (ida)
  commuteFuelL100?: number;              // Consumo en L/100km
  fuelPriceEurL?: number;                // Precio combustible en €/L
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
  totalMonetaryValue: number; // Salario Equivalente Personal Total (€/año)
  economicMonetaryValue: number; // Subtotal de valor económico directo
  intangibleMonetaryValue: number; // Subtotal de valor intangible/conciliación
  compositeScore: number;     // Score de 0 a 100
  deltaMonetaryVsCurrent: number;
  deltaPercentVsCurrent: number;
  deltaScoreVsCurrent: number;
  groupResults: ConceptGroupResult[];
  rank: number;
}
