---
name: atlas-deploy
description: Despliega o redespliega Atlas-v2- (AgendaCraft AI) a Cloud Run, o diagnostica un despliegue roto. Usa esto siempre que el usuario mencione "desplegar", "deploy", "subir a Cloud Run", "actualizar producción", "Atlas no responde en el teléfono", errores 401/403 en producción, variables de entorno perdidas, o el trigger de Cloud Build fallando. Cubre también la config de autonomía (IAM cross-project para Firestore, Cloud Scheduler para el scan autónomo).
---

# Deploy de Atlas-v2- a Cloud Run

Proyecto GCP real: `flash-rock-508419-q2` (NO `atlas-v1-505407`, ese es otro
proyecto con servicios sin relación: `atlas-core`, `atlas-telegram`).
Servicio Cloud Run: `atlas-v2-app`, región `us-central1`.
Firestore vive en OTRO proyecto: `atlas-v1-505407`, base de datos con nombre
`ai-studio-agendacraftai-88228244-34b0-45f8-9d06-001ed8595880` (no la default).

Deploy es por Buildpacks (`--source=.`), no hay Dockerfile. El server lee
`process.env.PORT`.

## Regla de oro: variables de entorno en PowerShell

`--set-env-vars` recibe UN string `KEY=VAL,KEY=VAL,KEY=VAL`. Ese string
completo va entre UN solo par de comillas. Si cada valor se cita por
separado, PowerShell parte el argumento en un array y gcloud lo vuelve a
unir con espacios — resultado: una sola env var (la primera) con las tres
mezcladas y las otras dos vacías. Esto ya pasó y causó un 401
(`ACCESS_TOKEN_TYPE_UNSUPPORTED`) porque el fallback interno interpretó mal
la clave corrupta.

Mal (rompe):
```powershell
--set-env-vars "GEMINI_API_KEY=xxx","NVIDIA_API_KEY=yyy","NVIDIA_MODEL=zzz"
```

Bien:
```powershell
--set-env-vars "GEMINI_API_KEY=xxx,NVIDIA_API_KEY=yyy,NVIDIA_MODEL=zzz"
```

Para verificar qué quedó realmente configurado tras un deploy:
```powershell
gcloud run services describe atlas-v2-app --project=flash-rock-508419-q2 --region=us-central1 --format="value(spec.template.spec.containers[0].env)"
```
Si ves un solo par `key='GEMINI_API_KEY' value='...,NVIDIA_API_KEY=...'` con
comas dentro del value, es el bug de arriba. Redeploy con la sintaxis
correcta.

## Comando de deploy/redeploy

Verifica primero que estás en el clon correcto (no `C:\WINDOWS\system32`,
ya pasó por un `cd` silenciosamente fallido encadenado con `;`):
```powershell
Test-Path package.json; Test-Path server.ts
```
Ambos deben dar `True`. Si no, buscar el clon real:
```powershell
Get-ChildItem -Path C:\ -Recurse -Directory -Filter "Atlas-v2-*" -ErrorAction SilentlyContinue
```

Deploy real (ejecutar el usuario/Antigravity, no Claude — sin acceso a
gcloud del usuario):
```powershell
git pull origin claude/practical-lovelace-5cn2c9; gcloud run deploy atlas-v2-app --project=flash-rock-508419-q2 --source=. --region=us-central1 --allow-unauthenticated --memory=512Mi --cpu=1 --min-instances=0 --max-instances=3 --set-env-vars "GEMINI_API_KEY=<key>,NVIDIA_API_KEY=<key>,NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b"
```

Modelo NVIDIA activo: `nvidia/nemotron-3.5-lightning-30b-a3b` (es modelo
"thinking", requiere `chat_template_kwargs: { enable_thinking: false }` en
el body — ya está en `server.ts`, no tocar si no cambias de modelo).
`meta/llama-3.1-70b-instruct` está EOL (410 Gone), no usar.

Formato de API key de Gemini en este entorno: `AQ....` (no `AIzaSy...` —
ambos son válidos, no rechazar el formato `AQ.` por parecer raro).

## Diagnosticar un fallo en producción

