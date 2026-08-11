import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createCustomerService } from "@/modules/customers/domain/service/create";
import {
  createInvoicesFromQuotationService,
  issueInvoiceService,
} from "@/modules/finance/domain/service/invoices";
import { createPaymentService } from "@/modules/finance/domain/service/payments";
import {
  acceptQuotationService,
  createQuotationService,
  sendQuotationService,
} from "@/modules/finance/domain/service/quotations";
import { createLedgerEntryService } from "@/modules/finance/domain/service/ledger";
import { linkLedgerPaymentService } from "@/modules/finance/domain/service/ledger-reconcile";
import { FINANCE_SETTINGS_ID } from "@/modules/finance/domain/repo/settings/get";
import { db, schema } from "@/server/platform/db/client";

const TEST_MARKER = "TEST_LEDGER_RECONCILE";

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

    await db
      .delete(schema.ledgerEntry)
      .where(
        eq(
          schema.ledgerEntry.relatedParty,
          "Reconcile Test Co.",
        ),
      );

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

describe("ledger reconcile link (integration)", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await db
      .update(schema.financeSettings)
      .set({ autoLedgerOnPayment: false, updatedAt: new Date() })
      .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID));
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("links manual ledger income to an existing payment", async () => {
    await db.transaction(async (tx) => {
      const { created: customer } = await createCustomerService(tx, {
        input: {
          type: "company",
          name: "Reconcile Test Co.",
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
              description: "App build",
              quantity: 1,
              unitPrice: 3_000_000,
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
          paidAt: new Date("2026-02-01"),
          method: "transfer",
        },
      });

      expect(payResult.ledgerEntry).toBeNull();

      const { created: manualLedger } = await createLedgerEntryService(tx, {
        input: {
          type: "income",
          entryDate: new Date("2026-02-01"),
          category: "ພັດທະນາ",
          amount: invoices[0]!.total,
          partyType: "customer",
          customerId: customer.id,
        },
      });

      const { updated } = await linkLedgerPaymentService(tx, {
        ledgerEntryId: manualLedger.id,
        paymentId: payResult.payment.id,
      });

      expect(updated.sourceType).toBe("payment");
      expect(updated.paymentId).toBe(payResult.payment.id);
      expect(updated.receiptId).toBe(payResult.receipt.id);
      expect(updated.notes).toContain(payResult.receipt.number);

      await expect(
        linkLedgerPaymentService(tx, {
          ledgerEntryId: manualLedger.id,
          paymentId: payResult.payment.id,
        }),
      ).rejects.toThrow(/already linked/i);
    });
  });
});
