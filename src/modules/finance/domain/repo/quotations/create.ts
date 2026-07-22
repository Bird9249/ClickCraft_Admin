import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateQuotationDTO } from "../../contracts";
import { computeTotals, lineAmount } from "../service-helpers";

export async function createQuotation(
  input: CreateQuotationDTO & { number: string; createdBy?: string | null },
  client: DbTransaction,
) {
  const totals = computeTotals(input.lines);

  const [qt] = await client
    .insert(schema.quotation)
    .values({
      number: input.number,
      status: "draft",
      customerId: input.customerId,
      issueDate: input.issueDate,
      validUntil: input.validUntil ?? null,
      currency: input.currency ?? "LAK",
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      taxNote: input.taxNote ?? "VAT 0%",
      notes: input.notes ?? null,
      internalNotes: input.internalNotes ?? null,
      sourcePresetId: input.sourcePresetId ?? null,
      paymentSchedule: input.paymentSchedule ?? null,
      showSignature: input.showSignature ?? true,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  if (!qt) throw new Error("Failed to create quotation");

  if (input.lines.length > 0) {
    await client.insert(schema.quotationLine).values(
      input.lines.map((l, i) => ({
        quotationId: qt.id,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: lineAmount(l),
        sortOrder: l.sortOrder ?? i,
      })),
    );
  }

  return qt;
}
