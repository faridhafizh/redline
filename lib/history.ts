import type { HistoryEntry } from "./types";

const STORAGE_KEY = "redline-history";
export const MAX_HISTORY = 20;
const EMPTY: HistoryEntry[] = [];

let snapshot: HistoryEntry[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((entry) => entry && typeof entry.query === "string");
  } catch {
    return EMPTY;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function handleStorage(): void {
  snapshot = read();
  hydrated = true;
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined" && listeners.size === 1) {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined" && listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getHistorySnapshot(): HistoryEntry[] {
  if (!hydrated && typeof window !== "undefined") {
    snapshot = read();
    hydrated = true;
  }
  return snapshot;
}

export function getServerHistorySnapshot(): HistoryEntry[] {
  return EMPTY;
}

export function addHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  const next = [
    entry,
    ...read().filter(
      (item) => !(item.query === entry.query && item.type === entry.type),
    ),
  ].slice(0, MAX_HISTORY);
  snapshot = next;
  hydrated = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  emit();
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  snapshot = EMPTY;
  hydrated = true;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}
