type Project = {
  title: string;
  description: string;
  tags: string[];
  status: "live" | "building" | "planned";
  link?: string;
};

const projects: Project[] = [
  {
    title: "API REST con autenticación JWT",
    description:
      "API Node.js + Express + TypeScript con autenticación basada en JWT, roles, rate limiting y documentación OpenAPI. Desplegada en ECS Fargate.",
    tags: ["Node.js", "TypeScript", "Express", "JWT", "ECS Fargate", "PostgreSQL"],
    status: "building",
  },
  {
    title: "Dashboard en tiempo real con React",
    description:
      "Dashboard interactivo con Next.js y WebSockets para monitoreo de métricas. Conectado a CloudWatch y DynamoDB Streams.",
    tags: ["Next.js", "React", "TypeScript", "WebSockets", "CloudWatch", "DynamoDB"],
    status: "building",
  },
  {
    title: "App móvil con React Native",
    description:
      "Aplicación móvil multiplataforma (iOS/Android) conectada a una API serverless Lambda + API Gateway con autenticación Cognito.",
    tags: ["React Native", "TypeScript", "Lambda", "API Gateway", "Cognito"],
    status: "planned",
  },
  {
    title: "Pipeline de datos serverless",
    description:
      "Ingesta y procesamiento de datos con Lambda + Kinesis + S3 + Glue + Athena. Infraestructura 100% Terraform.",
    tags: ["Lambda", "Kinesis", "S3", "Glue", "Athena", "Terraform"],
    status: "planned",
  },
];

const statusConfig: Record<
  Project["status"],
  { label: string; className: string }
> = {
  live: {
    label: "live",
    className: "bg-green-900/40 text-green-400 border border-green-800",
  },
  building: {
    label: "building",
    className: "bg-aws/10 text-aws border border-aws/30",
  },
  planned: {
    label: "planned",
    className: "bg-surface text-muted border border-border-subtle",
  },
};

export function Projects() {
  return (
    <section id="proyectos" className="py-24 px-6 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-sm tracking-widest uppercase mb-3 text-foreground/60">
            💻 Full Stack
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Proyectos
          </h2>
          <p className="text-muted mt-4 max-w-xl">
            Aplicaciones web, APIs y móviles construidas con el stack completo —
            desde la UI hasta la infraestructura cloud.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const status = statusConfig[project.status];
            return (
              <div
                key={project.title}
                className="bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-4 hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground leading-snug">
                    {project.title}
                  </h3>
                  <span
                    className={`shrink-0 text-xs font-mono px-2 py-1 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="text-muted text-sm leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-background border border-border-subtle text-muted px-2 py-1 rounded font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-aws hover:text-aws-hover transition-colors font-medium"
                  >
                    Ver proyecto →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
