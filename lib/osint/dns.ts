import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface DohAnswer {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
}

interface DohResponse {
  Status?: number;
  Answer?: DohAnswer[];
}

const DOH_BASE = "https://cloudflare-dns.com/dns-query";

async function dohQuery(name: string, type: string): Promise<DohAnswer[]> {
  const url = `${DOH_BASE}?name=${encodeURIComponent(name)}&type=${type}`;
  try {
    const raw = await fetchJson<DohResponse>(url, {
      timeoutMs: 8_000,
      retries: 1,
      headers: { Accept: "application/dns-json" },
    });
    return raw.Answer ?? [];
  } catch {
    return [];
  }
}

function values(answers: DohAnswer[]): string[] {
  const seen = new Set<string>();
  for (const answer of answers) {
    if (answer.data) seen.add(answer.data);
  }
  return [...seen];
}

const MAIL_PROVIDERS: { match: RegExp; label: string }[] = [
  { match: /google|googlemail/i, label: "Google Workspace" },
  { match: /outlook|protection\.outlook|microsoft/i, label: "Microsoft 365" },
  { match: /zoho/i, label: "Zoho Mail" },
  { match: /yandex/i, label: "Yandex Mail" },
  { match: /mimecast/i, label: "Mimecast" },
  { match: /proton/i, label: "Proton Mail" },
  { match: /icloud|apple/i, label: "Apple iCloud" },
  { match: /migadu|fastmail|messagingengine/i, label: "Fastmail" },
  { match: /improvmx/i, label: "ImprovMX" },
];

function detectMailProvider(mx: string[]): string | null {
  const joined = mx.join(" ");
  for (const provider of MAIL_PROVIDERS) {
    if (provider.match.test(joined)) return provider.label;
  }
  return mx.length > 0 ? "Penyedia lain" : null;
}

export function extractDomain(query: string): string {
  const at = query.indexOf("@");
  return (at >= 0 ? query.slice(at + 1) : query).trim().toLowerCase();
}

export async function run(query: string): Promise<AdapterOutput> {
  const domain = extractDomain(query);

  const [a, aaaa, mx, ns, txt, dmarcTxt] = await Promise.all([
    dohQuery(domain, "A"),
    dohQuery(domain, "AAAA"),
    dohQuery(domain, "MX"),
    dohQuery(domain, "NS"),
    dohQuery(domain, "TXT"),
    dohQuery(`_dmarc.${domain}`, "TXT"),
  ]);

  const records = {
    a: values(a),
    aaaa: values(aaaa),
    mx: values(mx),
    ns: values(ns),
    txt: values(txt),
  };

  const spf = records.txt.find((value) => /^"?v=spf1/i.test(value)) ?? null;
  const dmarc =
    values(dmarcTxt).find((value) => /^"?v=DMARC1/i.test(value)) ?? null;

  const totalRecords =
    records.a.length +
    records.aaaa.length +
    records.mx.length +
    records.ns.length +
    records.txt.length;

  const data = {
    domain,
    records,
    nameservers: records.ns,
    mailProvider: detectMailProvider(records.mx),
    spf,
    dmarc,
  };

  return { data, empty: totalRecords === 0 };
}
