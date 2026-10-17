import { describe, expect, it } from "vitest";
import { run } from "./phoneinfo";

interface PhoneData {
  parsed: boolean;
  valid: boolean;
  country: string | null;
  callingCode: string | null;
  type: string | null;
}

describe("phoneinfo", () => {
  it("menguraikan nomor seluler Indonesia", async () => {
    const output = await run("+6281234567890");
    const data = output.data as PhoneData;
    expect(data.parsed).toBe(true);
    expect(data.valid).toBe(true);
    expect(data.country).toBe("ID");
    expect(data.callingCode).toBe("+62");
    expect(data.type).toBe("MOBILE");
    expect(output.empty).toBe(false);
  });

  it("menguraikan nomor tetap Amerika Serikat", async () => {
    const output = await run("+12124567890");
    const data = output.data as PhoneData;
    expect(data.parsed).toBe(true);
    expect(data.country).toBe("US");
    expect(data.type).toBeDefined();
  });

  it("menandai nomor tidak valid", async () => {
    const output = await run("+112345678901234567890");
    const data = output.data as PhoneData;
    expect(data.valid).toBe(false);
  });

  it("mengembalikan hasil tidak terurai untuk masukan acak", async () => {
    const output = await run("bukan-nomor");
    const data = output.data as PhoneData;
    expect(data.parsed).toBe(false);
  });
});
