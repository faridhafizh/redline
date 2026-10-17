import type { AdapterOutput } from "../types";
import { HttpError, fetchText } from "./http";
import { createThrottle } from "./throttle";

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

const MAX_ARTICLES = 25;
const MIN_INTERVAL_MS = 5_000;

const throttle = createThrottle(MIN_INTERVAL_MS);

async function request(query: string): Promise<string> {
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
      `"${query}"`,
    )}&mode=artlist&maxrecords=${MAX_ARTICLES}&format=json&sort=datedesc`;

  return throttle.schedule(() =>
    fetchText(url, { timeoutMs: 12_000, retries: 0 }),
  );
}

export async function run(query: string): Promise<AdapterOutput> {
  let body: string;
  try {
    body = await request(query);
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 429) throw error;
    try {
      body = await request(query);
    } catch (retryError) {
      if (retryError instanceof HttpError && retryError.status === 429) {
        throw new HttpError(
          "GDELT sedang membatasi permintaan (429). Coba lagi dalam beberapa menit.",
          429,
        );
      }
      throw retryError;
    }
  }

  let raw: GdeltResponse;
  try {
    raw = JSON.parse(body) as GdeltResponse;
  } catch {
    if (/limit requests/i.test(body)) {
      throw new HttpError("GDELT membatasi 1 permintaan per 5 detik");
    }
    return { data: { query, articleCount: 0, articles: [] }, empty: true };
  }

  const articles = (raw.articles ?? []).slice(0, MAX_ARTICLES).map((article) => ({
    title: article.title ?? "(tanpa judul)",
    url: article.url ?? null,
    domain: article.domain ?? null,
    language: article.language ?? null,
    country: article.sourcecountry ?? null,
    seenDate: article.seendate ?? null,
  }));

  const domains = [...new Set(articles.map((a) => a.domain).filter(Boolean))];
  const data = {
    query,
    articleCount: articles.length,
    distinctDomains: domains.length,
    articles,
  };

  return { data, empty: articles.length === 0 };
}
