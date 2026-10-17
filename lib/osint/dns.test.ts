import { describe, expect, it } from "vitest";
import { extractDomain } from "./dns";

describe("extractDomain", () => {
  it("mengambil domain dari alamat email", () => {
    expect(extractDomain("alice@example.com")).toBe("example.com");
    expect(extractDomain("first.last@sub.example.co.id")).toBe(
      "sub.example.co.id",
    );
  });

  it("memakai domain apa adanya bila bukan email", () => {
    expect(extractDomain("example.com")).toBe("example.com");
    expect(extractDomain("Example.COM")).toBe("example.com");
  });
});
