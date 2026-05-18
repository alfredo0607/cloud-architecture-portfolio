# ADR-003: SQS como buffer entre S3 Events y Lambda

**Fecha:** 2026-05-17  
**Estado:** Aceptado  
**Arquitectura:** 03-event-driven-serverless

---

## Contexto

Para la arquitectura event-driven necesitamos decidir cómo conectar los eventos de S3 (upload de imagen) con el procesamiento Lambda. La opción directa es S3 → Lambda; la alternativa es S3 → SQS → Lambda.

## Decisión

Usar **SQS como buffer** entre S3 y Lambda para garantizar resiliencia, control de concurrencia y retry automático.

## Opciones Consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **S3 → SQS → Lambda** (elegida) | Dead-letter queue, batching, throttling control, reintentos automáticos | Latencia adicional (~1s), complejidad ligeramente mayor |
| S3 → Lambda directo | Menor latencia, configuración más simple | Sin DLQ nativa para fallos de Lambda, concurrencia descontrolada bajo picos |

## Consecuencias

### Positivas
- Dead-Letter Queue (DLQ) captura mensajes que fallaron tras N reintentos
- `maxReceiveCount` + `visibilityTimeout` previenen procesamiento duplicado
- El `reservedConcurrentExecutions` en Lambda limita el impacto ante picos masivos de uploads

### Negativas / Trade-offs
- Latencia end-to-end incrementa ~1-5 segundos dependiendo del `ReceiveMessageWaitTimeSeconds`
- Requiere permisos SQS adicionales y configuración de Event Source Mapping

## Referencias
- [Using Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)
