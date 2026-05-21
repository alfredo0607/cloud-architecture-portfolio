type Cert = {
  code: string;
  name: string;
  provider: "aws" | "azure" | "hashicorp";
  level: string;
  status: "obtained" | "studying" | "planned";
};

const certifications: Cert[] = [
  // AWS
  {
    code: "CLF-C02",
    name: "AWS Cloud Practitioner",
    provider: "aws",
    level: "Foundational",
    status: "planned",
  },
  {
    code: "DVA-C02",
    name: "AWS Developer – Associate",
    provider: "aws",
    level: "Associate",
    status: "planned",
  },
  {
    code: "SAA-C03",
    name: "AWS Solutions Architect – Associate",
    provider: "aws",
    level: "Associate",
    status: "planned",
  },
  {
    code: "SAP-C02",
    name: "AWS Solutions Architect – Professional",
    provider: "aws",
    level: "Professional",
    status: "planned",
  },

  // Azure
  {
    code: "AZ-900",
    name: "Azure Fundamentals",
    provider: "azure",
    level: "Foundational",
    status: "planned",
  },
  {
    code: "AZ-104",
    name: "Azure Administrator Associate",
    provider: "azure",
    level: "Associate",
    status: "planned",
  },
  // HashiCorp
  {
    code: "TA-002",
    name: "Terraform Associate",
    provider: "hashicorp",
    level: "Associate",
    status: "planned",
  },
];

const providerConfig = {
  aws: {
    label: "AWS",
    badgeClass: "bg-[#ff9900]/10 border-[#ff9900]/30 text-[#ff9900]",
    dotClass: "bg-[#ff9900]",
  },
  azure: {
    label: "Azure",
    badgeClass: "bg-[#0078d4]/10 border-[#0078d4]/30 text-[#0078d4]",
    dotClass: "bg-[#0078d4]",
  },
  hashicorp: {
    label: "HashiCorp",
    badgeClass: "bg-[#7b42bc]/10 border-[#7b42bc]/30 text-[#7b42bc]",
    dotClass: "bg-[#7b42bc]",
  },
};

const statusConfig: Record<
  Cert["status"],
  { label: string; className: string }
> = {
  obtained: {
    label: "✓ Obtenida",
    className: "bg-green-900/40 text-green-400 border border-green-800",
  },
  studying: {
    label: "Estudiando",
    className: "bg-aws/10 text-aws border border-aws/30",
  },
  planned: {
    label: "Meta",
    className: "bg-surface text-muted border border-border-subtle",
  },
};

const providers = ["aws", "azure", "hashicorp"] as const;

export function Certifications() {
  return (
    <section
      id="certificaciones"
      className="py-24 px-6 border-t border-border-subtle"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-muted text-sm tracking-widest uppercase mb-3">
            Credenciales
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Certificaciones
          </h2>
          <p className="text-muted mt-4 max-w-xl">
            Roadmap de certificaciones cloud. AWS como prioridad principal,
            Azure y Terraform como complemento.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {providers.map((provider) => {
            const certs = certifications.filter((c) => c.provider === provider);
            const config = providerConfig[provider];
            return (
              <div key={provider}>
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className={`text-sm font-mono font-semibold px-3 py-1 rounded-full border ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certs.map((cert) => {
                    const status = statusConfig[cert.status];
                    return (
                      <div
                        key={cert.code}
                        className="bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-3 hover:border-foreground/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs text-muted">
                            {cert.code}
                          </span>
                          <span
                            className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-foreground font-semibold text-sm leading-snug">
                            {cert.name}
                          </p>
                          <p className="text-muted text-xs mt-1">
                            {cert.level}
                          </p>
                        </div>

                        {/* Level indicator dots */}
                        <div className="flex gap-1.5 mt-auto">
                          {["Foundational", "Associate", "Professional"].map(
                            (lvl, i) => {
                              const levels = [
                                "Foundational",
                                "Associate",
                                "Professional",
                              ];
                              const currentIdx = levels.indexOf(cert.level);
                              const filled = i <= currentIdx;
                              return (
                                <div
                                  key={lvl}
                                  className={`h-1.5 flex-1 rounded-full ${
                                    filled
                                      ? config.dotClass
                                      : "bg-border-subtle"
                                  }`}
                                />
                              );
                            },
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
