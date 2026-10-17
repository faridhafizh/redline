"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Clock, Trash2 } from "lucide-react";
import { QUERY_TYPE_LABELS } from "@/lib/classify";
import {
  clearHistory,
  getHistorySnapshot,
  getServerHistorySnapshot,
  subscribe,
} from "@/lib/history";

export function HistoryList() {
  const entries = useSyncExternalStore(
    subscribe,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );

  if (entries.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
          <Clock size={13} /> Riwayat
        </span>
        <button
          type="button"
          onClick={() => clearHistory()}
          className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-danger"
        >
          <Trash2 size={12} /> Bersihkan
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <Link
            key={`${entry.type}:${entry.query}`}
            href={`/search/${encodeURIComponent(entry.query)}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs transition-colors hover:border-accent"
          >
            <span className="font-mono">{entry.query}</span>
            <span className="text-muted">{QUERY_TYPE_LABELS[entry.type]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
