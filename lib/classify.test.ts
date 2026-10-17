import { describe, expect, it } from "vitest";
import { classifyQuery, detectQueryType, normalizeQuery } from "./classify";

describe("detectQueryType", () => {
  const cases: [string, string][] = [
    ["example.com", "domain"],
    ["sub.example.co.id", "domain"],
    ["WWW.Example.COM", "domain"],
    ["https://example.com/path?x=1", "domain"],
    ["8.8.8.8", "ip"],
    ["192.168.1.1", "ip"],
    ["2001:4860:4860::8888", "ip"],
    ["alice@example.com", "email"],
    ["first.last+tag@sub.example.co.id", "email"],
    ["@john_doe", "username"],
    ["+628123456789", "phone"],
    ["0812-3456-7890", "phone"],
    ["(021) 555-1234", "phone"],
    ["osint tools", "keyword"],
    ["Jakarta", "keyword"],
    ["threat intelligence report", "keyword"],
  ];

  for (const [input, expected] of cases) {
    it(`mengklasifikasi "${input}" sebagai ${expected}`, () => {
      expect(detectQueryType(input)).toBe(expected);
    });
  }

  it("memperlakukan 999.1.1.1 sebagai keyword, bukan IP", () => {
    expect(detectQueryType("999.1.1.1")).not.toBe("ip");
  });

  it("memperlakukan teks kosong sebagai keyword", () => {
    expect(detectQueryType("   ")).toBe("keyword");
  });

  it("tidak menganggap frasa berspasi sebagai username", () => {
    expect(detectQueryType("john doe")).toBe("keyword");
  });
});

describe("normalizeQuery", () => {
  it("menurunkan huruf domain dan membuang titik akhir", () => {
    expect(normalizeQuery("Example.COM.", "domain")).toBe("example.com");
  });

  it("mengambil hostname dari URL", () => {
    expect(normalizeQuery("https://Example.com/path", "domain")).toBe(
      "example.com",
    );
  });

  it("menurunkan huruf email", () => {
    expect(normalizeQuery("Alice@Example.com", "email")).toBe(
      "alice@example.com",
    );
  });

  it("membuang tanda @ dan menurunkan huruf username", () => {
    expect(normalizeQuery("@John_Doe", "username")).toBe("john_doe");
  });

  it("menyisakan digit dan tanda plus pada telepon", () => {
    expect(normalizeQuery("+62 812-3456-7890", "phone")).toBe("+6281234567890");
  });

  it("merapikan spasi pada keyword", () => {
    expect(normalizeQuery("  threat   intel  ", "keyword")).toBe("threat intel");
  });
});

describe("classifyQuery", () => {
  it("mengembalikan tipe dan query ternormalisasi", () => {
    expect(classifyQuery("  Example.COM ")).toEqual({
      type: "domain",
      query: "example.com",
    });
  });
});
