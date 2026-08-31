import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateQuotationDTO } from "../../contracts";
import { computeTotals } from "../service-helpers";
import { insertQuotationLines } from "../line-helpers";

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
  if (input.documentMode !== undefined) updates.documentMode = input.documentMode;
  if (input.attachmentFileKey !== undefined)
    updates.attachmentFileKey = input.attachmentFileKey;
  if (input.attachmentFileName !== undefined)
    updates.attachmentFileName = input.attachmentFileName;
  if (input.attachmentContentType !== undefined)
    updates.attachmentContentType = input.attachmentContentType;
  if (input.contractTotal !== undefined) {
    updates.subtotal = input.contractTotal;
    updates.taxAmount = 0;
    updates.total = input.contractTotal;
  }

  const totals =
    input.documentMode === "builtin" && input.lines !== undefined
      ? computeTotals(input.lines)
      : null;
  if (totals) {
    updates.subtotal = totals.subtotal;
    updates.taxAmount = totals.taxAmount;
    updates.total = totals.total;
  }

  if (input.documentMode === "attachment" || input.lines !== undefined) {
    await client
      .delete(schema.quotationLine)
      .where(eq(schema.quotationLine.quotationId, id));

    const mode = input.documentMode;
    const lines =
      mode === "attachment" ? [] : (input.lines ?? []);

    if (lines.length > 0) {
      await insertQuotationLines(id, lines, client);
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
