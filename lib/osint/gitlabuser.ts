import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface GitlabUserSummary {
  id?: number;
  username?: string;
  name?: string;
  state?: string;
  avatar_url?: string;
  web_url?: string;
}

interface GitlabUser extends GitlabUserSummary {
  bio?: string;
  location?: string;
  created_at?: string;
  followers?: number;
  following?: number;
  public_email?: string;
  job_title?: string;
  organization?: string;
  last_activity_on?: string;
}

interface GitlabProject {
  name?: string;
  description?: string;
  web_url?: string;
  star_count?: number;
  forks_count?: number;
  language?: string | null;
  last_activity_at?: string;
}

const MAX_PROJECTS = 10;

export async function run(username: string): Promise<AdapterOutput> {
  const matches = await fetchJson<GitlabUserSummary[]>(
    `https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`,
    { timeoutMs: 10_000, retries: 1 },
  );

  const summary = Array.isArray(matches) ? matches[0] : undefined;
  if (!summary?.id) {
    return { data: { username, found: false }, empty: true };
  }

  const [user, projects] = await Promise.all([
    fetchJson<GitlabUser>(`https://gitlab.com/api/v4/users/${summary.id}`, {
      timeoutMs: 10_000,
      retries: 1,
    }).catch(() => summary as GitlabUser),
    fetchJson<GitlabProject[]>(
      `https://gitlab.com/api/v4/users/${summary.id}/projects?order_by=last_activity_at&per_page=${MAX_PROJECTS}`,
      { timeoutMs: 10_000, retries: 1 },
    ).catch(() => [] as GitlabProject[]),
  ]);

  const data = {
    username,
    found: true,
    id: user.id ?? summary.id,
    name: user.name ?? null,
    state: user.state ?? null,
    bio: user.bio ?? null,
    jobTitle: user.job_title ?? null,
    organization: user.organization ?? null,
    location: user.location ?? null,
    followers: user.followers ?? null,
    createdAt: user.created_at ?? null,
    lastActivityOn: user.last_activity_on ?? null,
    url: user.web_url ?? summary.web_url ?? null,
    avatarUrl: user.avatar_url ?? summary.avatar_url ?? null,
    projects: (projects ?? []).map((project) => ({
      name: project.name ?? null,
      description: project.description ?? null,
      url: project.web_url ?? null,
      stars: project.star_count ?? 0,
      forks: project.forks_count ?? 0,
      language: project.language ?? null,
      lastActivityAt: project.last_activity_at ?? null,
    })),
  };

  return { data, empty: false };
}
