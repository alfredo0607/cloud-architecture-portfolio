import type { Architecture } from "@/lib/types";

export const architectures: Architecture[] = [
  {
    slug: "01-private-cdn",
    githubUrl: "https://github.com/Alfredo0607/private-cdn-architecture",
    demoUrl: undefined,
    diagramImage: "/architectures/01-private-cdn/architecture.drawio.png",
    number: "01",
    title: "CDN Privada Segura",
    tagline:
      "Entrega global de archivos privados con CloudFront + S3 + Signed URLs y Origin Access Control.",
    status: "building",
    tags: ["CloudFront", "S3", "OAC", "Signed URLs", "IAM", "KMS", "Terraform"],
    problem:
      "Una plataforma SaaS necesita entregar archivos sensibles (PDFs, videos, contratos) a usuarios autenticados de forma global, con baja latencia, sin exponer el bucket S3 directamente a Internet ni permitir el acceso a URLs permanentes que puedan filtrarse.",
    solution:
      "Se implementa CloudFront como CDN con Origin Access Control (OAC) para autenticar solicitudes hacia S3 mediante SigV4. El bucket es completamente privado (BlockPublicAccess). El backend genera Signed URLs con expiración corta (15 min) firmadas con un CloudFront Key Pair almacenado en AWS Secrets Manager. CloudFront valida la firma en el edge antes de hacer el forward al origen.",
    diagram: `
  ┌─────────────┐     HTTPS + Signed URL
  │  Usuario    │──────────────────────────────────────────────────────────┐
  └─────────────┘                                                           │
                                                                            ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                     CloudFront Distribution (Edge Location)                     │
  │                                                                                 │
  │  1. Valida firma Signed URL (HMAC-SHA1 con CloudFront Key Pair)                 │
  │  2. Verifica X-Amz-Expires (TTL)                                                │
  │  3. Cache HIT  → retorna desde edge (~5ms)                                      │
  │  4. Cache MISS → forward a S3 con OAC (SigV4)                                  │
  └────────────────────────────────┬────────────────────────────────────────────────┘
                                   │ OAC: SigV4 (solo desde este distribution)
                                   ▼
  ┌──────────────────────────────────────────────────────┐
  │  S3 Bucket (privado, us-east-1)                      │
  │  ✗ Block Public Access: ON                           │
  │  ✗ Sin ACLs públicas                                 │
  │  ✓ Bucket Policy: permite solo el ARN del distribution│
  │  ✓ SSE-KMS: cifrado en reposo                        │
  └──────────────────────────────────────────────────────┘

  Flujo de generación de Signed URL:
  ┌──────────┐  GET /resource/123   ┌─────────────┐  GetSecret   ┌──────────────────┐
  │ Usuario  │─────────────────────▶│  Backend    │─────────────▶│ Secrets Manager  │
  └──────────┘                      │ (Node.js /  │◀─────────────│ (CloudFront Key) │
                                    │  Lambda)    │  private_key └──────────────────┘
                                    └──────┬──────┘
                                           │ Signed URL (válida 15 min)
                                           ▼
                                    ┌──────────────────────────────────────────────┐
                                    │ https://d1234.cloudfront.net/file.pdf        │
                                    │ ?X-Amz-Algorithm=RSA-SHA1                    │
                                    │ &X-Amz-Credential=KEYID                      │
                                    │ &X-Amz-Expires=900                           │
                                    │ &X-Amz-Signature=abc123...                   │
                                    └──────────────────────────────────────────────┘`,
    steps: [
      {
        n: 1,
        title: "Autenticación del usuario y solicitud de recurso",
        detail:
          "El usuario autenticado solicita un recurso privado al backend. El backend verifica la sesión (JWT/Cookie) y determina que tiene permisos sobre el archivo solicitado.",
      },
      {
        n: 2,
        title: "Generación del Signed URL en el backend",
        detail:
          "El backend obtiene el CloudFront Key Pair desde AWS Secrets Manager. Con el Private Key y el Key Pair ID, firma la URL usando HMAC-SHA1. La URL incluye el dominio CloudFront, el path del objeto, la fecha de expiración (900 segundos), y la firma. Este proceso ocurre en memoria — la clave privada nunca se escribe a disco.",
      },
      {
        n: 3,
        title: "CloudFront valida la Signed URL en el edge",
        detail:
          "Cuando el usuario hace el request con la Signed URL, CloudFront intercepta en el edge location más cercano. Verifica: (a) la firma usando el Public Key del Key Pair configurado, (b) que X-Amz-Expires no haya vencido, (c) que el dominio y path coincidan. Si cualquier verificación falla → 403 Forbidden.",
      },
      {
        n: 4,
        title: "Cache HIT: respuesta desde el edge",
        detail:
          "Si el objeto ya está en el cache del edge (dentro del TTL configurado), CloudFront retorna directamente el contenido sin contactar S3. Latencia: ~5-15ms global. El cache key no incluye los parámetros de firma para evitar fragmentación del cache.",
      },
      {
        n: 5,
        title: "Cache MISS: fetch desde S3 con OAC",
        detail:
          "Si el objeto no está en cache, CloudFront hace un request a S3 firmado con SigV4 usando Origin Access Control. S3 valida que el request proviene del distribution específico (via AWS:SourceArn en la bucket policy). S3 retorna el objeto → CloudFront lo cachea según Cache-Control headers → sirve al usuario.",
      },
      {
        n: 6,
        title: "Expiración de URL y renovación",
        detail:
          "Después de 15 minutos, la Signed URL expira. Si el usuario intenta reusarla, CloudFront retorna 403. El cliente debe solicitar una nueva URL al backend. Esto garantiza que URLs filtradas o compartidas tengan una ventana de exposición mínima.",
      },
    ],
    services: [
      {
        name: "Amazon CloudFront",
        role: "CDN global + validación de Signed URLs",
        detail:
          "Distribution configurado con HTTPS-only, TLSv1.2_2021, HSTS headers. Cache behaviors por path pattern. Key Groups para validar Signed URLs.",
      },
      {
        name: "Amazon S3",
        role: "Almacenamiento privado de objetos",
        detail:
          "Bucket con BlockPublicAccess habilitado en las 4 opciones. Bucket Policy que únicamente permite s3:GetObject al service principal cloudfront.amazonaws.com con condición AWS:SourceArn del distribution. SSE-KMS para cifrado en reposo.",
      },
      {
        name: "CloudFront Origin Access Control (OAC)",
        role: "Autenticación SigV4 de CloudFront hacia S3",
        detail:
          "Reemplaza el OAI legacy. Firma todas las solicitudes de CloudFront a S3 con SigV4, soporta SSE-KMS, compatible con S3 en todas las regiones incluyendo us-east-1.",
      },
      {
        name: "CloudFront Key Pairs",
        role: "Firma de Signed URLs",
        detail:
          "RSA-2048 key pair. La clave privada se almacena en AWS Secrets Manager. La clave pública se sube a CloudFront como Trusted Key Group. El backend extrae la privada en runtime para firmar URLs.",
      },
      {
        name: "AWS Secrets Manager",
        role: "Almacenamiento seguro de la clave privada CloudFront",
        detail:
          "La clave privada RSA se almacena como SecretString. Rotación automática configurable. El backend accede via SDK con un IAM Role con permisos secretsmanager:GetSecretValue limitado a ese secreto específico.",
      },
      {
        name: "AWS KMS",
        role: "Cifrado del bucket S3 (SSE-KMS)",
        detail:
          "Customer Managed Key (CMK) para cifrado at-rest. Permite auditoría de acceso a datos vía CloudTrail + KMS key policy. OAC automáticamente incluye kms:Decrypt en sus permisos.",
      },
    ],
    decisions: [
      {
        title: "OAC vs OAI (Origin Access Identity)",
        chosen: "Origin Access Control (OAC)",
        why: "OAC es el mecanismo recomendado por AWS desde 2022. Soporta SSE-KMS (OAI no puede descifrar objetos KMS nativamente), usa SigV4 más moderno, y es compatible con S3 Multi-Region Access Points. OAI está en modo legacy sin nuevas características.",
        alternatives: [
          "Origin Access Identity (OAI) — descontinuado como opción preferida",
        ],
      },
      {
        title: "Signed URLs vs Signed Cookies",
        chosen: "Signed URLs",
        why: "Signed URLs son ideales para acceso a archivos individuales y escenarios de descarga directa. Cada URL es auto-contenida con su firma, no requiere configuración de cookies en el cliente. Signed Cookies son preferibles para plataformas de video streaming donde se necesita acceso a múltiples objetos con un solo token.",
        alternatives: [
          "Signed Cookies — mejor para streaming de múltiples archivos bajo el mismo path",
        ],
      },
      {
        title: "TTL de la Signed URL",
        chosen: "900 segundos (15 minutos)",
        why: "Balance entre UX (tiempo suficiente para descargar archivos grandes) y seguridad (ventana de exposición mínima si la URL se filtra). Para downloads de archivos muy grandes (>1GB) se puede extender a 1 hora.",
        alternatives: [
          "5 min — muy agresivo, falla en conexiones lentas",
          "1 hora — más UX pero mayor ventana de exposición",
          "24 horas — inaceptable para archivos sensibles",
        ],
      },
    ],
    security: [
      "S3 Block Public Access habilitado en las 4 opciones: BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets.",
      "Bucket Policy con condición AWS:SourceArn: solo el ARN exacto del distribution puede hacer GetObject.",
      "Signed URLs con expiración corta (15 min): ventana de exposición mínima ante filtración.",
      "CloudFront con HTTPS-only (redirect HTTP → HTTPS) y TLS 1.2 mínimo.",
      "HSTS (Strict-Transport-Security) headers en las respuestas CloudFront.",
      "KMS CMK con key policy que audita todos los accesos vía CloudTrail.",
      "Clave privada RSA solo en Secrets Manager, nunca en variables de entorno ni código.",
      "CloudTrail logging para todas las operaciones S3 y KMS.",
    ],
    scalability: [
      "CloudFront escala automáticamente a cualquier nivel de tráfico — no hay límites de instancias ni capacidad que gestionar.",
      "Objetivo de Cache Hit Rate >80%: reduce carga en S3 y latencia para usuarios recurrentes.",
      "Cache TTL configurable por tipo de objeto (ej: thumbnails 7 días, PDFs 1 hora).",
      "S3 soporta hasta 5500 GET requests/segundo por prefijo — particionado de prefijos si se supera.",
      "Signed URL generation es O(1) — operación criptográfica local, no requiere llamadas adicionales a AWS después de obtener la clave.",
      "Multi-origin posible: CloudFront puede servir desde múltiples S3 en distintas regiones para DR.",
    ],
    cost: [
      {
        item: "CloudFront — Data Transfer Out",
        estimate: "$0.0085/GB",
        note: "Primeros 1TB/mes gratis (Free Tier)",
      },
      {
        item: "CloudFront — HTTPS Requests",
        estimate: "$0.0100/10,000 requests",
        note: "10M requests/mes ≈ $10",
      },
      {
        item: "S3 — Almacenamiento",
        estimate: "$0.023/GB/mes",
        note: "100GB ≈ $2.30/mes",
      },
      {
        item: "S3 — GET Requests (desde CloudFront)",
        estimate: "$0.0004/1,000 requests",
        note: "Solo Cache MISS llega a S3",
      },
      {
        item: "KMS — API Calls",
        estimate: "$0.03/10,000 requests",
        note: "Solo operaciones de cifrado/descifrado",
      },
      {
        item: "Secrets Manager",
        estimate: "$0.40/secreto/mes + $0.05/10,000 API calls",
        note: "1 secreto ≈ $0.40/mes base",
      },
    ],
    snippets: [
      {
        title: "Terraform — main.tf completo",
        language: "hcl",
        code: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.45.0"
    }
  }

  required_version = ">= 1.4.0"
}

provider "aws" {
  region  = "us-east-1"
  profile = "leader-developer-personal"
}

#################################################
# VARIABLE
#################################################

variable "env" {
  type = string
}

#################################################
# DATA SOURCES
#################################################

data "aws_caller_identity" "current" {}

#################################################
# KMS KEY
#################################################

resource "aws_kms_key" "s3" {
  description         = "KMS key for S3 encryption"
  enable_key_rotation = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::\${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudFrontViaS3"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-private-assets-\${var.env}"
  target_key_id = aws_kms_key.s3.key_id
}

#################################################
# S3 BUCKET
#################################################

resource "aws_s3_bucket" "assets" {
  bucket = "my-private-assets-\${var.env}-2026-demo"
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

#################################################
# CLOUDFRONT PUBLIC KEY & KEY GROUP
#################################################

resource "aws_cloudfront_public_key" "main" {
  name        = "cdn-public-key"
  comment     = "Public key for signed URLs"
  encoded_key = file("\${path.module}/public_key.pem")
}

resource "aws_cloudfront_key_group" "signed_urls" {
  name  = "signed-url-key-group"
  items = [aws_cloudfront_public_key.main.id]
}

#################################################
# ORIGIN ACCESS CONTROL
#################################################

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "s3-oac"
  description                       = "OAC for private S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

#################################################
# CLOUDFRONT DISTRIBUTION
#################################################

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id                = "s3-private-assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-private-assets"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    trusted_key_groups = [aws_cloudfront_key_group.signed_urls.id]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 604800
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

#################################################
# BUCKET POLICY
#################################################

resource "aws_s3_bucket_policy" "assets" {
  depends_on = [
    aws_s3_bucket_public_access_block.assets
  ]

  bucket = aws_s3_bucket.assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = ["s3:GetObject"]
        Resource = ["\${aws_s3_bucket.assets.arn}/*"]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}`,
      },
      {
        title: "NodeJS — Generación de Signed URL",
        language: "nodejs",
        code: `import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import fs from 'fs';
import { CLOUDFRONT_KEYPAIR_ID, CLOUDFRONT_PRIVATE_KEY } from '../../../config.js';

async function firmarUrl(url, expiresInSeconds = 86400) {
  console.info(CLOUDFRONT_PRIVATE_KEY);

  const signedUrl = await getSignedUrl({
    url,
    dateLessThan: new Date(Date.now() + expiresInSeconds * 1000),
    privateKey: fs.readFileSync(CLOUDFRONT_PRIVATE_KEY),
    keyPairId: CLOUDFRONT_KEYPAIR_ID,
  });

  return signedUrl;
}

export default firmarUrl;
`,
      },
    ],
  },

  {
    slug: "02-scalable-backend",
    githubUrl: "https://github.com/Alfredo0607/scalable-backend-ecs",
    demoUrl: undefined,
    number: "02",
    title: "Backend Escalable con Contenedores",
    tagline:
      "API containerizada con ECS Fargate + ALB + Auto Scaling que responde a picos de tráfico sin intervención manual.",
    status: "building",
    tags: [
      "ECS Fargate",
      "ALB",
      "Auto Scaling",
      "RDS",
      "ECR",
      "CloudWatch",
      "Docker",
      "Terraform",
    ],
    problem:
      "Una API REST necesita manejar tráfico variable con picos impredecibles (ej: campañas de marketing, eventos). La solución debe escalar automáticamente en segundos, tener zero-downtime deploys, y los desarrolladores no deben gestionar servidores ni parches de SO.",
    solution:
      "Se containeriza la aplicación con Docker (imagen mínima node:20-alpine, multi-stage build). ECS Fargate ejecuta las tareas sin provisionar instancias EC2. Un Application Load Balancer distribuye el tráfico con health checks activos. Target Tracking Scaling en ECS ajusta el número de tareas basándose en CPU utilization (target: 60%). Rolling deployments garantizan zero-downtime. RDS PostgreSQL en subnet privada con Secrets Manager para credenciales.",
    diagram: `
  Internet
     │ HTTPS :443
     ▼
  ┌──────────────────────────────────┐
  │  Route 53 (DNS + Health Check)   │
  └──────────────────┬───────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────────┐
  │    Application Load Balancer (HTTPS)             │
  │    Listener: 443 → Target Group (port 3000)      │
  │    Health Check: GET /health (200 OK, 5s timeout) │
  └───────────────────┬──────────────────────────────┘
                      │ (distribución round-robin)
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │ ECS Task 1  │ │ ECS Task 2  │ │ ECS Task N  │
  │ Fargate     │ │ Fargate     │ │ Fargate     │
  │ 0.5 vCPU   │ │ 0.5 vCPU   │ │ 0.5 vCPU   │
  │ 1GB RAM     │ │ 1GB RAM     │ │ 1GB RAM     │
  │ node:20     │ │ node:20     │ │ node:20     │
  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
         └───────────────┼───────────────┘
                         │ (private subnets)
                         ▼
  ┌───────────────────────────────────────────────┐
  │  RDS PostgreSQL (db.t3.medium)                │
  │  Multi-AZ: standby en AZ diferente            │
  │  Subnet Group: privado (sin endpoint público) │
  │  Encryption: KMS CMK                         │
  └───────────────────────────────────────────────┘

  Auto Scaling:
  CloudWatch Alarm (CPU > 60%) → Application Auto Scaling
    → ECS Service: desiredCount + 1 (scale-out, cooldown 60s)
  CloudWatch Alarm (CPU < 30%) → Application Auto Scaling
    → ECS Service: desiredCount - 1 (scale-in, cooldown 300s)

  CI/CD:
  GitHub Push → GitHub Actions → Docker Build → ECR Push
    → ECS Rolling Update (min 50% healthy, max 200% durante deploy)
    → Circuit Breaker: rollback automático si tasks fallan`,
    steps: [
      {
        n: 1,
        title: "Build y push de imagen Docker a ECR",
        detail:
          "GitHub Actions construye la imagen Docker con multi-stage build (builder → runner). La imagen final usa node:20-alpine (~150MB vs ~900MB de node:20). Se tagea con el SHA del commit para trazabilidad. Se pushea a ECR con docker/login-action usando OIDC (sin access keys hardcodeadas). ECR escanea la imagen con Amazon Inspector automáticamente.",
      },
      {
        n: 2,
        title: "ECS Rolling Deployment",
        detail:
          "ECS Service inicia nuevas tasks con la imagen actualizada. Deployment configuration: minimumHealthyPercent=50, maximumPercent=200. El ALB espera que las nuevas tasks pasen el health check (GET /health, 3 respuestas 200 OK consecutivas) antes de draining las antiguas. Circuit Breaker habilitado: si las nuevas tasks fallan dentro de una ventana de tiempo, ECS hace rollback automático a la versión anterior.",
      },
      {
        n: 3,
        title: "Request routing por el ALB",
        detail:
          "El ALB recibe el request HTTPS (certificado ACM). Termina TLS en el balanceador (TLS offloading). Distribuye vía round-robin entre las tasks registradas en el Target Group. Envía headers X-Forwarded-For y X-Forwarded-Proto para que la aplicación conozca la IP real del cliente.",
      },
      {
        n: 4,
        title: "Procesamiento en ECS Task (Fargate)",
        detail:
          "La task corre en una subnet privada (sin IP pública directa). El IAM Task Role le da permisos mínimos: GetSecretValue para credenciales DB, PutMetricData para métricas custom. Las credenciales DB se inyectan como environment variables desde Secrets Manager en el startup del container. El container logs a CloudWatch Logs via awslogs driver.",
      },
      {
        n: 5,
        title: "Auto Scaling basado en CPU",
        detail:
          "CloudWatch monitorea ECSServiceAverageCPUUtilization. Target Tracking Policy mantiene el target en 60%. Scale-out (agregar task): cuando CPU >60% por 1 minuto, cooldown 60s. Scale-in (remover task): cuando CPU <30% por 5 minutos, cooldown 300s (más conservador para evitar thrashing). Min: 1 task, Max: 10 tasks.",
      },
      {
        n: 6,
        title: "Conexión a RDS PostgreSQL",
        detail:
          "RDS en subnet privada, Security Group solo permite inbound 5432 desde el Security Group de las ECS tasks. La aplicación usa connection pooling (pg-pool, max 10 connections por task). Para 10 tasks → 100 conexiones máximas al RDS. Si se superan, se puede agregar RDS Proxy para pooling a nivel infraestructura.",
      },
    ],
    services: [
      {
        name: "ECS Fargate",
        role: "Orquestación serverless de containers",
        detail:
          "Task: 0.5 vCPU, 1GB RAM. awsvpc networking mode (ENI por task). IAM Task Role con permisos mínimos.",
      },
      {
        name: "Application Load Balancer",
        role: "Distribución de tráfico L7",
        detail:
          "Listener HTTPS:443 con certificado ACM. Health Check: GET /health cada 30s. Deregistration delay: 30s.",
      },
      {
        name: "Amazon ECR",
        role: "Registro privado de imágenes Docker",
        detail:
          "Lifecycle policy: retener últimas 10 imágenes tagged, eliminar untagged >7 días. Image scanning on push.",
      },
      {
        name: "Application Auto Scaling",
        role: "Escala las ECS tasks automáticamente",
        detail:
          "Target Tracking: CPU 60%. Scale-out cooldown 60s, scale-in 300s. Min 1 task, Max 10 tasks.",
      },
      {
        name: "RDS PostgreSQL",
        role: "Base de datos relacional administrada",
        detail:
          "db.t3.medium, Multi-AZ para HA. Automated backups 7 días. KMS encryption. Sin endpoint público.",
      },
      {
        name: "AWS Secrets Manager",
        role: "Credenciales de base de datos",
        detail:
          "DATABASE_URL se inyecta en el container via secretsFrom en el Task Definition. Rotación automática con Lambda.",
      },
      {
        name: "CloudWatch Logs + Metrics",
        role: "Observabilidad centralizada",
        detail:
          "Log group /ecs/portfolio-api, retención 30 días. Métricas custom: requests/s, latencia p95/p99, errores.",
      },
    ],
    decisions: [
      {
        title: "ECS Fargate vs ECS con EC2 vs EC2 directo",
        chosen: "ECS Fargate",
        why: "Fargate elimina la gestión de instancias EC2 (parches, capacity planning, AMIs). El overhead de costo (~30% más caro por unidad de cómputo) se justifica por el ahorro operativo. Para cargas sostenidas >80% utilización durante 24/7, EC2 Reserved Instances serían más rentables.",
        alternatives: [
          "ECS EC2 — más barato a alta utilización sostenida, pero requiere gestionar instancias",
          "EC2 directo + systemd — máximo control, máximo overhead operativo",
          "AWS App Runner — más simple pero menos control sobre networking y scaling",
        ],
      },
      {
        title: "RDS PostgreSQL vs Aurora Serverless",
        chosen: "RDS PostgreSQL (provisioned)",
        why: "Aurora Serverless v2 tiene cold start de ~5s que impacta las primeras requests después de un período de inactividad. Para una API que necesita respuesta consistente, RDS provisioned con Multi-AZ da latencia predecible. Aurora se recomendaría para cargas con patrones muy variables (ej: uso solo en horario laboral).",
        alternatives: [
          "Aurora PostgreSQL Provisioned — más performance, más costo",
          "Aurora Serverless v2 — escala a 0 en inactividad, tiene cold starts",
          "DynamoDB — si el modelo de datos lo permite, mejor escalabilidad",
        ],
      },
      {
        title: "Rolling Deployment vs Blue/Green",
        chosen: "Rolling Deployment con Circuit Breaker",
        why: "Rolling deployment es suficiente para la mayoría de casos y no requiere infraestructura duplicada. El Circuit Breaker de ECS hace rollback automático si las nuevas tasks fallan. Blue/Green (vía CodeDeploy) añade complejidad y costo, pero es obligatorio cuando se necesita rollback instantáneo sin downtime en caso de bugs en producción.",
        alternatives: [
          "Blue/Green (CodeDeploy) — rollback instantáneo, requiere infraestructura duplicada",
          "Canary — gradual, detecta issues antes del full rollout",
        ],
      },
    ],
    security: [
      "ECS Tasks en subnets privadas: sin IP pública, solo accesibles via ALB en subnet pública.",
      "Security Groups con least privilege: ALB SG permite 443 desde Internet; ECS SG solo permite 3000 desde ALB SG; RDS SG solo permite 5432 desde ECS SG.",
      "IAM Task Role con permisos mínimos: solo secretsmanager:GetSecretValue y cloudwatch:PutMetricData.",
      "Credenciales DB via Secrets Manager secretsFrom, nunca como variables de entorno en texto plano.",
      "RDS sin endpoint público: solo accesible desde la VPC.",
      "ECR image scanning on push con Amazon Inspector. Vulnerabilidades críticas bloquean el deploy en GitHub Actions.",
      "TLS offloading en ALB con certificado ACM (gratuito, auto-renovable). HSTS headers.",
      "VPC Flow Logs habilitados para auditoría de tráfico de red.",
    ],
    scalability: [
      "Target Tracking Scaling: ajuste automático en ~60-90 segundos ante cambios de carga.",
      "Rolling deploys: sin downtime durante actualizaciones, sin reducción de capacidad.",
      "ALB soporta hasta 100,000 requests/segundo sin configuración adicional.",
      "Connection pooling en la app (max 10 conn/task): para 10 tasks → 100 conexiones a RDS.",
      "RDS Proxy como siguiente paso si se supera el límite de conexiones de RDS.",
      "Multi-AZ en RDS: failover automático <60 segundos si la instancia principal falla.",
      "Horizontal scaling limitado por RDS. Para escala masiva: read replicas o migrar a Aurora.",
    ],
    cost: [
      {
        item: "ECS Fargate (0.5 vCPU, 1GB)",
        estimate: "$0.02024/hora/task",
        note: "2 tasks promedio ≈ $29/mes",
      },
      {
        item: "ALB",
        estimate: "$0.008/hora + $0.008/LCU-hora",
        note: "~$6/mes base + uso",
      },
      {
        item: "RDS db.t3.medium (Single-AZ)",
        estimate: "$0.068/hora",
        note: "$49/mes. Multi-AZ dobla el costo",
      },
      {
        item: "ECR Storage",
        estimate: "$0.10/GB/mes",
        note: "~$0.50/mes para imágenes típicas",
      },
      {
        item: "CloudWatch Logs",
        estimate: "$0.50/GB ingested",
        note: "Configurar retención para controlar costos",
      },
      {
        item: "Secrets Manager",
        estimate: "$0.40/secreto/mes",
        note: "1-2 secretos ≈ $1/mes",
      },
    ],
    snippets: [
      {
        title: "Dockerfile — Multi-stage build Node.js",
        language: "dockerfile",
        code: `# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runner (imagen mínima)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Solo las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar el build
COPY --from=builder /app/dist ./dist

# Non-root user por seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]`,
      },
      {
        title: "Terraform — ECS Task Definition + Service",
        language: "hcl",
        code: `resource "aws_ecs_task_definition" "api" {
  family                   = "portfolio-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"    # 0.5 vCPU
  memory                   = "1024"   # 1 GB
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "\${aws_ecr_repository.api.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    secrets = [{
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.db_url.arn
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/portfolio-api"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 10
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "portfolio-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }
}`,
      },
      {
        title: "Terraform — Target Tracking Auto Scaling",
        language: "hcl",
        code: `resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/\${aws_ecs_cluster.main.name}/\${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_tracking" {
  name               = "cpu-target-tracking"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60.0  # Mantener CPU en 60%
    scale_in_cooldown  = 300   # 5 min antes de scale-in (conservador)
    scale_out_cooldown = 60    # 1 min para escalar rápido ante picos
  }
}`,
      },
    ],
  },

  {
    slug: "03-event-driven-serverless",
    githubUrl: "https://github.com/Alfredo0607/event-driven-serverless",
    demoUrl: undefined,
    number: "03",
    title: "Arquitectura Event-Driven Serverless",
    tagline:
      "Pipeline de procesamiento de imágenes desacoplado con S3 + SQS + Lambda + DynamoDB con resiliencia end-to-end.",
    status: "building",
    tags: [
      "Lambda",
      "SQS",
      "SNS",
      "S3",
      "DynamoDB",
      "Python",
      "Terraform",
      "Serverless",
    ],
    problem:
      "Una plataforma necesita procesar imágenes subidas por usuarios (resize a múltiples resoluciones, extracción de metadata, generación de thumbnails) sin bloquear el request del cliente. El procesamiento puede tardar segundos y el sistema debe ser resiliente a fallos del procesador sin perder trabajos. El volumen es variable: de 10 a 10,000 uploads/hora.",
    solution:
      "Arquitectura event-driven completamente serverless: S3 emite eventos en cada upload, que van a SQS (buffer + retry automático + DLQ). Lambda se dispara via Event Source Mapping, procesa la imagen (Python + Pillow), guarda resultados en S3 output y metadata en DynamoDB, notifica via SNS. SQS actúa como buffer desacoplando el rate de uploads del rate de procesamiento. DLQ captura trabajos que fallaron 3 veces.",
    diagram: `
  ┌──────────────┐
  │  Usuario     │──── PUT /upload ────▶ API Gateway ──▶ S3 Bucket (input)
  └──────────────┘                                              │
                                                               │ S3 Event Notification
                                                               │ (s3:ObjectCreated:*)
                                                               ▼
                                              ┌──────────────────────────────────┐
                                              │  SQS Queue (Standard)            │
                                              │  VisibilityTimeout: 360s         │
                                              │  MessageRetentionPeriod: 86400s  │
                                              │  MaxReceiveCount: 3              │
                                              └─────────────────┬────────────────┘
                                                                │ Event Source Mapping
                                                                │ (BatchSize: 10)
                                                                ▼
                                              ┌──────────────────────────────────┐
                                              │  Lambda Function (Python 3.12)   │
                                              │  Memory: 512MB                   │
                                              │  Timeout: 60s                    │
                                              │  ReservedConcurrency: 50         │
                                              └─────┬──────────────────┬─────────┘
                                                    │                  │
                              ┌─────────────────────┤                  ├────────────────────┐
                              ▼                     ▼                  ▼                    ▼
                    S3 (output)            DynamoDB Table           SNS Topic          CloudWatch
                    resized images         metadata + status        notificaciones      Logs + Metrics
                    800x600, 400x300       imageId (PK)             Email / Webhook     Errores + Duración
                    150x150 (thumbnail)    status, sizes, ts

  Flujo de error:
  Lambda FALLA (3 veces) ──▶ SQS DLQ ──▶ CloudWatch Alarm ──▶ SNS Alert (email operaciones)`,
    steps: [
      {
        n: 1,
        title: "Upload de imagen y disparo del evento S3",
        detail:
          "El usuario sube una imagen via API Gateway + S3 Presigned PUT URL (recomendado) o directamente. S3 emite un evento s3:ObjectCreated:* en cuanto el objeto está disponible. S3 Event Notifications tienen entrega at-least-once — es posible (aunque raro) recibir el mismo evento dos veces, por eso se implementa idempotencia en Lambda.",
      },
      {
        n: 2,
        title: "SQS como buffer y garantía de entrega",
        detail:
          "S3 envía el evento a SQS. El VisibilityTimeout (360s = 6x el timeout de Lambda) es crítico: mientras Lambda procesa el mensaje, SQS lo oculta. Si Lambda termina exitosamente, elimina el mensaje. Si Lambda falla o se timeout, después de 360s SQS hace el mensaje visible nuevamente para reintento. MaxReceiveCount=3: después de 3 fallos, el mensaje va a la DLQ.",
      },
      {
        n: 3,
        title: "Lambda Event Source Mapping y batching",
        detail:
          "Lambda consume mensajes de SQS en batches de hasta 10. Con ReportBatchItemFailures, Lambda puede indicar cuáles mensajes del batch fallaron (partial batch response) en lugar de fallar el batch completo. ReservedConcurrency=50 previene que un pico de uploads consuma todo el límite de concurrencia regional de Lambda (1000 por defecto).",
      },
      {
        n: 4,
        title: "Procesamiento de imagen en Lambda (Python + Pillow)",
        detail:
          "Lambda descarga la imagen de S3 en memoria. Pillow genera 3 versiones: 800x600 (full), 400x300 (medium), 150x150 (thumbnail). Cada versión se sube a S3 output con un prefix organizado: resized/800x600/uuid.jpg. El procesamiento ocurre en memoria (no hay disco en Fargate/Lambda que sea necesario). Para imágenes >10MB se puede usar /tmp (512MB disponibles en Lambda).",
      },
      {
        n: 5,
        title: "Persistencia de metadata en DynamoDB",
        detail:
          "Lambda hace PutItem en DynamoDB con: imageId (partition key = S3 object key), status ('processed' o 'failed'), sizes (lista de S3 paths de las versiones generadas), processedAt (timestamp ISO), fileSize, mimeType, dimensions originales. La tabla tiene TTL habilitado: los items expiran después de 90 días automáticamente.",
      },
      {
        n: 6,
        title: "Notificación via SNS y manejo de DLQ",
        detail:
          "Lambda publica en SNS con el resultado del procesamiento. SNS puede fanout a múltiples suscriptores: Lambda para notificar al usuario vía WebSocket, email, webhook de terceros. Si Lambda falla 3 veces (SQS MaxReceiveCount), el mensaje va a la DLQ. Una CloudWatch Alarm monitorea ApproximateNumberOfMessagesVisible en la DLQ — si >0, notifica al equipo de operaciones.",
      },
    ],
    services: [
      {
        name: "Amazon S3 (input + output)",
        role: "Almacenamiento de imágenes originales y procesadas",
        detail:
          "Bucket input: trigger de eventos. Bucket output: imágenes procesadas por tamaño. Lifecycle: mover a S3-IA después de 30 días, Glacier después de 90 días.",
      },
      {
        name: "Amazon SQS (Standard Queue)",
        role: "Buffer desacoplado con garantía de entrega y retry",
        detail:
          "VisibilityTimeout=360s (6x Lambda timeout). MaxReceiveCount=3. MessageRetentionPeriod=86400s. Dead-Letter Queue separada.",
      },
      {
        name: "AWS Lambda (Python 3.12)",
        role: "Procesamiento serverless de imágenes",
        detail:
          "512MB memoria, 60s timeout. Pillow para procesamiento de imágenes. ReservedConcurrency=50. Lambda Layer para Pillow.",
      },
      {
        name: "Amazon DynamoDB (On-Demand)",
        role: "Metadata y estado del procesamiento",
        detail:
          "Partition key: imageId. On-Demand billing: paga por request, no por capacidad. TTL en atributo expiresAt (90 días). GSI en status para consultar por estado.",
      },
      {
        name: "Amazon SNS",
        role: "Notificaciones fanout",
        detail:
          "Topic con suscriptores: Lambda (WebSocket), Email (SES), SQS (audit log). Filter policies para routing selectivo.",
      },
      {
        name: "SQS Dead-Letter Queue",
        role: "Captura mensajes que fallaron tras 3 reintentos",
        detail:
          "Separada de la queue principal. CloudWatch Alarm en ApproximateNumberOfMessagesVisible > 0. Análisis manual de mensajes fallidos.",
      },
    ],
    decisions: [
      {
        title: "S3 → SQS → Lambda vs S3 → Lambda directo",
        chosen: "S3 → SQS → Lambda",
        why: "SQS actúa como buffer resiliente. Sin SQS, si Lambda falla (error, timeout, concurrencia agotada), el evento S3 se pierde. Con SQS: retry automático con backoff, DLQ para mensajes problemáticos, control de concurrencia via SQS batch size y Lambda reserved concurrency, y visibilidad de mensajes pendientes en las métricas de SQS.",
        alternatives: [
          "S3 → Lambda directo — más simple, pero sin retry automático ni DLQ",
          "S3 → EventBridge → Lambda — mejor para enrutamiento complejo con múltiples destinos",
          "S3 → Kinesis → Lambda — para streaming de alta velocidad (>1000 eventos/s)",
        ],
      },
      {
        title: "DynamoDB On-Demand vs Provisioned",
        chosen: "DynamoDB On-Demand",
        why: "El patrón de acceso es completamente impredecible (depende del rate de uploads). On-Demand escala automáticamente a cualquier carga sin capacity planning. El costo por request ($1.25/M writes, $0.25/M reads) es más alto que Provisioned para cargas sostenidas, pero elimina la complejidad de gestión de WCU/RCU.",
        alternatives: [
          "DynamoDB Provisioned + Auto Scaling — mejor para cargas predecibles, más barato",
          "RDS PostgreSQL — si se necesitan joins o transacciones complejas entre entidades",
        ],
      },
      {
        title: "Lambda Layer vs Container Image para Pillow",
        chosen: "Lambda Layer",
        why: "Pillow compilado para Amazon Linux 2023 se empaqueta como Lambda Layer (~8MB). Las Lambda Layers permiten compartir dependencias entre funciones y reducen el tamaño del deployment package. Container Images (~200MB) son preferibles para dependencias muy grandes o cuando se necesita control total del SO.",
        alternatives: [
          "Container Image — más control, cold start similar, imagen más grande",
          "Pre-instalar en el deployment package — acoplamiento, más lento de subir",
        ],
      },
    ],
    security: [
      "Lambda Execution Role con least privilege: solo s3:GetObject en bucket input, s3:PutObject en bucket output, dynamodb:PutItem en la tabla específica, sns:Publish en el topic específico.",
      "SQS con SSE-SQS (Server-Side Encryption) habilitado.",
      "DynamoDB con encryption at rest usando AWS managed key.",
      "S3 buckets con BlockPublicAccess completo. Output bucket con bucket policy que solo permite Lambda.",
      "VPC Endpoints para S3 y DynamoDB (opcional): tráfico nunca sale a Internet.",
      "Lambda function URL o API Gateway con autorización para el endpoint de upload.",
      "CloudTrail logging para todas las operaciones de S3, DynamoDB y Lambda invocations.",
    ],
    scalability: [
      "Lambda escala automáticamente hasta 1000 ejecuciones concurrentes por región (límite ajustable).",
      "ReservedConcurrency=50 en esta función previene consumir el burst limit regional completo.",
      "SQS desacopla completamente el rate de uploads del rate de procesamiento — puede acumular millones de mensajes.",
      "DynamoDB On-Demand: sin límite práctico de throughput en condiciones normales.",
      "S3 soporta miles de operaciones por segundo por prefijo.",
      "Para procesar imágenes de >50MB: usar S3 Multipart Upload y Lambda con /tmp (512MB).",
      "Si el procesamiento requiere GPU (ML/AI): cambiar Lambda por ECS Fargate con GPU.",
    ],
    cost: [
      {
        item: "Lambda (512MB, 60s promedio)",
        estimate: "$0.0000083334/GB-segundo",
        note: "10,000 imágenes/mes ≈ $0.25/mes",
      },
      {
        item: "SQS Standard Queue",
        estimate: "$0.40/millón de requests",
        note: "1M requests/mes gratis (Free Tier)",
      },
      {
        item: "DynamoDB On-Demand",
        estimate: "$1.25/M writes · $0.25/M reads",
        note: "10,000 imágenes ≈ $0.01/mes",
      },
      {
        item: "S3 Storage + Requests",
        estimate: "$0.023/GB + $0.005/1000 PUTs",
        note: "100GB output ≈ $2.30/mes",
      },
      {
        item: "SNS",
        estimate: "$0.50/M notificaciones",
        note: "1M notificaciones/mes gratis",
      },
      {
        item: "Total estimado (10K imágenes/mes)",
        estimate: "~$5–$10/mes",
        note: "Casi todo el costo es S3 storage",
      },
    ],
    snippets: [
      {
        title: "Python — Lambda Handler completo",
        language: "python",
        code: `import json
import boto3
import os
import io
from datetime import datetime, timezone
from PIL import Image

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
sns = boto3.client("sns")

OUTPUT_BUCKET = os.environ["OUTPUT_BUCKET"]
TABLE_NAME = os.environ["DYNAMODB_TABLE"]
SNS_TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]

SIZES = [
    ("800x600", 800, 600),
    ("400x300", 400, 300),
    ("150x150", 150, 150),
]


def handler(event, context):
    """
    Event Source Mapping desde SQS.
    Cada record del batch es un mensaje SQS que contiene un S3 event.
    Retorna batch item failures para partial batch response.
    """
    failures = []

    for record in event["Records"]:
        try:
            process_record(record)
        except Exception as exc:
            print(f"ERROR processing {record['messageId']}: {exc}")
            failures.append({"itemIdentifier": record["messageId"]})

    # Partial batch response: solo reintenta los mensajes que fallaron
    return {"batchItemFailures": failures}


def process_record(record: dict) -> None:
    body = json.loads(record["body"])
    s3_event = body["Records"][0]["s3"]
    bucket = s3_event["bucket"]["name"]
    key = s3_event["object"]["key"]

    # Descarga la imagen original desde S3
    response = s3.get_object(Bucket=bucket, Key=key)
    image_bytes = response["Body"].read()
    image = Image.open(io.BytesIO(image_bytes))

    original_size = image.size
    original_format = image.format or "JPEG"
    output_keys = []

    # Genera cada variante de tamaño
    for label, width, height in SIZES:
        resized = image.copy()
        resized.thumbnail((width, height), Image.LANCZOS)

        buffer = io.BytesIO()
        resized.save(buffer, format=original_format, quality=85, optimize=True)
        buffer.seek(0)

        output_key = f"resized/{label}/{key}"
        s3.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=output_key,
            Body=buffer,
            ContentType=f"image/{original_format.lower()}",
        )
        output_keys.append(output_key)

    # Persiste metadata en DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    table.put_item(
        Item={
            "imageId": key,
            "status": "processed",
            "originalBucket": bucket,
            "outputKeys": output_keys,
            "originalDimensions": list(original_size),
            "format": original_format,
            "processedAt": datetime.now(timezone.utc).isoformat(),
            "requestId": context.aws_request_id,
        }
    )

    # Notifica via SNS
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Message=json.dumps({"imageId": key, "status": "processed", "sizes": output_keys}),
        Subject="Image processing complete",
    )`,
      },
      {
        title: "Terraform — SQS + DLQ + Lambda Event Source Mapping",
        language: "hcl",
        code: `resource "aws_sqs_queue" "dlq" {
  name                      = "image-processing-dlq"
  message_retention_seconds = 1209600  # 14 días
}

resource "aws_sqs_queue" "image_processing" {
  name                       = "image-processing-queue"
  visibility_timeout_seconds = 360   # 6x el timeout de Lambda (60s)
  message_retention_seconds  = 86400 # 24 horas

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

# S3 envía eventos a SQS
resource "aws_s3_bucket_notification" "uploads" {
  bucket = aws_s3_bucket.input.id

  queue {
    queue_arn     = aws_sqs_queue.image_processing.arn
    events        = ["s3:ObjectCreated:*"]
    filter_suffix = ".jpg"  # solo imágenes JPEG
  }
}

# Lambda consume SQS
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn                   = aws_sqs_queue.image_processing.arn
  function_name                      = aws_lambda_function.image_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  function_response_types            = ["ReportBatchItemFailures"]
}

# Alarma si hay mensajes en DLQ
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "image-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
}`,
      },
    ],
  },
];

export function getArchitecture(slug: string): Architecture | undefined {
  return architectures.find((a) => a.slug === slug);
}
