import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";

interface CrtshEntry {
  issuer_ca_id?: number;
  common_name?: string;
  name_value?: string;
  entry_timestamp?: string;
  not_before?: string;
  not_after?: string;
}

const MAX_SUBDOMAINS = 200;
const HOSTNAME_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

async function fetchCrtsh(query: string): Promise<CrtshEntry[] | { message?: string }> {
  const url = `https://crt.sh/?q=${encodeURIComponent(`%.${query}`)}&output=json`;
  try {
    return await fetchJson<CrtshEntry[] | { message?: string }>(url, {
      timeoutMs: 20_000,
      retries: 0,
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      return await fetchJson<CrtshEntry[] | { message?: string }>(url, {
        timeoutMs: 20_000,
        retries: 0,
      });
    }
    throw error;
  }
}

export async function run(query: string): Promise<AdapterOutput> {
  let raw: CrtshEntry[] | { message?: string };
  try {
    raw = await fetchCrtsh(query);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      raw = [];
    } else {
      throw error;
    }
  }

  const entries = Array.isArray(raw) ? raw : [];
  const subdomains = new Set<string>();
  const issuers = new Map<number, number>();
  let earliest: string | null = null;
  let latest: string | null = null;

  for (const entry of entries) {
    for (const value of (entry.name_value ?? "").split("\n")) {
      const name = value.trim().toLowerCase().replace(/^\*\./, "");
      if (name.endsWith(query.toLowerCase()) && HOSTNAME_RE.test(name)) {
        subdomains.add(name);
      }
    }
    if (typeof entry.issuer_ca_id === "number") {
      issuers.set(entry.issuer_ca_id, (issuers.get(entry.issuer_ca_id) ?? 0) + 1);
    }
    const ts = entry.not_before ?? entry.entry_timestamp;
    if (ts) {
      if (!earliest || ts < earliest) earliest = ts;
      if (!latest || ts > latest) latest = ts;
    }
  }

  const sorted = [...subdomains].sort();
  const data = {
    totalCertificates: entries.length,
    subdomainCount: sorted.length,
    subdomains: sorted.slice(0, MAX_SUBDOMAINS),
    truncated: sorted.length > MAX_SUBDOMAINS,
    issuerCount: issuers.size,
    earliestCertificate: earliest,
    latestCertificate: latest,
  };

  return { data, empty: entries.length === 0 };
}
