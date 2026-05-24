import Link from "next/link";
import { architectures } from "@/lib/data/architectures";

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
            (ADRs), trade-offs, estimación de costos y snippets de código reales.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {architectures.map((arch) => (
            <Link
              key={arch.slug}
              href={`/arquitecturas/${arch.slug}`}
              className="bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-4 hover:border-aws/40 hover:shadow-[0_0_20px_rgba(255,153,0,0.05)] transition-all group"
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
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-aws transition-colors">
                  {arch.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed line-clamp-2">
                  <span className="text-foreground/60 font-medium">Problema: </span>
                  {arch.problem}
                </p>
                <p className="text-muted text-sm leading-relaxed mt-2 line-clamp-2">
                  <span className="text-foreground/60 font-medium">Solución: </span>
                  {arch.solution}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {arch.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-background border border-border-subtle text-muted px-2 py-1 rounded font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="text-xs text-aws group-hover:underline font-mono mt-1">
                Ver documentación completa →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
