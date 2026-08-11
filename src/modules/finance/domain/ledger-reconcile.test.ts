import { describe, expect, test } from "bun:test";
import {
  buildReconciliationSuggestions,
  type UnlinkedLedgerRow,
  type UnlinkedPaymentRow,
} from "./repo/ledger/reconciliation";

const ledgerRow = (
  overrides: Partial<UnlinkedLedgerRow> & { id: string },
): UnlinkedLedgerRow => ({
  entryDate: new Date("2026-01-10"),
  category: "ພັດທະນາ",
  amount: 1_000_000,
  relatedParty: "Life Football",
  customerId: null,
  sourceType: "csv_import",
  notes: null,
  ...overrides,
});

const paymentRow = (
  overrides: Partial<UnlinkedPaymentRow> & { paymentId: string },
): UnlinkedPaymentRow => ({
  paidAt: new Date("2026-01-12"),
  amount: 1_000_000,
  method: "transfer",
  reference: null,
  receiptId: "rc1",
  receiptNumber: "RC-202601001",
  invoiceId: "inv1",
  invoiceNumber: "INV-202601001",
  customerId: "cust1",
  customerName: "Life Football",
  ...overrides,
});

describe("buildReconciliationSuggestions", () => {
  test("matches amount and customer name", () => {
    const suggestions = buildReconciliationSuggestions(
      [ledgerRow({ id: "le1" })],
      [paymentRow({ paymentId: "pay1" })],
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.ledgerEntryId).toBe("le1");
    expect(suggestions[0]?.paymentId).toBe("pay1");
  });

  test("skips when amount differs", () => {
    const suggestions = buildReconciliationSuggestions(
      [ledgerRow({ id: "le1", amount: 2_000_000 })],
      [paymentRow({ paymentId: "pay1", amount: 1_000_000 })],
    );
    expect(suggestions).toHaveLength(0);
  });

  test("skips when customer does not match", () => {
    const suggestions = buildReconciliationSuggestions(
      [ledgerRow({ id: "le1", relatedParty: "Slurp" })],
      [paymentRow({ paymentId: "pay1", customerName: "Life Football" })],
    );
    expect(suggestions).toHaveLength(0);
  });

  test("deduplicates one-to-one pairs", () => {
    const suggestions = buildReconciliationSuggestions(
      [
        ledgerRow({ id: "le1" }),
        ledgerRow({ id: "le2", entryDate: new Date("2026-01-11") }),
      ],
      [
        paymentRow({ paymentId: "pay1" }),
        paymentRow({
          paymentId: "pay2",
          receiptNumber: "RC-202601002",
          paidAt: new Date("2026-01-13"),
        }),
      ],
    );
    expect(suggestions).toHaveLength(2);
    expect(new Set(suggestions.map((s) => s.ledgerEntryId)).size).toBe(2);
    expect(new Set(suggestions.map((s) => s.paymentId)).size).toBe(2);
  });
});
