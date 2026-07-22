#!/usr/bin/env bun

/**
 * Seed demo finance data for ClickCraft Admin P0.
 *
 * Usage: bun run db:seed:finance
 *
 * Idempotent: removes previous rows tagged with DEMO_SEED_MARKER first.
 */

import { eq, like, or } from "drizzle-orm";
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
import { db, schema } from "@/server/platform/db/client";
import { logger } from "@/server/platform/observability/logger";

const DEMO_SEED_MARKER = "DEMO_SEED_P0_FINANCE";

async function clearPreviousDemo() {
  const demoCustomers = await db
    .select({ id: schema.customer.id })
    .from(schema.customer)
    .where(
      or(
        eq(schema.customer.notes, DEMO_SEED_MARKER),
        like(schema.customer.email, "%@demo.clickcraft.local"),
      ),
    );

  const customerIds = demoCustomers.map((c) => c.id);
  if (customerIds.length === 0) return;

  logger.info(`Clearing ${customerIds.length} previous demo customer(s)...`);

  for (const customerId of customerIds) {
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

async function seedFinanceDemo() {
  try {
    logger.info("Starting finance demo seed...");
    await clearPreviousDemo();

    const result = await db.transaction(async (tx) => {
      const { created: hotel } = await createCustomerService(tx, {
        input: {
          type: "company",
          name: "Vientiane Riverside Hotel",
          nameLocal: "Vientiane Riverside Hotel (LA)",
          email: "hotel@demo.clickcraft.local",
          phone: "02055551111",
          whatsapp: "8562055551111",
          address: "Ban Hatsady, Chanthabuly, Vientiane",
          taxId: "DEMO-TAX-001",
          notes: DEMO_SEED_MARKER,
        },
      });

      const { created: dealer } = await createCustomerService(tx, {
        input: {
          type: "company",
          name: "Lao Motorbike Trading Co., Ltd.",
          nameLocal: "Lao Motorbike Trading",
          email: "dealer@demo.clickcraft.local",
          phone: "02055552222",
          address: "Km 9, Dongdok, Vientiane",
          taxId: "DEMO-TAX-002",
          notes: DEMO_SEED_MARKER,
        },
      });

      const { created: draftQt } = await createQuotationService(tx, {
        input: {
          customerId: dealer.id,
          issueDate: new Date(),
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          currency: "LAK",
          taxNote: "VAT 0%",
          notes: "Draft demo quotation — motorcycle dealership Phase 1",
          internalNotes: DEMO_SEED_MARKER,
          lines: [
            {
              description: "Dealer ERP — Phase 1 setup",
              quantity: 1,
              unitPrice: 18_000_000,
              sortOrder: 0,
            },
            {
              description: "Staff training (2 days)",
              quantity: 1,
              unitPrice: 2_000_000,
              sortOrder: 1,
            },
          ],
        },
      });

      const { created: qt } = await createQuotationService(tx, {
        input: {
          customerId: hotel.id,
          issueDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          currency: "LAK",
          taxNote: "VAT 0%",
          notes: "Hotel Management System — Phase 1 quotation (demo)",
          internalNotes: DEMO_SEED_MARKER,
          lines: [
            {
              description: "Hotel PMS Phase 1 — core booking & front desk",
              quantity: 1,
              unitPrice: 25_000_000,
              sortOrder: 0,
            },
            {
              description: "Housekeeping module",
              quantity: 1,
              unitPrice: 8_000_000,
              sortOrder: 1,
            },
            {
              description: "Onsite training & go-live support",
              quantity: 1,
              unitPrice: 5_000_000,
              sortOrder: 2,
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
          milestones: [
            { percent: 40, label: "Milestone 1 — 40% deposit" },
            { percent: 30, label: "Milestone 2 — 30% mid" },
            { percent: 30, label: "Milestone 3 — 30% final" },
          ],
        },
      });

      for (const inv of invoices) {
        await issueInvoiceService(tx, { id: inv.id });
      }

      const inv1 = invoices[0]!;
      const inv2 = invoices[1]!;

      const pay1 = await createPaymentService(tx, {
        input: {
          invoiceId: inv1.id,
          amount: inv1.total,
          paidAt: new Date(),
          method: "transfer",
          reference: "DEMO-TRX-001",
          notes: DEMO_SEED_MARKER,
        },
      });

      const partialAmount = Math.round(inv2.total * 0.5);
      const pay2 = await createPaymentService(tx, {
        input: {
          invoiceId: inv2.id,
          amount: partialAmount,
          paidAt: new Date(),
          method: "transfer",
          reference: "DEMO-TRX-002",
          notes: DEMO_SEED_MARKER,
        },
      });

      return {
        hotel,
        dealer,
        draftQt,
        qt,
        invoices,
        pay1,
        pay2,
      };
    });

    logger.info("Finance demo seed completed");
    logger.info(
      JSON.stringify(
        {
          customers: [result.hotel.name, result.dealer.name],
          draftQuotation: result.draftQt.number,
          acceptedQuotation: result.qt.number,
          invoices: result.invoices.map((i) => i.number),
          receipts: [result.pay1.receipt.number, result.pay2.receipt.number],
        },
        null,
        2,
      ),
    );
    process.exit(0);
  } catch (error) {
    logger.error("Finance demo seed failed:", error);
    process.exit(1);
  }
}

seedFinanceDemo();
