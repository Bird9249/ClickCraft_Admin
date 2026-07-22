import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { CreateFromQuotationDTO, CreateInvoiceDTO, UpdateInvoiceDTO } from "../contracts";
import { createInvoice } from "../repo/invoices/create";
import { getInvoiceById } from "../repo/invoices/get-by-id";
import { updateInvoice } from "../repo/invoices/update";
import { getQuotationById } from "../repo/quotations/get-by-id";
import { nextDocNumber } from "./sequence";

export async function createInvoiceService(
  client: DbTransaction,
  params: { input: CreateInvoiceDTO; actorId?: string | null },
) {
  const number = await nextDocNumber(client, "invoice");
  const created = await createInvoice(
    { ...params.input, number, createdBy: params.actorId ?? null },
    client,
  );
  return { created };
}

function isOnlyPrintOptions(input: UpdateInvoiceDTO): boolean {
  const keys = Object.entries(input)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
  return keys.length > 0 && keys.every((k) => k === "showSignature");
}

export async function updateInvoiceService(
  client: DbTransaction,
  params: { id: string; input: UpdateInvoiceDTO },
) {
  const inv = await getInvoiceById(params.id, client);
  if (!inv) throw new Error("Invoice not found");
  if (inv.status !== "draft" && !isOnlyPrintOptions(params.input))
    throw new Error("Can only edit invoices in draft status");

  const updated = await updateInvoice(params.id, params.input, client);
  if (!updated) throw new Error("Invoice not found");
  return { updated };
}

export async function issueInvoiceService(
  client: DbTransaction,
  params: { id: string },
) {
  const inv = await getInvoiceById(params.id, client);
  if (!inv) throw new Error("Invoice not found");
  if (inv.status !== "draft") throw new Error("Only draft invoices can be issued");

  const [updated] = await client
    .update(schema.invoice)
    .set({ status: "issued", updatedAt: new Date() })
    .where(eq(schema.invoice.id, params.id))
    .returning();
  return { updated };
}

export async function voidInvoiceService(
  client: DbTransaction,
  params: { id: string },
) {
  const inv = await getInvoiceById(params.id, client);
  if (!inv) throw new Error("Invoice not found");
  if (inv.status === "void") throw new Error("Invoice already voided");
  if ((inv.amountPaid ?? 0) > 0)
    throw new Error("Cannot void an invoice with payments. Void receipts first.");

  const [updated] = await client
    .update(schema.invoice)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(schema.invoice.id, params.id))
    .returning();
  return { updated };
}

export async function createInvoicesFromQuotationService(
  client: DbTransaction,
  params: { input: CreateFromQuotationDTO; actorId?: string | null },
) {
  const { input, actorId } = params;
  const qt = await getQuotationById(input.quotationId, client);
  if (!qt) throw new Error("Quotation not found");
  if (qt.status !== "accepted")
    throw new Error("Quotation must be accepted before creating invoices");

  const totalPercent = input.milestones.reduce((s, m) => s + m.percent, 0);
  if (totalPercent !== 100)
    throw new Error("Milestone percentages must sum to 100");

  // Persist chosen terms back onto the quotation for PDF / future edits
  await client
    .update(schema.quotation)
    .set({
      paymentSchedule: input.milestones.map((m, i) => ({
        percent: m.percent,
        label: m.label ?? `M${i + 1}`,
        condition: m.condition ?? "",
        dueDays:
          m.dueDate != null
            ? Math.max(
                0,
                Math.round(
                  (new Date(m.dueDate).getTime() -
                    new Date(input.issueDate).getTime()) /
                    (24 * 60 * 60 * 1000),
                ),
              )
            : null,
      })),
      updatedAt: new Date(),
    })
    .where(eq(schema.quotation.id, qt.id));

  const invoices = [];
  for (const milestone of input.milestones) {
    const milestoneTotal = Math.round((qt.total * milestone.percent) / 100);
    const milestoneSubtotal = Math.round(
      (qt.subtotal * milestone.percent) / 100,
    );
    const milestoneTax = milestoneTotal - milestoneSubtotal;

    const number = await nextDocNumber(client, "invoice");
    const conditionNote = milestone.condition?.trim() || null;
    const inv = await createInvoice(
      {
        number,
        customerId: qt.customerId,
        quotationId: qt.id,
        issueDate: input.issueDate,
        dueDate: milestone.dueDate ?? null,
        milestoneLabel: milestone.label ?? null,
        currency: qt.currency,
        taxNote: qt.taxNote ?? null,
        notes: conditionNote ?? qt.notes ?? null,
        showSignature: qt.showSignature ?? true,
        createdBy: actorId ?? null,
        lines: qt.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: Math.round((l.unitPrice * milestone.percent) / 100),
          sortOrder: l.sortOrder,
        })),
      },
      client,
    );

    // Correct the totals for this milestone directly
    await client
      .update(schema.invoice)
      .set({
        subtotal: milestoneSubtotal,
        taxAmount: milestoneTax,
        total: milestoneTotal,
        updatedAt: new Date(),
      })
      .where(eq(schema.invoice.id, inv.id));

    invoices.push({ ...inv, total: milestoneTotal });
  }

  return { invoices };
}
