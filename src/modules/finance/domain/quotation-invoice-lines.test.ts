import { describe, expect, test } from "bun:test";
import { invoiceLinesFromQuotation } from "./quotation-invoice-lines";

describe("invoiceLinesFromQuotation", () => {
  test("uses milestone label as the only invoice line", () => {
    const lines = invoiceLinesFromQuotation(
      {
        number: "QT-202601001",
        total: 10_000_000,
      },
      {
        percent: 40,
        label: "ງວດ 1 (ມັດຈຳ 40%)",
      },
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.unitPrice).toBe(4_000_000);
    expect(lines[0]?.quantity).toBe(1);
    expect(lines[0]?.children).toEqual([]);
    expect(lines[0]?.description).toContain("ງວດ 1 (ມັດຈຳ 40%)");
    expect(lines[0]?.description).not.toContain("QT-202601001");
  });

  test("falls back when label is empty", () => {
    const lines = invoiceLinesFromQuotation(
      {
        number: "QT-202601002",
        total: 10_000_000,
      },
      {
        percent: 30,
        label: "  ",
      },
    );

    expect(lines[0]?.unitPrice).toBe(3_000_000);
    expect(lines[0]?.description).toContain("Milestone 30%");
  });

  test("escapes html in milestone label", () => {
    const lines = invoiceLinesFromQuotation(
      { number: "QT-1", total: 100 },
      { percent: 100, label: 'A <b>bold</b> & "quoted"' },
    );
    expect(lines[0]?.description).toBe(
      "<p>A &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;</p>",
    );
  });
});
