import { describe, it, expect, vi, afterEach } from "vitest";
import { safeParseDate, toSafeSaleDateISO } from "./dateParsing";

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

describe("toSafeSaleDateISO utility", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should preserve exact calendar day at local noon for non-today custom dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 13, 10, 0, 0));

    // Midnight local time from Calendar DayPicker for Nov 5, 2026
    const pickedDate = new Date(2026, 10, 5, 0, 0, 0);
    const iso = toSafeSaleDateISO(pickedDate);
    const reparsed = new Date(iso);

    expect(reparsed.getFullYear()).toBe(2026);
    expect(reparsed.getMonth()).toBe(10);
    expect(reparsed.getDate()).toBe(5);
    expect(iso.startsWith("2026-11-05")).toBe(true);
  });

  it("should preserve current timestamp when today is selected or omitted", () => {
    vi.useFakeTimers();
    const fixedNow = new Date(2026, 10, 13, 15, 42, 10);
    vi.setSystemTime(fixedNow);

    expect(toSafeSaleDateISO()).toBe(fixedNow.toISOString());
    expect(toSafeSaleDateISO(new Date(2026, 10, 13, 0, 0, 0))).toBe(fixedNow.toISOString());
  });

  it("should parse string dates and fallback cleanly on invalid input", () => {
    vi.useFakeTimers();
    const fixedNow = new Date(2026, 10, 13, 9, 0, 0);
    vi.setSystemTime(fixedNow);

    const pastIso = toSafeSaleDateISO("2025-12-20");
    expect(pastIso.startsWith("2025-12-20")).toBe(true);
    expect(toSafeSaleDateISO("invalid-date")).toBe(fixedNow.toISOString());
  });
});
