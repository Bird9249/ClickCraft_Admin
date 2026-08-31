import { describe, expect, test } from "bun:test";
import { invoiceLinesFromQuotation } from "./quotation-invoice-lines";

describe("invoiceLinesFromQuotation", () => {
  test("uses synthetic line for attachment quotations", () => {
    const lines = invoiceLinesFromQuotation(
      {
        number: "QT-202601001",
        total: 10_000_000,
        documentMode: "attachment",
        lines: [],
      },
      40,
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.unitPrice).toBe(4_000_000);
    expect(lines[0]?.description).toContain("QT-202601001");
  });

  test("scales builtin quotation lines", () => {
    const lines = invoiceLinesFromQuotation(
      {
        number: "QT-202601002",
        total: 10_000_000,
        documentMode: "builtin",
        lines: [
          {
            description: "<p>Website</p>",
            quantity: 1,
            unitPrice: 10_000_000,
            sortOrder: 0,
            priceOn: "parent",
            children: [],
          },
        ],
      },
      30,
    );

    expect(lines[0]?.unitPrice).toBe(3_000_000);
  });
});
