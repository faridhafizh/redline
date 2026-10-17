import { describe, expect, it } from "vitest";
import { createThrottle } from "./throttle";

describe("createThrottle", () => {
  it("menjaga jarak minimal antar task", async () => {
    const throttle = createThrottle(60);
    const stamps: number[] = [];

    await Promise.all(
      [1, 2, 3].map((index) =>
        throttle.schedule(async () => {
          stamps.push(Date.now());
          return index;
        }),
      ),
    );

    expect(stamps).toHaveLength(3);
    expect(stamps[1] - stamps[0]).toBeGreaterThanOrEqual(55);
    expect(stamps[2] - stamps[1]).toBeGreaterThanOrEqual(55);
  });

  it("menjalankan task pertama tanpa jeda", async () => {
    const throttle = createThrottle(1_000);
    const started = Date.now();
    await throttle.schedule(async () => undefined);
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("mengembalikan hasil task dengan benar", async () => {
    const throttle = createThrottle(1);
    const value = await throttle.schedule(async () => "selesai");
    expect(value).toBe("selesai");
  });
});
