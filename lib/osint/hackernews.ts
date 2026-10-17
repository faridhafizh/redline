import type { AdapterOutput } from "../types";
import { fetchJson } from "./http";

interface AlgoliaHit {
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  points?: number;
  author?: string;
  num_comments?: number;
  created_at?: string;
  objectID?: string;
}

interface AlgoliaResponse {
  hits?: AlgoliaHit[];
  nbHits?: number;
}

interface AlgoliaUser {
  username?: string;
  karma?: number;
  about?: string;
  created_at?: string;
}

const MAX_STORIES = 20;

export type HnMode = "keyword" | "username";

function mapStory(hit: AlgoliaHit) {
  const id = hit.objectID ? `https://news.ycombinator.com/item?id=${hit.objectID}` : null;
  return {
    title: hit.title ?? hit.story_title ?? null,
    url: hit.url ?? hit.story_url ?? id,
    points: hit.points ?? null,
    author: hit.author ?? null,
    comments: hit.num_comments ?? null,
    date: hit.created_at ?? null,
  };
}

export async function run(
  query: string,
  mode: HnMode = "keyword",
): Promise<AdapterOutput> {
  if (mode === "username") {
    const [user, stories] = await Promise.all([
      fetchJson<AlgoliaUser>(
        `https://hn.algolia.com/api/v1/users/${encodeURIComponent(query)}`,
        { timeoutMs: 10_000, retries: 1 },
      ).catch(() => null),
      fetchJson<AlgoliaResponse>(
        `https://hn.algolia.com/api/v1/search?tags=story,author_${encodeURIComponent(
          query,
        )}&hitsPerPage=${MAX_STORIES}`,
        { timeoutMs: 10_000, retries: 1 },
      ).catch(() => ({ hits: [] }) as AlgoliaResponse),
    ]);

    const mapped = (stories.hits ?? []).map(mapStory).filter((s) => s.title);
    const found = Boolean(user?.username);

    const data = {
      username: query,
      found,
      user: found
        ? {
            karma: user?.karma ?? null,
            about: user?.about ?? null,
            createdAt: user?.created_at ?? null,
          }
        : null,
      storyCount: mapped.length,
      stories: mapped,
    };

    return { data, empty: !found && mapped.length === 0 };
  }

  const raw = await fetchJson<AlgoliaResponse>(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
      query,
    )}&tags=story&hitsPerPage=${MAX_STORIES}`,
    { timeoutMs: 10_000, retries: 1 },
  );

  const stories = (raw.hits ?? []).map(mapStory).filter((s) => s.title);

  const data = {
    query,
    storyCount: raw.nbHits ?? stories.length,
    stories,
  };

  return { data, empty: stories.length === 0 };
}
