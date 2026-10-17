const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = "Redline-OSINT/1.0 (admin@redline.dev)";

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, headers = {} } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": DEFAULT_USER_AGENT,
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new HttpError(
          `Upstream responded ${response.status}`,
          response.status,
        );
      }

      const text = await response.text();
      if (!text.trim()) return {} as T;
      return JSON.parse(text) as T;
    } catch (error) {
      lastError = error;
      if (error instanceof HttpError && error.status && error.status < 500) {
        break;
      }
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new HttpError("Permintaan ke sumber gagal");
}

export async function fetchText(
  url: string,
  options: FetchOptions = {},
): Promise<string> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, headers = {} } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/plain, application/xml, text/xml, */*",
          "User-Agent": DEFAULT_USER_AGENT,
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new HttpError(
          `Upstream responded ${response.status}`,
          response.status,
        );
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (error instanceof HttpError && error.status && error.status < 500) {
        break;
      }
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new HttpError("Permintaan ke sumber gagal");
}
