import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceId } from "../types";
import { getAdapter } from "./index";
import {
  SOURCES,
  getSource,
  getSourcesForType,
  isSourceConfigured,
} from "./registry";

afterEach(() => {
  vi.unstubAllEnvs();
});

function ids(type: Parameters<typeof getSourcesForType>[0]): string[] {
  return getSourcesForType(type)
    .map((source) => source.id)
    .sort();
}

describe("registry", () => {
  it("mendaftarkan 21 sumber", () => {
    expect(SOURCES).toHaveLength(21);
  });

  it("memiliki id yang unik", () => {
    const seen = new Set<SourceId>();
    for (const source of SOURCES) {
      expect(seen.has(source.id)).toBe(false);
      seen.add(source.id);
    }
    expect(seen.size).toBe(SOURCES.length);
  });

  it("melengkapi metadata setiap sumber", () => {
    for (const source of SOURCES) {
      expect(source.label.length).toBeGreaterThan(0);
      expect(source.description.length).toBeGreaterThan(0);
      expect(source.supports.length).toBeGreaterThan(0);
      expect(source.url).toMatch(/^https:\/\//);
      expect(getSource(source.id)).toBe(source);
    }
  });

  it("memiliki adapter untuk setiap sumber", () => {
    for (const source of SOURCES) {
      expect(typeof getAdapter(source.id)).toBe("function");
    }
  });

  it("memetakan sumber per tipe query", () => {
    expect(ids("keyword")).toEqual([
      "gdelt",
      "github-search",
      "hackernews",
      "sec-edgar",
      "stackexchange",
      "wikidata",
      "wikipedia",
    ]);
    expect(ids("domain")).toEqual([
      "crtsh",
      "dns-doh",
      "github-search",
      "hackernews",
      "rdap",
      "wayback",
    ]);
    expect(ids("ip")).toEqual([
      "ipgeolocation",
      "rdap",
      "ripestat",
      "shodan-internetdb",
    ]);
    expect(ids("email")).toEqual(["dns-doh", "gravatar", "xposedornot"]);
    expect(ids("username")).toEqual([
      "github-user",
      "gitlab-user",
      "hackernews",
      "keybase",
    ]);
    expect(ids("phone")).toEqual(["phone-info"]);
  });

  it("menyertakan sumber berkey hanya bila env tersedia", () => {
    const numverify = getSource("numverify");
    expect(numverify).toBeDefined();
    expect(numverify?.requiredEnv).toBe("NUMVERIFY_API_KEY");
    if (!numverify) return;

    vi.stubEnv("NUMVERIFY_API_KEY", "");
    expect(isSourceConfigured(numverify)).toBe(false);
    expect(ids("phone")).toEqual(["phone-info"]);

    vi.stubEnv("NUMVERIFY_API_KEY", "test-key");
    expect(isSourceConfigured(numverify)).toBe(true);
    expect(ids("phone")).toEqual(["numverify", "phone-info"]);
  });

  it("memberi minimal satu sumber untuk setiap tipe query", () => {
    for (const type of ["domain", "ip", "email", "phone", "username", "keyword"] as const) {
      expect(getSourcesForType(type).length).toBeGreaterThan(0);
    }
  });
});
