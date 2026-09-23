type Doc = {
  label: string;
  description: string;
  href: string;
  lang: "ES" | "EN";
  icon: string;
  primary?: boolean;
};

const documents: Doc[] = [
  {
    label: "Currículum",
    description: "Hoja de vida en español",
    href: "/cv/alfredo-dominguez-cv-es.pdf",
    lang: "ES",
    icon: "📄",
    primary: true,
  },
  {
    label: "Résumé",
    description: "Resume in English",
    href: "/cv/alfredo-dominguez-cv-en.pdf",
    lang: "EN",
    icon: "📄",
  },
  {
    label: "Carta de presentación",
    description: "Carta de presentación en español",
    href: "/letters/alfredo-dominguez-carta-presentacion-es.pdf",
    lang: "ES",
    icon: "✍️",
  },
  {
    label: "Cover Letter",
    description: "Cover letter in English",
    href: "/letters/alfredo-dominguez-cover-letter-en.pdf",
    lang: "EN",
    icon: "✍️",
  },
];

export function Documents() {
  return (
    <section
      id="documentos"
      className="py-24 px-6 border-t border-border-subtle"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-muted text-sm tracking-widest uppercase mb-3">
            Documentos
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            CV y cartas
          </h2>
          <p className="text-muted mt-4 max-w-xl">
            Hoja de vida y carta de presentación disponibles en español e
            inglés, listas para descargar.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              download
              className={`flex flex-col gap-3 p-5 rounded-xl border transition-colors ${
                doc.primary
                  ? "bg-aws text-black border-aws hover:bg-aws-hover"
                  : "bg-surface border-border-subtle text-foreground hover:border-aws/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{doc.icon}</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                    doc.primary
                      ? "border-black/20 bg-black/10 text-black"
                      : "border-border-subtle text-muted"
                  }`}
                >
                  {doc.lang}
                </span>
              </div>
              <div>
                <p
                  className={`font-semibold text-sm ${
                    doc.primary ? "text-black" : "text-foreground"
                  }`}
                >
                  {doc.label}
                </p>
                <p
                  className={`text-xs font-mono mt-0.5 ${
                    doc.primary ? "text-black/70" : "text-muted"
                  }`}
                >
                  {doc.description}
                </p>
              </div>
              <span
                className={`text-xs font-mono mt-auto ${
                  doc.primary ? "text-black/70" : "text-aws"
                }`}
              >
                ↓ Descargar PDF
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
