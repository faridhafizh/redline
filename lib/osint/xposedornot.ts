import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";

interface XonBreach {
  breach?: string;
  details?: string;
  domain?: string;
  industry?: string;
  password_risk?: string;
  references?: string;
  searchable?: string;
  verified?: string;
  xposed_data?: string;
  xposed_date?: string;
  xposed_records?: number;
}

interface XonResponse {
  BreachMetrics?: unknown;
  BreachesSummary?: { site?: string };
  ExposedBreaches?: { breaches_details?: XonBreach[] } | null;
  PastesSummary?: { cnt?: number };
  Error?: string;
}

export async function run(query: string): Promise<AdapterOutput> {
  try {
    const raw = await fetchJson<XonResponse>(
      `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(query)}`,
      { timeoutMs: 10_000, retries: 1 },
    );

    const summarySites = (raw.BreachesSummary?.site ?? "")
      .split(";")
      .map((site) => site.trim())
      .filter(Boolean);

    const breaches = (raw.ExposedBreaches?.breaches_details ?? []).map(
      (breach) => ({
        name: breach.breach ?? "Tidak diketahui",
        domain: breach.domain || null,
        industry: breach.industry ?? null,
        date: breach.xposed_date ?? null,
        records: breach.xposed_records ?? null,
        dataClasses: (breach.xposed_data ?? "")
          .split(";")
          .map((value) => value.trim())
          .filter(Boolean),
        passwordRisk: breach.password_risk ?? null,
        verified: breach.verified === "Yes",
        searchable: breach.searchable === "Yes",
        reference: breach.references || null,
      }),
    );

    const data = {
      email: query,
      breachCount: Math.max(summarySites.length, breaches.length),
      breachNames: summarySites,
      breaches,
      pasteCount: raw.PastesSummary?.cnt ?? 0,
    };

    return { data, empty: data.breachCount === 0 };
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return {
        data: {
          email: query,
          breachCount: 0,
          breachNames: [],
          breaches: [],
          pasteCount: 0,
        },
        empty: true,
      };
    }
    throw error;
  }
}
