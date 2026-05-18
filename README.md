# ☁️ Cloud Architecture Portfolio

> **Alfredo José Dominguez Hernández**  
> AWS Solutions Architect · Barranquilla, Colombia  
> [![LinkedIn](https://img.shields.io/badge/LinkedIn-Alfredo%20Dominguez-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alfredo-jose-dominguez-hernandez)
> ![Status](https://img.shields.io/badge/Status-En%20Construcción-orange?style=flat)
> ![AWS](https://img.shields.io/badge/AWS-Cloud%20Architect-FF9900?style=flat&logo=amazonaws&logoColor=white)

---

## 🎯 ¿Qué es este proyecto?

Este repositorio no es solo código.

Es un **portal profesional de arquitectura cloud** donde demuestro mi capacidad para diseñar, documentar y desplegar arquitecturas AWS modernas, escalables y seguras.

Cada arquitectura aquí presente incluye:

- Diagrama profesional del sistema
- Decisiones técnicas y trade-offs
- Consideraciones de seguridad, costo y escalabilidad
- Demo funcional desplegada en AWS

> _"No basta con saber construirlo. Hay que saber explicar por qué se construyó así."_

---

## 🗂️ Estructura del Proyecto

```
cloud-architecture-portfolio/
├── apps/
│   └── web/                        # Frontend Next.js (portfolio principal)
├── architectures/
│   ├── 01-private-cdn/             # CDN Privada con CloudFront + Signed URLs
│   ├── 02-scalable-backend/        # Backend escalable con ECS Fargate
│   └── 03-event-driven-serverless/ # Arquitectura event-driven con Lambda + SQS
├── infrastructure/
│   └── terraform/                  # IaC completa de la plataforma
├── demos/
│   ├── signed-url-demo/            # Demo: Signed URLs temporales
│   ├── ecs-scaling-demo/           # Demo: API con autoscaling
│   └── event-processing-demo/      # Demo: Procesamiento de imágenes async
├── docs/
│   └── decisions/                  # Architecture Decision Records (ADRs)
└── .github/
    └── workflows/                  # CI/CD con GitHub Actions
```

---

## 🏗️ Arquitecturas Documentadas

### 1. 🔐 CDN Privada Segura

**Problema:** Entregar archivos privados de forma segura y eficiente a nivel global sin exponer el bucket S3 directamente.

**Solución:** CloudFront + S3 con Signed URLs y Origin Access Control (OAC).

| Servicio    | Rol                                   |
| ----------- | ------------------------------------- |
| Amazon S3   | Almacenamiento privado de objetos     |
| CloudFront  | Distribución CDN global               |
| Signed URLs | Acceso temporal y controlado          |
| IAM         | Políticas de acceso mínimo privilegio |

**Demo:** Subir un archivo privado y acceder mediante URL firmada con expiración automática.

---

### 2. 📦 Backend Escalable con Contenedores

**Problema:** Escalar APIs modernas de forma automática ante picos de tráfico sin intervención manual.

**Solución:** ECS Fargate + ALB + Auto Scaling Group con rolling deployments.

| Servicio                  | Rol                                     |
| ------------------------- | --------------------------------------- |
| ECS Fargate               | Orquestación de contenedores serverless |
| Application Load Balancer | Distribución de tráfico                 |
| RDS (PostgreSQL)          | Base de datos relacional administrada   |
| CloudWatch                | Métricas y triggers de autoscaling      |

**Demo:** API REST con dashboard de métricas en tiempo real y autoscaling simulado.

---

### 3. ⚡ Arquitectura Event-Driven Serverless

**Problema:** Procesar tareas asíncronas de forma desacoplada, resiliente y sin gestionar servidores.

**Solución:** Lambda + SQS + SNS + S3 Events para procesamiento orientado a eventos.

| Servicio | Rol                                 |
| -------- | ----------------------------------- |
| Lambda   | Procesamiento serverless por evento |
| SQS      | Cola de mensajes desacoplada        |
| SNS      | Notificaciones fanout               |
| DynamoDB | Almacenamiento NoSQL de resultados  |

**Demo:** Upload de imagen → trigger S3 → Lambda procesa → resultado visible en tiempo real.

---

## 🛠️ Stack Tecnológico

### Cloud (AWS)

![ECS](https://img.shields.io/badge/ECS_Fargate-FF9900?style=flat&logo=amazonaws)
![Lambda](https://img.shields.io/badge/Lambda-FF9900?style=flat&logo=awslambda&logoColor=white)
![CloudFront](https://img.shields.io/badge/CloudFront-FF9900?style=flat&logo=amazonaws)
![S3](https://img.shields.io/badge/S3-569A31?style=flat&logo=amazons3&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=flat&logo=amazondynamodb&logoColor=white)
![RDS](https://img.shields.io/badge/RDS-527FFF?style=flat&logo=amazonaws)
![SQS](https://img.shields.io/badge/SQS-FF9900?style=flat&logo=amazonaws)
![SNS](https://img.shields.io/badge/SNS-FF9900?style=flat&logo=amazonaws)
![API Gateway](https://img.shields.io/badge/API_Gateway-FF9900?style=flat&logo=amazonaws)

### IaC & DevOps

![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)
![CloudWatch](https://img.shields.io/badge/CloudWatch-FF9900?style=flat&logo=amazonaws)

### Frontend & Backend

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

---

## 🗺️ Roadmap

```
✅ Fase 1 — Portfolio Base
   └── Landing page, CV, sobre mí, stack tecnológico

🔄 Fase 2 — Arquitecturas Documentadas          ← En progreso
   └── Diagramas, decisiones técnicas, ADRs, flujos

⏳ Fase 3 — Demos Funcionales
   └── Signed URLs, Lambda processing, ECS API

⏳ Fase 4 — Infraestructura Real
   └── Terraform completo, CI/CD, monitoring

⏳ Fase 5 — Blog Técnico
   └── Artículos, branding, SEO
```

---

## 🚀 Arquitectura de la Plataforma

El portfolio en sí mismo está desplegado siguiendo buenas prácticas AWS:

```
GitHub → GitHub Actions → S3 + CloudFront
                       ↘ Vercel (frontend)
                         API Gateway → Lambda
                         Terraform (IaC)
                         CloudWatch (observabilidad)
```

---

## 🎯 Certificaciones (En Progreso)

| Certificación                          | Estado  |
| -------------------------------------- | ------- |
| AWS Cloud Practitioner                 | 🎯 Meta |
| AWS Solutions Architect – Associate    | 🎯 Meta |
| AWS Solutions Architect – Professional | 🎯 Meta |
| HashiCorp Terraform Associate          | 🎯 Meta |

---

## 📬 Contacto

¿Interesado en colaborar, contratar o simplemente conversar sobre arquitecturas cloud?

- 🔗 **LinkedIn:** [alfredo-jose-dominguez-hernandez](https://www.linkedin.com/in/alfredo-jose-dominguez-hernandez)
- 📍 **Ubicación:** Barranquilla, Colombia — Disponible para trabajo remoto global

---

<div align="center">

_Construido con criterio arquitectónico, no solo con código._

**Alfredo José Dominguez Hernández** · AWS Solutions Architect · 2025

</div>
