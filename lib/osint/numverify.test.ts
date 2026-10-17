import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "./http";
import { run } from "./numverify";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("numverify", () => {
  it("gagal dengan pesan jelas tanpa API key", async () => {
    vi.stubEnv("NUMVERIFY_API_KEY", "");
    await expect(run("+6281234567890")).rejects.toThrow(/NUMVERIFY_API_KEY/);
  });

  it("memetakan respons validasi yang sukses", async () => {
    vi.stubEnv("NUMVERIFY_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          valid: true,
          number: "6281234567890",
          local_format: "081234567890",
          international_format: "+6281234567890",
          country_prefix: "+62",
          country_code: "ID",
          country_name: "Indonesia",
          location: "",
          carrier: "TELKOMSEL",
          line_type: "mobile",
        }),
      ),
    );

    const output = await run("+6281234567890");
    const data = output.data as { carrier: string; lineType: string; valid: boolean };
    expect(output.empty).toBe(false);
    expect(data.valid).toBe(true);
    expect(data.carrier).toBe("TELKOMSEL");
    expect(data.lineType).toBe("mobile");
  });

  it("melemparkan error ketika API mengembalikan success=false", async () => {
    vi.stubEnv("NUMVERIFY_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          success: false,
          error: { code: 104, type: "monthly_limit", info: "monthly usage limit reached" },
        }),
      ),
    );

    await expect(run("+6281234567890")).rejects.toBeInstanceOf(HttpError);
    await expect(run("+6281234567890")).rejects.toThrow(/monthly usage limit/);
  });
});
