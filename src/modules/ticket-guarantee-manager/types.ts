export type TicketCategory =
  | "Electrónica"
  | "Hogar y Cocina"
  | "Moda y Calzado"
  | "Deportes"
  | "Informática"
  | "Electrodomésticos"
  | "Bebé y Niños"
  | "Bricolaje y Jardín"
  | "Otros";

export interface TicketItem {
  id: string;
  productName: string;
  store: string;
  category: TicketCategory;
  price?: number;
  purchaseDate: string; // YYYY-MM-DD

  // Return policy details
  hasReturnPolicy: boolean;
  returnExpirationDate?: string; // YYYY-MM-DD

  // Guarantee details
  hasGuarantee: boolean;
  guaranteeExpirationDate?: string; // YYYY-MM-DD

  // Reminder settings
  reminderEnabled: boolean;
  reminderWeeksBefore: number; // e.g. 1, 2, 4 weeks

  // Photo / Scan digitalized
  ticketImageUrl?: string; // base64 data URL

  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TicketStatusFilter =
  | "all"
  | "return_active"
  | "guarantee_active"
  | "expiring_soon"
  | "expired";
