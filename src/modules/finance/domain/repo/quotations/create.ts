import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateQuotationDTO } from "../../contracts";
import { computeTotals } from "../service-helpers";
import { insertQuotationLines } from "../line-helpers";

function resolveQuotationTotals(input: CreateQuotationDTO) {
  if (input.documentMode === "attachment") {
    const total = input.contractTotal ?? 0;
    return { subtotal: total, taxAmount: 0, total };
  }
  return computeTotals(input.lines ?? []);
}

export async function createQuotation(
  input: CreateQuotationDTO & { number: string; createdBy?: string | null },
  client: DbTransaction,
) {
  const totals = resolveQuotationTotals(input);
  const lines = input.documentMode === "attachment" ? [] : (input.lines ?? []);

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
      documentMode: input.documentMode ?? "builtin",
      attachmentFileKey: input.attachmentFileKey ?? null,
      attachmentFileName: input.attachmentFileName ?? null,
      attachmentContentType: input.attachmentContentType ?? null,
      showSignature: input.showSignature ?? true,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  if (!qt) throw new Error("Failed to create quotation");

  if (lines.length > 0) {
    await insertQuotationLines(qt.id, lines, client);
  }

  return qt;
}
