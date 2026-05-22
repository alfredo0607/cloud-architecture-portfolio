import type { Architecture } from "@/lib/types";

export const architectures: Architecture[] = [
  {
    slug: "01-private-cdn",
    githubUrl: "https://github.com/alfredo0607/aws-secure-content-distribution",
    demoUrl: "https://images-url-signature.alfredo-dominguez.dev/",
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
    githubUrl:
      "https://github.com/alfredo0607/cloud-architecture-portfolio/tree/main/architectures/02-scalable-backend",
    demoUrl: undefined,
    diagramImage:
      "/architectures/02-scalable-backend/architecture-scalable-backend.drawio.png",
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
        code: `# ── Stage 1: instalar dependencias de producción ──────────────────────────
FROM node:22-slim AS deps

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# sharp descarga binarios precompilados para linux/x64 automáticamente
RUN pnpm install --frozen-lockfile --prod

# ── Stage 2: imagen final mínima ──────────────────────────────────────────
FROM node:22-slim

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY src/            ./src/
COPY config.js       ./
COPY package.json    ./

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/server.js"]
`,
      },
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
# VARIABLES
#################################################

variable "env" {
  type = string
}

variable "app_image" {
  type        = string
  description = "URI de imagen ECR: 123456789.dkr.ecr.us-east-1.amazonaws.com/backend-dev:latest"
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "cors_origin" {
  type        = string
  description = "URL del frontend permitido en CORS (ej: https://tuapp.com)"
}

variable "aws_bucket_name" {
  type        = string
  description = "Nombre del bucket S3 de la Arquitectura 01 (CDN)"
}

variable "cloudfront_domain" {
  type        = string
  description = "Dominio CloudFront de la Arquitectura 01 (ej: https://xxxx.cloudfront.net)"
}

variable "cloudfront_keypair_id" {
  type        = string
  description = "ID del key pair de CloudFront (APKA...)"
}

variable "cloudfront_private_key" {
  type        = string
  sensitive   = true
  description = "Contenido PEM de la private key de CloudFront"
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_refresh_secret" {
  type      = string
  sensitive = true
}

variable "cpu_scaling_target" {
  type    = number
  default = 60
}

#################################################
# DATA SOURCES
#################################################

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_s3_bucket" "assets" {
  bucket = var.aws_bucket_name
}

#################################################
# VPC
#################################################

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "vpc-backend-\${var.env}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "igw-backend-\${var.env}" }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "subnet-public-\${count.index + 1}-\${var.env}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 3}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "subnet-private-\${count.index + 1}-\${var.env}" }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = { Name = "eip-nat-\${var.env}" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [aws_internet_gateway.main]

  tags = { Name = "nat-backend-\${var.env}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "rt-public-\${var.env}" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "rt-private-\${var.env}" }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

#################################################
# SECURITY GROUPS
#################################################

resource "aws_security_group" "alb" {
  name        = "alb-sg-\${var.env}"
  description = "ALB: HTTP desde internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "alb-sg-\${var.env}" }
}

resource "aws_security_group" "ecs" {
  name        = "ecs-sg-\${var.env}"
  description = "ECS tasks: traffic only from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ecs-sg-\${var.env}" }
}

#################################################
# ECR
#################################################

resource "aws_ecr_repository" "backend" {
  name                 = "backend-\${var.env}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Mantener últimas 10 imágenes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

#################################################
# SECRETS MANAGER
#################################################

resource "aws_secretsmanager_secret" "app" {
  name                    = "backend-secrets-\${var.env}"
  description             = "JWT secrets y CloudFront private key del backend"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    JWT_SECRET             = var.jwt_secret
    JWT_REFRESH_SECRET     = var.jwt_refresh_secret
    CLOUDFRONT_KEYPAIR_ID  = var.cloudfront_keypair_id
    CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
  })
}

#################################################
# IAM — Execution Role
#################################################

resource "aws_iam_role" "ecs_execution" {
  name = "ecs-execution-role-backend-\${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "ecs-secrets-access-\${var.env}"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.app.arn
      },
      {
        Effect   = "Allow"
        Action   = ["kms:GenerateDataKey", "kms:Decrypt", "kms:DescribeKey"]
        Resource = "arn:aws:kms:us-east-1:578209355877:key/da2f5da6-2e70-40a0-88f1-e49baf700989"
      }
    ]
  })
}

