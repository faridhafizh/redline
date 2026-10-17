import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";

interface NumverifyResponse {
  valid?: boolean;
  number?: string;
  local_format?: string;
  international_format?: string;
  country_prefix?: string;
  country_code?: string;
  country_name?: string;
  location?: string;
  carrier?: string;
  line_type?: string;
  success?: boolean;
  error?: { code?: number; type?: string; info?: string };
}

export function getNumverifyKey(): string | null {
  return process.env.NUMVERIFY_API_KEY?.trim() || null;
}

export async function run(number: string): Promise<AdapterOutput> {
  const accessKey = getNumverifyKey();
  if (!accessKey) {
    throw new HttpError("NUMVERIFY_API_KEY belum dikonfigurasi");
  }

  const url =
    `https://apilayer.net/api/validate?access_key=${encodeURIComponent(
      accessKey,
    )}&number=${encodeURIComponent(number)}&format=1`;

  const raw = await fetchJson<NumverifyResponse>(url, {
    timeoutMs: 10_000,
    retries: 1,
  });

  if (raw.success === false) {
    throw new HttpError(
      raw.error?.info
        ? `Numverify: ${raw.error.info}`
        : "Numverify menolak permintaan",
      raw.error?.code,
    );
  }

  const data = {
    number: raw.number ?? null,
    valid: Boolean(raw.valid),
    localFormat: raw.local_format ?? null,
    internationalFormat: raw.international_format ?? null,
    countryPrefix: raw.country_prefix ?? null,
    countryCode: raw.country_code ?? null,
    countryName: raw.country_name ?? null,
    location: raw.location ?? null,
    carrier: raw.carrier ?? null,
    lineType: raw.line_type ?? null,
  };

  return { data, empty: false };
}
