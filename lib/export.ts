import { QUERY_TYPE_LABELS } from "./classify";
import type { QueryType, SourceResult } from "./types";

export interface ExportPayload {
  query: string;
  type: QueryType;
  timestamp: string;
  results: SourceResult[];
  analysis: string;
}

export function buildMarkdown(payload: ExportPayload): string {
  const lines: string[] = [];
  lines.push(`# Laporan Redline — ${payload.query}`);
  lines.push("");
  lines.push(`- **Tipe**: ${QUERY_TYPE_LABELS[payload.type]}`);
  lines.push(`- **Waktu**: ${payload.timestamp}`);
  lines.push(
    `- **Sumber**: ${payload.results.length} (${payload.results
      .filter((result) => result.status === "success").length} berhasil)`,
  );
  lines.push("");
  lines.push("## Laporan AI");
  lines.push("");
  lines.push(payload.analysis.trim() || "_Analisis AI tidak tersedia._");
  lines.push("");
  lines.push("## Data Mentah per Sumber");
  lines.push("");
  for (const result of payload.results) {
    lines.push(`### ${result.label} — ${result.status}`);
    lines.push("");
    lines.push("```json");
    lines.push(
      JSON.stringify(
        result.status === "error" ? { error: result.error } : result.data,
        null,
        2,
      ),
    );
    lines.push("```");
    lines.push("");
  }
  lines.push("---");
  lines.push("_Dihasilkan oleh Redline (OSINT Research)._");
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(query: string): string {
  const safe = query.replace(/[^a-z0-9.-]+/gi, "_").slice(0, 60);
  return `redline-${safe || "laporan"}.md`;
}
