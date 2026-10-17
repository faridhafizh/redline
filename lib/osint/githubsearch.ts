import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";
import { createThrottle } from "./throttle";

interface GithubRepo {
  full_name?: string;
  name?: string;
  description?: string;
  html_url?: string;
  stargazers_count?: number;
  forks_count?: number;
  language?: string;
  updated_at?: string;
  topics?: string[];
  owner?: { login?: string };
}

interface GithubSearchResponse {
  total_count?: number;
  items?: GithubRepo[];
}

const MAX_REPOS = 10;

const throttle = createThrottle(6_000);

export async function run(query: string): Promise<AdapterOutput> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
    query,
  )}&sort=stars&order=desc&per_page=${MAX_REPOS}`;

  let raw: GithubSearchResponse;
  try {
    raw = await throttle.schedule(() =>
      fetchJson<GithubSearchResponse>(url, {
        timeoutMs: 12_000,
        retries: 0,
        headers: { Accept: "application/vnd.github+json" },
      }),
    );
  } catch (error) {
    if (error instanceof HttpError && (error.status === 403 || error.status === 429)) {
      throw new HttpError(
        "GitHub API membatasi 10 permintaan/menit tanpa autentikasi",
        error.status,
      );
    }
    throw error;
  }

  const repositories = (raw.items ?? []).map((repo) => ({
    fullName: repo.full_name ?? repo.name ?? null,
    description: repo.description ?? null,
    url: repo.html_url ?? null,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    language: repo.language ?? null,
    updatedAt: repo.updated_at ?? null,
    topics: repo.topics ?? [],
  }));

  const data = {
    query,
    totalCount: raw.total_count ?? repositories.length,
    repositories,
  };

  return { data, empty: repositories.length === 0 };
}
