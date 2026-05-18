# ADR-002: ECS Fargate en lugar de ECS con EC2

**Fecha:** 2026-05-17  
**Estado:** Aceptado  
**Arquitectura:** 02-scalable-backend

---

## Contexto

Para el backend escalable con contenedores necesitamos decidir el modo de lanzamiento de ECS: gestionar instancias EC2 propias o usar Fargate (serverless compute para contenedores).

## Decisión

Usar **ECS Fargate** para eliminar la gestión de la infraestructura subyacente y optimizar costos en cargas de trabajo variables.

## Opciones Consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **Fargate** (elegida) | Sin gestión de EC2, pago por vCPU/memoria usada, integración nativa con IAM Task Roles | Costo por unidad más alto en cargas sostenidas altas |
| EC2 | Más económico en alta utilización sostenida, control total del OS | Gestión de parches, capacity planning, mayor overhead operativo |

## Consecuencias

### Positivas
- Zero overhead operativo de instancias
- Autoscaling fino a nivel de tarea
- Integración directa con AWS Secrets Manager y SSM Parameter Store via Task Roles

### Negativas / Trade-offs
- Para cargas sostenidas >70% utilización, EC2 Reserved Instances pueden ser más rentables
- Sin acceso SSH directo a los contenedores (usar ECS Exec en su lugar)

## Referencias
- [ECS Launch Types](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/launch_types.html)
- [AWS Fargate pricing](https://aws.amazon.com/fargate/pricing/)
