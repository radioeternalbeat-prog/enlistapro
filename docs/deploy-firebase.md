# Despliegue automático a Firebase Hosting

El workflow `.github/workflows/deploy-firebase-hosting.yml` compila la aplicación y despliega el site `enlistapro` al proyecto Firebase `app-happybeat` cada vez que se hace push a `main`. También puede ejecutarse manualmente desde la pestaña **Actions** de GitHub.

## Configuración necesaria una sola vez

El repositorio necesita un secreto de GitHub llamado `FIREBASE_SERVICE_ACCOUNT` con el JSON de una cuenta de servicio que tenga permisos para desplegar Firebase Hosting en el proyecto `app-happybeat`.

En GitHub:

1. Abrí **Settings → Secrets and variables → Actions**.
2. Seleccioná **New repository secret**.
3. Usá exactamente el nombre `FIREBASE_SERVICE_ACCOUNT`.
4. Pegá el contenido completo del JSON de la cuenta de servicio.
5. Guardá el secreto.

El JSON no debe guardarse en el repositorio ni compartirse en issues, commits o mensajes.

## Qué hace el workflow

1. Descarga el commit de `main`.
2. Instala Node.js 20 y las dependencias.
3. Ejecuta `npm run build`.
4. Se autentica con Google Cloud usando el secreto.
5. Despliega únicamente Firebase Hosting, no Firestore ni Cloud Functions.

Si el build falla, el paso de despliegue no se ejecuta.

## Comprobación del proyecto

El workflow usa estos valores definidos en `firebase.json` y en el repositorio:

- Proyecto Firebase: `app-happybeat`
- Site de Hosting: `enlistapro`
- Carpeta pública: `dist`

Si la web pública pertenece en realidad al proyecto Firebase `en-lista-app-z1e6wt`, hay que cambiar `FIREBASE_PROJECT_ID` en el workflow y confirmar que ese proyecto también tenga un site llamado `enlistapro` antes de activar el despliegue.
