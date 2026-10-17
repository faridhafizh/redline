import type { AdapterOutput } from "../types";
import { fetchJson, fetchText } from "./http";

interface SubmissionResponse {
  name?: string;
  tickers?: string[];
  exchanges?: string[];
  sicDescription?: string;
  category?: string;
}

interface Candidate {
  cik: string | null;
  name: string | null;
  tickers: string[];
  sic: string | null;
  sicDescription: string | null;
  state: string | null;
  lastDate: string | null;
  city: string | null;
  url: string | null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function extract(block: string, tag: string): string | null {
  const match = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`,
    "i",
  ).exec(block);
  return match ? decodeEntities(match[1].trim()) : null;
}

function parseCandidates(xml: string): Candidate[] {
  const entries = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].slice(0, 6);
  return entries.map((match) => {
    const block = match[0];
    const link = /<link[^>]*href="([^"]+)"/i.exec(block);
    const summary = stripTags(extract(block, "summary") ?? "");
    const sic = extract(block, "sic");
    const sicDescription = /SIC:\s*(.+)$/i.exec(summary)?.[1]?.trim() ?? null;

    return {
      cik: extract(block, "cik"),
      name: null,
      tickers: [],
      sic,
      sicDescription,
      state:
        extract(block, "state-of-incorporation") ?? extract(block, "state"),
      lastDate: extract(block, "last-date"),
      city: extract(block, "city"),
      url: link ? decodeEntities(link[1]) : null,
    };
  });
}

async function enrich(candidate: Candidate): Promise<Candidate> {
  if (!candidate.cik) return candidate;
  try {
    const submission = await fetchJson<SubmissionResponse>(
      `https://data.sec.gov/submissions/CIK${candidate.cik}.json`,
      { timeoutMs: 8_000, retries: 0 },
    );
    return {
      ...candidate,
      name: submission.name ?? null,
      tickers: submission.tickers ?? [],
      sicDescription: submission.sicDescription ?? candidate.sicDescription,
    };
  } catch {
    return candidate;
  }
}

export async function run(query: string): Promise<AdapterOutput> {
  const url =
    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(
      query,
    )}&type=&dateb=&owner=include&count=10&output=atom`;

  const xml = await fetchText(url, { timeoutMs: 12_000, retries: 1 });
  const parsed = parseCandidates(xml);
  const candidates = await Promise.all(parsed.map((candidate) => enrich(candidate)));

  const data = {
    query,
    matchCount: candidates.length,
    companies: candidates,
  };

  return { data, empty: candidates.length === 0 };
}
