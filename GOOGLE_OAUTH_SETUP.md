# Configuración de Google OAuth para Tool Hub

Esta guía detalla paso a paso cómo configurar las credenciales de Google OAuth en **Google Cloud Console** para permitir que los usuarios inicien sesión con sus cuentas de Google en la plataforma (tanto en entorno local de desarrollo como en producción en Vercel u otros hostings).

---

## Paso 1: Crear o seleccionar un proyecto en Google Cloud Console

1. Accede a [Google Cloud Console](https://console.cloud.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. En la esquina superior izquierda, haz clic en el selector de proyectos y selecciona **Nuevo proyecto** (New Project).
4. Dale un nombre identificativo a tu proyecto (por ejemplo, `Tool Hub`) y haz clic en **Crear** (Create).

---

## Paso 2: Configurar la Pantalla de Consentimiento OAuth (OAuth Consent Screen)

Antes de generar las credenciales, Google requiere definir la información que verán los usuarios cuando intenten loguearse.

1. En el menú lateral izquierdo de Google Cloud Console, navega a **API y servicios** (APIs & Services) > **Pantalla de consentimiento de OAuth** (OAuth consent screen).
2. Selecciona el **Tipo de usuario** (User Type):
   - **Externo (External):** Si quieres que cualquier cuenta de Google pueda iniciar sesión.
   - **Interno (Internal):** Si estás usando Google Workspace y solo quieres permitir el acceso a miembros de tu organización.
3. Haz clic en **Crear** (Create).
4. Completa la **Información de la aplicación**:
   - **Nombre de la aplicación:** Por ejemplo, `Tool Hub`.
   - **Correo electrónico de asistencia al usuario:** Selecciona tu correo.
   - **Logotipo de la aplicación:** Opcional.
   - **Dominios autorizados:** Si ya tienes un dominio de producción (ej. `mi-app.vercel.app`), puedes añadirlo aquí. En local no es necesario añadir `localhost`.
   - **Datos de contacto del desarrollador:** Introduce tu dirección de correo electrónico.
5. Haz clic en **Guardar y continuar** (Save and Continue).
6. **Permisos (Scopes):** No es necesario añadir permisos especiales para el inicio de sesión básico. Por defecto, NextAuth solicita los ámbitos `openid`, `email` y `profile`, que están incluidos en los alcances no sensibles estándar. Haz clic en **Guardar y continuar**.
7. **Usuarios de prueba (Test users):** Si configuraste la pantalla como *Externo* y el estado de publicación es *En pruebas (Testing)*, añade aquí las direcciones de correo electrónico de las cuentas con las que quieras probar el inicio de sesión.
8. Haz clic en **Guardar y continuar** y revisa el resumen.

---

## Paso 3: Crear las Credenciales de Cliente OAuth 2.0

Una vez configurada la pantalla de consentimiento, ya puedes generar el Client ID y el Client Secret.

1. En el menú lateral izquierdo, ve a **Credenciales** (Credentials).
2. Haz clic en el botón superior **+ Crear credenciales** (+ Create Credentials) y selecciona **ID de cliente de OAuth** (OAuth client ID).
3. En **Tipo de aplicación** (Application type), selecciona **Aplicación web** (Web application).
4. Asigna un nombre a la credencial (por ejemplo, `Web Cliente - Desarrollo y Producción`).

---

## Paso 4: Configurar los Orígenes y URIs de Redireccionamiento

Este es el paso más crucial. Debes especificar detalladamente los orígenes de JavaScript autorizados y las URIs de redireccionamiento para tus entornos.

### A. Para Entorno Local (Desarrollo)
En la sección **Orígenes autorizados de JavaScript** (Authorized JavaScript origins):
- Haz clic en **Añadir URI** (Add URI) y escribe:
  ```text
  http://localhost:3000
  ```

En la sección **URIs de redireccionamiento autorizados** (Authorized redirect URIs):
- Haz clic en **Añadir URI** (Add URI) y escribe exactamente el callback de NextAuth para Google:
  ```text
  http://localhost:3000/api/auth/callback/google
  ```

### B. Para Entorno de Producción (Vercel, Render, etc.)
Si vas a desplegar la aplicación en producción, debes añadir también las URLs correspondientes en la misma credencial o crear una credencial independiente.

En la sección **Orígenes autorizados de JavaScript** (Authorized JavaScript origins):
- Haz clic en **Añadir URI** y escribe tu dominio de producción sin barra al final:
  ```text
  https://tu-app-url.vercel.app
  ```

En la sección **URIs de redireccionamiento autorizados** (Authorized redirect URIs):
- Haz clic en **Añadir URI** y añade la URL de producción con la ruta de callback exacta:
  ```text
  https://tu-app-url.vercel.app/api/auth/callback/google
  ```

> ⚠️ **Nota Importante:** Reemplaza `https://tu-app-url.vercel.app` por tu dominio o subdominio real provisto por Vercel u otro proveedor de hosting.

Haz clic en **Crear** (Create). Se abrirá una ventana emergente mostrando:
- **Tu ID de cliente** (Your Client ID)
- **Tu secreto de cliente** (Your Client Secret)

Copia ambos valores inmediatamente.

---

## Paso 5: Configurar las Variables de Entorno en el Proyecto

Debes añadir estos valores a la configuración de tu aplicación para que NextAuth.js pueda utilizarlos.

### A. Configuración en Local (`.env.local`)
Crea o edita tu archivo `.env.local` en la raíz del proyecto y añade las siguientes variables con los valores que acabas de copiar de Google Cloud Console:

```env
# URL base de tu aplicación en desarrollo
NEXTAUTH_URL=http://localhost:3000

# Secreto para firmar las cookies de sesión (puedes generar uno fuerte ejecutando `openssl rand -base64 32`)
NEXTAUTH_SECRET=tu_secreto_aleatorio_aqui

# Credenciales de Google OAuth obtenidas en el Paso 4
GOOGLE_CLIENT_ID=tu_google_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
```

### B. Configuración en Producción (Vercel)
Si utilizas Vercel para el despliegue de tu proyecto, dirígete a tu panel de control:
1. Ve a **Settings** > **Environment Variables** en tu proyecto de Vercel.
2. Añade las siguientes variables:
   - `NEXTAUTH_URL`: `https://tu-app-url.vercel.app` (tu dominio de producción real).
   - `NEXTAUTH_SECRET`: Un secreto aleatorio fuerte generado para producción.
   - `GOOGLE_CLIENT_ID`: Tu ID de cliente de Google.
   - `GOOGLE_CLIENT_SECRET`: Tu secreto de cliente de Google.
3. Vuelve a desplegar o activa una nueva build para aplicar los cambios.

---

## Solución de Problemas Comunes

### Error: `redirect_uri_mismatch`
Este es el error más común. Significa que la URL desde la que intentas iniciar sesión o la URL de callback no coinciden exactamente con las configuradas en Google Cloud Console.
- **Solución:** Verifica que el protocolo sea el correcto (`http://` para local, `https://` para producción) y que no haya barras inclinadas (`/`) sobrantes al final del dominio de origen. Compara letra a letra el valor de `NEXTAUTH_URL` de tus variables de entorno con los registros autorizados en Google.

### Error de Pantalla de Consentimiento "Acceso denegado" (Access Blocked)
Si tu aplicación está configurada en estado de publicación "En pruebas" (Testing), solo los correos electrónicos agregados como "Usuarios de prueba" podrán iniciar sesión.
- **Solución:** Añade tu correo electrónico a la sección "Usuarios de prueba" en la configuración de la pantalla de consentimiento de OAuth, o cambia el estado a "Producción" si la aplicación está lista para que cualquiera se conecte.
