import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface WikidataSearchResult {
  id?: string;
  title?: string;
  concepturi?: string;
  label?: string;
  description?: string;
  match?: { type?: string; language?: string; text?: string };
  aliases?: string[];
}

interface WikidataResponse {
  search?: WikidataSearchResult[];
}

const MAX_RESULTS = 10;

export async function run(query: string): Promise<AdapterOutput> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      query,
    )}&language=en&uselang=en&format=json&limit=${MAX_RESULTS}&origin=*`;

  const raw = await fetchJson<WikidataResponse>(url, {
    timeoutMs: 10_000,
    retries: 2,
  });

  const entities = (raw.search ?? []).map((entity) => ({
    id: entity.id ?? null,
    label: entity.label ?? entity.title ?? null,
    description: entity.description ?? null,
    url: entity.concepturi ?? (entity.id ? `https://www.wikidata.org/wiki/${entity.id}` : null),
    aliases: entity.aliases ?? [],
  }));

  const data = {
    query,
    matchCount: entities.length,
    entities,
  };

  return { data, empty: entities.length === 0 };
}
