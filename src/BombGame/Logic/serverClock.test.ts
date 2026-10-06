import { afterEach, expect, it, vi } from "vitest";
import { ServerClock } from "./serverClock";

afterEach(() => vi.restoreAllMocks());

it("ignores device clock skew and clock jumps, accounting for half the round trip", () => {
  const clock = new ServerClock();
  vi.spyOn(Date, "now").mockReturnValue(999999999);
  clock.synchronize(100000, 1000, 1200);
  expect(clock.now(1200)).toBe(100100); expect(clock.now(2200)).toBe(101100);
  vi.spyOn(Date, "now").mockReturnValue(-999999999);
  expect(clock.now(3200)).toBe(102100);
  clock.observe(105000, 3500);
  expect(clock.now(4200)).toBe(103100);
});

it("uses snapshots until synchronization and resets for a new connection", () => {
  const clock = new ServerClock();
  clock.observe(2000, 100); expect(clock.now(1100)).toBe(3000);
  clock.synchronize(4000, 1500, 1700); expect(clock.now(1700)).toBe(4100);
  clock.reset(); clock.observe(8000, 2000); expect(clock.now(2100)).toBe(8100);
});
