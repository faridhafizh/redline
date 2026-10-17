import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface IpwhoisResponse {
  ip?: string;
  success?: boolean;
  message?: string;
  type?: string;
  continent?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  postal?: string | null;
  connection?: {
    asn?: number;
    org?: string;
    isp?: string;
    domain?: string;
  };
  timezone?: { id?: string; abbr?: string; utc?: string };
}

export async function run(query: string): Promise<AdapterOutput> {
  const raw = await fetchJson<IpwhoisResponse>(
    `https://ipwho.is/${encodeURIComponent(query)}`,
    { timeoutMs: 8_000, retries: 1 },
  );

  if (raw.success === false) {
    return {
      data: { ip: query, message: raw.message ?? "Tidak ada data" },
      empty: true,
    };
  }

  const data = {
    ip: raw.ip ?? query,
    type: raw.type ?? null,
    continent: raw.continent ?? null,
    country: raw.country ?? null,
    countryCode: raw.country_code ?? null,
    region: raw.region ?? null,
    city: raw.city ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    postal: raw.postal ?? null,
    connection: {
      asn: raw.connection?.asn ?? null,
      org: raw.connection?.org ?? null,
      isp: raw.connection?.isp ?? null,
      domain: raw.connection?.domain ?? null,
    },
    timezone: raw.timezone?.id ?? null,
  };

  const empty = !data.country && !data.connection.org;
  return { data, empty };
}
