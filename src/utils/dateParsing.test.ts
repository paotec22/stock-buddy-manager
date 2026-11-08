import { describe, it, expect } from "vitest";
import { safeParseDate } from "./dateParsing";

describe("safeParseDate utility", () => {
  it("should correctly parse strict ISO strings", () => {
    const parsed = safeParseDate("2026-11-08T14:30:00.000Z");
    expect(parsed).not.toBeNull();
    expect(parsed?.getUTCFullYear()).toBe(2026);
    expect(parsed?.getUTCMonth()).toBe(10); // 0-indexed: 10 = Nov
    expect(parsed?.getUTCDate()).toBe(8);
  });

  it("should parse SQL datetime strings with space separator", () => {
    const parsed = safeParseDate("2025-06-15 10:20:00");
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2025);
    expect(parsed?.getMonth()).toBe(5); // June
    expect(parsed?.getDate()).toBe(15);
  });

  it("should parse YYYY-MM-DD date-only strings", () => {
    const parsed = safeParseDate("2024-01-25");
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2024);
    expect(parsed?.getMonth()).toBe(0); // Jan
    expect(parsed?.getDate()).toBe(25);
  });

  it("should parse British/European DD/MM/YYYY strings", () => {
    const parsed = safeParseDate("18/09/2023");
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2023);
    expect(parsed?.getMonth()).toBe(8); // Sept
    expect(parsed?.getDate()).toBe(18);
  });

  it("should parse YYYY/MM/DD strings", () => {
    const parsed = safeParseDate("2022/12/31");
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2022);
    expect(parsed?.getMonth()).toBe(11); // Dec
    expect(parsed?.getDate()).toBe(31);
  });

  it("should parse numeric epoch timestamps", () => {
    const now = new Date("2026-05-10T12:00:00Z").getTime();
    const parsed = safeParseDate(now);
    expect(parsed).not.toBeNull();
    expect(parsed?.getTime()).toBe(now);
  });

  it("should return null for invalid, empty, or garbage dates", () => {
    expect(safeParseDate(null)).toBeNull();
    expect(safeParseDate(undefined)).toBeNull();
    expect(safeParseDate("")).toBeNull();
    expect(safeParseDate("not-a-valid-date-string")).toBeNull();
  });
});
