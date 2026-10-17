import { getSourcesForType } from "./osint/registry";
import type {
  AgentId,
  AgentProgress,
  QueryType,
  SourceDefinition,
  SourceResult,
} from "./types";

export interface AgentDefinition {
  id: AgentId;
  label: string;
  mandate: string;
  sourceIds: SourceResult["source"][];
}

export const AGENTS: AgentDefinition[] = [
  {
    id: "infra",
    label: "Agent Infrastruktur",
    mandate: "Pemetaan IP, domain, DNS, dan jejak arsip.",
    sourceIds: [
      "shodan-internetdb",
      "rdap",
      "crtsh",
      "ipgeolocation",
      "ripestat",
      "dns-doh",
      "wayback",
    ],
  },
  {
    id: "leak",
    label: "Agent Kebocoran",
    mandate: "Deteksi data bocor dan profil tertaut email.",
    sourceIds: ["xposedornot", "gravatar"],
  },
  {
    id: "media",
    label: "Agent Media",
    mandate: "Berita, diskusi publik, dan wawasan ensiklopedia.",
    sourceIds: ["gdelt", "wikidata", "hackernews", "wikipedia", "stackexchange"],
  },
  {
    id: "corporate",
    label: "Agent Korporasi",
    mandate: "Jejak perusahaan, dokumen SEC, dan repositori.",
    sourceIds: ["sec-edgar", "github-search"],
  },
  {
    id: "identity",
    label: "Agent Identitas",
    mandate: "Profil akun dan enumerasi identitas.",
    sourceIds: [
      "github-user",
      "gitlab-user",
      "keybase",
      "phone-info",
      "numverify",
    ],
  },
];

export interface AgentPlan extends AgentDefinition {
  sources: SourceDefinition[];
}

export function getAgent(id: AgentId): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === id);
}

export function planAgents(type: QueryType): AgentPlan[] {
  const relevant = getSourcesForType(type);
  const byId = new Map(relevant.map((source) => [source.id, source]));

  return AGENTS.map((agent) => ({
    ...agent,
    sources: agent.sourceIds
      .map((id) => byId.get(id))
      .filter((source): source is SourceDefinition => Boolean(source)),
  })).filter((agent) => agent.sources.length > 0);
}

export function getSourceAgent(sourceId: string): AgentId | undefined {
  return AGENTS.find((agent) => agent.sourceIds.includes(sourceId as never))?.id;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function summarizeResult(result: SourceResult): string | null {
  const data = asRecord(result.data);

  switch (result.source) {
    case "shodan-internetdb": {
      const ports = arr(data.ports).length;
      const vulns = arr(data.vulns).length;
      return `${ports} port terbuka${vulns ? ` · ${vulns} CVE` : ""}`;
    }
    case "ipgeolocation": {
      const connection = asRecord(data.connection);
      const place = [str(data.city), str(data.country)].filter(Boolean).join(", ");
      return place || str(connection.isp);
    }
    case "ripestat":
      return str(data.prefix);
    case "crtsh":
      return `${num(data.subdomainCount)} subdomain`;
    case "rdap":
      return str(data.name);
    case "dns-doh": {
      const mail = str(data.mailProvider);
      const parts = [mail, str(data.spf) ? "SPF" : null, str(data.dmarc) ? "DMARC" : null];
      const line = parts.filter(Boolean).join(" · ");
      return line || null;
    }
    case "wayback":
      return `${num(data.snapshotCount)} snapshot arsip`;
    case "xposedornot":
      return `${num(data.breachCount)} kebocoran`;
    case "gravatar":
      return data.found ? str(data.displayName) ?? "Profil ditemukan" : null;
    case "gdelt":
      return `${num(data.articleCount)} artikel berita`;
    case "hackernews":
      return data.found
        ? `Profil HN · ${num(arr(data.stories).length)} kiriman`
        : `${num(arr(data.stories).length)} diskusi`;
    case "wikipedia":
      return `${num(data.articleCount)} artikel`;
    case "stackexchange":
      return `${num(data.questionCount)} pertanyaan`;
    case "sec-edgar":
      return `${num(arr(data.companies).length)} perusahaan`;
    case "github-search":
      return `${num(data.totalCount)} repositori`;
    case "github-user":
      return data.found ? `GitHub · ${num(data.publicRepos)} repo` : null;
    case "gitlab-user":
      return data.found ? "Profil GitLab ditemukan" : null;
    case "keybase":
      return data.found ? `${num(arr(data.proofs).length)} proof sosial` : null;
    case "phone-info":
      return str(data.typeLabel) ?? null;
    case "numverify": {
      const carrier = str(data.carrier);
      const lineType = str(data.lineType);
      return carrier ? `${carrier}${lineType ? ` · ${lineType}` : ""}` : lineType;
    }
    default:
      return null;
  }
}

export function summarizeAgent(
  plan: AgentPlan,
  results: SourceResult[],
): AgentProgress {
  const successCount = results.filter((r) => r.status === "success").length;
  const emptyCount = results.filter((r) => r.status === "empty").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  const highlights = results
    .filter((r) => r.status === "success")
    .map((r) => summarizeResult(r))
    .filter((value): value is string => Boolean(value))
    .slice(0, 4);

  return {
    id: plan.id,
    label: plan.label,
    mandate: plan.mandate,
    status: "done",
    successCount,
    emptyCount,
    errorCount,
    highlights,
  };
}

export function runningAgent(plan: AgentPlan): AgentProgress {
  return {
    id: plan.id,
    label: plan.label,
    mandate: plan.mandate,
    status: "running",
    successCount: 0,
    emptyCount: 0,
    errorCount: 0,
    highlights: [],
  };
}
