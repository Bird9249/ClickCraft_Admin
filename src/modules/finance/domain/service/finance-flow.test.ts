import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { createCustomerService } from "@/modules/customers/domain/service/create";
import {
  createInvoicesFromQuotationService,
  issueInvoiceService,
  voidInvoiceService,
} from "@/modules/finance/domain/service/invoices";
import { createPaymentService } from "@/modules/finance/domain/service/payments";
import {
  acceptQuotationService,
  createQuotationService,
  sendQuotationService,
  updateQuotationService,
} from "@/modules/finance/domain/service/quotations";
import { getInvoiceById } from "@/modules/finance/domain/repo/invoices/get-by-id";
import { getQuotationById } from "@/modules/finance/domain/repo/quotations/get-by-id";
import { db, schema } from "@/server/platform/db/client";

const TEST_MARKER = "TEST_P0_FINANCE_FLOW";

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

describe("finance P0 happy path (integration)", () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("runs QT → accept → invoices 40/30/30 → pay full/partial", async () => {
    const outcome = await db.transaction(async (tx) => {
      const { created: customer } = await createCustomerService(tx, {
        input: {
          type: "company",
          name: "Test Hotel Co.",
          email: "test-hotel@test.clickcraft.local",
          notes: TEST_MARKER,
        },
      });

      const { created: qt } = await createQuotationService(tx, {
        input: {
          customerId: customer.id,
          issueDate: new Date(),
          currency: "LAK",
          taxNote: "VAT 0%",
          notes: TEST_MARKER,
          lines: [
            {
              description: "Phase 1 build",
              quantity: 1,
              unitPrice: 10_000_000,
              sortOrder: 0,
            },
          ],
        },
      });

      expect(qt.number).toMatch(/^QT-\d{6}\d{3}$/);
      expect(qt.status).toBe("draft");
      expect(qt.total).toBe(10_000_000);

      await sendQuotationService(tx, { id: qt.id });
      await acceptQuotationService(tx, { id: qt.id });

      const accepted = await getQuotationById(qt.id, tx);
      expect(accepted?.status).toBe("accepted");

      await expect(
        updateQuotationService(tx, {
          id: qt.id,
          input: { notes: "should fail" },
        }),
      ).rejects.toThrow(/draft/i);

      const { invoices } = await createInvoicesFromQuotationService(tx, {
        input: {
          quotationId: qt.id,
          issueDate: new Date(),
          milestones: [
            { percent: 40, label: "M1", condition: "Deposit before kickoff" },
            { percent: 30, label: "M2", condition: "After design approval" },
            { percent: 30, label: "M3", condition: "After go-live" },
          ],
        },
      });

      expect(invoices).toHaveLength(3);
      expect(invoices[0]!.total).toBe(4_000_000);
      expect(invoices[1]!.total).toBe(3_000_000);
      expect(invoices[2]!.total).toBe(3_000_000);
      expect(
        invoices[0]!.total + invoices[1]!.total + invoices[2]!.total,
      ).toBe(10_000_000);

      for (const inv of invoices) {
        await issueInvoiceService(tx, { id: inv.id });
      }

      const payFull = await createPaymentService(tx, {
        input: {
          invoiceId: invoices[0]!.id,
          amount: invoices[0]!.total,
          paidAt: new Date(),
          method: "transfer",
          reference: "TEST-FULL",
        },
      });
      expect(payFull.receipt.number).toMatch(/^RC-\d{6}\d{3}$/);

      const inv1 = await getInvoiceById(invoices[0]!.id, tx);
      expect(inv1?.status).toBe("paid");
      expect(inv1?.amountPaid).toBe(4_000_000);

      await expect(
        voidInvoiceService(tx, { id: invoices[0]!.id }),
      ).rejects.toThrow(/payment/i);

      const payPartial = await createPaymentService(tx, {
        input: {
          invoiceId: invoices[1]!.id,
          amount: 1_000_000,
          paidAt: new Date(),
          method: "transfer",
          reference: "TEST-PARTIAL",
        },
      });
      expect(payPartial.receipt.amount).toBe(1_000_000);

      const inv2 = await getInvoiceById(invoices[1]!.id, tx);
      expect(inv2?.status).toBe("partial");
      expect(inv2?.amountPaid).toBe(1_000_000);

      return { customerId: customer.id };
    });

    expect(outcome.customerId).toBeTruthy();
  });

  it("rejects creating invoices from non-accepted quotation", async () => {
    await db.transaction(async (tx) => {
      const { created: customer } = await createCustomerService(tx, {
        input: {
          type: "individual",
          name: "Test Person",
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

      await expect(
        createInvoicesFromQuotationService(tx, {
          input: {
            quotationId: qt.id,
            issueDate: new Date(),
            milestones: [
              { percent: 100, label: "Full" },
            ],
          },
        }),
      ).rejects.toThrow(/accepted/i);

      // Force rollback of this nested write set by throwing after assertions
      // Data cleaned in afterAll via TEST_MARKER
    });
  });
});
