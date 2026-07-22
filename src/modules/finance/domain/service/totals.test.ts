import { describe, expect, it } from "bun:test";
import { computeTotals, lineAmount } from "./totals";

describe("computeTotals", () => {
  it("sums line amounts with zero tax by default", () => {
    const result = computeTotals([
      { quantity: 1, unitPrice: 25_000_000 },
      { quantity: 2, unitPrice: 1_500_000 },
    ]);

    expect(result.subtotal).toBe(28_000_000);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(28_000_000);
  });

  it("includes per-line tax when provided", () => {
    const result = computeTotals([
      { quantity: 1, unitPrice: 10_000_000, taxAmount: 500_000 },
      { quantity: 1, unitPrice: 5_000_000, taxAmount: 250_000 },
    ]);

    expect(result.subtotal).toBe(15_000_000);
    expect(result.taxAmount).toBe(750_000);
    expect(result.total).toBe(15_750_000);
  });

  it("handles empty lines", () => {
    expect(computeTotals([])).toEqual({
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    });
  });
});

describe("lineAmount", () => {
  it("multiplies quantity by unit price", () => {
    expect(lineAmount({ quantity: 3, unitPrice: 2_000_000 })).toBe(6_000_000);
  });
});
