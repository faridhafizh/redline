import type { QueryType } from "./types";

const TTL_BY_TYPE: Record<QueryType, number> = {
  domain: 60 * 60 * 12,
  ip: 60 * 60 * 6,
  email: 60 * 60 * 24,
  phone: 60 * 60,
  username: 60 * 60,
  keyword: 60 * 60,
};

export function getCacheTtl(type: QueryType): number {
  return TTL_BY_TYPE[type] ?? 60 * 60;
}

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

class MemoryCache implements CacheStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.store.size > 500) {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt < now) this.store.delete(key);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

class UpstashCache implements CacheStore {
  constructor(private redis: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(key);
      return value ?? null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch {
      return;
    }
  }
}

interface RedisClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options: { ex: number }): Promise<unknown>;
}

let cachedStore: CacheStore | null = null;

export async function getCacheStore(): Promise<CacheStore> {
  if (cachedStore) return cachedStore;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const { Redis } = await import("@upstash/redis");
      cachedStore = new UpstashCache(Redis.fromEnv() as unknown as RedisClient);
      return cachedStore;
    } catch {
      // fall through to memory cache
    }
  }

  cachedStore = new MemoryCache();
  return cachedStore;
}

export function cacheKey(type: QueryType, query: string): string {
  return `redline:osint:${type}:${query.toLowerCase()}`;
}
