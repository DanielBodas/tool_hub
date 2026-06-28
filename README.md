# Tool Hub

Una plataforma escalable para alojar múltiples herramientas web bajo un mismo login.

---

## Seguridad y Acceso

La plataforma utiliza un sistema de autenticación centralizado mediante **NextAuth.js**:

1.  **Login:** Se puede acceder mediante un **Código de Administrador** (`ADMIN_CODE`) o mediante **Google Auth**.
2.  **Permisos:**
    *   **Usuarios de Google:** Tienen acceso a todas las herramientas por defecto.
    *   **Administrador (Código):** Solo tiene acceso a las herramientas listadas en la variable de entorno `ALLOWED_TOOLS_FOR_PIN`.
    *   **Sin login:** No se puede acceder ni al Dashboard ni a ninguna herramienta.

---

## Variables de Entorno

Crea un archivo `.env.local` basado en `example.env`:

| Variable | Descripción |
|---|---|
| `NEXTAUTH_SECRET` | Secreto para NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL base (`http://localhost:3000` en local) |
| `ADMIN_CODE` | Código principal para el Login (ej. `1234`) |
| `ALLOWED_TOOLS_FOR_PIN` | Herramientas permitidas para el código Admin (ej. `baby-leave-planner`) |
| `MONGODB_URI` | URI de MongoDB (necesario para persistencia de datos) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales de Google OAuth (opcional) |

---

## Despliegue en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com).
2. Configurar las variables de entorno mencionadas arriba.
3. Asegurarse de que `NEXTAUTH_URL` apunte al dominio de producción.

---

## Desarrollo Local

```bash
npm install
npm run dev
```

---

## Estructura del proyecto

- `src/app`: Rutas y APIs de Next.js.
- `src/modules`: Lógica de negocio de cada herramienta.
- `src/lib/security.ts`: Lógica centralizada de permisos.
- `src/lib/auth.ts`: Configuración de NextAuth.
