# 🎾 Padel Ranking & RACE Tracker

**Padel Ranking & RACE Tracker** es una herramienta para el seguimiento y simulación del ranking profesional de pádel masculino y femenino (FIP / Premier Padel).

> **Nota de Arquitectura**: La herramienta **NO guarda ni almacena jugadores o resultados por defecto** en la base de datos. Toda la información de ránkings, puntos y torneos se obtiene de forma dinámica a través de la **API de Pádel** configurada por el usuario. Lo único que se persiste en la base de datos es la **URL de la API**, el **Token de autorización** y los escenarios simulados.

---

## 🚀 Características Principales

1. **Datos 100% Dinámicos desde API**:
   - Conexión directa con tu proveedor de API de pádel (FIP, RapidAPI u otros endpoints REST).
   - Solamente se guardan en MongoDB la URL de la API y el token Bearer.
2. **Ranking Oficial vs. RACE del Año**:
   - **Ranking Oficial (FIP / Premier Padel)**: Sistema de puntuación móvil (*rolling*) de 52 semanas.
   - **RACE del Año**: Clasificación acumulada exclusivamente con los puntos ganados a partir del 1 de enero del año actual.
3. **Caída y Resta de Puntos por Fecha (Expiración)**:
   - Desglose transparente de los puntos que cada jugador restará según las fechas de caducidad devueltas por la API.
   - Cálculo automático de **Predicción de Puntos Netos** = *(Puntos Actuales - Puntos a Restar + Puntos Nuevos/Simulados)*.
4. **Simulador de Torneos y Resultados Futuros**:
   - Permite seleccionar torneos del calendario y proyectar la ronda alcanzada por cada pareja (Campeón, Finalista, Semis, Cuartos, Octavos, etc.).
   - Recalcula al instante las posiciones del Ranking y de la RACE, mostrando ascensos y descensos (`+2`, `-1`, `=`).
5. **Diseño Mobile-First**:
   - Interfaz adaptada a smartphones con cápsula de navegación adhesiva (*sticky*) y controles táctiles rápida.

---

## ⚙️ Configuración y Variables de Entorno (`.env`)

Puedes configurar tu API de pádel desde la pestaña **⚙️ Ajustes & API** de la interfaz o mediante tu archivo `.env`:

```env
# URL base de la API de pádel (obligatorio para cargar datos)
PADEL_API_URL="https://api.tu-proveedor-padel.com/v1"

# Token / API Key Bearer
PADEL_API_KEY="tu_token_aqui"

# Nombre de la base de datos MongoDB (donde se guarda solo la config y simulaciones)
PADEL_RANKING_TRACKER_DB_NAME="padel-ranking-tracker"

# PIN de acceso rápido a la herramienta
PADEL_RANKING_TRACKER_PIN="1234"
```

---

## 📡 Formato Esperado de la API Externa

La API configurada debe exponer los siguientes endpoints JSON:

### 1. `GET /rankings`
Devuelve el listado de jugadores/as con su desglose de puntos:

```json
{
  "malePlayers": [
    {
      "id": "m-1",
      "name": "Arturo Coello",
      "country": "ESP 🇪🇸",
      "officialPoints": 13800,
      "racePoints": 3000,
      "partnerName": "Agustín Tapia",
      "pointsHistory": [
        {
          "tournamentId": "t-1",
          "tournamentName": "Qatar Major 2025",
          "category": "Major",
          "round": "Winner",
          "points": 2000,
          "expirationDate": "2026-03-09"
        }
      ]
    }
  ],
  "femalePlayers": []
}
```

### 2. `GET /tournaments`
Devuelve el calendario de torneos y sus escalas de puntos por ronda:

```json
[
  {
    "id": "t-1",
    "name": "GNP Mexico P1 2025",
    "category": "P1",
    "location": "Acapulco, México",
    "startDate": "2025-03-24",
    "endDate": "2025-03-30",
    "status": "upcoming",
    "pointsScale": {
      "Winner": 1000,
      "Finalist": 600,
      "SF": 360,
      "QF": 180,
      "R16": 90,
      "R32": 45
    }
  }
]
```

---

## 🧮 Algoritmo de Predicción y Simulación

$$\text{Puntos Predichos} = \text{Puntos Actuales} - \sum \text{Puntos Expirados} + \text{Puntos Proyectados en Simulador}$$
