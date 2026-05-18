type Degree = {
  institution: string;
  location: string;
  degree: string;
  minor?: string;
  period: string;
  description: string;
  highlights: string[];
};

const education: Degree[] = [
  {
    institution: "Universidad Simón Bolívar",
    location: "Barranquilla, Colombia",
    degree: "Ingeniero de Sistemas",
    minor: "Minor en Ingeniería de Software y Gestión de la Tecnología de la Información",
    period: "Egresado",
    description:
      "Formación integral en diseño, desarrollo y gestión de sistemas de información, con énfasis en arquitectura de software, ingeniería de procesos y gestión tecnológica.",
    highlights: [
      "Arquitectura y diseño de sistemas",
      "Ingeniería de software",
      "Gestión de la tecnología de la información",
      "Bases de datos y sistemas distribuidos",
      "Redes y comunicaciones",
    ],
  },
];

export function Education() {
  return (
    <section id="educacion" className="py-24 px-6 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-muted text-sm tracking-widest uppercase mb-3">
            Formación
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Estudios
          </h2>
        </div>

        <div className="flex flex-col gap-8">
          {education.map((item) => (
            <div
              key={item.institution}
              className="bg-surface border border-border-subtle rounded-xl p-8 flex flex-col md:flex-row gap-8"
            >
              {/* Left column */}
              <div className="md:w-64 shrink-0">
                <p className="font-mono text-aws text-xs tracking-widest uppercase mb-2">
                  {item.period}
                </p>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {item.institution}
                </h3>
                <p className="text-muted text-sm">{item.location}</p>
              </div>

              {/* Right column */}
              <div className="flex-1">
                <div className="mb-4">
                  <span className="inline-block bg-aws/10 border border-aws/30 text-aws font-semibold text-sm px-4 py-1.5 rounded-full mb-3">
                    {item.degree}
                  </span>
                  {item.minor && (
                    <div>
                      <span className="inline-block bg-surface border border-border-subtle text-foreground text-sm px-4 py-1.5 rounded-full">
                        {item.minor}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-muted text-sm leading-relaxed mb-6">
                  {item.description}
                </p>

                <div>
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-3">
                    Áreas de enfoque
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-sm bg-background border border-border-subtle text-foreground px-3 py-1.5 rounded font-mono"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
