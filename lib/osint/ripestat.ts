import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface PrefixOverviewResponse {
  data?: {
    resource?: string;
    desc?: string;
    block?: string;
    asns?: { asn?: number; holder?: string; announced?: boolean }[];
  };
}

interface NetworkInfoResponse {
  data?: { prefix?: string | null; asns?: string[] };
}

export async function run(query: string): Promise<AdapterOutput> {
  const resource = encodeURIComponent(query);

  const [prefix, network] = await Promise.allSettled([
    fetchJson<PrefixOverviewResponse>(
      `https://stat.ripe.net/data/prefix-overview/data.json?resource=${resource}`,
      { timeoutMs: 8_000, retries: 1 },
    ),
    fetchJson<NetworkInfoResponse>(
      `https://stat.ripe.net/data/network-info/data.json?resource=${resource}`,
      { timeoutMs: 8_000, retries: 1 },
    ),
  ]);

  if (prefix.status === "rejected" && network.status === "rejected") {
    throw prefix.reason;
  }

  const prefixData = prefix.status === "fulfilled" ? prefix.value.data : undefined;
  const networkData =
    network.status === "fulfilled" ? network.value.data : undefined;

  const data = {
    ip: query,
    prefix: networkData?.prefix ?? prefixData?.resource ?? null,
    description: prefixData?.desc ?? null,
    block: prefixData?.block ?? null,
    asns: (prefixData?.asns ?? []).map((entry) => ({
      asn: entry.asn != null ? `AS${entry.asn}` : null,
      holder: entry.holder ?? null,
      announced: entry.announced ?? null,
    })),
    networkAsns: networkData?.asns ?? [],
  };

  const empty = !data.prefix && data.asns.length === 0;
  return { data, empty };
}
