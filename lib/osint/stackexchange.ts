import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface StackExchangeQuestion {
  title?: string;
  link?: string;
  score?: number;
  answer_count?: number;
  is_answered?: boolean;
  view_count?: number;
  tags?: string[];
  creation_date?: number;
}

interface StackExchangeResponse {
  items?: StackExchangeQuestion[];
  has_more?: boolean;
  quota_remaining?: number;
}

const MAX_QUESTIONS = 10;

export async function run(query: string): Promise<AdapterOutput> {
  const url =
    `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(
      query,
    )}&site=stackoverflow&pagesize=${MAX_QUESTIONS}&filter=default`;

  const raw = await fetchJson<StackExchangeResponse>(url, {
    timeoutMs: 10_000,
    retries: 1,
  });

  const questions = (raw.items ?? []).map((item) => ({
    title: item.title ?? null,
    link: item.link ?? null,
    score: item.score ?? 0,
    answers: item.answer_count ?? 0,
    answered: Boolean(item.is_answered),
    views: item.view_count ?? 0,
    tags: item.tags ?? [],
    date: item.creation_date
      ? new Date(item.creation_date * 1000).toISOString()
      : null,
  }));

  const data = {
    query,
    questionCount: questions.length,
    questions,
  };

  return { data, empty: questions.length === 0 };
}
