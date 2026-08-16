export type FieldId =
  | "software"
  | "ai"
  | "engineering"
  | "economics"
  | "law"
  | "medicine"
  | "biology"
  | "chemistry"
  | "physics"
  | "math"
  | "business"
  | "other";

export const FIELD_LABEL: Record<FieldId, string> = {
  software: "software",
  ai: "AI",
  engineering: "engineering",
  economics: "economics",
  law: "law",
  medicine: "medicine",
  biology: "biology",
  chemistry: "chemistry",
  physics: "physics",
  math: "mathematics",
  business: "business",
  other: "this field",
};

const CUES: { id: FieldId; words: string[] }[] = [
  {
    id: "software",
    words: [
      "kubernetes", "docker", "api", "git", "github", "deploy", "cluster",
      "server", "compiler", "runtime", "kubernetes", "repo", "commit",
      "pull request", "container", "linux", "cli", "daemon", "endpoint",
      "frontend", "backend", "typescript", "javascript", "python",
      "opensource", "open-source", "dev", "devops", "yaml", "json",
      "tailscale", "wireguard", "traefik", "ssh",
    ],
  },
  {
    id: "ai",
    words: [
      "llm", "transformer", "token", "embedding", "gradient", "model",
      "inference", "prompt", "fine-tune", "finetune", "neural", "gpt",
      "claude", "agent", "context window", "logits", "attention",
    ],
  },
  {
    id: "law",
    words: [
      "plaintiff", "defendant", "statute", "tort", "jurisdiction",
      "precedent", "holding", "certiorari", "contract", "liability",
      "injunction", "habeas", "constitutional", "appellate", "brief",
      "due process", "consideration", "fiduciary",
    ],
  },
  {
    id: "medicine",
    words: [
      "patient", "clinical", "diagnosis", "symptom", "dose", "trial",
      "randomized", "pathology", "cardi", "oncolog", "therapy",
      "prognosis", "lesion", "chronic", "acute",
    ],
  },
  {
    id: "biology",
    words: [
      "gene", "genome", "protein", "rna", "dna", "cell", "enzyme",
      "transcription", "translation", "crispr", "allele", "species",
      "mutation", "mitochond", "photosynth", "organism",
    ],
  },
  {
    id: "economics",
    words: [
      "inflation", "elasticity", "gdp", "fiscal", "monetary", "utility",
      "externality", "oligopoly", "equilibrium", "supply", "demand",
      "tariff", "liquidity", "recession", "keynes",
    ],
  },
  {
    id: "physics",
    words: [
      "quantum", "photon", "particle", "velocity", "momentum", "entropy",
      "relativity", "hamiltonian", "wavefunction", "fermion", "boson",
      "thermodynamic", "electromagnet",
    ],
  },
  {
    id: "chemistry",
    words: [
      "molecule", "reagent", "catalyst", "molar", "oxidation", "polymer",
      "compound", "ion", "valence", "stoichiometr", "organic",
    ],
  },
  {
    id: "math",
    words: [
      "theorem", "lemma", "proof", "integer", "topology", "eigen",
      "manifold", "homomorphism", "axiom", "corollary", "vector space",
    ],
  },
  {
    id: "business",
    words: [
      "revenue", "stakeholder", "ebitda", "margin", "kpi", "okrs",
      "valuation", "runway", "churn", "saas", "p&l",
    ],
  },
  {
    id: "engineering",
    words: [
      "voltage", "torque", "tolerance", "schematic", "firmware",
      "pcb", "load-bearing", "tensile", "hydraulic",
    ],
  },
];

export function inferField(title: string, text: string): FieldId {
  const hay = `${title}\n${text}`.toLowerCase();
  let best: FieldId = "other";
  let bestScore = 0;
  for (const cue of CUES) {
    let score = 0;
    for (const w of cue.words) {
      if (hay.includes(w)) score += w.includes(" ") ? 3 : 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cue.id;
    }
  }
  return bestScore >= 4 ? best : "other";
}

export function readerStance(field: FieldId): string {
  switch (field) {
    case "software":
    case "ai":
      return "a curious adult who has never opened a terminal and does not work on a software team";
    case "law":
      return "a curious adult who has never taken a law class";
    case "medicine":
      return "a curious adult who is not a clinician";
    case "biology":
    case "chemistry":
    case "physics":
    case "math":
      return `a curious adult who has not studied ${FIELD_LABEL[field]} past school`;
    case "economics":
    case "business":
      return "a curious adult who does not work in markets or a firm";
    case "engineering":
      return "a curious adult who does not work as an engineer";
    default:
      return "a curious adult teaching themselves a field they were not trained in";
  }
}

export function fieldKicker(field?: string): string {
  if (!field || field === "other" || field === "this field") return "In this passage";
  return `In this ${field} piece`;
}
