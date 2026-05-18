export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-14">
      <div className="text-center max-w-4xl">
        {/* Dual role badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
          <span className="inline-flex items-center gap-2 bg-aws/10 border border-aws/30 text-aws font-mono text-sm px-4 py-1.5 rounded-full">
            ☁️ AWS Solutions Architect
          </span>
          <span className="text-muted hidden sm:block">&</span>
          <span className="inline-flex items-center gap-2 bg-surface border border-border-subtle text-foreground font-mono text-sm px-4 py-1.5 rounded-full">
            💻 Full Stack Engineer
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-6 leading-none tracking-tight">
          Ingeniero Alfredo
          <br />
          <span className="text-aws">Dominguez</span>
        </h1>

        <p className="text-muted text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
          Diseño arquitecturas AWS escalables, seguras y costo-eficientes — y
          construyo las aplicaciones que corren sobre ellas, de extremo a
          extremo.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <a
            href="#arquitecturas"
            className="bg-aws text-black px-8 py-3 rounded font-semibold hover:bg-aws-hover transition-colors"
          >
            ☁️ Arquitecturas AWS
          </a>
          <a
            href="#proyectos"
            className="border border-border-subtle text-foreground px-8 py-3 rounded font-semibold hover:border-aws hover:text-aws transition-colors"
          >
            💻 Proyectos Full Stack
          </a>
          <a
            href="https://www.linkedin.com/in/alfredo-jose-dominguez-hernandez"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border-subtle text-muted px-8 py-3 rounded font-semibold hover:border-aws/40 hover:text-foreground transition-colors"
          >
            LinkedIn →
          </a>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted flex-wrap">
          <span>📍 Barranquilla, Colombia</span>
          <span className="hidden sm:block text-border-subtle">·</span>
          <span>🌎 Disponible para trabajo remoto global</span>
          <span className="hidden sm:block text-border-subtle">·</span>
          <span>AWS · Node.js · React · TypeScript · Terraform</span>
        </div>
      </div>
    </section>
  );
}
