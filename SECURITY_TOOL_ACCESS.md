# Control de Acceso Granular por Herramienta (Tool Access Control)

Este documento explica en detalle la **nueva capa de seguridad** implementada en la plataforma, el modo en que se configura en `.env` / Vercel, y diversas **alternativas arquitectónicas** que podrían aplicarse para cubrir necesidades de control de acceso similares o avanzadas.

---

## 1. Funcionamiento del Sistema Actual

La plataforma implementa un modelo de seguridad por capas (Zero-Trust granular) estructurado de la siguiente forma:

```
                  ┌─────────────────────────────────┐
                  │        Acceso al Dashboard      │
                  │   (Google Auth o Código Admin)  │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │   Entrada a /tools/[toolId]     │
                  └────────────────┬────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             │                                           │
             ▼                                           ▼
  ¿Es Rol "admin"?                        ¿Usuario Convencional / Google?
  ┌─────────────────────┐                 ┌─────────────────────────────┐
  │ Acceso Total        │                 │ Evaluado por                │
  │ Sin restricciones   │                 │ `isToolAllowedForUser()`    │
  └─────────────────────┘                 └──────────────┬──────────────┘
                                                         │
                                        ┌────────────────┴────────────────┐
                                        │                                 │
                                        ▼                                 ▼
                             ¿Herramienta permitida?            ¿Herramienta NO permitida?
                             ┌──────────────────────┐           ┌────────────────────────┐
                             │ Acceso Directo       │           │ Solicita Código PIN    │
                             │ concedido            │           │ (`ToolSecurityGate`)   │
                             └──────────────────────┘           └───────────┬────────────┘
                                                                            │
                                                                            ▼
                                                                ¿PIN correcto en `.env`?
                                                                ┌────────────────────────┐
                                                                │ Cookie auth_tool_<id>  │
                                                                │ Acceso Concedido       │
                                                                └────────────────────────┘
```

### Reglas de Evaluación:
1. **Administrador (`role === "admin"`)**:
   - Acceso sin restricciones a **todas** las herramientas de la plataforma.
2. **Usuario Registrado / Google (`role === "user"`)**:
   - **Paso A**: Se comprueba si la herramienta está incluida en sus permisos directos (mediante variables de entorno globales `ALLOWED_TOOLS_FOR_USER` o por email específico `ALLOWED_TOOLS_<EMAIL>`). Si está en la lista, entra directamente.
   - **Paso B**: Si la herramienta **no** está autorizada por su usuario, la aplicación muestra una pantalla de bloqueo (`ToolSecurityGate`) solicitando el **Código de Acceso / PIN** de esa herramienta específica.
3. **Validación vía PIN**:
   - El código PIN de cada herramienta se almacena en el archivo `.env` local y en las variables de entorno de **Vercel** (`<HERRAMIENTA_UPPERCASE>_PIN`).
   - Al introducir el PIN correcto, se genera una cookie segura y firmada (`auth_tool_<toolId>`) válida durante 30 días, permitiendo el uso continuo de la herramienta en ese navegador.

---

## 2. Configuración en `.env` y Vercel

### 2.1 Variables Globales y de Usuario
Añade en tu `.env` o en el panel de **Environment Variables** en Vercel:

```env
# 1. Código de Administrador global (Otorga rol 'admin' y acceso a todo)
ADMIN_CODE=1234

# 2. Herramientas permitidas para TODOS los usuarios convencionales que inicien sesión por Google
# Se especifican los IDs de las herramientas separados por comas (o "*" para todas)
ALLOWED_TOOLS_FOR_USER=baby-leave-planner

# 3. Permisos específicos asignados a correos electrónicos individuales (Opcional)
# Formato: ALLOWED_TOOLS_<EMAIL_SANEADO> (en mayúsculas, cambiando caracteres no alfanuméricos por _)
ALLOWED_TOOLS_USUARIO_GMAIL_COM=baby-leave-planner,baby-weight-tracker
ALLOWED_TOOLS_MARIA_EMPRESA_ES=finance-tracker
```

### 2.2 PINs de Seguridad por Herramienta
Cada herramienta posee su propia variable de entorno independiente para el PIN de acceso:

```env
# PINs de herramientas individuales (en Vercel y .env local)
BABY_LEAVE_PLANNER_PIN=1111
BABY_WEIGHT_TRACKER_PIN=2222
FINANCE_TRACKER_PIN=3333
STORAGE_ORGANIZER_PIN=4444
BIRTH_BET_PIN=5555
```

---

