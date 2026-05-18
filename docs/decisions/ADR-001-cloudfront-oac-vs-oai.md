# ADR-001: CloudFront Origin Access Control (OAC) en lugar de OAI

**Fecha:** 2026-05-17  
**Estado:** Aceptado  
**Arquitectura:** 01-private-cdn

---

## Contexto

Para la CDN privada necesitamos restringir el acceso al bucket S3 de modo que solo CloudFront pueda leerlo. AWS ofrece dos mecanismos: Origin Access Identity (OAI) — el legacy — y Origin Access Control (OAC) — el recomendado desde 2022.

## Decisión

Usar **Origin Access Control (OAC)** con firma SigV4 para autenticar las solicitudes de CloudFront al bucket S3.

## Opciones Consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **OAC** (elegida) | Soporta SSE-KMS, SigV4, S3 en todas las regiones, recomendado por AWS | Requiere política de bucket actualizada |
| OAI (legacy) | Compatible con distribuciones antiguas | No soporta SSE-KMS, descontinuado como opción preferida |

## Consecuencias

### Positivas
- Soporte nativo para buckets cifrados con KMS
- Compatible con S3 Object Lambda y S3 Multi-Region Access Points
- Alineado con las mejores prácticas AWS actuales

### Negativas / Trade-offs
- La política de bucket debe otorgar explícitamente permisos al ARN del distribution, no a un IAM principal genérico

## Referencias
- [AWS: Restricting access to an Amazon S3 origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Migrating from OAI to OAC](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-introduces-origin-access-control/)
