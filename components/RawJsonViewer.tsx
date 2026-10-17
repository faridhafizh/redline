"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { SourceResult } from "@/lib/types";

export function RawJsonViewer({ results }: { results: SourceResult[] }) {
  const [openSource, setOpenSource] = useState<string | null>(null);

  if (results.length === 0) {
    return <p className="text-sm text-muted">Belum ada data mentah.</p>;
  }

  return (
    <div className="space-y-2">
      {results.map((result) => {
        const isOpen = openSource === result.source;
        return (
          <div key={result.source} className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setOpenSource(isOpen ? null : result.source)}
              className="flex w-full items-center justify-between gap-2 bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-2">
                <ChevronRight
                  size={14}
                  className={isOpen ? "rotate-90 transition-transform" : "transition-transform"}
                />
                {result.label}
              </span>
              <span className="font-mono text-xs text-muted">{result.status}</span>
            </button>
            {isOpen && (
              <pre className="max-h-96 overflow-auto bg-surface-2 p-3 font-mono text-xs text-muted">
                {JSON.stringify(
                  result.status === "error" ? { error: result.error } : result.data,
                  null,
                  2,
                )}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
