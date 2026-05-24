import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { architectures, getArchitecture } from "@/lib/data/architectures";

export function generateStaticParams() {
  return architectures.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const arch = getArchitecture(slug);
  if (!arch) return {};
  return {
    title: `${arch.title} — Alfredo Dominguez`,
    description: arch.tagline,
  };
}

const statusConfig = {
  live: {
    label: "Live",
    className: "bg-green-900/40 text-green-400 border border-green-800",
  },
  building: {
    label: "Building",
    className: "bg-aws/10 text-aws border border-aws/30",
  },
  planned: {
    label: "Planned",
    className: "bg-surface text-muted border border-border-subtle",
  },
  "In development": {
    label: "In Development",
    className: "bg-blue-900/40 text-blue-400 border border-blue-800",
  },
};

export default async function ArchitectureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const arch = getArchitecture(slug);
  if (!arch) notFound();

  const status = statusConfig[arch.status];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border-subtle sticky top-0 bg-background/90 backdrop-blur-sm z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/#arquitecturas"
            className="text-muted hover:text-foreground transition-colors text-sm flex items-center gap-1.5"
          >
            ← Arquitecturas
          </Link>
          <span className="text-border-subtle">/</span>
          <span className="text-sm text-muted font-mono">{arch.slug}</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="font-mono text-aws text-sm">{arch.number}</span>
            <span
              className={`text-xs font-mono px-2 py-1 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
            <span className="text-xs font-mono px-2 py-1 rounded-full bg-aws/10 border border-aws/30 text-aws">
              ☁️ AWS Architecture
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            {arch.title}
          </h1>
          <p className="text-muted text-xl leading-relaxed max-w-3xl mb-8">
            {arch.tagline}
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap mb-8">
            {arch.githubUrl ? (
              <a
                href={arch.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-border-subtle text-foreground px-5 py-2.5 rounded font-semibold text-sm hover:border-foreground/40 hover:text-aws transition-colors"
              >
                <GitHubIcon />
                Ver en GitHub
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 border border-border-subtle text-muted px-5 py-2.5 rounded font-semibold text-sm opacity-50 cursor-not-allowed">
                <GitHubIcon />
                GitHub (próximamente)
              </span>
            )}

            {arch.demoUrl ? (
              <a
                href={arch.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-aws text-black px-5 py-2.5 rounded font-semibold text-sm hover:bg-aws-hover transition-colors"
              >
                ▶ Ver Demo
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 border border-border-subtle text-muted px-5 py-2.5 rounded font-semibold text-sm opacity-50 cursor-not-allowed">
                ▶ Demo (próximamente)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {arch.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono bg-surface border border-border-subtle text-foreground px-3 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Problema & Solución */}
        <Section title="Problema & Solución">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <p className="text-xs font-mono text-muted uppercase tracking-widest mb-3">
                Problema
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {arch.problem}
              </p>
            </div>
            <div className="bg-surface border border-aws/20 rounded-xl p-6">
              <p className="text-xs font-mono text-aws uppercase tracking-widest mb-3">
                Solución
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {arch.solution}
              </p>
            </div>
          </div>
        </Section>

        {/* Diagrama */}
        <Section title="Diagrama de Arquitectura">
          {arch.diagramImage ? (
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <Image
                src={arch.diagramImage}
                alt={`Diagrama de arquitectura — ${arch.title}`}
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
          ) : (
            <div className="bg-surface border border-border-subtle rounded-xl p-6 overflow-x-auto">
              <pre className="font-mono text-sm text-foreground/80 leading-relaxed whitespace-pre">
                {arch.diagram}
              </pre>
            </div>
          )}
        </Section>

        {/* Cómo funciona */}
        <Section title="Cómo Funciona">
          <div className="flex flex-col gap-6">
            {arch.steps.map((step) => (
              <div key={step.n} className="flex gap-5">
                <div className="shrink-0 w-8 h-8 rounded-full bg-aws/10 border border-aws/30 flex items-center justify-center">
                  <span className="text-aws font-mono text-sm font-bold">
                    {step.n}
                  </span>
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Servicios AWS */}
        <Section title="Servicios AWS">
          <div className="grid md:grid-cols-2 gap-4">
            {arch.services.map((svc) => (
              <div
                key={svc.name}
                className="bg-surface border border-border-subtle rounded-xl p-5 hover:border-aws/30 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-xs font-mono bg-aws/10 text-aws border border-aws/30 px-2 py-0.5 rounded shrink-0">
                    AWS
                  </span>
                  <p className="font-semibold text-foreground text-sm">
                    {svc.name}
                  </p>
                </div>
                <p className="text-xs text-muted mb-2">{svc.role}</p>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  {svc.detail}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Decisiones Técnicas */}
        <Section title="Decisiones Técnicas (Trade-offs)">
          <div className="flex flex-col gap-6">
            {arch.decisions.map((d) => (
              <div
                key={d.title}
                className="bg-surface border border-border-subtle rounded-xl p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">
                  {d.title}
                </h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-foreground/5 border border-border-subtle rounded-lg p-4">
                    <p className="text-xs font-mono text-aws uppercase tracking-widest mb-2">
                      Elegido
                    </p>
                    <p className="text-foreground text-sm font-medium">
                      {d.chosen}
                    </p>
                  </div>
                  <div className="bg-background border border-border-subtle rounded-lg p-4">
                    <p className="text-xs font-mono text-muted uppercase tracking-widest mb-2">
                      Alternativas
                    </p>
                    <ul className="text-sm text-muted space-y-1">
                      {d.alternatives.map((alt) => (
                        <li key={alt} className="flex items-start gap-1.5">
                          <span className="text-border-subtle mt-1">—</span>
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-border-subtle pt-4">
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-2">
                    Razón
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {d.why}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Seguridad & Escalabilidad */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Section title="Seguridad" noBorder>
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <ul className="space-y-3">
                {arch.security.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                  >
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section title="Escalabilidad" noBorder>
            <div className="bg-surface border border-border-subtle rounded-xl p-6">
              <ul className="space-y-3">
                {arch.scalability.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                  >
                    <span className="text-aws mt-0.5 shrink-0">↑</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>

        {/* Estimación de Costos */}
        <Section title="Estimación de Costos">
          <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-6 py-3 text-xs font-mono text-muted uppercase tracking-widest">
                    Servicio / Concepto
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-mono text-muted uppercase tracking-widest">
                    Estimado
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-mono text-muted uppercase tracking-widest hidden md:table-cell">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {arch.cost.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border-subtle last:border-0 ${
                      i % 2 === 0 ? "bg-background/30" : ""
                    }`}
                  >
                    <td className="px-6 py-3 text-foreground/80 font-mono text-xs">
                      {row.item}
                    </td>
                    <td className="px-6 py-3 text-aws font-mono text-xs font-semibold">
                      {row.estimate}
                    </td>
                    <td className="px-6 py-3 text-muted text-xs hidden md:table-cell">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Code Snippets */}
        <Section title="Snippets de Código">
          <div className="flex flex-col gap-8">
            {arch.snippets.map((snippet) => (
              <div
                key={snippet.title}
                className="bg-surface border border-border-subtle rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
                  <span className="text-sm font-medium text-foreground">
                    {snippet.title}
                  </span>
                  <span className="text-xs font-mono text-muted">
                    {snippet.language}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <pre className="p-6 text-xs font-mono text-foreground/85 leading-relaxed">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Back CTA */}
        <div className="border-t border-border-subtle pt-12 flex flex-wrap gap-3">
          <Link
            href="/#arquitecturas"
            className="border border-border-subtle text-foreground px-6 py-3 rounded font-semibold hover:border-aws hover:text-aws transition-colors text-sm"
          >
            ← Ver todas las arquitecturas
          </Link>
          {arch.githubUrl && (
            <a
              href={arch.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border-subtle text-foreground px-6 py-3 rounded font-semibold text-sm hover:border-foreground/40 hover:text-aws transition-colors"
            >
              <GitHubIcon />
              GitHub
            </a>
          )}
          {arch.demoUrl && (
            <a
              href={arch.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-aws/40 text-aws px-6 py-3 rounded font-semibold text-sm hover:bg-aws/5 transition-colors"
            >
              ▶ Ver Demo
            </a>
          )}
          <a
            href="https://wa.me/573116534760"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-aws text-black px-6 py-3 rounded font-semibold hover:bg-aws-hover transition-colors text-sm"
          >
            💬 Hablemos de este proyecto
          </a>
        </div>
      </main>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function Section({
  title,
  children,
  noBorder,
}: {
  title: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div className={`${noBorder ? "" : "mb-16"}`}>
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border-subtle hidden md:block" />
        {title}
        <span className="h-px flex-1 bg-border-subtle hidden md:block" />
      </h2>
      {children}
    </div>
  );
}
