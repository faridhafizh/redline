export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

type Limiter = (id: string) => Promise<RateLimitResult>;

const WINDOW_MS = 60_000;

class MemorySlidingWindow {
  private hits = new Map<string, number[]>();

  constructor(private limit: number) {}

  check(id: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const timestamps = (this.hits.get(id) ?? []).filter(
      (timestamp) => timestamp > windowStart,
    );

    const success = timestamps.length < this.limit;
    if (success) timestamps.push(now);
    this.hits.set(id, timestamps);

    const oldest = timestamps[0] ?? now;
    return {
      success,
      limit: this.limit,
      remaining: Math.max(0, this.limit - timestamps.length),
      reset: oldest + WINDOW_MS,
    };
  }
}

const limiterCache = new Map<number, Promise<Limiter>>();

async function buildLimiter(limit: number): Promise<Limiter> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import("@upstash/ratelimit"),
        import("@upstash/redis"),
      ]);
      const ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, "60 s"),
        prefix: `redline:rl:${limit}`,
      });
      return async (id: string) => {
        const result = await ratelimit.limit(id);
        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        };
      };
    } catch {
      // fall through to in-memory limiter
    }
  }

  const memory = new MemorySlidingWindow(limit);
  return async (id: string) => memory.check(id);
}

function getLimiter(limit: number): Promise<Limiter> {
  let limiter = limiterCache.get(limit);
  if (!limiter) {
    limiter = buildLimiter(limit);
    limiterCache.set(limit, limiter);
  }
  return limiter;
}

export async function rateLimit(
  id: string,
  limit = 15,
): Promise<RateLimitResult> {
  const limiter = await getLimiter(limit);
  return limiter(id);
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "local";
}