1. Confirmar que el server realmente logueó el error real (el catch externo
   de `jarvis-command` en `server.ts` debe tener `console.error(...)` antes
   de construir el fallback heurístico; si no lo tiene, no hay forma de
   diagnosticar por logs — agregarlo primero, redeploy, reproducir).
2. Leer logs:
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=atlas-v2-app" --project=flash-rock-508419-q2 --limit=30 --format="value(textPayload)"
```
3. Reproducir con curl contra la URL pública si hace falta.

## Trigger de Cloud Build roto (ignorar)

El trigger `atlas-v2--git` (Cloud Build automático conectado al repo)
falla en ~3s en cada push, sin importar el commit — problema de
configuración del trigger fuera de este alcance. Ya documentado en un
comentario del PR #1. El deploy real se hace con `gcloud run deploy
--source=.` manual, no depende de ese trigger. No volver a comentar sobre
el mismo check fallando de nuevo — es ruido conocido, no una regresión.

## Autonomía: IAM cross-project + Scheduler

El servicio corre bajo la cuenta de servicio compute de
`flash-rock-508419-q2` pero necesita escribir en Firestore del proyecto
`atlas-v1-505407`. Sin esto, `executeChecklistToolCall` falla con "Could
not load the default credentials" (o permission denied en prod).

```powershell
gcloud projects add-iam-policy-binding atlas-v1-505407 --member="serviceAccount:480057719321-compute@developer.gserviceaccount.com" --role="roles/datastore.user"
```

Cloud Scheduler para el scan autónomo (`GET /api/atlas/autonomous-scan`,
independiente de cualquier sesión de navegador):
```powershell
gcloud scheduler jobs create http atlas-autonomous-scan --project=flash-rock-508419-q2 --location=us-central1 --schedule="*/15 * * * *" --uri="https://atlas-v2-app-480057719321.us-central1.run.app/api/atlas/autonomous-scan" --http-method=GET
```

## Motor de memoria (Firestore vector search)

Colección `atlas_memoria`, embeddings `gemini-embedding-001` a **768
dimensiones**. No subas a 3072: el índice vectorial de Firestore corta en
2048 y el índice no se puede crear.

En el emulador `findNearest` funciona sin índice. **En Firestore real
exige un índice vectorial** o falla con `FAILED_PRECONDITION`. Crear una vez:

La vía confiable — pega la URL de `/api/atlas/memory/search?q=prueba` o de
`/api/atlas/diagnostics` en el navegador; si falta el índice, el campo de
error trae un enlace de consola que lo crea con un clic. Esto evita pelear
con el escapado de JSON en PowerShell.

Por comando (el JSON con comillas dobles dentro de comillas simples es
frágil en PowerShell, verifica el resultado):

```powershell
gcloud firestore indexes composite create --project=atlas-v1-505407 --database="ai-studio-agendacraftai-88228244-34b0-45f8-9d06-001ed8595880" --collection-group=atlas_memoria --query-scope=COLLECTION --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":"{}"}'
```

Endpoints: `POST /api/atlas/memory` (guardar), `GET /api/atlas/memory/search?q=`
(buscar), `GET /api/atlas/memory/export` (proyección markdown para Obsidian).

Regla de diseño, no la rompas: Firestore es la fuente de verdad y el vault de
Obsidian es solo una proyección de lectura. Datos operativos estructurados
(checklists, incidencias) se consultan con query exacta, no se vectorizan.

## Probar sin credenciales de GCP

El emulador de Firestore permite verificar todo el motor de memoria de punta a
punta sin tocar producción ni necesitar ADC:

```bash
npm install --no-save --prefix /tmp/fbtools firebase-tools
/tmp/fbtools/node_modules/.bin/firebase emulators:start --only firestore --project atlas-v1-505407
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 npx tsx server.ts
```

Requiere Java (hay openjdk 21 en el sandbox). Los embeddings sí salen a
`generativelanguage.googleapis.com`, que la política de red permite.

## Límite de acceso

Claude (este agente) NO tiene gcloud, NO puede autenticarse contra GCP del
usuario, y su sandbox bloquea salida de red hacia `*.run.app` e
`integrate.api.nvidia.com`. Todo verificación real en Cloud Run/NVIDIA la
hace el usuario o Antigravity — Claude da el comando exacto, no lo ejecuta.
