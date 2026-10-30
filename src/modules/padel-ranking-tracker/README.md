# 🎾 Padel Ranking & RACE Tracker

Módulo para la consulta, análisis, defensa de puntos y simulación del ranking profesional de pádel (FIP / Premier Padel), integrado con la API **[PadelAPI.org](https://padelapi.org)**.

---

## 📌 Especificaciones Funcionales y Reglas de Cálculo

### 1. Ranking Oficial FIP (Regla de los 22 Mejores Resultados 2026)
- Refleja los resultados válidos durante una ventana temporal móvil de **52 semanas**.
- **Regla Temporada 2026**: Computa únicamente la suma de los **22 mejores resultados** del jugador. El número de resultados computables es configurable por temporada.
- La aplicación muestra:
  - Posición actual y puntos totales oficiales.
  - Variación de posición y puntos respecto a la última actualización.
  - Resultados específicos del Top 22 que contribuyen al total.
  - Puntos pendientes de defender en las próximas semanas.
  - Fecha de última consulta y fuente verificable.

---

### 2. Clasificación Anual (RACE)
- Es la **FIP Race oficial de la temporada 2026**: suma los 22 mejores resultados obtenidos en los torneos de Premier Padel y CUPRA FIP Tour disputados durante 2026.
- No debe confundirse con el ranking FIP de 52 semanas: la Race mide exclusivamente la temporada actual y determina la clasificación para las Finals.
- La aplicación debe mostrar el dato de Race de la fuente oficial/API cuando esté disponible; si se reconstruye desde resultados, debe identificarse como cálculo derivado y validarse contra la clasificación oficial.
- Mantiene:
  - Puntos conseguidos en el año actual.
  - Posición anual y número de torneos disputados.
  - Diferencia de puntos (*gap*) respecto al jugador inmediatamente superior e inferior.

---

### 3. Defensa y Caducidad de Puntos del Año Anterior
- Al cumplirse el ciclo de 52 semanas (según el calendario de la semana de defensa oficial del torneo), los puntos anteriores vencen.
- **Ejemplo de Variación Atribuible**:
  - Un jugador obtuvo **1.000 puntos** en la edición anterior de un P1.
  - En la nueva edición obtiene **600 puntos**.
  - **Variación del resultado sustituido**: $600 - 1.000 = -400 \text{ puntos}$.
  - La variación final del ranking oficial se recalcula re-evaluando el conjunto de los 22 mejores resultados.
- Estados de resultados históricos: `vigente`, `próximo a vencer` y `vencido`.

---

### 4. Diferencia entre Puntos Ganados y Puntos a Defender
- **Puntos Ganados**: Suma de puntos obtenidos en los torneos del año actual.
- **Puntos a Defender**: Puntos del año previo próximos a caducar. No se restan automáticamente a ciegas; su impacto depende del resultado conseguido en la nueva edición.

---

### 5. Proyección y Simulador de Resultados
- Permite simular escenarios para cualquier torneo futuro:
  - Eliminación en 1ª Ronda (R64 / R32).
  - Octavos (R16), Cuartos (QF), Semifinal (SF).
  - Finalista o Campeón.
- Al seleccionar una ronda, el sistema:
  1. Deduce los puntos del torneo anterior sustituido.
  2. Suma los puntos oficiales según la categoría del torneo (Major, P1, P2, Tour Finals, FIP Platinum, Gold, Silver y Bronze).
  3. **Re-calcula el conjunto de los 22 mejores resultados** para determinar la nueva puntuación oficial.
  4. Muestra la posición proyectada estimada con la etiqueta explícita **«Estimación / Proyección Hipotética»**.

---

### 6. Calendario de Defensa de Puntos
- Vista de calendario ordenada por semana de vencimiento.
- Muestra el balance potencial de puntos y el impacto previsto en el ranking.

---

## 🌐 Fuentes de información

- **Premier Padel (web oficial):** referencia para consultar calendario, torneos y resultados publicados por el circuito. La aplicación ofrece un acceso directo; no se debe presentar una extracción automática del sitio hasta que esté implementada y validada.
- **PadelAPI.org:** fuente de datos estructurados para rankings, jugadores y torneos. Su conexión requiere un token Bearer, pero es opcional.
- **Sin token o ante un error de API:** la herramienta carga igualmente, muestra el estado de conexión y deja vacías las vistas que necesitan datos. No se sustituyen datos oficiales por cifras ficticias.

## 📡 Conexión a PadelAPI.org

La aplicación se conecta a PadelAPI.org enviando la cabecera HTTP de autorización. El token debe mantenerse en el servidor (variable de entorno o almacenamiento protegido), nunca devolverse al navegador:

```http
GET https://padelapi.org/api/seasons
Authorization: Bearer TU_API_TOKEN
```

### Endpoints Utilizados:
- `GET https://padelapi.org/api/seasons`: Consulta las temporadas y reglas de cálculo.
- `GET https://padelapi.org/api/rankings`: Obtiene las clasificaciones oficiales de categorías masculina y femenina.
- `GET https://padelapi.org/api/tournaments`: Obtiene el calendario de torneos y tablas de puntuación por ronda.

---

## ⚙️ Variables de Entorno (`.env`)

Cuando dispongas del token, configúralo desde la pestaña **⚙️ Ajustes & API** o mediante `.env`. No es necesario configurarlo para abrir y navegar por la herramienta:

```env
# URL base de PadelAPI.org
PADEL_API_URL="https://padelapi.org/api"

# Token de autenticación Bearer de padelapi.org
PADEL_API_KEY="TU_API_TOKEN_BEARER"

# Base de datos MongoDB (almacena solo credenciales, reglas y simulaciones)
PADEL_RANKING_TRACKER_DB_NAME="padel-ranking-tracker"
```
