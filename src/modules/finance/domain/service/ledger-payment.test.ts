import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createCustomerService } from "@/modules/customers/domain/service/create";
import {
  createInvoicesFromQuotationService,
  issueInvoiceService,
} from "@/modules/finance/domain/service/invoices";
import {
  createPaymentService,
  voidReceiptService,
} from "@/modules/finance/domain/service/payments";
import {
  acceptQuotationService,
  createQuotationService,
  sendQuotationService,
} from "@/modules/finance/domain/service/quotations";
import { FINANCE_SETTINGS_ID } from "@/modules/finance/domain/repo/settings/get";
import { LEDGER_PAYMENT_INCOME_CATEGORY } from "@/modules/finance/domain/ledger-payment-constants";
import { db, schema } from "@/server/platform/db/client";

const TEST_MARKER = "TEST_LEDGER_PAYMENT_SYNC";

async function cleanupTestData() {
  const customers = await db
    .select({ id: schema.customer.id })
    .from(schema.customer)
    .where(eq(schema.customer.notes, TEST_MARKER));

  for (const { id: customerId } of customers) {
    const invoices = await db
      .select({ id: schema.invoice.id })
      .from(schema.invoice)
      .where(eq(schema.invoice.customerId, customerId));

    for (const inv of invoices) {
      const receipts = await db
        .select({ id: schema.receipt.id, paymentId: schema.receipt.paymentId })
        .from(schema.receipt)
        .where(eq(schema.receipt.invoiceId, inv.id));

      for (const rc of receipts) {
        await db
          .delete(schema.ledgerEntry)
          .where(eq(schema.ledgerEntry.paymentId, rc.paymentId));
        await db.delete(schema.receipt).where(eq(schema.receipt.id, rc.id));
        await db
          .delete(schema.payment)
          .where(eq(schema.payment.id, rc.paymentId));
      }
      await db.delete(schema.invoice).where(eq(schema.invoice.id, inv.id));
    }

    const quotations = await db
      .select({ id: schema.quotation.id })
      .from(schema.quotation)
      .where(eq(schema.quotation.customerId, customerId));

    for (const qt of quotations) {
      await db.delete(schema.quotation).where(eq(schema.quotation.id, qt.id));
    }

    await db.delete(schema.customer).where(eq(schema.customer.id, customerId));
  }
}

describe("ledger payment sync (integration)", () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await db
      .update(schema.financeSettings)
      .set({ autoLedgerOnPayment: false, updatedAt: new Date() })
      .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID));
  });

  it("creates ledger on payment when enabled and removes on void", async () => {
    await db
      .update(schema.financeSettings)
      .set({ autoLedgerOnPayment: true, updatedAt: new Date() })
      .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID));

    await db.transaction(async (tx) => {
      const { created: customer } = await createCustomerService(tx, {
        input: {
          type: "company",
          name: "Ledger Sync Co.",
          notes: TEST_MARKER,
        },
      });

      const { created: qt } = await createQuotationService(tx, {
        input: {
          customerId: customer.id,
          issueDate: new Date(),
          currency: "LAK",
          lines: [
            {
              description: "Website",
              quantity: 1,
              unitPrice: 5_000_000,
              sortOrder: 0,
            },
          ],
        },
      });

      await sendQuotationService(tx, { id: qt.id });
      await acceptQuotationService(tx, { id: qt.id });

      const { invoices } = await createInvoicesFromQuotationService(tx, {
        input: {
          quotationId: qt.id,
          issueDate: new Date(),
          milestones: [{ percent: 100, label: "Full", condition: "On delivery" }],
        },
      });

      await issueInvoiceService(tx, { id: invoices[0]!.id });

      const payResult = await createPaymentService(tx, {
        input: {
          invoiceId: invoices[0]!.id,
          amount: invoices[0]!.total,
          paidAt: new Date("2026-01-15"),
          method: "transfer",
          reference: "TEST-LEDGER",
        },
      });

      expect(payResult.ledgerEntry).toBeTruthy();
      expect(payResult.ledgerEntry?.sourceType).toBe("payment");
      expect(payResult.ledgerEntry?.amount).toBe(5_000_000);
      expect(payResult.ledgerEntry?.category).toBe(LEDGER_PAYMENT_INCOME_CATEGORY);
      expect(payResult.ledgerEntry?.paymentId).toBe(payResult.payment.id);
      expect(payResult.ledgerEntry?.notes).toContain(payResult.receipt.number);

      const [linked] = await tx
        .select()
        .from(schema.ledgerEntry)
        .where(eq(schema.ledgerEntry.paymentId, payResult.payment.id));
      expect(linked?.id).toBe(payResult.ledgerEntry?.id);

      await voidReceiptService(tx, { id: payResult.receipt.id });

      const afterVoid = await tx
        .select()
        .from(schema.ledgerEntry)
        .where(eq(schema.ledgerEntry.paymentId, payResult.payment.id));
      expect(afterVoid).toHaveLength(0);
    });
  });

  it("skips ledger when auto setting is off", async () => {
    await db
      .update(schema.financeSettings)
      .set({ autoLedgerOnPayment: false, updatedAt: new Date() })
      .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID));

    await db.transaction(async (tx) => {
      const { created: customer } = await createCustomerService(tx, {
        input: {
          type: "individual",
          name: "No Auto Ledger",
          notes: TEST_MARKER,
        },
      });

      const { created: qt } = await createQuotationService(tx, {
        input: {
          customerId: customer.id,
          issueDate: new Date(),
          currency: "LAK",
          lines: [
            {
              description: "Consulting",
              quantity: 1,
              unitPrice: 1_000_000,
              sortOrder: 0,
            },
          ],
        },
      });

      await sendQuotationService(tx, { id: qt.id });
      await acceptQuotationService(tx, { id: qt.id });

      const { invoices } = await createInvoicesFromQuotationService(tx, {
        input: {
          quotationId: qt.id,
          issueDate: new Date(),
          milestones: [{ percent: 100, label: "Full", condition: "" }],
        },
      });

      await issueInvoiceService(tx, { id: invoices[0]!.id });

      const payResult = await createPaymentService(tx, {
        input: {
          invoiceId: invoices[0]!.id,
          amount: invoices[0]!.total,
          paidAt: new Date(),
          method: "transfer",
        },
      });

      expect(payResult.ledgerEntry).toBeNull();

      const rows = await tx
        .select()
        .from(schema.ledgerEntry)
        .where(eq(schema.ledgerEntry.paymentId, payResult.payment.id));
      expect(rows).toHaveLength(0);
    });
  });
});
