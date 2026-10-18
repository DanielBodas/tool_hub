# 🎾 Padel Ranking & RACE Tracker

**Padel Ranking & RACE Tracker** es una herramienta integral diseñada para el seguimiento y simulación del ranking profesional de pádel masculino y femenino (FIP / Premier Padel).

---

## 🚀 Características Principales

1. **Ranking Oficial vs. RACE del Año**:
   - **Ranking Oficial (FIP / Premier Padel)**: Sistema de puntuación móvil (*rolling*) de 52 semanas basado en los mejores resultados.
   - **RACE del Año**: Clasificación acumulada exclusivamente con los puntos ganados desde el 1 de enero del año actual.
2. **Caída y Resta de Puntos por Fecha (Expiración)**:
   - Desglose transparente de los puntos que cada jugador restará en las próximas semanas/meses.
   - Cálculo automático de **Predicción de Puntos Netos** = *(Puntos Actuales - Puntos a Restar + Puntos Nuevos/Simulados)*.
3. **Simulador de Torneos y Resultados Futuros**:
   - Permite seleccionar torneos del calendario y asignar la ronda proyectada para cada pareja (Campeón, Finalista, Semis, Cuartos, Octavos, etc.).
   - Recalcula al instante las posiciones del Ranking y de la RACE, mostrando variaciones de puestos (`+2`, `-1`, `=`) y diferencias de puntos.
4. **Próximos Torneos y Resultados**:
   - Calendario completo de torneos Premier Padel (Major, P1, P2, Tour Finals, FIP Platinum, etc.).
   - Escalas oficiales de distribución de puntos por categoría.
   - Resultados detallados de torneos disputados.
5. **Diseño Mobile-First**:
   - Interfaz ultra-compacta, controles flotantes adhesivos (*sticky*), navegación por pestañas táctiles y adaptación completa a pantallas móviles de cualquier tamaño.

---

## 🔍 Investigación sobre APIs de Pádel

Para mantener los datos actualizados automáticamente, la herramienta soporta la integración con APIs externas de pádel:

### 1. FIP Official Data Services (International Padel Federation API)
- **Endpoint**: `https://api.padelfip.com/v1`
- **Descripción**: La API oficial de la Federación Internacional de Pádel provee ránkings masculinos y femeninos, fichas de jugadores, torneos y cuadros de competición.

### 2. RapidAPI / Sports Data APIs (Padel Feeds)
- Proveedores en RapidAPI ofrecen conectores REST para torneos Premier Padel y FIP Tour.
- Proporcionan endpoints estructurados para:
  - `GET /rankings?gender=male|female`
  - `GET /tournaments?status=upcoming|completed`
  - `GET /matches/results`

### 3. Conector Adaptable Local
Si no dispones de una API key comercial, la herramienta funciona de manera autónoma con una **base de datos precargada (*seed data*)** con los 15 mejores jugadores y jugadoras del ranking mundial (Coello, Tapia, Galán, Chingotto, Lebrón, Stupaczuk, Paula Josemaría, Ari Sánchez, Gemma Triay, Delfi Brea, Bea González, etc.) y el calendario Premier Padel 2024/2025.

---

## ⚙️ Configuración y Variables de Entorno (`.env`)

Añade las siguientes variables a tu archivo `.env` o `.env.local`:

```env
# URL base de la API de pádel (opcional)
PADEL_API_URL="https://api.padelfip.com/v1"

# API Key de la API de pádel (opcional)
PADEL_API_KEY="tu_api_key_aqui"

# Nombre de la base de datos en MongoDB
PADEL_RANKING_TRACKER_DB_NAME="padel-ranking-tracker"

# PIN de acceso a la herramienta desde el Dashboard
PADEL_RANKING_TRACKER_PIN="1234"

# Usuarios con acceso directo sin PIN (separados por comas)
PADEL_RANKING_TRACKER_ALLOWED_USERS="admin@ejemplo.com,usuario@ejemplo.com"
```

---

## 🧮 Cálculo del Ranking, Expiración y RACE

### 1. Distinción entre Ranking y RACE
- **Ranking Oficial**: Suma los puntos válidos conseguidos en los torneos disputados durante las últimas 52 semanas. Al disputarse una nueva edición de un torneo, los puntos de la edición anterior caducan.
- **RACE**: Suma únicamente los puntos ganados a partir del 1 de enero del año actual. Al final del año, el Top 16 de la RACE clasifica al Premier Padel Tour Finals.

### 2. Algoritmo de Predicción
$$\text{Puntos Predichos} = \text{Puntos Actuales} - \sum \text{Puntos Expirados en Fecha} + \sum \text{Puntos Simulados Nuevos}$$

---

## 📲 Uso en Dispositivos Móviles

- Cambia entre **👨 MASCULINO** y **👩 FEMENINO** usando la barra superior.
- Navega cómodamente por las 5 pestañas:
  - **🏆 Ranking & RACE**: Tabla general con variación de puestos y puntos.
  - **📉 Caída de Puntos**: Línea de tiempo de caducidad de puntos por fecha.
  - **🔮 Simulador**: Pronostica resultados y simula la clasificación.
  - **📅 Torneos & Resultados**: Consulta el calendario e historial.
  - **⚙️ Config & API**: Gestiona sincronización, copias de seguridad JSON y edición manual.