#################################################
# IAM — Task Role
#################################################

resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-backend-\${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "ecs-task-s3-\${var.env}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "\${data.aws_s3_bucket.assets.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = data.aws_s3_bucket.assets.arn
      },
      {
        Effect   = "Allow"
        Action   = ["kms:GenerateDataKey", "kms:Decrypt", "kms:DescribeKey"]
        Resource = "arn:aws:kms:us-east-1:578209355877:key/da2f5da6-2e70-40a0-88f1-e49baf700989"
      }
    ]
  })
}

#################################################
# CLOUDWATCH — Log Group
#################################################

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/backend-\${var.env}"
  retention_in_days = 7
}

#################################################
# ECS CLUSTER
#################################################

resource "aws_ecs_cluster" "main" {
  name = "cluster-backend-\${var.env}"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

#################################################
# ECS TASK DEFINITION
#################################################

resource "aws_ecs_task_definition" "backend" {
  family                   = "backend-\${var.env}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = var.app_image

    portMappings = [{
      containerPort = var.app_port
      protocol      = "tcp"
    }]

    secrets = [
      { name = "JWT_SECRET",             valueFrom = "\${aws_secretsmanager_secret.app.arn}:JWT_SECRET::" },
      { name = "JWT_REFRESH_SECRET",     valueFrom = "\${aws_secretsmanager_secret.app.arn}:JWT_REFRESH_SECRET::" },
      { name = "CLOUDFRONT_KEYPAIR_ID",  valueFrom = "\${aws_secretsmanager_secret.app.arn}:CLOUDFRONT_KEYPAIR_ID::" },
      { name = "CLOUDFRONT_PRIVATE_KEY", valueFrom = "\${aws_secretsmanager_secret.app.arn}:CLOUDFRONT_PRIVATE_KEY::" },
    ]

    environment = [
      { name = "NODE_ENV",               value = "production" },
      { name = "PORT",                   value = tostring(var.app_port) },
      { name = "API_PREFIX",             value = "/api/v1" },
      { name = "CORS_ORIGIN",            value = var.cors_origin },
      { name = "AWS_REGION",             value = data.aws_region.current.name },
      { name = "AWS_BUCKET_NAME",        value = var.aws_bucket_name },
      { name = "CLOUDFRONT_DOMAIN",      value = var.cloudfront_domain },
      { name = "RATE_LIMIT_WINDOW_MS",   value = "900000" },
      { name = "RATE_LIMIT_MAX",         value = "100" },
      { name = "LOG_LEVEL",              value = "combined" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "backend"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:\${var.app_port}/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))\""]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

#################################################
# APPLICATION LOAD BALANCER
#################################################

resource "aws_lb" "main" {
  name               = "alb-backend-\${var.env}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = { Name = "alb-backend-\${var.env}" }
}

resource "aws_lb_target_group" "backend" {
  name        = "tg-backend-\${var.env}"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = { Name = "tg-backend-\${var.env}" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

#################################################
# ECS SERVICE
#################################################

resource "aws_ecs_service" "backend" {
  name            = "backend-service-\${var.env}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.app_port
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.http]

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}

#################################################
# AUTO SCALING
#################################################

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/\${aws_ecs_cluster.main.name}/\${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-tracking-backend-\${var.env}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.cpu_scaling_target
    scale_out_cooldown = 60
    scale_in_cooldown  = 300
  }
}

#################################################
# CLOUDWATCH — Alarmas
#################################################

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "ecs-cpu-high-backend-\${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU del backend > 80% por 2 minutos"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }
}

resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "alb-unhealthy-hosts-backend-\${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Hay containers no saludables detrás del ALB"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }
}

