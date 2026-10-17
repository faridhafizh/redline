export type QueryType =
  | "domain"
  | "ip"
  | "email"
  | "phone"
  | "username"
  | "keyword";

export type SourceStatus =
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "unsupported";

export type SourceCategory = "domain" | "ip" | "email" | "keyword" | "identity";

export type SourceId =
  | "shodan-internetdb"
  | "rdap"
  | "crtsh"
  | "xposedornot"
  | "ipgeolocation"
  | "ripestat"
  | "gdelt"
  | "wikidata"
  | "sec-edgar"
  | "wayback"
  | "dns-doh"
  | "hackernews"
  | "github-search"
  | "wikipedia"
  | "stackexchange"
  | "github-user"
  | "gitlab-user"
  | "keybase"
  | "gravatar"
  | "phone-info"
  | "numverify";

export type AgentId =
  | "infra"
  | "leak"
  | "media"
  | "corporate"
  | "identity";

export type AgentStatus = "idle" | "running" | "done";

export interface AgentProgress {
  id: AgentId;
  label: string;
  mandate: string;
  status: AgentStatus;
  successCount: number;
  emptyCount: number;
  errorCount: number;
  highlights: string[];
}

export interface SourceDefinition {
  id: SourceId;
  label: string;
  category: SourceCategory;
  description: string;
  supports: QueryType[];
  url: string;
  requiredEnv?: string;
}

export interface SourceResult<T = unknown> {
  source: SourceId;
  label: string;
  category: SourceCategory;
  status: SourceStatus;
  agent?: AgentId;
  data?: T;
  error?: string;
  durationMs?: number;
}

export interface OsintAggregate {
  query: string;
  type: QueryType;
  results: SourceResult[];
  timestamp: string;
}

export type SearchEvent =
  | { type: "meta"; query: string; queryType: QueryType; sources: SourceId[]; agents: AgentId[]; cached: boolean; timestamp: string }
  | { type: "notice"; message: string; links: { label: string; url: string }[] }
  | { type: "agent"; agent: AgentProgress }
  | { type: "source"; result: SourceResult }
  | { type: "done"; timestamp: string }
  | { type: "error"; message: string };

export interface HistoryEntry {
  query: string;
  type: QueryType;
  timestamp: string;
}

export interface AdapterOutput {
  data: unknown;
  empty: boolean;
}

export type Adapter = (query: string) => Promise<AdapterOutput>;
