# Tool Hub

Una plataforma escalable para alojar múltiples herramientas web bajo un mismo login, con autenticación por PIN y soporte Google OAuth.

---

## Seguridad y Acceso

La plataforma utiliza un sistema de seguridad de dos niveles:

1.  **Acceso al Panel (Dashboard):** Se puede acceder mediante un **Código de Administrador** (`ADMIN_CODE`) o mediante **Google Auth**.
2.  **Acceso a Herramientas:**
    *   Si accedes con **Google Auth**, tienes acceso a todas las herramientas.
    *   Si accedes con el **Código del Dashboard**, solo tienes acceso a las herramientas listadas en la variable de entorno `ALLOWED_TOOLS_FOR_PIN` (separadas por comas).
    *   También es posible acceder a una herramienta individual directamente mediante su **PIN específico** (ej. `BABY_LEAVE_PLANNER_PIN`).

---

## Variables de Entorno

Crea un archivo `.env.local` basado en `example.env`:

### Globales
| Variable | Descripción |
|---|---|
| `NEXTAUTH_SECRET` | Secreto para NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base (`http://localhost:3000` en local) |
| `ADMIN_CODE` | Código principal para el Dashboard (ej. `1234`) |
| `ALLOWED_TOOLS_FOR_PIN` | Herramientas permitidas para el `ADMIN_CODE` (ej. `baby-leave-planner`) |
| `MONGODB_URI` | URI de MongoDB (si la herramienta lo requiere) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales de Google OAuth (opcional) |

### Por herramienta
Cada herramienta puede definir su propio PIN de acceso directo:
`TOOL_ID_EN_MAYUSCULAS_PIN=1234`
Ejemplos: `BABY_LEAVE_PLANNER_PIN`, `FINANCE_TRACKER_PIN`.

---

## Despliegue en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com).
2. En **Settings → Environment Variables**, añadir todas las variables del `example.env`.
3. `NEXTAUTH_URL` debe apuntar a la URL de producción (ej. `https://tu-app.vercel.app`).
4. Si usas MongoDB Atlas, recuerda permitir el acceso desde las IPs de Vercel (0.0.0.0/0).

---

## Desarrollo Local

```bash
npm install
npm run dev
```

---

## Cómo añadir una nueva herramienta

1. **Módulo:** Crea la carpeta en `src/modules/[id]`.
2. **Metadata:** Crea `metadata.ts` con la info de la herramienta.
3. **Página:** Crea `src/app/tools/[id]/page.tsx` usando el componente `isToolAllowed` para gestionar el acceso.
4. **API:** Si necesitas persistencia, usa `isToolAllowed` en tu ruta de API.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/auth/          → Lógica de autenticación
│   ├── dashboard/         → Panel principal
│   └── tools/[id]/        → Rutas de las herramientas
├── components/            → UI compartida y Gates de seguridad
├── lib/
│   ├── auth.ts            → Configuración de NextAuth
│   └── security.ts        → Lógica central de permisos
└── modules/               → Código fuente de cada herramienta
```
