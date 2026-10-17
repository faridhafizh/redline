import type { QueryType } from "./types";

const DOMAIN_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const USERNAME_RE = /^@[a-z0-9_.-]{2,30}$/i;
const PHONE_RE = /^\+?[0-9(][0-9\s().-]{4,18}\d$/;

export const QUERY_TYPE_LABELS: Record<QueryType, string> = {
  domain: "Domain",
  ip: "Alamat IP",
  email: "Email",
  phone: "Telepon",
  username: "Username",
  keyword: "Kata kunci",
};

function isIPv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith("0")) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function isIPv6(value: string): boolean {
  if (!value.includes(":")) return false;
  try {
    new URL(`http://[${value}]/`);
    return true;
  } catch {
    return false;
  }
}

function extractHostname(input: string): string | null {
  if (!/^https?:\/\//i.test(input)) return null;
  try {
    return new URL(input).hostname;
  } catch {
    return null;
  }
}

function digitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

export function detectQueryType(raw: string): QueryType {
  const input = raw.trim();
  if (!input) return "keyword";

  const host = extractHostname(input);
  const candidate = host ?? input;

  if (EMAIL_RE.test(candidate)) return "email";
  if (isIPv4(candidate) || isIPv6(candidate)) return "ip";
  if (DOMAIN_RE.test(candidate)) return "domain";
  if (USERNAME_RE.test(candidate)) return "username";
  if (PHONE_RE.test(candidate)) {
    const digits = digitCount(candidate);
    if (digits >= 7 && digits <= 15) return "phone";
  }

  return "keyword";
}

export function normalizeQuery(raw: string, type: QueryType): string {
  const input = raw.trim();
  const host = extractHostname(input);
  const candidate = (host ?? input).trim();

  switch (type) {
    case "domain":
      return candidate.toLowerCase().replace(/\.$/, "");
    case "email":
      return candidate.toLowerCase();
    case "ip":
      return candidate.toLowerCase();
    case "username":
      return candidate.replace(/^@/, "").toLowerCase();
    case "phone":
      return candidate.replace(/[^\d+]/g, "");
    case "keyword":
      return input.replace(/\s+/g, " ");
  }
}

export interface ClassifiedQuery {
  type: QueryType;
  query: string;
}

export function classifyQuery(raw: string): ClassifiedQuery {
  const type = detectQueryType(raw);
  return { type, query: normalizeQuery(raw, type) };
}

export const UNSUPPORTED_TYPES: QueryType[] = [];

export function isFanOutType(type: QueryType): boolean {
  return !UNSUPPORTED_TYPES.includes(type);
}
