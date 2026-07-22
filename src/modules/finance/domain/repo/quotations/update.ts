import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateQuotationDTO } from "../../contracts";
import { computeTotals, lineAmount } from "../service-helpers";

export async function updateQuotation(
  id: string,
  input: UpdateQuotationDTO,
  client: DbTransaction,
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.customerId !== undefined) updates.customerId = input.customerId;
  if (input.issueDate !== undefined) updates.issueDate = input.issueDate;
  if (input.validUntil !== undefined) updates.validUntil = input.validUntil;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.taxNote !== undefined) updates.taxNote = input.taxNote;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.internalNotes !== undefined)
    updates.internalNotes = input.internalNotes;
  if (input.paymentSchedule !== undefined)
    updates.paymentSchedule = input.paymentSchedule;
  if (input.showSignature !== undefined)
    updates.showSignature = input.showSignature;

  if (input.lines !== undefined) {
    const totals = computeTotals(input.lines);
    updates.subtotal = totals.subtotal;
    updates.taxAmount = totals.taxAmount;
    updates.total = totals.total;

    await client
      .delete(schema.quotationLine)
      .where(eq(schema.quotationLine.quotationId, id));

    if (input.lines.length > 0) {
      await client.insert(schema.quotationLine).values(
        input.lines.map((l, i) => ({
          quotationId: id,
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
    .update(schema.quotation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updates as any)
    .where(eq(schema.quotation.id, id))
    .returning();

  return updated ?? null;
}
