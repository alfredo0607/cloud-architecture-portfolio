# Arquitectura 03 — Event-Driven Serverless

## Problema

Procesar tareas asíncronas de forma desacoplada, resiliente y sin gestionar servidores. El caso de uso: procesamiento de imágenes al momento de upload.

## Solución

Lambda + SQS + SNS + S3 Events para un pipeline de procesamiento orientado a eventos con resiliencia end-to-end.

## Diagrama

```
Usuario
  │ (upload)
  ▼
S3 Bucket (input)
  │ (S3 Event Notification)
  ▼
SQS Queue (buffer + retry)
  │ (Event Source Mapping)
  ▼
Lambda (procesamiento)
  │              │
  ▼              ▼
S3 (output)   DynamoDB (metadata)
  │
  ▼
SNS → Email / Webhook (notificación)
```

> Diagrama detallado: `diagram.png` (pendiente)

## Servicios AWS

| Servicio  | Rol                                         |
|-----------|---------------------------------------------|
| S3        | Almacenamiento de imágenes input/output     |
| SQS       | Cola de mensajes con retry y DLQ            |
| Lambda    | Procesamiento serverless por evento         |
| SNS       | Notificaciones fanout (email, webhook)      |
| DynamoDB  | Almacenamiento NoSQL de resultados/metadata |
| CloudWatch| Logs, métricas y alertas de Lambda          |
| IAM       | Roles con mínimo privilegio por función     |

## Decisiones Técnicas

- [ADR-003: SQS como buffer entre S3 y Lambda](../../docs/decisions/ADR-003-lambda-sqs-vs-direct-invocation.md)

## Consideraciones

### Seguridad
- Lambda execution role con permisos mínimos (solo el bucket output, no input)
- SQS con server-side encryption (SSE-SQS)
- DynamoDB con encryption at rest habilitado

### Costo
- Lambda: primer 1M requests/mes gratis, luego $0.20/M requests
- SQS: primer 1M requests/mes gratis, luego $0.40/M requests
- DynamoDB: $0.25/GB/mes almacenamiento + $1.25/M write units

### Escalabilidad
- Lambda escala automáticamente hasta 1000 ejecuciones concurrentes por región
- SQS desacopla el rate de uploads del rate de procesamiento
- `reservedConcurrentExecutions` para prevenir throttling de downstream services

### Resiliencia
- Dead-Letter Queue (DLQ) captura mensajes tras 3 reintentos
- `visibilityTimeout` = 6x el timeout de Lambda (best practice AWS)
- Idempotency key en DynamoDB para prevenir doble procesamiento

## Demo

Ubicación: [`../../demos/event-processing-demo/`](../../demos/event-processing-demo/)

**Flujo:**
1. Upload de imagen al bucket S3 via UI o CLI
2. S3 Event → SQS → Lambda procesa (resize, metadata extraction)
3. Resultado visible en DynamoDB + notificación SNS

## Estado

- [ ] Diagrama arquitectural
- [ ] Lambda function (Python) para procesamiento de imágenes
- [ ] IaC Terraform
- [ ] Demo funcional end-to-end
- [ ] ADR adicionales documentados
