"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Database,
  FileJson,
  Info,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { getAgent } from "@/lib/agents";
import { QUERY_TYPE_LABELS, detectQueryType } from "@/lib/classify";
import {
  buildMarkdown,
  downloadMarkdown,
  exportFilename,
} from "@/lib/export";
import { addHistory } from "@/lib/history";
import { MODEL_LABEL_DEEP, MODEL_LABEL_NORMAL } from "@/lib/models";
import { getSource } from "@/lib/osint/registry";
import type {
  AgentId,
  AgentProgress,
  QueryType,
  SearchEvent,
  SourceId,
  SourceResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AIReport } from "./AIReport";
import { RawJsonViewer } from "./RawJsonViewer";
import { SourceCard } from "./SourceCard";

type Phase = "loading" | "done" | "error";
type Tab = "ai" | "sources" | "raw";

interface Notice {
  message: string;
  links: { label: string; url: string }[];
}

function loadingResult(id: SourceId): SourceResult {
  const definition = getSource(id);
  return {
    source: id,
    label: definition?.label ?? id,
    category: definition?.category ?? "domain",
    status: "loading",
  };
}

function runningAgent(id: AgentId): AgentProgress {
  const definition = getAgent(id);
  return {
    id,
    label: definition?.label ?? id,
    mandate: definition?.mandate ?? "",
    status: "running",
    successCount: 0,
    emptyCount: 0,
    errorCount: 0,
    highlights: [],
  };
}

