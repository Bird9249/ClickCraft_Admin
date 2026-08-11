import { describe, expect, test } from "bun:test";
import {
  buildPaymentLedgerNotes,
  LEDGER_PAYMENT_INCOME_CATEGORY,
} from "./ledger-payment-constants";

describe("buildPaymentLedgerNotes", () => {
  test("joins invoice, receipt, and milestone", () => {
    expect(
      buildPaymentLedgerNotes({
        invoiceNumber: "INV-202601001",
        receiptNumber: "RC-202601001",
        milestoneLabel: "M1",
      }),
    ).toBe("INV-202601001 / RC-202601001 / M1");
  });

  test("omits empty milestone", () => {
    expect(
      buildPaymentLedgerNotes({
        invoiceNumber: "INV-202601001",
        receiptNumber: "RC-202601001",
        milestoneLabel: "  ",
      }),
    ).toBe("INV-202601001 / RC-202601001");
  });
});

describe("LEDGER_PAYMENT_INCOME_CATEGORY", () => {
  test("uses development fee label", () => {
    expect(LEDGER_PAYMENT_INCOME_CATEGORY).toBe("ຄ່າພັດທະນາ");
  });
});
