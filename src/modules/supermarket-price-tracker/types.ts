export type UnitType = "kg" | "g" | "L" | "ml" | "ud";

export interface Supermarket {
  id: string;
  name: string;
  color: string;
  logoUrl?: string;
  notes?: string;
}

export interface Brand {
  id: string;
  name: string;
  supermarketIds: string[]; // If empty, available in all supermarkets
  productIds: string[];     // If empty, available for all products
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  defaultUnit: UnitType;
  notes?: string;
}

export interface PriceRecord {
  id: string;
  productId: string;
  brandId: string;
  supermarketId: string;
  date: string; // YYYY-MM-DD
  totalPrice: number; // total cost in Euros (€)
  quantity: number;   // quantity e.g. 1.5, 500, 6
  unit: UnitType;     // "kg", "g", "L", "ml", "ud"
  unitPrice: number;  // normalized unit price (€ per base unit: kg, L, ud)
  isOffer: boolean;
  offerDescription?: string;
  notes?: string;
}

export type OfferAssessmentStatus =
  | "CHOLLO"        // <= min or within 2% of min
  | "BUEN_PRECIO"   // < avg
  | "FALSA_OFERTA"  // >= avg
  | "SIN_DATOS";    // no historical records to compare

export interface OfferAssessment {
  status: OfferAssessmentStatus;
  currentUnitPrice: number;
  historicalMinUnitPrice: number;
  historicalAvgUnitPrice: number;
  historicalMaxUnitPrice: number;
  diffVsMinPercent: number;
  diffVsAvgPercent: number;
  baseUnitLabel: string; // "€/kg", "€/L", "€/ud"
  message: string;
}

/**
 * Normalizes quantity to standard base units:
 * - g -> kg (qty / 1000)
 * - ml -> L (qty / 1000)
 * - kg -> kg
 * - L -> L
 * - ud -> ud
 */
export function getBaseQuantity(quantity: number, unit: UnitType): number {
  if (quantity <= 0) return 1;
  if (unit === "g" || unit === "ml") {
    return quantity / 1000;
  }
  return quantity;
}

export function getBaseUnitLabel(unit: UnitType): string {
  if (unit === "kg" || unit === "g") return "€/kg";
  if (unit === "L" || unit === "ml") return "€/L";
  return "€/ud";
}

export function calculateNormalizedUnitPrice(
  totalPrice: number,
  quantity: number,
  unit: UnitType
): number {
  const baseQty = getBaseQuantity(quantity, unit);
  if (baseQty <= 0) return totalPrice;
  return totalPrice / baseQty;
}