export function SearchResults({ query }: { query: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [queryType, setQueryType] = useState<QueryType>("keyword");
  const [cached, setCached] = useState(false);
  const [results, setResults] = useState<SourceResult[]>([]);
  const [agents, setAgents] = useState<AgentProgress[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ai");

  const [aiText, setAiText] = useState("");
  const [aiStatus, setAiStatus] = useState<
    "idle" | "streaming" | "done" | "error"
  >("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<"normal" | "deep">("normal");

  const resultsRef = useRef<SourceResult[]>([]);
  const typeRef = useRef<QueryType>("keyword");

  const runAnalysis = useCallback(
    async (mode: "normal" | "deep", targetQuery: string) => {
      if (resultsRef.current.length === 0) return;
      setAiMode(mode);
      setAiStatus("streaming");
      setAiError(null);
      setAiText("");

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: targetQuery,
            type: typeRef.current,
            mode,
            results: resultsRef.current,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          setAiError(payload.error ?? "Analisis gagal.");
          setAiStatus("error");
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setAiError("Aliran analisis tidak tersedia.");
          setAiStatus("error");
          return;
        }

        const decoder = new TextDecoder();
        let firstChunk = true;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (firstChunk && !chunk) continue;
          firstChunk = false;
          setAiText((previous) => previous + chunk);
        }
        setAiStatus("done");
      } catch {
        setAiError("Gagal menghubungi layanan analisis.");
        setAiStatus("error");
      }
    },
    [],
  );

  const runSearch = useCallback(
    async (targetQuery: string) => {
      addHistory({
        query: targetQuery,
        type: detectQueryType(targetQuery),
        timestamp: new Date().toISOString(),
      });

      let response: Response;
      try {
        response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: targetQuery }),
        });
      } catch {
        setError("Tidak dapat menghubungi server.");
        setPhase("error");
        return;
      }

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "Pencarian gagal.");
        setPhase("error");
        return;
      }

      const collected: SourceResult[] = [];
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf("\n");
          if (!line) continue;
          let event: SearchEvent;
          try {
            event = JSON.parse(line) as SearchEvent;
          } catch {
            continue;
          }

          if (event.type === "meta") {
            typeRef.current = event.queryType;
            setQueryType(event.queryType);
            setCached(event.cached);
            setResults(event.sources.map(loadingResult));
            setAgents(event.agents.map(runningAgent));
          } else if (event.type === "agent") {
            setAgents((previous) => {
              const next = previous.filter((item) => item.id !== event.agent.id);
              return [...next, event.agent];
            });
          } else if (event.type === "source") {
            collected.push(event.result);
            setResults((previous) =>
              previous.map((item) =>
                item.source === event.result.source ? event.result : item,
              ),
            );
          } else if (event.type === "notice") {
            setNotice({ message: event.message, links: event.links });
          } else if (event.type === "done") {
            setPhase("done");
          } else if (event.type === "error") {
            setError(event.message);
            setPhase("error");
          }
        }
      }

      resultsRef.current = collected;
      setPhase("done");
      setResults((previous) => {
        const merged = previous.map(
          (item) =>
            collected.find((result) => result.source === item.source) ?? item,
        );
        return merged;
      });

      const hasData = collected.some(
        (result) => result.status === "success" || result.status === "empty",
      );
      if (hasData) {
        void runAnalysis("normal", targetQuery);
      }
    },
    [runAnalysis],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memuat data streaming saat mount; semua setState terjadi setelah await
    void runSearch(query);
  }, [query, runSearch]);

  const successCount = results.filter((r) => r.status === "success").length;
  const emptyCount = results.filter((r) => r.status === "empty").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const settledCount = results.filter((r) => r.status !== "loading").length;
  const runningAgentCount = agents.filter((a) => a.status === "running").length;

  function handleExport() {
    const markdown = buildMarkdown({
      query,
      type: queryType,
      timestamp: new Date().toISOString(),
      results: resultsRef.current,
      analysis: aiText,
    });
    downloadMarkdown(exportFilename(query), markdown);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "ai", label: "Laporan AI", icon: <Sparkles size={13} /> },
    { id: "sources", label: `Sumber (${results.length})`, icon: <Database size={13} /> },
    { id: "raw", label: "Data Mentah", icon: <FileJson size={13} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-mono text-base font-semibold">{query}</span>
        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs text-accent">
          {QUERY_TYPE_LABELS[queryType]}
        </span>
        {cached && (
          <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted">
            dari cache
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {phase === "loading" ? (
            <>
              <Loader2 size={12} className="animate-spin" /> {settledCount}/
              {results.length || "…"} sumber
            </>
          ) : (
            `${successCount} berhasil · ${emptyCount} kosong · ${errorCount} gagal`
          )}
        </span>
      </div>

      {agents.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <Users size={13} /> Tim Agent
            {runningAgentCount > 0 && (
              <span className="flex items-center gap-1 text-accent">
                <Loader2 size={11} className="animate-spin" /> {runningAgentCount} berjalan
              </span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "rounded-xl border p-3",
                  agent.status === "running"
                    ? "border-accent/40 bg-accent-soft"
                    : "border-border bg-surface",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{agent.label}</span>
                  {agent.status === "running" ? (
                    <Loader2 size={12} className="animate-spin text-accent" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">{agent.mandate}</p>
                {agent.status === "running" ? (
                  <p className="mt-1.5 font-mono text-xs text-accent">
                    menyelidiki…
                  </p>
                ) : (
                  <>
                    <p className="mt-1.5 font-mono text-xs text-muted">
                      {agent.successCount}/{agent.successCount + agent.emptyCount + agent.errorCount} sumber berdata
                      {agent.errorCount > 0 ? ` · ${agent.errorCount} gagal` : ""}
                    </p>
                    {agent.highlights.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {agent.highlights.map((highlight, index) => (
                          <li key={index} className="flex gap-1.5 text-xs text-muted">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <div className="flex gap-3 rounded-xl border border-warn/40 bg-warn/5 p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-warn" />
          <div className="space-y-2">
            <p className="text-sm">{notice.message}</p>
            <div className="flex flex-wrap gap-2">
              {notice.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-accent hover:bg-accent-soft"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!notice && (
        <>
          <div className="flex gap-1 border-b border-border">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                  tab === item.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {tab === "ai" && (
            <AIReport
              text={aiText}
              status={aiStatus}
              error={aiError}
              mode={aiMode}
              model={aiMode === "deep" ? MODEL_LABEL_DEEP : MODEL_LABEL_NORMAL}
              disabled={phase === "loading" || results.length === 0}
              onRun={(mode) => void runAnalysis(mode, query)}
              onExport={handleExport}
            />
          )}

          {tab === "sources" && (
            <div className="grid gap-3 md:grid-cols-2">
              {results.map((result) => (
                <SourceCard key={result.source} result={result} />
              ))}
            </div>
          )}

          {tab === "raw" && <RawJsonViewer results={results} />}
        </>
      )}
    </div>
  );
}
