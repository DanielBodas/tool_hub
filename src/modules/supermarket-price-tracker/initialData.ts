import { Supermarket, Brand, Product, PriceRecord, calculateNormalizedUnitPrice } from "./types";

export const INITIAL_SUPERMARKETS: Supermarket[] = [
  { id: "sm-mercadona", name: "Mercadona", color: "#00A859", notes: "Supermercado de proximidad principal" },
  { id: "sm-carrefour", name: "Carrefour", color: "#004B93", notes: "Hipermercado con ofertas 3x2 habituales" },
  { id: "sm-lidl", name: "Lidl", color: "#E30613", notes: "Grandes ofertas en semanas temáticas" },
  { id: "sm-dia", name: "Dia", color: "#DC241F", notes: "Descuentos con tarjeta Club Dia" },
  { id: "sm-consum", name: "Consum", color: "#FF6600", notes: "Cooperativa con cheques regalo mensuales" },
];

export const INITIAL_BRANDS: Brand[] = [
  {
    id: "brand-hacendado",
    name: "Hacendado",
    supermarketIds: ["sm-mercadona"], // Only in Mercadona
    productIds: [], // All products
    notes: "Marca blanca de Mercadona",
  },
  {
    id: "brand-carrefour",
    name: "Carrefour Classic",
    supermarketIds: ["sm-carrefour"], // Only in Carrefour
    productIds: [],
    notes: "Marca blanca de Carrefour",
  },
  {
    id: "brand-milbona",
    name: "Milbona",
    supermarketIds: ["sm-lidl"], // Only in Lidl
    productIds: ["prod-leche"], // Lácteos
    notes: "Marca láctea exclusiva de Lidl",
  },
  {
    id: "brand-bosqueverde",
    name: "Bosque Verde",
    supermarketIds: ["sm-mercadona"],
    productIds: ["prod-detergente"], // Limpieza
    notes: "Marca de limpieza de Mercadona",
  },
  {
    id: "brand-pascual",
    name: "Pascual",
    supermarketIds: [], // Global (available in multiple supermarkets)
    productIds: ["prod-leche"],
    notes: "Marca de leche nacional",
  },
  {
    id: "brand-carbonell",
    name: "Carbonell",
    supermarketIds: [], // Global
    productIds: ["prod-aceite"],
    notes: "Marca tradicional de aceite",
  },
  {
    id: "brand-nestle",
    name: "Nestlé",
    supermarketIds: [], // Global
    productIds: [],
    notes: "Multinacional de alimentación",
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-leche",
    name: "Leche Entera",
    category: "Lácteos",
    defaultUnit: "L",
    variants: [
      { id: "v-leche-1l", name: "Brik 1L", quantity: 1, unit: "L" },
      { id: "v-leche-6pack", name: "Pack 6x1L", quantity: 6, unit: "L" },
    ],
    notes: "Cartón o pack de brik de leche entera",
  },
  {
    id: "prod-aceite",
    name: "Aceite de Oliva Virgen Extra",
    category: "Aceites y Condimentos",
    defaultUnit: "L",
    variants: [
      { id: "v-aceite-1l", name: "Botella 1L", quantity: 1, unit: "L" },
      { id: "v-aceite-3l", name: "Garrafa 3L", quantity: 3, unit: "L" },
      { id: "v-aceite-5l", name: "Garrafa 5L", quantity: 5, unit: "L" },
    ],
    notes: "Garrafa de 3L/5L o botella de 1L",
  },
  {
    id: "prod-arroz",
    name: "Arroz Redondo",
    category: "Cereales y Legumbres",
    defaultUnit: "kg",
    variants: [
      { id: "v-arroz-1kg", name: "Paquete 1kg", quantity: 1, unit: "kg" },
      { id: "v-arroz-2kg", name: "Saco 2kg", quantity: 2, unit: "kg" },
    ],
    notes: "Paquete estándar de arroz para paellas/guisos",
  },
  {
    id: "prod-pollo",
    name: "Pechuga de Pollo Fileteada",
    category: "Frescos y Carnes",
    defaultUnit: "kg",
    variants: [
      { id: "v-pollo-500g", name: "Bandeja 500g", quantity: 500, unit: "g" },
      { id: "v-pollo-650g", name: "Bandeja 650g", quantity: 650, unit: "g" },
      { id: "v-pollo-1kg", name: "Ahorro 1kg", quantity: 1, unit: "kg" },
    ],
    notes: "Bandeja de pechuga deshuesada y fileteada",
  },
  {
    id: "prod-detergente",
    name: "Detergente Líquido Lavadora",
    category: "Limpieza del Hogar",
    defaultUnit: "L",
    variants: [
      { id: "v-det-3l", name: "Botella 3L (50 lavados)", quantity: 3, unit: "L" },
      { id: "v-det-5l", name: "Garrafa 5L (80 lavados)", quantity: 5, unit: "L" },
    ],
    notes: "Detergente concentrado en formato botella",
  },
];

