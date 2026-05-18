type TechCategory = {
  label: string;
  track: "cloud" | "fullstack";
  items: string[];
};

const stack: TechCategory[] = [
  {
    label: "Cloud & AWS",
    track: "cloud",
    items: [
      "Cloud Architecture",
      "Serverless",
      "High Availability",
      "Security",
      "ECS Fargate",
      "Lambda",
      "CloudFront",
      "S3",
      "RDS",
      "DynamoDB",
      "SQS",
      "SNS",
      "API Gateway",
      "VPC",
      "IAM",
      "CloudWatch",
    ],
  },
  {
    label: "DevOps & Infrastructure",
    track: "cloud",
    items: [
      "CI/CD",
      "Infrastructure as Code",
      "Terraform",
      "Docker",
      "Kubernetes",
      "Linux",
      "GitHub Actions",
      "Azure",
    ],
  },
  {
    label: "Frontend",
    track: "fullstack",
    items: ["React", "Next.js", "React Native", "TypeScript", "JavaScript", "Tailwind CSS"],
  },
  {
    label: "Backend & APIs",
    track: "fullstack",
    items: ["Node.js", "REST APIs", "Express", "TypeScript"],
  },
  {
    label: "Databases",
    track: "fullstack",
    items: ["PostgreSQL", "MySQL", "MongoDB", "DynamoDB", "Redis"],
  },
  {
    label: "Tools",
    track: "fullstack",
    items: ["Git", "GitHub", "VS Code", "Postman"],
  },
];

const trackLabel: Record<TechCategory["track"], string> = {
  cloud: "☁️ Cloud",
  fullstack: "💻 Full Stack",
};

const trackColor: Record<TechCategory["track"], string> = {
  cloud: "border-aws/30 text-aws",
  fullstack: "border-border-subtle text-muted",
};

export function TechStack() {
  return (
    <section id="stack" className="py-24 px-6 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="font-mono text-aws text-sm tracking-widest uppercase mb-3">
            Tecnologías
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Stack completo
          </h2>
          <p className="text-muted mt-4 max-w-xl">
            Cloud como especialidad principal, Full Stack como capacidad end-to-end.
          </p>
        </div>

        {/* Track legend */}
        <div className="flex gap-4 mb-12 flex-wrap">
          {(["cloud", "fullstack"] as const).map((track) => (
            <span
              key={track}
              className={`text-xs font-mono px-3 py-1 rounded-full border ${trackColor[track]}`}
            >
              {trackLabel[track]}
            </span>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {stack.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-mono text-muted uppercase tracking-widest">
                  {group.label}
                </p>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full border ${trackColor[group.track]}`}
                >
                  {trackLabel[group.track]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="text-sm bg-surface border border-border-subtle text-foreground px-3 py-1.5 rounded font-mono hover:border-aws/40 transition-colors"
                  >
                    {item}
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
