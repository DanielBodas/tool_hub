# Credenciales de prueba — ToolHub

## Acceso global
- **Admin Code** (login `/login` → Acceso por código / dashboard): `1234` (env `ADMIN_CODE`)

## Herramienta Gestor Financiero (`/tools/finance-tracker`)
- **PIN de herramienta**: `1234` (env `FINANCE_TRACKER_PIN` en `src/modules/finance-tracker/.env`)
- Acceso: en la pantalla de la herramienta → "Acceso por PIN" → `1234`

## Base de datos
- MongoDB local: `mongodb://127.0.0.1:27017` (env `MONGODB_URI`)
- DB del gestor financiero: `finance-tracker` (configurable con `FINANCE_TRACKER_DB_NAME`), colección `data`, doc `finance_store_v1`