#################################################
# CLOUDWATCH — Dashboard
#################################################

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "backend-\${var.env}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric" x = 0  y = 0  width = 12 height = 6
        properties = {
          region  = "us-east-1"
          title   = "ECS CPU Utilization (%)"
          period  = 60
          stat    = "Average"
          view    = "timeSeries"
          metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.backend.name]]
        }
      },
      {
        type = "metric" x = 12 y = 0  width = 12 height = 6
        properties = {
          region  = "us-east-1"
          title   = "ECS Memory Utilization (%)"
          period  = 60
          stat    = "Average"
          view    = "timeSeries"
          metrics = [["AWS/ECS", "MemoryUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.backend.name]]
        }
      },
      {
        type = "metric" x = 0  y = 6  width = 12 height = 6
        properties = {
          region  = "us-east-1"
          title   = "ALB Request Count"
          period  = 60
          stat    = "Sum"
          view    = "timeSeries"
          metrics = [["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]]
        }
      },
      {
        type = "metric" x = 12 y = 6  width = 12 height = 6
        properties = {
          region  = "us-east-1"
          title   = "ALB Target Response Time (s)"
          period  = 60
          stat    = "Average"
          view    = "timeSeries"
          metrics = [["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix]]
        }
      }
    ]
  })
}

#################################################
# OUTPUTS
#################################################

output "api_endpoint" {
  description = "Endpoint público del backend"
  value       = "http://\${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "URL del repositorio ECR para push de imágenes"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.backend.name
}

output "cloudwatch_dashboard_url" {
  value = "https://console.aws.amazon.com/cloudwatch/home?region=\${data.aws_region.current.name}#dashboards:name=\${aws_cloudwatch_dashboard.main.dashboard_name}"
}`,
      },
    ],
  },

  {
    slug: "03-event-driven-serverless",
    githubUrl:
      "https://github.com/alfredo0607/aws-event-driven-image-processing-platform",
    demoUrl: "https://services-resize-image.alfredo-dominguez.dev",
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
        code: `Lambda function: procesa imágenes de S3 disparadas por eventos SQS.

Flujo:
  S3 ObjectCreated → SQS → este handler → 3 versiones en S3 + DynamoDB + SNS

Implementa:
  - ReportBatchItemFailures: solo reintenta mensajes fallidos del batch
  - Idempotencia via DynamoDB: evita doble procesamiento si el evento llega dos veces
  - S3 TestEvent: ignora eventos de prueba enviados al configurar notificaciones
"""

import boto3
import datetime
import io
import json
import os
import time
import urllib.parse

from PIL import Image

# ── Clientes AWS ──────────────────────────────────────────────────────────────

s3_client  = boto3.client("s3")
dynamodb   = boto3.resource("dynamodb")
sns_client = boto3.client("sns")

# ── Variables de entorno ──────────────────────────────────────────────────────

BUCKET_NAME    = os.environ["BUCKET_NAME"]
TABLE_NAME     = os.environ["DYNAMODB_TABLE"]
SNS_TOPIC_ARN  = os.environ["SNS_TOPIC_ARN"]
RESIZED_PREFIX = os.environ.get("RESIZED_PREFIX", "image-resize/resized")
ENVIRONMENT    = os.environ.get("ENVIRONMENT", "dev")

# ── Configuración de resizing ─────────────────────────────────────────────────

SIZES = [
    ("800x600", 800, 600),
    ("400x300", 400, 300),
    ("150x150", 150, 150),
]

FORMAT_MAP = {
    "jpg":  "JPEG",
    "jpeg": "JPEG",
    "png":  "PNG",
    "gif":  "GIF",
    "webp": "WEBP",
    "svg":  "PNG",   # Pillow no soporta SVG → convierte a PNG
}


# ── Handler principal ─────────────────────────────────────────────────────────

def lambda_handler(event, context):
    """
    Punto de entrada. Itera sobre los registros SQS del batch.
    Retorna batchItemFailures para que SQS reintente solo los mensajes fallidos.
    """
    failed = []

    for record in event.get("Records", []):
        message_id = record["messageId"]
        try:
            _process_sqs_record(record)
        except Exception as exc:
            print(f"[ERROR] messageId={message_id}: {exc}")
            failed.append({"itemIdentifier": message_id})

    return {"batchItemFailures": failed}


# ── Procesamiento de un registro SQS ─────────────────────────────────────────

def _process_sqs_record(record: dict) -> None:
    body = json.loads(record["body"])

    # S3 envía un evento de prueba al configurar la notificación → ignorar
    if body.get("Event") == "s3:TestEvent":
        print("[INFO] S3 test event recibido, ignorando.")
        return

    for s3_record in body.get("Records", []):
        bucket = s3_record["s3"]["bucket"]["name"]
        key    = urllib.parse.unquote_plus(s3_record["s3"]["object"]["key"])
        size   = s3_record["s3"]["object"].get("size", 0)
        _process_image(bucket, key, size)


# ── Procesamiento de una imagen ───────────────────────────────────────────────

def _process_image(bucket: str, key: str, file_size: int) -> None:
    table = dynamodb.Table(TABLE_NAME)

    # Idempotencia: si ya fue procesada, salir sin hacer nada
    existing = table.get_item(Key={"imageId": key})
    if existing.get("Item", {}).get("status") == "processed":
        print(f"[INFO] Ya procesada (idempotente): {key}")
        return

    print(f"[INFO] Procesando: {key} ({file_size} bytes)")

    # Descargar imagen de S3
    response     = s3_client.get_object(Bucket=bucket, Key=key)
    image_data   = response["Body"].read()
    content_type = response.get("ContentType", "image/jpeg")

    img = Image.open(io.BytesIO(image_data))
    original_w, original_h = img.size

    ext      = key.rsplit(".", 1)[-1].lower()
    base     = key.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    fmt      = FORMAT_MAP.get(ext, "JPEG")
    out_ext  = "png" if ext == "svg" else ext
    out_mime = "image/png" if ext == "svg" else content_type

    # Generar las 3 versiones redimensionadas
    generated_keys = []
    for label, max_w, max_h in SIZES:
        resized = img.copy()
        resized.thumbnail((max_w, max_h), Image.LANCZOS)

        buf = io.BytesIO()
        save_kwargs = {"format": fmt}
        if fmt == "JPEG":
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        resized.save(buf, **save_kwargs)
        buf.seek(0)

        output_key = f"{RESIZED_PREFIX}/{label}/{base}.{out_ext}"
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=output_key,
            Body=buf.getvalue(),
            ContentType=out_mime,
            ContentDisposition="inline",
        )
        generated_keys.append(output_key)
        print(f"[INFO] Subida: {output_key}")

    now_iso  = datetime.datetime.utcnow().isoformat() + "Z"
    ttl_unix = int(time.time()) + 90 * 24 * 3600  # expira en 90 días

    # Persistir metadata en DynamoDB
    table.put_item(
        Item={
            "imageId":    key,
            "status":     "processed",
            "sizes":      generated_keys,
            "originalKey": key,
            "fileSize":   file_size,
            "mimeType":   content_type,
            "dimensions": f"{original_w}x{original_h}",
            "processedAt": now_iso,
            "expiresAt":  ttl_unix,
            "environment": ENVIRONMENT,
        }
    )

    # Notificar vía SNS
    sns_client.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject=f"✅ Tus imágenes ya están listas",
        Message=json.dumps(
            {
                "title": "Imágenes procesadas correctamente",
                "message": (
                    f"Hola 👋\n\n"
                    f"Tu imagen '{base}' fue procesada exitosamente y ya se "
                    f"encuentran disponibles las versiones optimizadas.\n\n"
                    f"📐 Tamaño original: {original_w}x{original_h}\n"
                    f"🖼️ Versiones generadas: {len(generated_keys)}\n"
                    f"📦 Tamaño del archivo: {file_size} bytes\n\n"
                    f"Gracias por usar nuestro servicio 🚀"
                ),
                "imageId": key,
                "sizes": generated_keys,
                "processedAt": now_iso,
                "environment": ENVIRONMENT,
            },
            ensure_ascii=False,
            indent=2,
        ),
    )

    print(f"[INFO] Completado: {key} → {generated_keys}")`,
      },

      {
        title: "Main.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  required_version = ">= 1.4.0"
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# ── Data sources ──────────────────────────────────────────────────────────────

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ── Locals: naming & tags aplicados a todos los recursos ─────────────────────

locals {
  prefix = "img-proc-env"

  tags = {
    Project      = "aws-event-driven-image-processing-platform"
    Architecture = "event-driven-serverless"
    Environment  = var.env
    ManagedBy    = "terraform"
    Owner        = "Alfredo Jose Dominguez Hernandez"
    Repository   = "aws-event-driven-image-processing-platform"
  }
}
`,
      },

      {
        title: "s3.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# S3 BUCKET — almacenamiento de imágenes input/output
#################################################

resource "aws_s3_bucket" "images" {
  # Nombre único por cuenta y entorno
  bucket = "{local.prefix}-images-{data.aws_caller_identity.current.account_id}"

  tags = merge(local.tags, {
    Name    = "{local.prefix}-images"
    Purpose = "image-storage-input-output"
  })
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "images" {
  bucket = aws_s3_bucket.images.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    id     = "expire-input-originals"
    status = "Enabled"

    filter {
      prefix = "image-resize/input/"
    }

    expiration {
      days = 7
    }
  }

  rule {
    id     = "expire-resized-outputs"
    status = "Enabled"

    filter {
      prefix = "image-resize/resized/"
    }

    expiration {
      days = 90
    }
  }
}

#################################################
# S3 EVENT NOTIFICATION → SQS
# Dispara cuando se sube un objeto a image-resize/input/
# depends_on: la política de SQS debe existir primero para que AWS
# pueda validar que S3 tiene permiso de escribir en la cola.
#################################################

resource "aws_s3_bucket_notification" "images" {
  depends_on = [aws_sqs_queue_policy.processing]

  bucket = aws_s3_bucket.images.id

  queue {
    queue_arn     = aws_sqs_queue.processing.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "image-resize/input/"
  }
}`,
      },

      {
        title: "SNS.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# SNS TOPIC — notificaciones del pipeline
# Lambda publica aquí tras procesar o fallar.
# Suscriptores opcionales: email, webhook, otra Lambda.
#################################################

resource "aws_sns_topic" "notifications" {
  name = "{local.prefix}-notifications"

  tags = merge(local.tags, {
    Name    = "{local.prefix}-notifications"
    Purpose = "processing-notifications"
  })
}

# Suscripción por email (opcional — solo si notification_email != "")
# AWS enviará un correo de confirmación; debe aceptarse manualmente.
resource "aws_sns_topic_subscription" "email" {
  count = var.notification_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
`,
      },

      {
        title: "SQS.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# SQS DEAD-LETTER QUEUE
# Recibe mensajes que fallaron 3 veces consecutivas.
# Retención máxima (14 días) para dar tiempo al equipo de revisar.
#################################################

resource "aws_sqs_queue" "dlq" {
  name = "{local.prefix}-dlq"

  message_retention_seconds = 1209600 # 14 días (máximo)
  sqs_managed_sse_enabled   = true

  tags = merge(local.tags, {
    Name    = "{local.prefix}-dlq"
    Purpose = "dead-letter-queue"
  })
}

#################################################
# SQS PROCESSING QUEUE
# Buffer entre el evento S3 y la ejecución de Lambda.
# VisibilityTimeout = 6× el timeout de Lambda (best practice AWS).
# MaxReceiveCount = 3: tras 3 fallos el mensaje pasa a la DLQ.
#################################################

resource "aws_sqs_queue" "processing" {
  name = "{local.prefix}-processing"

  # 6× lambda_timeout: mientras Lambda procesa, SQS oculta el mensaje
  visibility_timeout_seconds = var.lambda_timeout * 6

  message_retention_seconds = 86400 # 1 día
  sqs_managed_sse_enabled   = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.tags, {
    Name    = "{local.prefix}-processing"
    Purpose = "image-processing-queue"
  })
}

#################################################
# SQS QUEUE POLICY
# Permite que Amazon S3 publique mensajes en la cola.
# La condición aws:SourceArn restringe el acceso al bucket concreto,
# evitando el confused deputy problem.
#################################################

resource "aws_sqs_queue_policy" "processing" {
  queue_url = aws_sqs_queue.processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3SendMessage"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.processing.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.images.arn
          }
        }
      }
    ]
  })
}
`,
      },

      {
        title: "lambda.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# BUILD AUTOMÁTICO DEL PAQUETE LAMBDA
# Se ejecuta en terraform apply cuando handler.py o
# requirements.txt cambian. Instala Pillow compilado para
# Linux x86_64 (manylinux) dentro de lambda/package/.
#################################################

resource "null_resource" "lambda_build" {
  triggers = {
    handler_md5      = filemd5("{path.module}/lambda/handler.py")
    requirements_md5 = filemd5("{path.module}/lambda/requirements.txt")
  }

  provisioner "local-exec" {
    command     = "python build.py"
    working_dir = path.module
  }
}

#################################################
# LAMBDA DEPLOYMENT PACKAGE
# archive_file depende de null_resource para asegurar que
# lambda/package/ ya existe antes de ser empaquetado.
#################################################

data "archive_file" "lambda" {
  depends_on = [null_resource.lambda_build]

  type        = "zip"
  source_dir  = "{path.module}/lambda/package"
  output_path = "{path.module}/.build/handler.zip"
}

#################################################
# LAMBDA FUNCTION — procesamiento de imágenes
# Runtime: Python 3.12
# Timeout: var.lambda_timeout (default 60 s)
# Memory: var.lambda_memory_mb (default 512 MB)
# reserved_concurrent_executions: -1 = sin reserva,
#   usa el pool general de la cuenta (correcto para dev).
#   En producción cambiar a 50+ en terraform.tfvars.
#################################################

resource "aws_lambda_function" "image_processor" {
  function_name = "{local.prefix}-processor"
  role          = aws_iam_role.lambda.arn

  handler     = "handler.lambda_handler"
  runtime     = "python3.12"
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_mb

  reserved_concurrent_executions = var.lambda_reserved_concurrency

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME    = aws_s3_bucket.images.bucket
      DYNAMODB_TABLE = aws_dynamodb_table.images.name
      SNS_TOPIC_ARN  = aws_sns_topic.notifications.arn
      RESIZED_PREFIX = "image-resize/resized"
      ENVIRONMENT    = var.env
    }
  }

  tags = merge(local.tags, {
    Name    = "{local.prefix}-processor"
    Purpose = "image-processing-function"
  })
}

#################################################
# EVENT SOURCE MAPPING — SQS → Lambda
# batch_size: hasta 10 mensajes por invocación
# ReportBatchItemFailures: solo reintenta mensajes
#   fallidos del batch, no el batch completo
#################################################

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.processing.arn
  function_name    = aws_lambda_function.image_processor.arn

  batch_size = var.sqs_batch_size

  function_response_types = ["ReportBatchItemFailures"]
}`,
      },

      {
        title: "IAM.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# IAM ROLE — ejecución de Lambda
#################################################

resource "aws_iam_role" "lambda" {
  name = "{local.prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaAssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.tags, {
    Name    = "{local.prefix}-lambda-role"
    Purpose = "lambda-execution-role"
  })
}

# AWS managed policy: CloudWatch Logs (CreateLogGroup, CreateLogStream, PutLogEvents)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

#################################################
# IAM INLINE POLICY — permisos de mínimo privilegio
# S3: solo los prefijos input/ y resized/
# SQS: solo la cola de procesamiento
# DynamoDB: solo la tabla de metadata
# SNS: solo el topic de notificaciones
#################################################

resource "aws_iam_role_policy" "lambda_custom" {
  name = "{local.prefix}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadInput"
        Effect = "Allow"
        Action = ["s3:GetObject"]
        Resource = [
          "{aws_s3_bucket.images.arn}/image-resize/input/*"
        ]
      },
      {
        Sid    = "S3WriteResized"
        Effect = "Allow"
        Action = ["s3:PutObject"]
        Resource = [
          "{aws_s3_bucket.images.arn}/image-resize/resized/*"
        ]
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [aws_dynamodb_table.images.arn]
      },
      {
        Sid      = "SNSPublish"
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [aws_sns_topic.notifications.arn]
      },
      {
        Sid    = "SQSConsumeMessages"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [aws_sqs_queue.processing.arn]
      }
    ]
  })
}
`,
      },

      {
        title: "dynamodb.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# DYNAMODB TABLE — metadata de imágenes procesadas
# Clave: imageId (S3 object key de la imagen original)
# TTL: expiresAt — los ítems expiran a los 90 días automáticamente
#################################################

resource "aws_dynamodb_table" "images" {
  name         = "{local.prefix}-metadata"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "imageId"

  attribute {
    name = "imageId"
    type = "S"
  }

  # TTL: Lambda escribe expiresAt como Unix timestamp
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name    = "{local.prefix}-metadata"
    Purpose = "image-metadata-storage"
  })
}
`,
      },

      {
        title: "cloudwatch.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `#################################################
# CLOUDWATCH LOG GROUP — logs de Lambda
# Creado explícitamente para controlar retención
# y garantizar que los tags del proyecto se apliquen.
#################################################

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/{aws_lambda_function.image_processor.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name    = "{local.prefix}-lambda-logs"
    Purpose = "lambda-execution-logs"
  })
}

#################################################
# CLOUDWATCH ALARM — mensajes en DLQ
# Se activa si hay ≥1 mensaje visible en la DLQ,
# lo que indica fallos repetidos en el procesamiento.
# Acción: publica en SNS para notificar al equipo de operaciones.
#################################################

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "{local.prefix}-dlq-not-empty"
  alarm_description   = "La DLQ tiene mensajes — revisa los fallos de procesamiento en Lambda."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]
  ok_actions    = [aws_sns_topic.notifications.arn]

  tags = merge(local.tags, {
    Name    = "{local.prefix}-dlq-alarm"
    Purpose = "dlq-monitoring"
  })
}

#################################################
# CLOUDWATCH ALARM — errores de Lambda
# Se activa si Lambda lanza ≥1 error en el período.
#################################################

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "{local.prefix}-lambda-errors"
  alarm_description   = "Lambda registró errores en el procesamiento de imágenes."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.image_processor.function_name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]

  tags = merge(local.tags, {
    Name    = "{local.prefix}-lambda-errors-alarm"
    Purpose = "lambda-error-monitoring"
  })
}

#################################################
# CLOUDWATCH ALARM — throttles de Lambda
# Se activa si Lambda es throttled, lo que indica
# que el reservedConcurrency es insuficiente para la carga.
#################################################

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "{local.prefix}-lambda-throttles"
  alarm_description   = "Lambda está siendo throttled — considera aumentar reserved concurrency."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.image_processor.function_name
  }

  alarm_actions = [aws_sns_topic.notifications.arn]

  tags = merge(local.tags, {
    Name    = "{local.prefix}-lambda-throttles-alarm"
    Purpose = "lambda-throttle-monitoring"
  })
}
`,
      },

      {
        title: "outputs.tf — Infraestructura completa en Terraform",
        language: "terraform",
        code: `output "bucket_name" {
  description = "Nombre del bucket S3 de imágenes."
  value       = aws_s3_bucket.images.bucket
}

output "bucket_arn" {
  description = "ARN del bucket S3."
  value       = aws_s3_bucket.images.arn
}

output "sqs_queue_url" {
  description = "URL de la cola SQS de procesamiento."
  value       = aws_sqs_queue.processing.id
}

output "sqs_queue_arn" {
  description = "ARN de la cola SQS de procesamiento."
  value       = aws_sqs_queue.processing.arn
}

output "sqs_dlq_url" {
  description = "URL de la Dead-Letter Queue."
  value       = aws_sqs_queue.dlq.id
}

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB."
  value       = aws_dynamodb_table.images.name
}

output "dynamodb_table_arn" {
  description = "ARN de la tabla DynamoDB."
  value       = aws_dynamodb_table.images.arn
}

output "sns_topic_arn" {
  description = "ARN del topic SNS de notificaciones."
  value       = aws_sns_topic.notifications.arn
}

output "lambda_function_name" {
  description = "Nombre de la función Lambda."
  value       = aws_lambda_function.image_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN de la función Lambda."
  value       = aws_lambda_function.image_processor.arn
}

output "lambda_role_arn" {
  description = "ARN del IAM Role de Lambda."
  value       = aws_iam_role.lambda.arn
}

output "cloudwatch_log_group" {
  description = "Nombre del Log Group de Lambda en CloudWatch."
  value       = aws_cloudwatch_log_group.lambda.name
}

output "env_vars_for_backend" {
  description = "Variables de entorno necesarias para el backend Express."
  value = {
    AWS_BUCKET_NAME = aws_s3_bucket.images.bucket
    AWS_REGION      = var.aws_region
  }
}
`,
      },
    ],
  },
];

export function getArchitecture(slug: string): Architecture | undefined {
  return architectures.find((a) => a.slug === slug);
}
