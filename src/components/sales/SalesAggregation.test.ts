import { describe, it, expect } from "vitest";
import { safeParseDate } from "@/utils/dateParsing";
import { Sale } from "./types";

describe("Sales Aggregation & Multi-Year Metrics (Demo Data)", () => {
  const demoSales: Sale[] = [
    {
      id: "sale-1",
      sale_date: "2026-11-05T10:00:00Z",
      quantity: 2,
      sale_price: 150000,
      total_amount: 300000,
      item_name: "Inverter 3.5kVA",
      location: "Ikeja",
      payment_status: "paid",
      amount_paid: 300000,
      notes: "Delivered",
      raw_notes: "Delivered",
      is_custom: false,
    },
    {
      id: "sale-2",
      sale_date: "2026-10-12T14:30:00Z",
      quantity: 1,
      sale_price: 250000,
      total_amount: 250000,
      item_name: "Lithium Battery 48V",
      location: "Cement",
      payment_status: "part_paid",
      amount_paid: 100000,
      notes: "Balance pending",
      raw_notes: "Balance pending",
      is_custom: false,
    },
    {
      id: "sale-3",
      sale_date: "2025-08-20 11:15:00",
      quantity: 4,
      sale_price: 50000,
      total_amount: 200000,
      item_name: "Mono Solar Panels 400W",
      location: "Uyo",
      payment_status: "paid",
      amount_paid: 200000,
      notes: "Historic 2025 order",
      raw_notes: "Historic 2025 order",
      is_custom: false,
    },
    {
      id: "sale-4",
      sale_date: "2024-03-10",
      quantity: 10,
      sale_price: 15000,
      total_amount: 150000,
      item_name: "Battery Cables",
      location: "Ikeja",
      payment_status: "unpaid",
      amount_paid: 0,
      notes: "Net 30 invoice",
      raw_notes: "Net 30 invoice",
      is_custom: false,
    },
  ];

  it("calculates executive KPI totals accurately from demo sales data", () => {
    const totalRevenue = demoSales.reduce((acc, s) => acc + s.total_amount, 0);
    const totalUnits = demoSales.reduce((acc, s) => acc + s.quantity, 0);
    const totalPaid = demoSales.reduce((acc, s) => {
      if (s.payment_status === "paid") return acc + s.total_amount;
      return acc + s.amount_paid;
    }, 0);
    const totalOutstanding = totalRevenue - totalPaid;

    expect(totalRevenue).toBe(900000); // 300k + 250k + 200k + 150k
    expect(totalUnits).toBe(17); // 2 + 1 + 4 + 10
    expect(totalPaid).toBe(600000); // 300k + 100k + 200k + 0
    expect(totalOutstanding).toBe(300000); // 150k unpaid + 150k part_paid balance
  });

  it("correctly identifies all distinct years across sales records", () => {
    const yearsSet = new Set<number>();
    for (const sale of demoSales) {
      const parsed = safeParseDate(sale.sale_date);
      if (parsed) {
        yearsSet.add(parsed.getFullYear());
      }
    }

    const observedYears = Array.from(yearsSet).sort((a, b) => b - a);
    expect(observedYears).toEqual([2026, 2025, 2024]);
  });

  it("aggregates branch revenue totals across company operating branches (Ikeja, Cement, Uyo)", () => {
    const branchTotals: Record<string, number> = {};
    for (const sale of demoSales) {
      branchTotals[sale.location] = (branchTotals[sale.location] || 0) + sale.total_amount;
    }

    expect(branchTotals["Ikeja"]).toBe(450000); // 300k + 150k
    expect(branchTotals["Cement"]).toBe(250000);
    expect(branchTotals["Uyo"]).toBe(200000);

    // Verify Lekki, Abuja, and Port Harcourt are completely excluded
    expect(branchTotals["Lekki"]).toBeUndefined();
    expect(branchTotals["Abuja"]).toBeUndefined();
    expect(branchTotals["Port Harcourt"]).toBeUndefined();
  });
});
