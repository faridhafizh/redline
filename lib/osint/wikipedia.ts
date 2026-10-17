import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface WikipediaPage {
  id?: number;
  key?: string;
  title?: string;
  description?: string;
  excerpt?: string;
}

interface WikipediaSearchResponse {
  pages?: WikipediaPage[];
}

const MAX_ARTICLES = 10;

function stripHtml(value: string | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

export async function run(query: string): Promise<AdapterOutput> {
  const raw = await fetchJson<WikipediaSearchResponse>(
    `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(
      query,
    )}&limit=${MAX_ARTICLES}`,
    { timeoutMs: 10_000, retries: 1 },
  );

  const articles = (raw.pages ?? []).map((page) => ({
    title: page.title ?? null,
    description: page.description ?? null,
    excerpt: stripHtml(page.excerpt),
    url: page.key
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}`
      : null,
  }));

  const data = {
    query,
    articleCount: articles.length,
    articles,
  };

  return { data, empty: articles.length === 0 };
}
