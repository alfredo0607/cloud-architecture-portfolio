import Link from "next/link";
import { projects } from "@/lib/data/projects";

const statusConfig: Record<
  "live" | "building" | "planned" | "In development",
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
  "In development": {
    label: "In development",
    className: "bg-blue-900/40 text-blue-400 border border-blue-800",
  },
};

export function Projects() {
  return (
    <section
      id="proyectos"
      className="py-24 px-6 border-t border-border-subtle"
    >
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
            desde la UI hasta la infraestructura cloud. Cada proyecto incluye
            documentación técnica, decisiones y código real.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const status = statusConfig[project.status];
            return (
              <Link
                key={project.slug}
                href={`/proyectos/${project.slug}`}
                className="bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-4 hover:border-foreground/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground leading-snug group-hover:text-aws transition-colors">
                    {project.title}
                  </h3>
                  <span
                    className={`shrink-0 text-xs font-mono px-2 py-1 rounded-full ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="text-muted text-sm leading-relaxed">
                  {project.tagline}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  {project.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-background border border-border-subtle text-muted px-2 py-1 rounded font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {project.architectureSlugs &&
                  project.architectureSlugs.length > 0 && (
                    <p className="text-xs font-mono text-muted">
                      Arquitecturas:{" "}
                      {project.architectureSlugs
                        .map((s) => s.split("-")[0])
                        .join(", ")}
                    </p>
                  )}

                <span className="text-xs text-foreground/40 group-hover:text-aws group-hover:underline font-mono transition-colors">
                  Ver documentación técnica →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
