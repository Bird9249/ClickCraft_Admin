import { describe, expect, it } from "bun:test";
import {
  renderInvoiceHtml,
  renderQuotationHtml,
  renderReceiptHtml,
} from "./pdf";

const baseLines = [
  {
    description: "Hotel PMS Phase 1",
    quantity: 1,
    unitPrice: 25_000_000,
    amount: 25_000_000,
  },
];

describe("finance PDF HTML", () => {
  it("matches Website quotation print structure and brand", () => {
    const html = renderQuotationHtml({
      number: "QT-202607001",
      issueDate: new Date("2026-07-22"),
      customerName: "Vientiane Riverside Hotel",
      customerPhone: "020 5555 1234",
      customerAddress: "Vientiane Capital",
      currency: "LAK",
      lines: baseLines,
      subtotal: 25_000_000,
      taxAmount: 0,
      total: 25_000_000,
      taxNote: "VAT 0%",
    });

    expect(html).toContain("QT-202607001");
    expect(html).toContain("ClickCraft");
    expect(html).toContain("#00A896");
    expect(html).toContain("Noto Sans Lao");
    expect(html).toContain("Vientiane Riverside Hotel");
    expect(html).toContain("25,000,000 LAK");
    expect(html).toContain("Payment Milestones");
    expect(html).toContain("CLIENT INFO");
    expect(html).toContain("Document No.");
    expect(html).toContain("Grand Total");
    expect(html).toContain("window.print()");
    expect(html).toContain("data:image/webp;base64,");
    expect(html).toContain("Software Studio for SME");
    expect(html).toContain("signatures");
  });

  it("hides signature section when showSignature is false", () => {
    const html = renderQuotationHtml({
      number: "QT-202607002",
      issueDate: new Date("2026-07-22"),
      customerName: "Test Co",
      currency: "LAK",
      lines: baseLines,
      subtotal: 25_000_000,
      taxAmount: 0,
      total: 25_000_000,
      showSignature: false,
    });

    expect(html).toContain("QT-202607002");
    expect(html).not.toContain('class="signatures"');
  });

  it("renders invoice with milestone label", () => {
    const html = renderInvoiceHtml({
      number: "INV-202607001",
      issueDate: new Date("2026-07-22"),
      dueDate: new Date("2026-08-22"),
      milestoneLabel: "Milestone 1 — 40%",
      customerName: "Vientiane Riverside Hotel",
      currency: "LAK",
      lines: baseLines,
      subtotal: 10_000_000,
      taxAmount: 0,
      total: 10_000_000,
      amountPaid: 0,
    });

    expect(html).toContain("INV-202607001");
    expect(html).toContain("Milestone 1 — 40%");
    expect(html).toContain("Invoice");
    expect(html).toContain("#00A896");
  });

  it("renders invoice bank transfer section from global settings", () => {
    const html = renderInvoiceHtml({
      number: "INV-202607009",
      issueDate: new Date("2026-07-22"),
      customerName: "Test Co",
      currency: "LAK",
      lines: baseLines,
      subtotal: 10_000_000,
      taxAmount: 0,
      total: 10_000_000,
      amountPaid: 0,
      bank: {
        bankName: "BCEL",
        accountName: "ClickCraft Studio",
        accountNumber: "123-4-56789-0",
        qrDataUri: "data:image/png;base64,AAA",
      },
    });

    expect(html).toContain("Bank Transfer");
    expect(html).toContain("BCEL");
    expect(html).toContain("ClickCraft Studio");
    expect(html).toContain("123-4-56789-0");
    expect(html).toContain('class="bank-qr"');
    expect(html).toContain("data:image/png;base64,AAA");
  });

  it("renders receipt with reference", () => {
    const html = renderReceiptHtml({
      number: "RC-202607001",
      issueDate: new Date("2026-07-22"),
      customerName: "Vientiane Riverside Hotel",
      currency: "LAK",
      lines: [
        {
          description: "Payment for INV-202607001",
          quantity: 1,
          unitPrice: 10_000_000,
          amount: 10_000_000,
        },
      ],
      subtotal: 10_000_000,
      taxAmount: 0,
      total: 10_000_000,
      paymentMethod: "transfer",
      reference: "DEMO-TRX-001",
    });

    expect(html).toContain("RC-202607001");
    expect(html).toContain("DEMO-TRX-001");
    expect(html).toContain("transfer");
    expect(html).toContain("Receipt");
  });
});
