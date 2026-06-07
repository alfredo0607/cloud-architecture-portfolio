import type { Project } from "@/lib/types";

export const projects: Project[] = [
  // ── Proyectos reales ────────────────────────────────────────────────────────
  {
    slug: "aws-secure-content-distribution",
    githubUrl: "https://github.com/alfredo0607/aws-secure-content-distribution",
    demoUrl: "https://images-url-signature.alfredo-dominguez.dev/",
    title: "AWS Secure Content Distribution",
    tagline:
      "Plataforma fullstack para subir archivos a S3 y servirlos con Signed URLs de CloudFront. Frontend en Astro + backend Node.js containerizado en EC2 + Docker.",
    status: "live",
    architectureSlugs: ["01-private-cdn", "04-container-backend"],
    tags: [
      "Astro",
      "Node.js",
      "Express",
      "EC2",
      "CloudFront",
      "S3",
      "Docker",
      "Terraform",
    ],
    problem:
      "Una plataforma necesita permitir a usuarios autenticados subir archivos a S3 y acceder a ellos de forma privada con URLs temporales, sin exponer el bucket directamente a Internet. El backend debe escalar bajo demanda sin gestionar servidores.",
    solution:
      "Frontend estático en Astro 6 que interactúa con una API REST en Express 5 containerizada en EC2 + Docker. El backend gestiona la subida a S3, lista archivos y genera Signed URLs de CloudFront firmadas con Key Pair RSA. El bucket es completamente privado con OAC; CloudFront valida la firma en el edge antes de servir el contenido.",
    diagram: `
  Browser (Astro SSG)
     │
     ├─ POST /api/v1/files/upload         → sube a S3 (multipart, sharp compresión)
     ├─ GET  /api/v1/files                → lista archivos del bucket
     ├─ GET  /api/v1/files/:key/signed-url → genera Signed URL de CloudFront
     └─ DELETE /api/v1/files/:key         → elimina objeto S3
          │
          ▼
  ┌──────────────────────────────────────────────────────┐
  │  EC2 + Docker (Node.js + Express 5)                   │
  │  • sharp: compresión de imágenes antes de subir      │
  │  • @aws-sdk/cloudfront-signer: firma RSA de URLs     │
  │  • helmet + rate-limit: seguridad HTTP               │
  └───────────────┬─────────────────────────┬────────────┘
                  │                         │
                  ▼                         ▼
  ┌──────────────────────┐    ┌──────────────────────────┐
  │  S3 Bucket (privado) │    │  CloudFront Distribution  │
  │  OAC + SSE-KMS       │    │  Signed URLs (RSA Key)    │
  │  BlockPublicAccess   │    │  OAC SigV4 → S3           │
  └──────────────────────┘    └──────────────────────────┘`,
    steps: [
      {
        n: 1,
        title: "Frontend — Zona de drag & drop (Astro + Vanilla JS)",
        detail:
          "El frontend es un sitio estático generado con Astro 6 + Tailwind CSS v4. Sin frameworks de componentes — toda la interactividad se maneja con JavaScript nativo. La zona de drag & drop valida el tamaño del archivo en cliente (máx. 10 MB) antes de enviarlo.",
      },
      {
        n: 2,
        title: "Backend — Upload a S3 con compresión automática",
        detail:
          "El backend (Express 5) recibe el archivo via multipart/form-data. Si es una imagen, sharp la comprime antes de subir a S3: 30% calidad para >2MB, 60% para 1-2MB, sin pérdida para <1MB. Esto reduce el costo de almacenamiento y la latencia de descarga.",
      },
      {
        n: 3,
        title: "Generación de Signed URL de CloudFront",
        detail:
          "El backend obtiene la clave privada RSA del CloudFront Key Pair desde variables de entorno (en producción, desde Secrets Manager). Usa @aws-sdk/cloudfront-signer para generar una Signed URL con expiración configurable (15 min, 1h, 24h, 7 días). CloudFront valida la firma en el edge antes de hacer el request a S3.",
      },
      {
        n: 4,
        title: "Acceso privado a S3 vía CloudFront OAC",
        detail:
          "El bucket S3 tiene BlockPublicAccess habilitado en las 4 opciones. La bucket policy solo permite GetObject al ARN exacto del distribution de CloudFront. CloudFront firma cada request a S3 con SigV4 (OAC) — el bucket rechaza cualquier request que no venga de este distribution.",
      },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          "Astro 6.x",
          "Tailwind CSS 4.x",
          "Vanilla JavaScript",
          "Node.js ≥ 22",
          "pnpm 11",
        ],
      },
      {
        category: "Backend",
        items: [
          "Node.js ≥ 20",
          "Express 5.2.1",
          "AWS SDK v3",
          "sharp 0.34.5",
          "express-fileupload",
          "helmet",
          "express-rate-limit",
          "nanoid",
        ],
      },
      {
        category: "Infraestructura AWS",
        items: [
          "EC2",
          "S3 (privado + OAC)",
          "CloudFront + Signed URLs",
          "KMS (SSE-KMS)",
          "Secrets Manager",
          "Terraform",
        ],
      },
    ],
    decisions: [
      {
        title: "Astro vs Next.js para el frontend",
        chosen: "Astro (modo estático)",
        why: "El frontend es una demo interactiva sin routing complejo ni SSR. Astro genera HTML estático puro — cero JavaScript de framework en producción. Se sirve desde S3 + CloudFront sin servidor. Next.js añadiría complejidad innecesaria (server, bundle, hydration) para una SPA de una sola página.",
        alternatives: [
          "Next.js — necesario si se requiere SSR, autenticación server-side o rutas dinámicas",
          "SvelteKit — output estático también, pero menos ecosistema",
        ],
      },
      {
        title: "sharp vs client-side resize",
        chosen: "sharp en el backend (Node.js)",
        why: "La compresión server-side garantiza que todos los archivos en S3 estén optimizados independientemente del cliente. El browser no tiene acceso a APIs de compresión tan eficientes. sharp usa binarios nativos de libvips — procesa imágenes de 10MB en <200ms.",
        alternatives: [
          "Canvas API en el browser — dependiente del dispositivo del usuario, calidad variable",
          "Sin compresión — mayor costo de S3 storage y mayor latencia de descarga",
        ],
      },
    ],
    snippets: [
      {
        title: "Backend — Generación de Signed URL (Express 5 + AWS SDK v3)",
        language: "javascript",
        code: `import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

// CLOUDFRONT_PRIVATE_KEY viene de Secrets Manager en prod
// o de variable de entorno en dev
async function firmarUrl(url, expiresInSeconds = 86400) {
  const signedUrl = await getSignedUrl({
    url,
    dateLessThan: new Date(Date.now() + expiresInSeconds * 1000),
    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
    keyPairId: process.env.CLOUDFRONT_KEYPAIR_ID,
  });
  return signedUrl;
}

// Route handler
router.get('/files/:key/signed-url', async (req, res) => {
  const { key } = req.params;
  const expires = parseInt(req.query.expires) || 86400;

  const cfUrl = \`\${process.env.CLOUDFRONT_DOMAIN}/\${key}\`;
  const signedUrl = await firmarUrl(cfUrl, expires);

  res.json({
    message: 'Signed URL generated',
    data: { signedUrl, expiresIn: expires },
  });
});`,
      },
      {
        title:
          "Frontend — Fetch de Signed URL y copia al portapapeles (Vanilla JS)",
        language: "javascript",
        code: `async function generateSignedUrl(key, expiresSeconds) {
  const res = await fetch(
    \`\${API_URL}/files/\${encodeURIComponent(key)}/signed-url?expires=\${expiresSeconds}\`
  );
  const { data } = await res.json();

  await navigator.clipboard.writeText(data.signedUrl);
  showToast('URL copiada al portapapeles', 'success');
}

// Botones de expiración
document.querySelectorAll('[data-expires]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.closest('[data-key]').dataset.key;
    generateSignedUrl(key, btn.dataset.expires);
  });
});`,
      },
    ],
  },

  {
    slug: "aws-event-driven-image-processing",
    githubUrl:
      "https://github.com/alfredo0607/aws-event-driven-image-processing-platform",
    demoUrl: "https://services-resize-image.alfredo-dominguez.dev",
    title: "AWS Event-Driven Image Processing Platform",
    tagline:
      "Plataforma fullstack de procesamiento de imágenes con pipeline event-driven. Sube una imagen y Lambda genera 3 variantes automáticamente vía S3 → SQS → Lambda → DynamoDB.",
    status: "live",
    architectureSlugs: [
      "03-event-driven-serverless",
      "01-private-cdn",
      "04-container-backend",
    ],
    tags: [
      "Astro",
      "React 19",
      "Node.js",
      "Express",
      "Lambda",
      "SQS",
      "S3",
      "DynamoDB",
      "CloudFront",
      "Terraform",
    ],
    problem:
      "Una plataforma necesita procesar imágenes subidas por usuarios (resize a múltiples resoluciones) sin bloquear el request del cliente. El usuario debe poder subir la imagen y ver los resultados en tiempo real a medida que Lambda los genera, sin recargar la página.",
    solution:
      "Frontend en Astro 6 + React 19 con polling automático post-upload. Backend Express 5 que sube imágenes al bucket S3 input, disparando el pipeline event-driven: S3 → SQS → Lambda (Python + Pillow) → 3 variantes en S3 output + metadata en DynamoDB. Las imágenes se sirven con Signed URLs de CloudFront. El frontend hace polling cada 4s hasta detectar las imágenes procesadas.",
    diagram: `
  Browser (Astro + React 19)
     │
     ├─ POST /api/v1/files/upload   → S3 input (dispara pipeline)
     ├─ GET  /api/v1/files          → lista resized/ (polling cada 4s)
     ├─ GET  /api/v1/files/signed-url → URL firmada CloudFront
     └─ DELETE /api/v1/files        → elimina 3 variantes en paralelo
          │
          ▼
  ┌──────────────────────────────────┐
  │  Express 5 Backend               │
  │  • Sube a image-resize/input/    │
  │  • Lista image-resize/resized/   │
  │  • Genera Signed URLs CloudFront │
  └──────────────┬───────────────────┘
                 │ S3 Event (ObjectCreated)
                 ▼
  ┌──────────────────────────────────────┐
  │  SQS Queue → Lambda (Python + Pillow)│
  │  → 800×600, 400×300, 150×150         │
  │  → DynamoDB (metadata + status)      │
  │  → SNS (notificación)                │
  └──────────────────────────────────────┘
                 │
                 ▼ Signed URLs
  CloudFront Distribution (OAC → S3)`,
    steps: [
      {
        n: 1,
        title: "Frontend — Upload con React 19 + polling automático",
        detail:
          "ImageUploader valida MIME type en cliente antes de enviar. Tras un upload exitoso, ImageProcessor activa isProcessing=true e incrementa refreshTrigger. ImageGallery detecta el cambio y comienza polling cada 4 segundos consultando GET /api/v1/files. Cuando el número de grupos de imágenes aumenta (las variantes están listas), el polling se detiene automáticamente.",
      },
      {
        n: 2,
        title: "Backend — Upload a S3 y disparo del pipeline",
        detail:
          "El backend sube la imagen al prefijo image-resize/input/ del bucket S3. Este upload dispara automáticamente la S3 Event Notification → SQS → Lambda. El backend responde al cliente con la URL firmada de la imagen original antes de que Lambda la procese.",
      },
      {
        n: 3,
        title: "Pipeline Lambda — 3 variantes + DynamoDB",
        detail:
          "Lambda (Python + Pillow) descarga la imagen de S3 input, genera 3 versiones (800×600, 400×300, 150×150) y las sube a S3 resized/. Implementa idempotencia via DynamoDB: si la imagen ya fue procesada, no la reprocesa. SQS con MaxReceiveCount=3 y DLQ para mensajes fallidos.",
      },
      {
        n: 4,
        title: "Frontend — Galería agrupada con preview y eliminación",
        detail:
          "ImageGallery agrupa las imágenes por filename extrayéndolo del S3 key (image-resize/resized/800x600/abc.jpg). Muestra las 3 variantes en una grid. Al eliminar un grupo, ejecuta DELETE en paralelo (Promise.all) para las 3 variantes. ImagePreviewModal muestra las dimensiones reales del archivo usando img.naturalWidth/naturalHeight.",
      },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          "Astro 6.x",
          "React 19.2",
          "Tailwind CSS 4.x",
          "TypeScript 6.x",
          "pnpm 11",
        ],
      },
      {
        category: "Backend",
        items: [
          "Node.js ≥ 20",
          "Express 5.2.x",
          "AWS SDK v3 (S3 + CloudFront)",
          "@aws-sdk/cloudfront-signer",
          "helmet",
          "express-rate-limit",
          "nanoid",
        ],
      },
      {
        category: "Pipeline AWS (Lambda)",
        items: [
          "Python 3.12",
          "Pillow (imagen resize)",
          "boto3",
          "SQS + DLQ",
          "DynamoDB (metadata)",
          "SNS (notificaciones)",
        ],
      },
      {
        category: "Infraestructura",
        items: [
          "S3 (input + output)",
          "CloudFront + Signed URLs",
          "KMS (SSE-KMS)",
          "Lambda Layers (Pillow)",
          "Terraform",
        ],
      },
    ],
    decisions: [
      {
        title: "Polling vs WebSockets para actualizar la galería",
        chosen: "Polling con intervalo adaptativo (4s)",
        why: "WebSockets requieren un servidor stateful adicional (ECS task o API Gateway WebSockets). Polling cada 4s es suficiente para una demo — Lambda procesa imágenes en 2-5 segundos. El polling se detiene automáticamente al detectar las imágenes nuevas, minimizando requests innecesarios.",
        alternatives: [
          "WebSockets — tiempo real verdadero, requiere servidor adicional y más complejidad",
          "Server-Sent Events — unidireccional, pero requiere conexión HTTP persistente al backend",
          "AppSync Subscriptions — managed WebSockets, más costo y configuración",
        ],
      },
      {
        title: "Astro Islands con React vs SPA pura",
        chosen: "Astro Islands (React como isla interactiva)",
        why: "La página tiene contenido estático (explicación de la arquitectura) que no necesita JavaScript. Solo la sección de demo (upload + galería) es interactiva. Astro Islands permite hidratación selectiva: solo los componentes React que necesitan interactividad se envían al cliente.",
        alternatives: [
          "Next.js SPA — hidrata toda la página, más JS en el bundle",
          "Remix — server-side forms, más complejo para esta demo",
        ],
      },
    ],
    snippets: [
      {
        title: "Frontend — Hook de polling en ImageGallery (React 19)",
        language: "typescript",
        code: `// Polling automático cuando isProcessing = true
// Se detiene cuando detecta nuevas imágenes o tras 30s de timeout
useEffect(() => {
  if (!isProcessing) return;

  let attempts = 0;
  const MAX_ATTEMPTS = 30000 / 4000; // 30s / 4s = 7 intentos

  const interval = setInterval(async () => {
    attempts++;
    const result = await listImages();
    if (!result.success) return;

    const newGroups = groupByFilename(result.data.files);
    if (newGroups.length > prevGroupCount) {
      setGroups(newGroups);
      onProcessingComplete();
      clearInterval(interval);
    }

    if (attempts >= MAX_ATTEMPTS) {
      onProcessingComplete();
      clearInterval(interval);
    }
  }, 4000);

  return () => clearInterval(interval);
}, [isProcessing, prevGroupCount]);`,
      },
      {
        title: "Frontend — Eliminación en paralelo de 3 variantes",
        language: "typescript",
        code: `async function handleDeleteGroup(group: ImageGroup) {
  const keys = [
    group.variants['800x600']?.key,
    group.variants['400x300']?.key,
    group.variants['150x150']?.key,
  ].filter(Boolean) as string[];

  // Elimina las 3 variantes en paralelo
  const results = await Promise.all(keys.map(key => deleteImage(key)));

  const allOk = results.every(r => r.success);
  if (allOk) {
    setGroups(prev => prev.filter(g => g.filename !== group.filename));
  }
}`,
      },
    ],
  },

  {
    slug: "gps-vehicle-tracking",
    githubUrl: "https://github.com/alfredo0607/gps-vehicle-tracking-system",
    demoUrl: "https://tracking-vehicle-aws.alfredo-dominguez.dev",
    title: "GPS Vehicle Tracking System",
    tagline:
      "Sistema fullstack de rastreo de flota en tiempo real con mapas interactivos, comandos remotos vía AWS IoT y almacenamiento en DynamoDB.",
    status: "live",
    architectureSlugs: ["05-gps-vehicle-tracking", "04-container-backend"],
    tags: [
      "React",
      "MapLibre GL",
      "Node.js",
      "Express",
      "AWS IoT",
      "DynamoDB",
      "JWT",
      "Terraform",
    ],
    problem:
      "Una empresa de logística necesita monitorear su flota de vehículos en tiempo real: ver la posición actual en un mapa, consultar el historial de coordenadas, y enviar comandos remotos (bloquear motor, activar alarma) directamente al dispositivo GPS instalado en el vehículo.",
    solution:
      "Dashboard React + MapLibre GL que muestra posiciones en tiempo real. Backend Node.js + Express que gestiona autenticación JWT, CRUD de vehículos y dispositivos GPS en DynamoDB, y envío de comandos remotos via AWS IoT (MQTT). Los dispositivos GPS publican coordenadas al IoT endpoint; el backend las persiste en DynamoDB con TTL.",
    diagram: `
  ┌────────────────────────────────────────────────────────────────┐
  │  Dashboard React (Vite + MapLibre GL + TailwindCSS)            │
  │  • Mapa interactivo con posición de vehículos                  │
  │  • CommandPanel: bloquear motor, alarma, flash de luces         │
  │  • Historial de coordenadas por vehículo                       │
  └──────────────────────────────┬─────────────────────────────────┘
                                 │ JWT Auth + REST
                                 ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Backend (Node.js + Express 4)                               │
  │  • Auth: bcryptjs + jsonwebtoken                             │
  │  • Rutas: /auth, /gps, /vehicles, /commands                  │
  │  • AWS IoT: publica comandos MQTT al dispositivo             │
  └────────────────────┬──────────────────────┬──────────────────┘
                       │                      │
                       ▼                      ▼
  ┌─────────────────────────┐    ┌─────────────────────────────┐
  │  DynamoDB               │    │  AWS IoT Core               │
  │  • Usuarios             │    │  MQTT endpoint              │
  │  • GPS (dispositivos)   │    │  Comandos → dispositivo     │
  │  • Vehículos            │    │  (block_engine, alarm, etc) │
  │  • Coordenadas (TTL)    │    └─────────────────────────────┘
  │  • Comandos             │                 │
  │  • Eventos (TTL)        │                 ▼ MQTT
  └─────────────────────────┘    ┌─────────────────────────────┐
                                 │  Dispositivo GPS (hardware)  │
                                 │  Publica coordenadas         │
                                 │  Recibe comandos MQTT        │
                                 └─────────────────────────────┘`,
    steps: [
      {
        n: 1,
        title: "Frontend — Mapa interactivo con MapLibre GL",
        detail:
          "El dashboard usa MapLibre GL (open-source, sin costo de API key) para renderizar mapas. Los vehículos se muestran como marcadores con su posición actual. El componente Map.jsx actualiza las posiciones consultando GET /api/gps periódicamente. React Router gestiona las páginas: Dashboard, Login, detalle de vehículo.",
      },
      {
        n: 2,
        title: "Backend — Autenticación JWT + RBAC",
        detail:
          "El backend usa bcryptjs para hashear contraseñas y jsonwebtoken para emitir tokens JWT. El middleware auth.middleware.js verifica el token en cada request protegido. Los usuarios se almacenan en DynamoDB (tabla Usuarios) con un GSI en email para búsqueda eficiente.",
      },
      {
        n: 3,
        title: "Envío de comandos remotos vía AWS IoT",
        detail:
          "El servicio iot-commands.service.js publica mensajes MQTT al IoT endpoint de AWS usando el AWS SDK. Cada comando tiene un payload específico (ej: block_engine → {CMD: 'setdigout 100'}). El estado del comando (pending → sent → executed/failed/timeout) se persiste en DynamoDB (tabla Comandos).",
      },
      {
        n: 4,
        title: "Persistencia de coordenadas con TTL en DynamoDB",
        detail:
          "Las coordenadas GPS se almacenan en DynamoDB con TTL habilitado — expiran automáticamente después del período configurado, controlando el costo de storage. Un GSI en gpsId + timestamp permite consultar el historial de posiciones de un dispositivo ordenado cronológicamente.",
      },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          "React 18.3.1",
          "Vite 5.4.2",
          "React Router 6.26.2",
          "MapLibre GL 4.7.1",
          "TailwindCSS 3.4.1",
          "Axios 1.7.7",
          "Lucide React",
        ],
      },
      {
        category: "Backend",
        items: [
          "Node.js 18.x",
          "Express 4.19.2",
          "jsonwebtoken 9.0.2",
          "bcryptjs 2.4.3",
          "AWS SDK 2.x",
          "uuid 10.0.0",
          "dotenv 16.x",
        ],
      },
      {
        category: "Infraestructura AWS",
        items: [
          "AWS IoT Core (MQTT)",
          "DynamoDB (6 tablas + TTL)",
          "DynamoDB GSI (email, deviceId, gpsId-timestamp)",
          "IAM Roles",
          "Terraform",
        ],
      },
    ],
    decisions: [
      {
        title: "MapLibre GL vs Google Maps vs Leaflet",
        chosen: "MapLibre GL",
        why: "MapLibre GL es open-source y no requiere API key ni cargos por uso. Soporta mapas vectoriales con WebGL — mejor performance que Leaflet (raster tiles). Leaflet es más simple pero limitado para mapas con muchos marcadores en tiempo real. Google Maps tiene mejor UX pero cobra por request.",
        alternatives: [
          "Google Maps — mejor UX y cobertura, costo por uso ($7/1000 requests)",
          "Leaflet — open-source, simple, raster tiles, menos performance con muchos marcadores",
          "Mapbox GL — similar a MapLibre (es el fork), requiere API key y tiene costos",
        ],
      },
      {
        title: "DynamoDB vs RDS para persistir coordenadas GPS",
        chosen: "DynamoDB con TTL",
        why: "Las coordenadas GPS son writes frecuentes (cada 30s por vehículo) con lecturas por rango de tiempo. DynamoDB On-Demand escala automáticamente sin capacity planning. El TTL elimina coordenadas antiguas automáticamente sin queries de limpieza. Para 100 vehículos → 2,880 writes/hora → DynamoDB maneja esto sin configuración.",
        alternatives: [
          "RDS PostgreSQL con PostGIS — queries geoespaciales avanzadas, requiere gestionar instancias",
          "TimescaleDB — optimizado para series de tiempo, más complejo de operar",
        ],
      },
    ],
    snippets: [
      {
        title: "Backend — Envío de comando MQTT via AWS IoT",
        language: "javascript",
        code: `import AWS from 'aws-sdk';

const iotData = new AWS.IotData({
  endpoint: process.env.IOT_ENDPOINT,
  region: process.env.AWS_REGION,
});

const COMMAND_PAYLOADS = {
  block_engine:     { CMD: 'setdigout 100' },
  unblock_engine:   { CMD: 'setdigout 000' },
  activate_alarm:   { CMD: 'setdigout 010' },
  deactivate_alarm: { CMD: 'setdigout 000' },
  flash_lights:     { CMD: 'setdigout 001' },
  request_status:   { CMD: 'getinfo' },
};

export async function sendIoTCommand(deviceId, command, parameters = {}) {
  const payload = COMMAND_PAYLOADS[command] ?? { CMD: command, ...parameters };

  await iotData.publish({
    topic: \`gps/\${deviceId}/commands\`,
    qos: 1,
    payload: JSON.stringify(payload),
  }).promise();
}`,
      },
      {
        title: "Frontend — Cliente Axios con interceptor JWT",
        language: "javascript",
        code: `import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el JWT automáticamente a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export const sendCommand = async (gpsId, command, parameters = {}) => {
  const { data } = await api.post(\`/commands/\${gpsId}/send\`, {
    command,
    parameters,
  });
  return data;
};

export const getCommandHistory = async (gpsId, limit = 50) => {
  const { data } = await api.get(\`/commands/\${gpsId}/history\`, {
    params: { limit },
  });
  return data;
};`,
      },
    ],
  },

  // ── Proyectos placeholder ───────────────────────────────────────────────────
  {
    slug: "api-rest-jwt",
    githubUrl: "https://github.com/alfredo0607/express-typescript-jwt-api",
    demoUrl: "https://express-typescript-jwt-api.pages.dev/login",
    title: "API REST con Autenticación JWT",
    tagline:
      "API Node.js + TypeScript + Express con JWT, RBAC, rate limiting, OpenAPI docs y deploy en EC2 + Docker.",
    status: "live",
    architectureSlugs: ["04-container-backend"],
    tags: [
      "Node.js",
      "TypeScript",
      "Express",
      "JWT",
      "PostgreSQL",
      "EC2",
      "Docker",
      "Redis",
    ],
    problem:
      "Construir una API REST production-ready con autenticación stateless (JWT), control de acceso basado en roles (RBAC), protección contra abuso (rate limiting), validación exhaustiva de inputs, y documentación automática. El deploy debe ser reproducible con Docker y la infraestructura gestionada con Terraform.",
    solution:
      "API construida con Express + TypeScript usando una arquitectura en capas (routes → middleware → controllers → services → repositories). JWT para autenticación stateless con refresh token rotation. RBAC con roles definidos en base de datos. Rate limiting por IP y por usuario con Redis. Validación con Zod en cada endpoint. Documentación OpenAPI generada automáticamente. Containerizada con Docker multi-stage y desplegada en EC2 + Docker.",
    diagram: `
  Cliente (Next.js / Postman)
     │ HTTPS
     ▼
  ┌──────────────────────────────────────────────────────┐
  │  Express App (TypeScript)                            │
  │                                                      │
  │  Request Pipeline:                                   │
  │  ┌─────────────────────────────────────────────────┐ │
  │  │ 1. Helmet (security headers)                    │ │
  │  │ 2. CORS (allow-list de orígenes)               │ │
  │  │ 3. Rate Limiter (100 req/15min por IP, Redis)  │ │
  │  │ 4. Body Parser (JSON, max 1MB)                 │ │
  │  │ 5. Morgan (request logging)                    │ │
  │  │ 6. authenticate() middleware (JWT verify)      │ │
  │  │ 7. authorize() middleware (RBAC check)         │ │
  │  │ 8. validate() middleware (Zod schema)          │ │
  │  │ 9. Route Handler (Controller)                  │ │
  │  │ 10. Error Handler global                       │ │
  │  └─────────────────────────────────────────────────┘ │
  └────────────────────────┬────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
  ┌─────────────┐   ┌─────────────┐   ┌────────────────┐
  │ PostgreSQL  │   │    Redis    │   │  Secrets Mgr   │
  │ (usuarios,  │   │ (rate limit │   │ (JWT secret,   │
  │  roles,     │   │  + sessions)│   │  DB password)  │
  │  recursos)  │   └─────────────┘   └────────────────┘
  └─────────────┘

  Auth Flow (JWT + Refresh Token):
  POST /auth/login ──▶ valida credenciales ──▶ genera:
    • accessToken  (JWT, 15 min, firmado con RS256)
    • refreshToken (opaque, 7 días, almacenado en Redis)

  POST /auth/refresh ──▶ valida refreshToken en Redis ──▶ rota:
    • nuevo accessToken (15 min)
    • nuevo refreshToken (7 días) + invalida el anterior`,
    steps: [
      {
        n: 1,
        title: "Arquitectura en capas (Layered Architecture)",
        detail:
          "La aplicación se divide en: Routes (define endpoints y aplica middleware), Controllers (maneja el request/response, delega lógica), Services (lógica de negocio pura, testeable), Repositories (acceso a datos, abstrae la DB). Esta separación permite testear cada capa de forma independiente con mocks.",
      },
      {
        n: 2,
        title: "Autenticación JWT con RS256 y Refresh Token Rotation",
        detail:
          "Se usa RS256 (asimétrico) en lugar de HS256: la clave privada firma los tokens (solo el servidor), la clave pública verifica (puede distribuirse a otros servicios). Access token: 15 minutos, contiene userId y roles. Refresh token: opaque UUID aleatorio, 7 días, almacenado en Redis con el userId asociado. Refresh token rotation: cada vez que se usa, se invalida y genera uno nuevo.",
      },
      {
        n: 3,
        title: "Control de acceso basado en roles (RBAC)",
        detail:
          "Los roles (admin, user, viewer) se almacenan en PostgreSQL y se incluyen en el JWT payload al login. El middleware authorize('admin', 'user') verifica que el rol del token esté en la lista permitida. Para permisos más granulares (ej: solo el dueño del recurso puede editar), se hace una verificación adicional en el Service layer comparando req.user.id con el ownerId del recurso.",
      },
      {
        n: 4,
        title: "Validación con Zod en cada endpoint",
        detail:
          "Cada endpoint define un schema Zod para body, params y query. El middleware validate(schema) ejecuta schema.parse() y retorna 400 con los errores de validación si falla. Zod garantiza type safety en runtime, complementando TypeScript que solo opera en compile time.",
      },
      {
        n: 5,
        title: "Rate Limiting con Redis",
        detail:
          "express-rate-limit con Redis store (rate-limit-redis). Límites: 100 requests/15min por IP (global), 5 intentos de login/15min por IP (anti-brute-force), 1000 requests/hora por usuario autenticado. Redis persiste los contadores entre restarts del servidor y entre múltiples instancias (crítico en ECS con múltiples tasks).",
      },
      {
        n: 6,
        title: "Documentación OpenAPI con Swagger UI",
        detail:
          "swagger-jsdoc genera la especificación OpenAPI 3.0 desde JSDoc comments en las routes. swagger-ui-express sirve el UI interactivo en /api/docs. Cada endpoint documenta: descripción, parámetros, request body schema, response schemas (200, 400, 401, 403, 404, 500), y ejemplos.",
      },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          "Next.js 16 (App Router)",
          "React 19, shadcn/ui, Radix UI",
          "TypeScript 5",
          "Tailwind CSS",
          "Zustand v5",
          "TanStack Query v5",
          "Axios",
          "react-hook-form + Zod v3",
          "Sonner",
        ],
      },

      {
        category: "Runtime & Framework",
        items: ["Node.js 24.16.0 LTS", "Express 5", "TypeScript 6"],
      },
      {
        category: "Autenticación & Seguridad",
        items: [
          "jsonwebtoken (RS256)",
          "bcrypt",
          "helmet",
          "cors",
          "express-rate-limit",
        ],
      },
      {
        category: "Validación & Documentación",
        items: ["Zod", "swagger-jsdoc", "swagger-ui-express"],
      },
      {
        category: "Base de datos",
        items: ["PostgreSQL 17", "node-postgres (pg)", "pg-pool"],
      },
      {
        category: "Caché & Sessions",
        items: ["Redis 7", "ioredis", "rate-limit-redis"],
      },
      {
        category: "Infraestructura",
        items: [
          "Docker (multi-stage)",
          "EC2 + Docker",
          "Terraform",
          "GitHub Actions",
        ],
      },
    ],
    decisions: [
      {
        title: "Express vs Fastify vs NestJS",
        chosen: "Express + TypeScript",
        why: "Express es el estándar de facto con el ecosistema más amplio. Fastify tiene mejor performance (~2x) pero el overhead de Express es irrelevante en la mayoría de casos reales. NestJS añade demasiado opinionamiento y curva de aprendizaje para una API REST estándar.",
        alternatives: [
          "Fastify — mayor throughput, decoradores nativos, pero ecosistema más pequeño",
          "NestJS — estructura empresarial, inyección de dependencias, más complejo",
        ],
      },
      {
        title: "JWT RS256 vs HS256",
        chosen: "RS256 (RSA)",
        why: "RS256 usa par de claves asimétricas: la clave privada firma (solo el auth service), la clave pública verifica (cualquier microservicio). Permite que otros servicios validen tokens sin acceder a la clave privada. HS256 requiere compartir el secreto con todos los servicios que validan tokens, lo que aumenta la superficie de ataque.",
        alternatives: [
          "HS256 — más simple, suficiente para monolitos o cuando solo hay un servicio",
          "PASETO — más moderno, evita errores comunes de JWT, menos soporte de librerías",
        ],
      },
    ],
    snippets: [
      {
        title: "TypeScript — JWT Middleware (authenticate + authorize)",
        language: "typescript",
        code: `import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPublicKey } from "../config/jwt";
import { AppError } from "../utils/AppError";
import type { JwtPayload, AuthUser } from "../types";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, getPublicKey(), {
      algorithms: ["RS256"],
    }) as JwtPayload;

    req.user = { id: payload.sub, roles: payload.roles } satisfies AuthUser;

    next();
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
}


import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import type { UserRole } from "../types";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw AppError.unauthorized();

    const hasRole = req.user.roles.some((r) => roles.includes(r));

    if (!hasRole) throw AppError.forbidden();

    next();
  };
}`,
      },
      {
        title: "TypeScript — Validación con Zod + middleware genérico",
        language: "typescript",
        code: `import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

interface RequestSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    if (schemas.params) req.params = schemas.params.parse(req.params) as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    if (schemas.query) req.query = schemas.query.parse(req.query) as any;
    next();
  };
}


// --- Uso en routes ---
import { Router, IRouter } from "express";
import {
  createUser,
  getProfile,
  listUsers,
  updateUser,
  deleteUser,
} from "../controllers/users.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  adminUpdateUserSchema,
  createUserByAdminSchema,
  userIdParamSchema,
} from "../models/users.schemas";

export const router: IRouter = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", getProfile);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (admin only)
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */
router.get("/", authorize("admin"), listUsers);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, user, viewer] }
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already in use
 */
router.post(
  "/",
  authorize("admin"),
  validate({ body: createUserByAdminSchema }),
  createUser,
);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user (admin or own profile)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id",
  validate({ params: userIdParamSchema, body: adminUpdateUserSchema }),
  updateUser,
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: User deleted
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/:id",
  authorize("admin"),
  validate({ params: userIdParamSchema }),
  deleteUser,
);`,
      },
    ],
  },

  {
    slug: "dashboard-tiempo-real",
    githubUrl: "https://github.com/Alfredo0607/dashboard-tiempo-real",
    demoUrl: "https://www.google.com",
    title: "Dashboard en Tiempo Real con React",
    tagline:
      "Dashboard interactivo Next.js con WebSockets para métricas en vivo desde CloudWatch y DynamoDB Streams.",
    status: "In development",
    tags: [
      "Next.js",
      "React",
      "TypeScript",
      "WebSockets",
      "Node.js",
      "CloudWatch",
      "DynamoDB Streams",
    ],
    problem:
      "Un equipo de operaciones necesita monitorear métricas de su plataforma AWS en tiempo real (CPU, requests/s, errores, latencia p95) sin refrescar la página. Los datos vienen de CloudWatch y DynamoDB. La solución debe actualizar el dashboard automáticamente cada vez que hay nuevos datos.",
    solution:
      "Frontend Next.js con componentes de gráficos en tiempo real. WebSocket server (Node.js) que actúa como proxy entre el browser y las APIs de AWS: consulta CloudWatch Metrics cada 60 segundos y escucha DynamoDB Streams en tiempo real. El cliente usa un hook personalizado useMetricsStream que gestiona la conexión WebSocket, reconexión automática y el buffer de datos.",
    diagram: `
  Browser (Next.js)
     │
     │ WebSocket (ws://)
     ▼
  ┌────────────────────────────────────────────────────┐
  │  WebSocket Server (Node.js)                        │
  │                                                    │
  │  ┌─────────────────┐    ┌──────────────────────┐   │
  │  │ CloudWatch      │    │  DynamoDB Streams    │   │
  │  │ Poller (60s)    │    │  Listener (real-time)│   │
  │  └────────┬────────┘    └──────────┬───────────┘   │
  │           │                        │                │
  │           └──────────┬─────────────┘                │
  │                      ▼                              │
  │             ┌─────────────────┐                     │
  │             │ Broadcast a     │                     │
  │             │ clientes WS     │                     │
  │             │ suscritos       │                     │
  │             └─────────────────┘                     │
  └────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  ┌─────────────┐          ┌─────────────────┐
  │  CloudWatch │          │  DynamoDB       │
  │  Metrics    │          │  Streams        │
  │  (CPU, req, │          │  (nuevos items) │
  │   latencia) │          └─────────────────┘
  └─────────────┘

  Frontend State Machine (useMetricsStream):
  DISCONNECTED ──connect──▶ CONNECTING ──open──▶ CONNECTED
       ▲                                              │
       └──────────── error/close (backoff retry) ◀───┘`,
    steps: [
      {
        n: 1,
        title: "Hook useMetricsStream — gestión del WebSocket en React",
        detail:
          "El hook gestiona el ciclo de vida completo de la conexión WebSocket: conectar, recibir datos, reconectar con exponential backoff (1s, 2s, 4s, 8s, max 30s) ante desconexiones. Mantiene un buffer circular de los últimos 60 puntos de datos por métrica para renderizar la gráfica. Cleanup en el useEffect garantiza que el socket se cierra cuando el componente se desmonta.",
      },
      {
        n: 2,
        title: "CloudWatch Metrics Poller (server-side)",
        detail:
          "El WebSocket server consulta CloudWatch GetMetricData cada 60 segundos para las métricas configuradas (CPU, RequestCount, TargetResponseTime, HTTPCode_ELB_5XX_Count). Usa el SDK v3 de AWS con IAM Role (sin credentials hardcodeadas). Los datos se normalizan y se brodacastean a todos los clientes WebSocket suscritos a esa métrica.",
      },
      {
        n: 3,
        title: "DynamoDB Streams — eventos en tiempo real",
        detail:
          "DynamoDB Streams captura cada INSERT/MODIFY/REMOVE en la tabla. El servidor usa el SDK para leer los stream records con getShardIterator + getRecords en polling (o con Kinesis Client Library para mayor robustez). Cada nuevo item se parsea y se brodacastea al dashboard en <1 segundo desde el evento original.",
      },
      {
        n: 4,
        title: "Renderizado de gráficas con Recharts",
        detail:
          "Los componentes de gráfica usan Recharts (LineChart, AreaChart). Son 'use client' en Next.js (interactivos). Cada punto de dato nuevo se añade al estado con setData(prev => [...prev.slice(-59), newPoint]) — mantiene los últimos 60 puntos y el componente re-renderiza solo la parte que cambia gracias al virtual DOM de React.",
      },
    ],
    techStack: [
      {
        category: "Frontend",
        items: [
          "Next.js 16",
          "React 19",
          "TypeScript",
          "Recharts",
          "Tailwind CSS",
        ],
      },
      {
        category: "WebSocket Server",
        items: ["Node.js 24.16.0", "ws (WebSocket library)", "TypeScript"],
      },
      {
        category: "AWS SDKs",
        items: [
          "@aws-sdk/client-cloudwatch",
          "@aws-sdk/client-dynamodb-streams",
        ],
      },
      {
        category: "Infraestructura",
        items: ["EC2 + Docker (WS server)", "IAM Roles"],
      },
    ],
    decisions: [
      {
        title: "WebSockets vs Server-Sent Events (SSE) vs Polling",
        chosen: "WebSockets",
        why: "WebSockets permiten comunicación bidireccional — el cliente puede suscribirse a métricas específicas y el server solo envía lo relevante. SSE es unidireccional (server → client) y más simple pero no permite que el cliente filtre qué datos quiere. Polling (fetch cada N segundos) añade latencia y carga innecesaria.",
        alternatives: [
          "Server-Sent Events — más simple, nativo en browser, pero solo server→client",
          "Long Polling — compatible con cualquier servidor HTTP, más latencia",
          "GraphQL Subscriptions — over WebSockets, más estructura pero más overhead",
        ],
      },
    ],
    snippets: [
      {
        title: "TypeScript — Hook useMetricsStream con reconexión automática",
        language: "typescript",
        code: `import { useEffect, useRef, useState, useCallback } from "react";

type MetricPoint = { timestamp: number; value: number };
type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

const MAX_BACKOFF_MS = 30_000;

export function useMetricsStream(metricName: string, maxPoints = 60) {
  const [data, setData] = useState<MetricPoint[]>([]);
  const [state, setState] = useState<ConnectionState>("disconnected");

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const ws = new WebSocket(
      \`\${process.env.NEXT_PUBLIC_WS_URL}/metrics\`
    );
    wsRef.current = ws;
    setState("connecting");

    ws.onopen = () => {
      setState("connected");
      backoffRef.current = 1000; // reset backoff al conectar
      ws.send(JSON.stringify({ action: "subscribe", metric: metricName }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const point: MetricPoint = JSON.parse(event.data as string);
      setData((prev) => [...prev.slice(-(maxPoints - 1)), point]);
    };

    ws.onerror = () => setState("error");

    ws.onclose = () => {
      setState("disconnected");
      // Exponential backoff con jitter
      const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      timeoutRef.current = setTimeout(connect, delay + Math.random() * 1000);
    };
  }, [metricName, maxPoints]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timeoutRef.current);
      wsRef.current?.close(1000, "Component unmounted");
    };
  }, [connect]);

  return { data, state };
}`,
      },
      {
        title: "Node.js — CloudWatch Metrics Poller (WebSocket Server)",
        language: "typescript",
        code: `import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { WebSocketServer, WebSocket } from "ws";

const cw = new CloudWatchClient({ region: "us-east-1" });
const wss = new WebSocketServer({ port: 8080 });

// Map de metric → Set de clients suscritos
const subscriptions = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString()) as { action: string; metric: string };
    if (msg.action === "subscribe") {
      if (!subscriptions.has(msg.metric)) {
        subscriptions.set(msg.metric, new Set());
      }
      subscriptions.get(msg.metric)!.add(ws);
    }
  });

  ws.on("close", () => {
    // Limpia suscripciones del cliente desconectado
    for (const clients of subscriptions.values()) {
      clients.delete(ws);
    }
  });
});

async function pollCloudWatch(): Promise<void> {
  const now = new Date();
  const start = new Date(now.getTime() - 5 * 60 * 1000); // últimos 5 min

  const { MetricDataResults } = await cw.send(
    new GetMetricDataCommand({
      StartTime: start,
      EndTime: now,
      MetricDataQueries: [
        {
          Id: "cpu",
          MetricStat: {
            Metric: {
              Namespace: "AWS/ECS",
              MetricName: "CPUUtilization",
              Dimensions: [{ Name: "ServiceName", Value: "portfolio-api" }],
            },
            Period: 60,
            Stat: "Average",
          },
        },
      ],
    })
  );

  for (const result of MetricDataResults ?? []) {
    const clients = subscriptions.get(result.Id ?? "");
    if (!clients?.size) continue;

    const points = (result.Timestamps ?? []).map((ts, i) => ({
      timestamp: ts.getTime(),
      value: result.Values?.[i] ?? 0,
    }));

    for (const point of points) {
      const payload = JSON.stringify(point);
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  }
}

// Poll cada 60 segundos
setInterval(pollCloudWatch, 60_000);
pollCloudWatch(); // ejecuta inmediatamente al arrancar`,
      },
    ],
  },

  {
    slug: "app-movil-react-native",
    githubUrl: "https://github.com/Alfredo0607/app-movil-react-native",
    demoUrl: "https://www.google.com",
    title: "App Móvil con React Native + AWS Cognito",
    tagline:
      "Aplicación móvil multiplataforma iOS/Android con autenticación Cognito, API serverless y sincronización offline.",
    status: "In development",
    tags: [
      "React Native",
      "Expo",
      "TypeScript",
      "AWS Cognito",
      "API Gateway",
      "Lambda",
      "DynamoDB",
    ],
    problem:
      "Construir una app móvil que funcione en iOS y Android con autenticación segura, acceso a una API serverless en AWS, y capacidad de funcionar offline con sincronización automática cuando se restaura la conexión.",
    solution:
      "React Native + Expo para desarrollo multiplataforma con TypeScript. AWS Amplify SDK para integración con Cognito (User Pools + Identity Pools), API Gateway y AppSync. Cognito maneja el flujo completo de auth: registro, confirmación por email, login, MFA opcional, refresh automático de tokens. Las llamadas a la API van firmadas con credenciales temporales STS (Cognito Identity Pool). SQLite local (via expo-sqlite) para cache offline con sincronización delta.",
    diagram: `
  ┌──────────────────────────────────────────────────────────────┐
  │  React Native App (Expo)                                     │
  │                                                              │
  │  ┌─────────────────────────┐  ┌──────────────────────────┐  │
  │  │  Auth Flow              │  │  Data Layer              │  │
  │  │  • Sign Up              │  │  • React Query (cache)   │  │
  │  │  • Email Confirm        │  │  • SQLite (offline)      │  │
  │  │  • Sign In              │  │  • Sync Queue            │  │
  │  │  • MFA (TOTP)           │  └──────────────────────────┘  │
  │  │  • Token Refresh (auto) │                                 │
  │  └─────────────────────────┘                                 │
  └─────────────────────────┬────────────────────────────────────┘
                            │ HTTPS (Amplify SDK)
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  ┌─────────────┐  ┌────────────────┐  ┌─────────────────┐
  │  Cognito    │  │  API Gateway   │  │  AppSync        │
  │  User Pool  │  │  (REST)        │  │  (GraphQL/WS)   │
  │             │  │  + Lambda      │  │  + DynamoDB     │
  │  Identity   │  │  (business     │  │  (real-time     │
  │  Pool       │  │   logic)       │  │   subscriptions)│
  └─────────────┘  └────────────────┘  └─────────────────┘
         │
         ▼ (credenciales temporales STS)
  IAM Role → permisos para llamar API Gateway y AppSync`,
    steps: [
      {
        n: 1,
        title: "Configuración de Cognito User Pool + Identity Pool",
        detail:
          "User Pool define las reglas de contraseña, atributos del usuario (email, nombre), políticas de MFA, y triggers Lambda (pre-signup, post-confirmation). Identity Pool mapea usuarios autenticados de Cognito a un IAM Role con permisos temporales STS. Los tokens JWT de Cognito se intercambian por credenciales AWS temporales (AccessKeyId + SecretAccessKey + SessionToken).",
      },
      {
        n: 2,
        title: "Flujo de autenticación con Amplify SDK",
        detail:
          "Amplify maneja automáticamente el refresh de tokens: cuando el accessToken expira (1 hora), usa el refreshToken para obtener uno nuevo sin que el usuario lo note. El token se almacena en SecureStore (iOS Keychain / Android Keystore). Si el refreshToken expira (30 días por defecto), el usuario debe volver a hacer login.",
      },
      {
        n: 3,
        title: "Llamadas firmadas a API Gateway con IAM Auth",
        detail:
          "Con las credenciales STS del Identity Pool, el SDK de Amplify firma automáticamente cada request a API Gateway con SigV4. API Gateway valida la firma y el IAM Role. Este approach es más seguro que API Keys porque las credenciales son temporales (1 hora) y tienen scope limitado al rol del Identity Pool.",
      },
      {
        n: 4,
        title: "Offline-first con SQLite y sync queue",
        detail:
          "expo-sqlite almacena datos localmente. Cuando hay conexión, se consulta la API y se actualiza SQLite. Cuando no hay conexión, la app lee de SQLite directamente. Las operaciones de escritura offline se añaden a una sync queue. Al recuperar conectividad (NetInfo listener), se procesan en orden con manejo de conflictos (last-write-wins o server-wins según el tipo de dato).",
      },
    ],
    techStack: [
      {
        category: "Mobile Framework",
        items: ["React Native 0.76", "Expo SDK 52", "TypeScript"],
      },
      {
        category: "UI & Navigation",
        items: [
          "React Navigation 7",
          "NativeWind (Tailwind)",
          "React Native Reanimated",
        ],
      },
      {
        category: "AWS & Auth",
        items: [
          "AWS Amplify SDK v6",
          "Amazon Cognito",
          "API Gateway",
          "Lambda",
        ],
      },
      {
        category: "Data & Offline",
        items: [
          "React Query (TanStack Query)",
          "expo-sqlite",
          "Zustand (state)",
        ],
      },
    ],
    decisions: [
      {
        title: "Expo vs React Native CLI puro",
        chosen: "Expo (Managed Workflow)",
        why: "Expo managed workflow elimina la necesidad de Xcode y Android Studio para el desarrollo del día a día. EAS Build compila en la nube. Para un portfolio, la productividad importa más que el control del código nativo. Si se necesitan módulos nativos no disponibles en Expo, se puede hacer eject o usar Expo bare workflow.",
        alternatives: [
          "React Native CLI — control total, requiere configurar Xcode/Android Studio",
          "React Native CLI + Expo modules — lo mejor de ambos mundos, más complejo",
        ],
      },
    ],
    snippets: [
      {
        title: "TypeScript — Amplify Cognito Auth Setup + useAuth hook",
        language: "typescript",
        code: `// amplify-config.ts
import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.EXPO_PUBLIC_CLIENT_ID!,
      identityPoolId: process.env.EXPO_PUBLIC_IDENTITY_POOL_ID!,
      loginWith: {
        email: true,
      },
      mfa: {
        status: "optional",
        totpEnabled: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
});

// hooks/useAuth.ts
import { useState, useEffect } from "react";
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  AuthUser,
} from "aws-amplify/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      setUser(await getCurrentUser());
    }
    return result;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const getToken = async (): Promise<string> => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? "";
  };

  return { user, loading, login, logout, getToken };
}`,
      },
    ],
  },

  {
    slug: "pipeline-datos-serverless",
    githubUrl: "https://github.com/Alfredo0607/pipeline-datos-serverless",
    demoUrl: "https://www.google.com",
    title: "Pipeline de Datos Serverless",
    tagline:
      "Ingesta y procesamiento de datos en tiempo real con Kinesis + Lambda + S3 + Glue + Athena. 100% Terraform.",
    status: "In development",
    tags: [
      "Kinesis",
      "Lambda",
      "S3",
      "Glue",
      "Athena",
      "Python",
      "Terraform",
      "Serverless",
    ],
    problem:
      "Un sistema de e-commerce necesita procesar eventos de usuario en tiempo real (clicks, views, purchases) para analytics. El volumen es de ~10,000 eventos/minuto con picos de 100,000/minuto. Los datos deben estar disponibles para consultas SQL ad-hoc en menos de 5 minutos desde que se generaron.",
    solution:
      "Pipeline event streaming con Kinesis Data Streams como ingestor de alta velocidad. Lambda consume el stream en micro-batches, transforma los eventos (normalización, enriquecimiento) y los escribe en S3 en formato Parquet particionado por fecha/hora. AWS Glue Crawler actualiza el Data Catalog automáticamente. Athena permite queries SQL serverless directamente sobre S3 sin ETL adicional. Todo el stack definido en Terraform.",
    diagram: `
  Productores de eventos:
  ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │ Frontend │ │ Backend  │ │ Mobile App   │
  │ (clicks) │ │ (orders) │ │ (sessions)   │
  └────┬─────┘ └────┬─────┘ └──────┬───────┘
       │             │              │ PutRecords (SDK)
       └─────────────┴──────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  Kinesis Data Stream                    │
  │  Shards: 2 (20,000 records/s capacity) │
  │  Retention: 24 horas                   │
  └──────────────────────┬──────────────────┘
                         │ Event Source Mapping
                         │ (BatchSize: 100, BisectOnError)
                         ▼
  ┌────────────────────────────────────────────┐
  │  Lambda (Python) — Transformer             │
  │  1. Decodifica base64                      │
  │  2. Parsea JSON                            │
  │  3. Valida schema (Pydantic)               │
  │  4. Enriquece (geo-IP, user-agent parsing) │
  │  5. Convierte a Parquet (pyarrow)          │
  │  6. Escribe a S3 particionado             │
  └──────────────────────┬─────────────────────┘
                         │ s3://data-lake/events/
                         │   year=2025/month=05/day=17/hour=14/
                         │   part-00001.parquet
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  S3 Data Lake (Parquet, Snappy compression)     │
  │  Particionado: year/month/day/hour              │
  └──────────────────────┬──────────────────────────┘
                         │ (trigger: s3:ObjectCreated)
                         ▼
  ┌──────────────────────────────┐
  │  Glue Crawler (cada 15 min) │
  │  → actualiza Data Catalog   │
  └──────────────────┬───────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────┐
  │  Amazon Athena (SQL serverless)          │
  │  SELECT event_type, COUNT(*) as total    │
  │  FROM events                             │
  │  WHERE year='2025' AND month='05'        │
  │  GROUP BY event_type                     │
  │  → $0.005 por query típica              │
  └──────────────────────────────────────────┘`,
    steps: [
      {
        n: 1,
        title: "Ingesta con Kinesis Data Streams",
        detail:
          "Los productores (frontend, backend, mobile) envían eventos a Kinesis con PutRecords (batch de hasta 500 records). Cada record tiene un partition key (userId) que determina el shard destino — records del mismo usuario van al mismo shard, garantizando orden por usuario. El stream tiene 2 shards iniciales (20,000 records/s de ingesta, 4MB/s). Con Shard-level Enhanced Fan-Out, cada consumidor Lambda tiene su propio throughput de 2MB/s por shard.",
      },
      {
        n: 2,
        title: "Transformación en Lambda con batching",
        detail:
          "Lambda consume el stream con BisectOnFunctionError=true: si un batch falla, lo divide a la mitad y reintenta, aislando el record problemático. Cada record del stream contiene el evento en base64. Lambda: decodifica, valida con Pydantic (descarta eventos malformados con logging), enriquece (parsing de user-agent, geo-lookup si hay IP), agrupa 100 records y convierte a Parquet con pyarrow (columnar, compresión Snappy: ~10x menos espacio que JSON).",
      },
      {
        n: 3,
        title: "Escritura en S3 particionada",
        detail:
          "Los archivos Parquet se escriben con el esquema de particionado Hive-compatible: s3://data-lake/events/year=2025/month=05/day=17/hour=14/part-XXXXX.parquet. Este esquema permite a Athena hacer partition pruning — si se consulta solo el día de hoy, solo lee las particiones de hoy, no todo el dataset. Archivo típico: ~5MB Parquet = ~50MB JSON original.",
      },
      {
        n: 4,
        title: "Glue Crawler y Data Catalog",
        detail:
          "Glue Crawler escanea el bucket S3 cada 15 minutos (o se puede disparar vía Lambda al escribir nuevas particiones). Detecta el schema Parquet automáticamente y registra/actualiza la tabla en el Glue Data Catalog. Una vez en el catalog, Athena puede consultar los datos con SQL estándar sin ninguna configuración adicional.",
      },
      {
        n: 5,
        title: "Queries SQL con Athena",
        detail:
          "Athena ejecuta queries SQL directamente sobre los archivos Parquet en S3 sin necesidad de cargar datos en una base de datos. El costo es $5/TB de datos escaneados — con particionado y Parquet, una query típica escanea <1GB ($0.005). Los resultados se guardan en un bucket S3 de resultados y pueden consumirse desde cualquier herramienta BI (QuickSight, Tableau, Grafana con el plugin de Athena).",
      },
    ],
    techStack: [
      {
        category: "Streaming & Ingesta",
        items: ["Amazon Kinesis Data Streams", "PutRecords API (SDK v3)"],
      },
      {
        category: "Procesamiento",
        items: ["AWS Lambda (Python 3.12)", "pyarrow", "Pydantic", "boto3"],
      },
      {
        category: "Storage & Format",
        items: ["Amazon S3", "Apache Parquet", "Snappy compression"],
      },
      {
        category: "Analytics",
        items: ["AWS Glue Crawler", "AWS Glue Data Catalog", "Amazon Athena"],
      },
      {
        category: "IaC & CI/CD",
        items: ["Terraform", "GitHub Actions", "AWS SAM (alternativa)"],
      },
    ],
    decisions: [
      {
        title: "Kinesis vs SQS para ingesta de eventos",
        chosen: "Kinesis Data Streams",
        why: "Kinesis preserva el orden dentro de cada shard (eventos del mismo usuario van al mismo shard via partition key). Retiene datos 24h (configurable hasta 365 días) — permite replay de eventos. Múltiples consumidores pueden leer el mismo stream independientemente (Enhanced Fan-Out). SQS no garantiza orden en Standard Queues, y un mensaje solo puede ser consumido por un consumidor.",
        alternatives: [
          "SQS — más simple, sin orden garantizado, sin replay, sin múltiples consumidores",
          "Kinesis Data Firehose — más simple que Streams, sin replay, latencia mínima 60s",
          "MSK (Kafka managed) — máxima flexibilidad y ecosistema, mucho más complejo y caro",
        ],
      },
      {
        title: "Parquet vs JSON en S3",
        chosen: "Apache Parquet con compresión Snappy",
        why: "Parquet es columnar: Athena solo lee las columnas que necesita la query (si haces SELECT event_type, COUNT(*), solo lee la columna event_type, no todas). Compresión Snappy: ~10x menos espacio que JSON. Athena cobra por datos escaneados — Parquet reduce el costo dramáticamente. Para 1TB de eventos JSON, en Parquet son ~100GB → queries 10x más baratas.",
        alternatives: [
          "JSON — más simple, legible, mayor costo de almacenamiento y queries en Athena",
          "ORC — similar a Parquet en performance, menos popular en el ecosistema AWS",
          "Avro — mejor para streaming/serialización, no tan eficiente para analytical queries",
        ],
      },
    ],
    snippets: [
      {
        title: "Python — Productor de eventos a Kinesis",
        language: "python",
        code: `import boto3
import json
import uuid
from datetime import datetime, timezone
from typing import Any

kinesis = boto3.client("kinesis", region_name="us-east-1")
STREAM_NAME = "ecommerce-events"


def publish_event(event_type: str, payload: dict[str, Any], user_id: str) -> None:
    """
    Publica un evento al stream de Kinesis.

    Args:
        event_type: Tipo de evento ('page_view', 'add_to_cart', 'purchase')
        payload: Datos del evento
        user_id: ID del usuario (usado como partition key para preservar orden)
    """
    record = {
        "eventId": str(uuid.uuid4()),
        "eventType": event_type,
        "userId": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload,
        "metadata": {
            "source": "backend-api",
            "version": "1.0",
        },
    }

    kinesis.put_record(
        StreamName=STREAM_NAME,
        Data=json.dumps(record),
        PartitionKey=user_id,  # mismo shard para el mismo usuario → orden garantizado
    )


def publish_batch(events: list[dict]) -> dict:
    """Publica hasta 500 eventos en un solo request."""
    records = [
        {
            "Data": json.dumps(event),
            "PartitionKey": event.get("userId", str(uuid.uuid4())),
        }
        for event in events
    ]

    response = kinesis.put_records(StreamName=STREAM_NAME, Records=records)

    failed = response.get("FailedRecordCount", 0)
    if failed > 0:
        print(f"WARNING: {failed} records failed to publish")

    return response`,
      },
      {
        title: "Python — Lambda Consumer: Kinesis → Parquet en S3",
        language: "python",
        code: `import base64
import json
import boto3
import pyarrow as pa
import pyarrow.parquet as pq
import io
from datetime import datetime, timezone

s3 = boto3.client("s3")
OUTPUT_BUCKET = "my-data-lake"


def handler(event: dict, context) -> dict:
    """
    Consume records de Kinesis, transforma a Parquet y escribe en S3.
    BisectOnFunctionError: si falla, Kinesis divide el batch y reintenta.
    """
    records = []
    failed_items = []

    for i, record in enumerate(event["Records"]):
        try:
            # Kinesis codifica el data en base64
            raw = base64.b64decode(record["kinesis"]["data"])
            event_data = json.loads(raw)
            records.append(transform(event_data))
        except Exception as e:
            print(f"Failed to process record {i}: {e}")
            failed_items.append(
                {"itemIdentifier": record["kinesis"]["sequenceNumber"]}
            )

    if records:
        write_parquet_to_s3(records)

    return {"batchItemFailures": failed_items}


def transform(raw: dict) -> dict:
    """Normaliza y enriquece el evento."""
    ts = datetime.fromisoformat(raw["timestamp"])
    return {
        "event_id": raw["eventId"],
        "event_type": raw["eventType"],
        "user_id": raw["userId"],
        "ts": raw["timestamp"],
        "year": ts.year,
        "month": ts.month,
        "day": ts.day,
        "hour": ts.hour,
        # Flatten payload
        **raw.get("payload", {}),
    }


def write_parquet_to_s3(records: list[dict]) -> None:
    now = datetime.now(timezone.utc)
    # Particionado Hive-compatible para partition pruning en Athena
    key = (
        f"events/year={now.year}/month={now.month:02d}/"
        f"day={now.day:02d}/hour={now.hour:02d}/"
        f"part-{now.strftime('%H%M%S%f')}.parquet"
    )

    table = pa.Table.from_pylist(records)
    buffer = io.BytesIO()
    pq.write_table(table, buffer, compression="snappy")
    buffer.seek(0)

    s3.put_object(Bucket=OUTPUT_BUCKET, Key=key, Body=buffer)
    print(f"Wrote {len(records)} records to s3://{OUTPUT_BUCKET}/{key}")`,
      },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
