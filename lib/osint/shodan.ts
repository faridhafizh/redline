import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";

interface InternetDbResponse {
  ip?: string;
  ports?: number[];
  hostnames?: string[];
  cpes?: string[];
  tags?: string[];
  vulns?: string[];
}

export async function run(query: string): Promise<AdapterOutput> {
  try {
    const raw = await fetchJson<InternetDbResponse>(
      `https://internetdb.shodan.io/${encodeURIComponent(query)}`,
      { timeoutMs: 8_000, retries: 1 },
    );

    const data = {
      ip: raw.ip ?? query,
      ports: (raw.ports ?? []).sort((a, b) => a - b),
      hostnames: raw.hostnames ?? [],
      tags: raw.tags ?? [],
      cpes: raw.cpes ?? [],
      vulns: raw.vulns ?? [],
    };

    const empty =
      data.ports.length === 0 &&
      data.hostnames.length === 0 &&
      data.vulns.length === 0 &&
      data.tags.length === 0;

    return { data, empty };
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return {
        data: {
          ip: query,
          ports: [],
          hostnames: [],
          tags: [],
          cpes: [],
          vulns: [],
        },
        empty: true,
      };
    }
    throw error;
  }
}
