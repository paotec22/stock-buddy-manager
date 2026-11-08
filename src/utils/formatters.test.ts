import { describe, it, expect } from "vitest";
import { formatCurrency } from "./formatters";

describe("formatCurrency utility", () => {
  it("should format amounts in NGN by default", () => {
    const formatted = formatCurrency(150000);
    // Should include currency symbol or code and comma separators
    expect(formatted).toMatch(/(NGN|₦).*150,000\.00/);
  });

  it("should handle custom currencies such as USD", () => {
    const formatted = formatCurrency(2500, {
      code: "USD",
      symbol: "$",
      name: "US Dollar",
      rate: 1,
    });
    expect(formatted).toBe("$2,500.00");
  });

  it("should handle zero amounts cleanly", () => {
    const formatted = formatCurrency(0);
    expect(formatted).toMatch(/(NGN|₦).*0\.00/);
  });
});
