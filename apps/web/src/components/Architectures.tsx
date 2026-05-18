type Architecture = {
  number: string;
  title: string;
  problem: string;
  solution: string;
  services: string[];
  status: "live" | "building";
};

const architectures: Architecture[] = [
  {
    number: "01",
    title: "CDN Privada Segura",
    problem: "Entregar archivos privados globalmente sin exponer S3 directamente.",
    solution: "CloudFront + S3 con Signed URLs y Origin Access Control (OAC).",
    services: ["CloudFront", "S3", "Signed URLs", "IAM", "KMS"],
    status: "building",
  },
  {
    number: "02",
    title: "Backend Escalable con Contenedores",
    problem: "Escalar APIs ante picos de tráfico sin intervención manual.",
    solution: "ECS Fargate + ALB + Auto Scaling con rolling deployments.",
    services: ["ECS Fargate", "ALB", "RDS PostgreSQL", "CloudWatch", "ECR"],
    status: "building",
  },
  {
    number: "03",
    title: "Arquitectura Event-Driven",
    problem: "Procesar tareas asíncronas de forma desacoplada y resiliente.",
    solution: "Lambda + SQS + SNS + S3 Events con DLQ y retry automático.",
    services: ["Lambda", "SQS", "SNS", "DynamoDB", "S3"],
    status: "building",
  },
];

export function Architectures() {
  return (
    <section id="arquitecturas" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-aws text-sm tracking-widest uppercase mb-3">
            Arquitecturas
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Sistemas diseñados para producción
          </h2>
          <p className="text-muted mt-4 max-w-xl">
            Cada arquitectura incluye diagrama técnico, decisiones documentadas
            (ADRs), trade-offs y demo funcional desplegada en AWS.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {architectures.map((arch) => (
            <div
              key={arch.number}
              className="bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-4 hover:border-aws/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-aws text-3xl font-bold leading-none">
                  {arch.number}
                </span>
                <span
                  className={`text-xs font-mono px-2 py-1 rounded-full ${
                    arch.status === "live"
                      ? "bg-green-900/40 text-green-400 border border-green-800"
                      : "bg-aws/10 text-aws border border-aws/30"
                  }`}
                >
                  {arch.status === "live" ? "live" : "building"}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {arch.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  <span className="text-foreground/60 font-medium">Problema: </span>
                  {arch.problem}
                </p>
                <p className="text-muted text-sm leading-relaxed mt-2">
                  <span className="text-foreground/60 font-medium">Solución: </span>
                  {arch.solution}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {arch.services.map((svc) => (
                  <span
                    key={svc}
                    className="text-xs bg-background border border-border-subtle text-muted px-2 py-1 rounded font-mono"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
