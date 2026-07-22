import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateInvoiceDTO } from "../../contracts";
import { computeTotals, lineAmount } from "../service-helpers";

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceDTO,
  client: DbTransaction,
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.customerId !== undefined) updates.customerId = input.customerId;
  if (input.issueDate !== undefined) updates.issueDate = input.issueDate;
  if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
  if (input.milestoneLabel !== undefined)
    updates.milestoneLabel = input.milestoneLabel;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.taxNote !== undefined) updates.taxNote = input.taxNote;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.showSignature !== undefined)
    updates.showSignature = input.showSignature;

  if (input.lines !== undefined) {
    const totals = computeTotals(input.lines);
    updates.subtotal = totals.subtotal;
    updates.taxAmount = totals.taxAmount;
    updates.total = totals.total;

    await client
      .delete(schema.invoiceLine)
      .where(eq(schema.invoiceLine.invoiceId, id));

    if (input.lines.length > 0) {
      await client.insert(schema.invoiceLine).values(
        input.lines.map((l, i) => ({
          invoiceId: id,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: lineAmount(l),
          sortOrder: l.sortOrder ?? i,
        })),
      );
    }
  }

  const [updated] = await client
    .update(schema.invoice)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updates as any)
    .where(eq(schema.invoice.id, id))
    .returning();

  return updated ?? null;
}
