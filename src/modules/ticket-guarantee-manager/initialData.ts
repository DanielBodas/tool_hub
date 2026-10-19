import { TicketItem } from "./types";

// Helper to compute dynamic default dates relative to today
const getOffsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export const INITIAL_TICKETS: TicketItem[] = [
  {
    id: "sample-ticket-1",
    productName: "Auriculares Inalámbricos Noise Cancelling",
    store: "El Corte Inglés",
    category: "Electrónica",
    price: 189.99,
    purchaseDate: getOffsetDate(-10),
    hasReturnPolicy: true,
    returnExpirationDate: getOffsetDate(20), // 30 days return
    hasGuarantee: true,
    guaranteeExpirationDate: getOffsetDate(365 * 3 - 10), // 3 years guarantee
    reminderEnabled: true,
    reminderWeeksBefore: 2,
    notes: "Conservar caja original para devolución si es necesario.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-ticket-2",
    productName: "Cafetera Expresso Automática",
    store: "MediaMarkt",
    category: "Electrodomésticos",
    price: 349.00,
    purchaseDate: getOffsetDate(-350),
    hasReturnPolicy: true,
    returnExpirationDate: getOffsetDate(-320), // Expired return
    hasGuarantee: true,
    guaranteeExpirationDate: getOffsetDate(15), // Expiring in 15 days!
    reminderEnabled: true,
    reminderWeeksBefore: 3,
    notes: "Aviso de revisión del molinillo antes de agotar garantía.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-ticket-3",
    productName: "Zapatillas de Running PRO",
    store: "Decathlon",
    category: "Deportes",
    price: 89.95,
    purchaseDate: getOffsetDate(-5),
    hasReturnPolicy: true,
    returnExpirationDate: getOffsetDate(55), // 60 days Decathlon return
    hasGuarantee: true,
    guaranteeExpirationDate: getOffsetDate(365 * 2 - 5),
    reminderEnabled: false,
    reminderWeeksBefore: 1,
    notes: "Ticket del club registrado.",
    createdAt: new Date().toISOString(),
  },
];