export const INITIAL_PRICE_RECORDS: PriceRecord[] = [
  // Leche Entera - Historical timeline
  {
    id: "pr-1",
    productId: "prod-leche",
    variantId: "v-leche-1l",
    brandId: "brand-hacendado",
    supermarketId: "sm-mercadona",
    date: "2024-11-10",
    totalPrice: 0.91,
    quantity: 1,
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(0.91, 1, "L"),
    isOffer: false,
    notes: "Precio habitual en Mercadona",
  },
  {
    id: "pr-2",
    productId: "prod-leche",
    variantId: "v-leche-1l",
    brandId: "brand-hacendado",
    supermarketId: "sm-mercadona",
    date: "2025-01-15",
    totalPrice: 0.95,
    quantity: 1,
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(0.95, 1, "L"),
    isOffer: false,
    notes: "Subida general de lácteos",
  },
  {
    id: "pr-3",
    productId: "prod-leche",
    variantId: "v-leche-6pack",
    brandId: "brand-pascual",
    supermarketId: "sm-carrefour",
    date: "2025-02-01",
    totalPrice: 6.60,
    quantity: 6, // 6x1L pack
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(6.60, 6, "L"), // 1.10 €/L
    isOffer: true,
    offerDescription: "Pack 6 briks en oferta 3x2",
    notes: "Precio por brik sale a 1,10€ en pack de 6",
  },
  {
    id: "pr-4",
    productId: "prod-leche",
    variantId: "v-leche-1l",
    brandId: "brand-milbona",
    supermarketId: "sm-lidl",
    date: "2025-02-10",
    totalPrice: 0.89,
    quantity: 1,
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(0.89, 1, "L"),
    isOffer: true,
    offerDescription: "Oferta catálogo semanal Lidl",
    notes: "Mínimo histórico reciente en Lidl",
  },

  // Aceite de Oliva AOVE
  {
    id: "pr-5",
    productId: "prod-aceite",
    variantId: "v-aceite-1l",
    brandId: "brand-hacendado",
    supermarketId: "sm-mercadona",
    date: "2024-10-05",
    totalPrice: 9.25,
    quantity: 1,
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(9.25, 1, "L"),
    isOffer: false,
    notes: "Botella 1L",
  },
  {
    id: "pr-6",
    productId: "prod-aceite",
    variantId: "v-aceite-1l",
    brandId: "brand-hacendado",
    supermarketId: "sm-mercadona",
    date: "2025-01-20",
    totalPrice: 7.95,
    quantity: 1,
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(7.95, 1, "L"),
    isOffer: true,
    offerDescription: "Bajada de precio por nueva cosecha",
    notes: "Gran bajada del aceite de oliva",
  },
  {
    id: "pr-7",
    productId: "prod-aceite",
    variantId: "v-aceite-3l",
    brandId: "brand-carbonell",
    supermarketId: "sm-carrefour",
    date: "2025-02-12",
    totalPrice: 21.90,
    quantity: 3, // 3L garrafa
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(21.90, 3, "L"), // 7.30 €/L
    isOffer: true,
    offerDescription: "Garrafa 3L con 15% acumulable en ChequeSalud",
    notes: "Salía a 7.30€/L",
  },

  // Arroz Redondo
  {
    id: "pr-8",
    productId: "prod-arroz",
    variantId: "v-arroz-1kg",
    brandId: "brand-hacendado",
    supermarketId: "sm-mercadona",
    date: "2025-01-10",
    totalPrice: 1.30,
    quantity: 1,
    unit: "kg",
    unitPrice: calculateNormalizedUnitPrice(1.30, 1, "kg"),
    isOffer: false,
  },
  {
    id: "pr-9",
    productId: "prod-arroz",
    variantId: "v-arroz-1kg",
    brandId: "brand-carrefour",
    supermarketId: "sm-carrefour",
    date: "2025-02-05",
    totalPrice: 1.19,
    quantity: 1,
    unit: "kg",
    unitPrice: calculateNormalizedUnitPrice(1.19, 1, "kg"),
    isOffer: true,
    offerDescription: "Súper precio Carrefour",
  },

  // Pechuga de Pollo
  {
    id: "pr-10",
    productId: "prod-pollo",
    variantId: "v-pollo-650g",
    brandId: "brand-hacendado",
    supermarketId: "sm-mercadona",
    date: "2025-02-01",
    totalPrice: 4.80,
    quantity: 650, // 650 grams
    unit: "g",
    unitPrice: calculateNormalizedUnitPrice(4.80, 650, "g"), // 7.38 €/kg
    isOffer: false,
    notes: "Bandeja 650g",
  },

  // Detergente
  {
    id: "pr-11",
    productId: "prod-detergente",
    variantId: "v-det-3l",
    brandId: "brand-bosqueverde",
    supermarketId: "sm-mercadona",
    date: "2025-01-18",
    totalPrice: 4.50,
    quantity: 3, // 3L = 50 lavados
    unit: "L",
    unitPrice: calculateNormalizedUnitPrice(4.50, 3, "L"), // 1.50 €/L
    isOffer: false,
  },
];
