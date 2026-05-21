export type Status = "live" | "building" | "planned";

export type CodeSnippet = {
  title: string;
  language: string;
  code: string;
};

export type Step = {
  n: number;
  title: string;
  detail: string;
};

export type Service = {
  name: string;
  role: string;
  detail: string;
};

export type Decision = {
  title: string;
  chosen: string;
  why: string;
  alternatives: string[];
};

export type CostItem = {
  item: string;
  estimate: string;
  note?: string;
};

export type Architecture = {
  slug: string;
  number: string;
  title: string;
  tagline: string;
  status: Status;
  tags: string[];
  problem: string;
  solution: string;
  diagram: string;
  diagramImage?: string;
  steps: Step[];
  services: Service[];
  decisions: Decision[];
  security: string[];
  scalability: string[];
  cost: CostItem[];
  snippets: CodeSnippet[];
  githubUrl?: string;
  demoUrl?: string;
};

export type TechGroup = {
  category: string;
  items: string[];
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  status: Status;
  tags: string[];
  problem: string;
  solution: string;
  diagram: string;
  steps: Step[];
  techStack: TechGroup[];
  decisions: Decision[];
  snippets: CodeSnippet[];
  githubUrl?: string;
  demoUrl?: string;
};
