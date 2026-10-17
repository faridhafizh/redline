import { describe, expect, it } from "vitest";
import {
  AGENTS,
  getSourceAgent,
  planAgents,
  runningAgent,
  summarizeAgent,
} from "./agents";
import type { QueryType, SourceResult } from "./types";

const ALL_TYPES: QueryType[] = [
  "domain",
  "ip",
  "email",
  "phone",
  "username",
  "keyword",
];

function result(partial: Partial<SourceResult>): SourceResult {
  return {
    source: "gdelt",
    label: "GDELT",
    category: "keyword",
    status: "success",
    ...partial,
  };
}

describe("agents", () => {
  it("memetakan setiap sumber ke tepat satu agent", () => {
    const mapped = AGENTS.flatMap((agent) => agent.sourceIds);
    const unique = new Set(mapped);
    expect(unique.size).toBe(mapped.length);

    for (const id of mapped) {
      expect(getSourceAgent(id)).toBeDefined();
    }
  });

  it("memetakan seluruh 21 sumber", () => {
    const mapped = AGENTS.flatMap((agent) => agent.sourceIds);
    expect(new Set(mapped).size).toBe(21);
    expect(getSourceAgent("numverify")).toBe("identity");
  });

  it("mensummon agent yang relevan per tipe query", () => {
    expect(planAgents("ip").map((a) => a.id)).toEqual(["infra"]);
    expect(planAgents("keyword").map((a) => a.id).sort()).toEqual([
      "corporate",
      "media",
    ]);
    expect(planAgents("domain").map((a) => a.id).sort()).toEqual([
      "corporate",
      "infra",
      "media",
    ]);
    expect(planAgents("email").map((a) => a.id).sort()).toEqual([
      "infra",
      "leak",
    ]);
    expect(planAgents("username").map((a) => a.id).sort()).toEqual([
      "identity",
      "media",
    ]);
    expect(planAgents("phone").map((a) => a.id)).toEqual(["identity"]);
  });

  it("tidak menyummon agent tanpa sumber relevan", () => {
    for (const type of ALL_TYPES) {
      for (const agent of planAgents(type)) {
        expect(agent.sources.length).toBeGreaterThan(0);
      }
    }
  });

  it("menghitung ringkasan agent", () => {
    const plan = planAgents("keyword")[0];
    const results: SourceResult[] = [
      result({ status: "success", data: { articleCount: 5 } }),
      result({ status: "empty" }),
      result({ status: "error", error: "gagal" }),
    ];
    const summary = summarizeAgent(plan, results);
    expect(summary.successCount).toBe(1);
    expect(summary.emptyCount).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.status).toBe("done");
    expect(summary.highlights).toContain("5 artikel berita");
  });

  it("menandai agent sebagai berjalan", () => {
    const plan = planAgents("domain")[0];
    expect(runningAgent(plan).status).toBe("running");
  });
});
