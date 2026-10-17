import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

const SAMPLE_LIMIT = 100;

type CdxRow = string[];

function isHeaderRow(row: CdxRow): boolean {
  return row.includes("timestamp") && row.includes("original");
}

function parseRows(raw: unknown): CdxRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as CdxRow[]).filter(
    (row): row is CdxRow => Array.isArray(row) && !isHeaderRow(row),
  );
}

function cdxUrl(domain: string, fields: string, extra: string): string {
  return `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(
    domain,
  )}&output=json&fl=${fields}&${extra}`;
}

export async function run(domain: string): Promise<AdapterOutput> {
  const settled = await Promise.allSettled([
    fetchJson<unknown>(cdxUrl(domain, "timestamp,original", "limit=1"), {
      timeoutMs: 20_000,
      retries: 0,
    }),
    fetchJson<unknown>(cdxUrl(domain, "timestamp,original", "limit=-1"), {
      timeoutMs: 20_000,
      retries: 0,
    }),
    fetchJson<unknown>(
      cdxUrl(
        domain,
        "timestamp,original,statuscode",
        `limit=${SAMPLE_LIMIT}&collapse=timestamp:6`,
      ),
      { timeoutMs: 18_000, retries: 0 },
    ),
  ]);

  const value = (index: number): unknown =>
    settled[index].status === "fulfilled" ? settled[index].value : [];

  if (settled.every((entry) => entry.status === "rejected")) {
    throw new Error("Layanan arsip Wayback sedang tidak merespons");
  }

  const earliest = parseRows(value(0))[0] ?? null;
  const latest = parseRows(value(1))[0] ?? null;
  const sample = parseRows(value(2));

  const statusCounts: Record<string, number> = {};
  for (const row of sample) {
    const status = row[2] || "unknown";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const topUrls = sample.slice(0, 15).map((row) => ({
    url: row[1] ?? null,
    timestamp: row[0] ?? null,
    status: row[2] ?? null,
  }));

  const data = {
    domain,
    snapshotCount: sample.length,
    truncated: sample.length >= SAMPLE_LIMIT,
    earliestSnapshot: earliest?.[0] ?? null,
    earliestUrl: earliest?.[1] ?? null,
    latestSnapshot: latest?.[0] ?? null,
    latestUrl: latest?.[1] ?? null,
    statusCounts,
    topUrls,
  };

  return { data, empty: !earliest && !latest && sample.length === 0 };
}