## 3. Alternativas de Implementación (Otras Opciones Arquitectónicas)

A continuación se exponen otras alternativas técnicas para conseguir un comportamiento similar o extendido, analizando sus ventajas e inconvenientes:

---

### Alternativa A: Permisos RBAC basados en Base de Datos (MongoDB)
En lugar de almacenar las herramientas permitidas en variables de entorno, se gestiona una colección `users` o `permissions` en MongoDB.

#### ¿Cómo funcionaría?
1. Tras iniciar sesión con Google, la API busca el email del usuario en la colección `users`.
2. El documento del usuario contiene un array de herramientas autorizadas:
   ```json
   {
     "email": "usuario@gmail.com",
     "role": "user",
     "allowedTools": ["baby-leave-planner"],
     "customToolPins": {
       "finance-tracker": "9876"
     }
   }
   ```
3. Si la herramienta solicitada no está en `allowedTools`, se solicita el PIN.

#### Ventajas:
- **Gestión Dinámica**: Permite añadir/quitar permisos a usuarios desde un panel de administración en vivo sin reiniciar servidores ni hacer redeplyments en Vercel.
- **Escalabilidad**: Ideal si la plataforma crece a decenas o cientos de usuarios.

#### Inconvenientes:
- Requiere latencia adicional de lectura en Base de Datos en cada carga de página/API.
- Mayor complejidad de desarrollo inicial.

---

### Alternativa B: Reclamaciones JWT / Escopos OAuth (Claims & Scopes)
Aprovechar las capacidades de JWT de NextAuth para incluir la lista de permisos dentro del propio token firmado de sesión.

#### ¿Cómo funcionaría?
1. En el callback `jwt` de NextAuth (`src/lib/auth.ts`), se inyecta la lista de herramientas autorizadas en el token al iniciar sesión:
   ```ts
   async jwt({ token, user }) {
     if (user) {
       token.allowedTools = await fetchUserAllowedTools(user.email);
     }
     return token;
   }
   ```
2. Las páginas y endpoints leen directamente `session.user.allowedTools` en memoria sin consultar base de datos ni variables de entorno adicionales por petición.

#### Ventajas:
- **Zero Database Latency**: Rendimiento extremadamente elevado al estar todo encriptado en la cookie/token JWT.
- Cero consultas a variables de entorno dinámicas.

#### Inconvenientes:
- Los cambios de permisos no surten efecto de inmediato hasta que la sesión expire o el usuario re-autentique.

---

### Alternativa C: Grupos de PINs Multitenant / Invitados (Multi-Tenant Shared PINs)
Inspirado en el módulo de *Porra de Nacimiento*, en el que múltiples PINs permiten acceder a diferentes "grupos" o instancias de datos.

#### ¿Cómo funcionaría?
1. No existe un PIN único por herramienta.
2. Cada familia o grupo genera un PIN propio (ej. `PIN_FAMILIA_GARCIA=1234`, `PIN_FAMILIA_PEREZ=5678`).
3. Al ingresar con un PIN específico, el usuario no solo desbloquea la herramienta, sino que sus datos quedan aislados bajo la clave de ese grupo/tenant.

#### Ventajas:
- Aislamiento multi-inquilino (*Multi-tenancy*) nativo.
- Permite compartir la herramienta con familiares/amigos sin darles cuenta de Google ni acceso a datos ajenos.

#### Inconvenientes:
- Lógica de persistencia más compleja (`groupId` asociado a cada registro en base de datos).

---

## 4. Resumen Comparativo

| Enfoque | Complejidad | Mantenimiento | Flexibilidad | Velocidad / Performance |
| :--- | :--- | :--- | :--- | :--- |
| **Actual (.env + Vercel)** | 🟢 Baja | 🟢 Sencillo (Vercel GUI) | 🟡 Media | ⚡ Máxima (Instantáneo) |
| **Alternativa A (MongoDB RBAC)** | 🔴 Alta | 🟢 Excelencia desde UI | 🟢 Máxima | 🟡 Media (Database lookup) |
| **Alternativa B (JWT Claims)** | 🟡 Media | 🟡 Requiere Re-login | 🟢 Alta | ⚡ Máxima (In-Memory) |
| **Alternativa C (Multi-tenant PIN)** | 🔴 Alta | 🟢 Descentralizado | 🟢 Máxima para grupos | 🟢 Alta |

---
*Para cualquier duda o extensión del sistema de seguridad, consultar `src/lib/auth.ts` y `src/app/api/auth/secondary/route.ts`.*
