import type { AdapterOutput } from "../types";
import { HttpError, fetchJson } from "./http";

interface GithubUser {
  login?: string;
  name?: string;
  bio?: string;
  company?: string;
  blog?: string;
  location?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  avatar_url?: string;
  html_url?: string;
}

interface GithubRepo {
  name?: string;
  description?: string;
  html_url?: string;
  stargazers_count?: number;
  language?: string;
  updated_at?: string;
}

const MAX_REPOS = 10;
const HEADERS = { Accept: "application/vnd.github+json" };

export async function run(username: string): Promise<AdapterOutput> {
  let user: GithubUser;
  try {
    user = await fetchJson<GithubUser>(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      { timeoutMs: 10_000, retries: 0, headers: HEADERS },
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { data: { username, found: false }, empty: true };
    }
    throw error;
  }

  const repos = await fetchJson<GithubRepo[]>(
    `https://api.github.com/users/${encodeURIComponent(
      username,
    )}/repos?sort=updated&per_page=${MAX_REPOS}`,
    { timeoutMs: 10_000, retries: 0, headers: HEADERS },
  ).catch(() => [] as GithubRepo[]);

  const data = {
    username,
    found: true,
    login: user.login ?? username,
    name: user.name ?? null,
    bio: user.bio ?? null,
    company: user.company ?? null,
    blog: user.blog ?? null,
    location: user.location ?? null,
    publicRepos: user.public_repos ?? null,
    followers: user.followers ?? null,
    following: user.following ?? null,
    createdAt: user.created_at ?? null,
    avatarUrl: user.avatar_url ?? null,
    url: user.html_url ?? null,
    repositories: (repos ?? []).map((repo) => ({
      name: repo.name ?? null,
      description: repo.description ?? null,
      url: repo.html_url ?? null,
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
      updatedAt: repo.updated_at ?? null,
    })),
  };

  return { data, empty: false };
}
