# PRD — Gestor Financiero (ToolHub)

## Problema original (usuario)
Mejorar la herramienta "Gestor Financiero" dentro del ToolHub (Next.js + MongoDB):
- Persistir datos en MongoDB con nombre de BD por defecto, sobreescribible vía `.env`.
- Separar por secciones: Dashboard (dinero disponible vs invertido + control de prudencia), y detalle de inversiones.
- Inversiones diversificadas. Caso especial: acciones Airbus (ESOP): cada año la empresa ofrece X acciones (se pagan) y regala Y (gratis).
- Bloqueo de 3 años antes de poder vender (se desbloquean).
- Al vender: impuesto configurable sobre el margen fiscal.

## Arquitectura
- **Framework**: Next.js 16 (App Router) + React 19 + TailwindCSS 4 + NextAuth + MongoDB (driver oficial).
- **Ejecución**: supervisor `nextapp` → `npm run start` en `/app` puerto 3000 (build de producción; se reconstruye con `npm run build`).
- **Módulo**: `src/modules/finance-tracker/FinanceTrackerModule.tsx`; API `src/app/api/finance-tracker/route.ts`; página `src/app/tools/finance-tracker/page.tsx`.
- **Persistencia**: DB `finance-tracker` (env `FINANCE_TRACKER_DB_NAME`), colección `data`, documento único `finance_store_v1`.
- **Auth**: three-tier (Admin code / Google whitelist / PIN de herramienta). PIN `1234`.

## Fórmula fiscal Airbus (confirmada por el usuario)
Por paquete: `totalShares = X + Y` (bonus Y coste 0).
- Base fiscal = `totalShares × (PrecioVenta − PrecioOficial)` (mínimo 0)
- Impuesto = `Base × taxRate%`
- Coste compra = `X × PrecioCompra`
- Beneficio neto real = `(PrecioVenta × totalShares) − Coste compra − Impuesto`
En paquetes no vendidos se usa `marketPrice` como precio de venta estimado.

## Implementado (2026-06)
- Persistencia real en MongoDB con nombre de BD configurable (verificado POST→GET→documento en Mongo).
- Secciones: Resumen, Liquidez, Airbus ESOP, Otras Inversiones.
- Dashboard: patrimonio neto, liquidez vs invertido (%), barra de distribución, límite de prudencia con alerta, colchón en meses.
- Airbus: alta/edición de añadas (X, Y, precio compra, precio oficial, mercado, año adjudicación), bloqueo 3 años.
- **NUEVO**: flujo de venta real (precio y fecha de venta), cálculo de beneficio neto realizado, tarjeta "Beneficio Realizado".
- **NUEVO**: desglose fiscal detallado expandible por paquete (coste, ingreso, valor oficial, base fiscal, impuesto, neto).
- **NUEVO**: simulador con precio de venta objetivo (input) + base fiscal y beneficio real neto.
- Ajustes configurables: límite máximo invertido (%) y tipo de impuesto (%).
- Datos de ejemplo sembrados en MongoDB.

## Backlog / próximos
- P1: Al marcar vendido, opción de mover automáticamente el neto a liquidez.
- P2: Histórico/gráfica de evolución del patrimonio.
- P2: Exportar informe fiscal (PDF/CSV) por año.
- P2: Precio de mercado Airbus automático (API bolsa).
