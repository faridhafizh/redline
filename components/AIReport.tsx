"use client";

import { Download, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIReportProps {
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  error?: string | null;
  mode: "normal" | "deep";
  model: string;
  disabled: boolean;
  onRun: (mode: "normal" | "deep") => void;
  onExport: () => void;
}

function renderFormatted(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = (key: string) => {
    if (bullets.length === 0) return;
    nodes.push(
      <ul key={key} className="my-2 space-y-1.5 pl-1">
        {bullets.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{item.replace(/\*\*/g, "")}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\*\*/g, "").replace(/^#+\s*/, "");
    const bullet = /^\s*[-*]\s+(.*)$/.exec(rawLine);
    const heading = /^\s*(\d+)\.\s+(.+)$/.exec(line);

    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flush(`ul-${index}`);
    if (heading) {
      nodes.push(
        <h3
          key={index}
          className="mt-4 mb-1 text-sm font-semibold text-accent first:mt-0"
        >
          {heading[1]}. {heading[2]}
        </h3>,
      );
    } else if (line.trim()) {
      nodes.push(
        <p key={index} className="my-1 text-sm leading-relaxed">
          {line}
        </p>,
      );
    }
  });
  flush("ul-end");
  return nodes;
}

export function AIReport({
  text,
  status,
  error,
  mode,
  model,
  disabled,
  onRun,
  onExport,
}: AIReportProps) {
  const hasText = text.trim().length > 0;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <span className="text-sm font-semibold">Laporan Analisis AI</span>
          <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-xs text-accent">
            {model}
          </span>
          {mode === "deep" && (
            <span className="rounded-md border border-accent/40 px-1.5 py-0.5 text-xs text-accent">
              mendalam
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || status === "streaming"}
            onClick={() => onRun(mode === "deep" ? "deep" : "normal")}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-accent disabled:opacity-40"
          >
            <RefreshCw size={12} /> Ulangi
          </button>
          <button
            type="button"
            disabled={disabled || status === "streaming" || mode === "deep"}
            onClick={() => onRun("deep")}
            className="flex items-center gap-1.5 rounded-md border border-accent/40 px-2.5 py-1.5 text-xs text-accent transition-colors hover:bg-accent-soft disabled:opacity-40"
          >
            <Sparkles size={12} /> Analisis Mendalam
          </button>
          <button
            type="button"
            disabled={!hasText}
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-accent disabled:opacity-40"
          >
            <Download size={12} /> Ekspor MD
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        {error && status === "error" ? (
          <p className="text-sm text-danger">{error}</p>
        ) : status === "idle" && !hasText ? (
          <p className="text-sm text-muted">
            Analisis akan berjalan otomatis setelah data terkumpul.
          </p>
        ) : !hasText && status === "streaming" ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ) : (
          <div className={cn(status === "streaming" && "after:animate-pulse")}>
            {renderFormatted(text)}
            {status === "streaming" && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-accent align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
