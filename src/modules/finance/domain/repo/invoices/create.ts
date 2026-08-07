import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateInvoiceDTO } from "../../contracts";
import { computeTotals } from "../service-helpers";
import { insertInvoiceLines } from "../line-helpers";

export async function createInvoice(
  input: CreateInvoiceDTO & {
    number: string;
    milestoneLabel?: string | null;
    createdBy?: string | null;
  },
  client: DbTransaction,
) {
  const totals = computeTotals(input.lines);

  const [inv] = await client
    .insert(schema.invoice)
    .values({
      number: input.number,
      status: "draft",
      customerId: input.customerId,
      quotationId: input.quotationId ?? null,
      issueDate: input.issueDate,
      dueDate: input.dueDate ?? null,
      milestoneLabel: input.milestoneLabel ?? null,
      currency: input.currency ?? "LAK",
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      amountPaid: 0,
      taxNote: input.taxNote ?? "VAT 0%",
      notes: input.notes ?? null,
      showSignature: input.showSignature ?? true,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  if (!inv) throw new Error("Failed to create invoice");

  if (input.lines.length > 0) {
    await insertInvoiceLines(inv.id, input.lines, client);
  }

  return inv;
}
