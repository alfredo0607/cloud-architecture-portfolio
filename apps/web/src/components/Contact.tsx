const links = [
  {
    label: "WhatsApp",
    href: "https://wa.me/573116534760",
    description: "+57 311 653 4760",
    primary: true,
    icon: "💬",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/alfredo-jose-dominguez-hernandez",
    description: "alfredo-jose-dominguez-hernandez",
    primary: false,
    icon: "🔗",
  },
  {
    label: "GitHub",
    href: "https://github.com/Alfredo0607",
    description: "github.com/Alfredo0607",
    primary: false,
    icon: "⌨️",
  },
  {
    label: "Email",
    href: "mailto:alfredojosedominguezhernandez@gmail.com",
    description: "alfredojosedominguezhernandez@gmail.com",
    primary: false,
    icon: "✉️",
  },
];

export function Contact() {
  return (
    <section id="contacto" className="py-24 px-6 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-aws text-sm tracking-widest uppercase mb-3">
            Contacto
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Hablemos de arquitectura
          </h2>
          <p className="text-muted text-lg leading-relaxed max-w-xl">
            ¿Tienes un proyecto cloud que necesita diseño sólido? ¿Buscas un
            arquitecto o desarrollador para tu equipo? Estoy disponible para
            consultoría, proyectos y trabajo remoto global.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={`flex flex-col gap-3 p-5 rounded-xl border transition-colors ${
                link.primary
                  ? "bg-aws text-black border-aws hover:bg-aws-hover"
                  : "bg-surface border-border-subtle text-foreground hover:border-aws/40"
              }`}
            >
              <span className="text-2xl">{link.icon}</span>
              <div>
                <p
                  className={`font-semibold text-sm ${
                    link.primary ? "text-black" : "text-foreground"
                  }`}
                >
                  {link.label}
                </p>
                <p
                  className={`text-xs font-mono mt-0.5 truncate ${
                    link.primary ? "text-black/70" : "text-muted"
                  }`}
                >
                  {link.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border-subtle py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <span className="font-mono">
          Alfredo José Dominguez Hernández · AWS Solutions Architect & Full Stack Engineer
        </span>
        <span className="font-mono text-xs">
          Construido con criterio arquitectónico, no solo con código.
        </span>
      </div>
    </footer>
  );
}
