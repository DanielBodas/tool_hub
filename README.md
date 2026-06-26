# Tool Hub

Una plataforma escalable para alojar múltiples herramientas web bajo un mismo login, con autenticación por PIN y soporte Google OAuth. Desplegable en Vercel con cero configuración.

---

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **NextAuth.js v4** (Google + Admin Code)
- **MongoDB** (opcional, solo para tools que lo necesiten)

---

## Arrancar en local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el fichero de variables de entorno
Copy-Item example.env .env.local   # PowerShell
# cp example.env .env.local        # bash/zsh

# 3. Levantar el servidor de desarrollo
npm run dev
```

Abre **http://localhost:3000** en el navegador.

- Dashboard → `/dashboard` → PIN por defecto: `1234`
- Cada tool tiene su propio PIN (configurable vía env vars)

---

## Cómo añadir una nueva herramienta

El sistema necesita **3 pasos** para registrar un nuevo tool:

### 1. Crear la carpeta del módulo

```
src/modules/mi-tool/
├── metadata.ts          ← obligatorio (info del hub)
├── MiToolModule.tsx     ← componente principal
└── example.env          ← variables de entorno del tool
```

**`metadata.ts`** (copiar esta plantilla):

```ts
import { IconName } from "lucide-react";
import type { ToolMeta } from "@/config/tools";

export const metadata: ToolMeta = {
  id: "mi-tool",                       // kebab-case, debe coincidir con la carpeta
  name: "Mi Herramienta",
  description: "Descripción breve que aparece en el dashboard.",
  icon: IconName,                      // cualquier icono de lucide-react
  category: "Productividad",           // categoría del badge
};
```

### 2. Crear la página de ruta

```
src/app/tools/mi-tool/page.tsx
```

```tsx
import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { MiToolModule } from "@/modules/mi-tool/MiToolModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function MiToolPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked = cookieStore.get("auth_tool_mi-tool")?.value === "true";

  if (!session && !isUnlocked) {
    return <ToolSecurityGate toolId="mi-tool" toolName="Mi Herramienta" />;
  }

  return (
    <ToolBaseLayout toolId="mi-tool" toolName="Mi Herramienta">
      <MiToolModule />
    </ToolBaseLayout>
  );
}
```

### 3. Registrar en el registry central

En **`src/config/tools.ts`**, añadir una línea de import:

```ts
import { metadata as miTool } from "@/modules/mi-tool/metadata";

export const tools: Tool[] = [babyLeave, finance, miTool].map(...);
```

---

## Variables de entorno

### Globales (`example.env` → `.env.local`)

| Variable | Descripción |
|---|---|
| `NEXTAUTH_SECRET` | Secret para NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base (`http://localhost:3000` en local) |
| `ADMIN_CODE` | PIN del dashboard principal |
| `MONGODB_URI` | URI de MongoDB (si aplica) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth de Google (opcional) |

### Por tool

Cada tool tiene su propio `example.env` dentro de su carpeta en `src/modules/<tool-id>/`. El PIN sigue el formato:

```
TOOL_ID_EN_MAYUSCULAS_PIN=1234
```

Ejemplos: `BABY_LEAVE_PLANNER_PIN`, `FINANCE_TRACKER_PIN`

---

## Despliegue en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables**, añadir todas las variables del `example.env` global más las de cada tool activo
3. `NEXTAUTH_URL` debe apuntar a la URL de producción (ej. `https://tu-app.vercel.app`)
4. Deploy automático en cada push a `main`

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/auth/          → NextAuth + PIN secondary auth
│   ├── dashboard/         → Panel principal (server component, protegido por cookie)
│   ├── tools/[tool-id]/   → Una page.tsx por herramienta
│   └── login/
├── components/
│   ├── SecurityGate.tsx       → PIN del dashboard
│   ├── ToolSecurityGate.tsx   → PIN por tool (Google + PIN)
│   ├── ToolBaseLayout.tsx     → Layout compartido de todas las tools
│   └── SecurityProvider.tsx   → Context para unlock/lock client-side
├── config/
│   └── tools.ts           → Registry central (solo imports)
├── lib/
│   ├── auth.ts            → NextAuth config
│   └── mongodb.ts         → Cliente MongoDB
└── modules/
    └── [tool-id]/
        ├── metadata.ts    ← Fuente de verdad del tool en el hub
        ├── *Module.tsx    ← Componente principal
        └── example.env   ← Vars de entorno del tool
```
