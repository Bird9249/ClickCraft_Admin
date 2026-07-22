import type { DbTransaction } from "@/shared/types";
import type { CreateQuotationDTO, UpdateQuotationDTO } from "../contracts";
import { createQuotation } from "../repo/quotations/create";
import { getQuotationById } from "../repo/quotations/get-by-id";
import { updateQuotation } from "../repo/quotations/update";
import { nextDocNumber } from "./sequence";
import { schema } from "@/server/platform/db/client";
import { eq } from "drizzle-orm";

export async function createQuotationService(
  client: DbTransaction,
  params: { input: CreateQuotationDTO; actorId?: string | null },
) {
  const number = await nextDocNumber(client, "quotation");
  const created = await createQuotation(
    { ...params.input, number, createdBy: params.actorId ?? null },
    client,
  );
  return { created };
}

function isOnlyPrintOptions(input: UpdateQuotationDTO): boolean {
  const keys = Object.entries(input)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
  return keys.length > 0 && keys.every((k) => k === "showSignature");
}

export async function updateQuotationService(
  client: DbTransaction,
  params: { id: string; input: UpdateQuotationDTO },
) {
  const qt = await getQuotationById(params.id, client);
  if (!qt) throw new Error("Quotation not found");
  if (qt.status !== "draft" && !isOnlyPrintOptions(params.input))
    throw new Error("Can only edit quotations in draft status");

  const updated = await updateQuotation(params.id, params.input, client);
  if (!updated) throw new Error("Quotation not found");
  return { updated };
}

export async function sendQuotationService(
  client: DbTransaction,
  params: { id: string },
) {
  const qt = await getQuotationById(params.id, client);
  if (!qt) throw new Error("Quotation not found");
  if (qt.status !== "draft") throw new Error("Only draft quotations can be sent");

  const [updated] = await client
    .update(schema.quotation)
    .set({ status: "sent", updatedAt: new Date() })
    .where(eq(schema.quotation.id, params.id))
    .returning();
  return { updated };
}

export async function acceptQuotationService(
  client: DbTransaction,
  params: { id: string },
) {
  const qt = await getQuotationById(params.id, client);
  if (!qt) throw new Error("Quotation not found");
  if (qt.status !== "sent") throw new Error("Only sent quotations can be accepted");

  const [updated] = await client
    .update(schema.quotation)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(schema.quotation.id, params.id))
    .returning();
  return { updated };
}

export async function rejectQuotationService(
  client: DbTransaction,
  params: { id: string },
) {
  const qt = await getQuotationById(params.id, client);
  if (!qt) throw new Error("Quotation not found");
  if (qt.status !== "sent") throw new Error("Only sent quotations can be rejected");

  const [updated] = await client
    .update(schema.quotation)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(schema.quotation.id, params.id))
    .returning();
  return { updated };
}

export async function voidQuotationService(
  client: DbTransaction,
  params: { id: string },
) {
  const qt = await getQuotationById(params.id, client);
  if (!qt) throw new Error("Quotation not found");
  if (qt.status === "void") throw new Error("Quotation already voided");

  const [updated] = await client
    .update(schema.quotation)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(schema.quotation.id, params.id))
    .returning();
  return { updated };
}

export async function duplicateQuotationService(
  client: DbTransaction,
  params: { id: string; actorId?: string | null },
) {
  const qt = await getQuotationById(params.id, client);
  if (!qt) throw new Error("Quotation not found");

  const number = await nextDocNumber(client, "quotation");
  const created = await createQuotation(
    {
      number,
      customerId: qt.customerId,
      issueDate: new Date(),
      validUntil: qt.validUntil ?? null,
      currency: qt.currency,
      taxNote: qt.taxNote ?? null,
      notes: qt.notes ?? null,
      internalNotes: qt.internalNotes ?? null,
      createdBy: params.actorId ?? null,
      lines: qt.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        sortOrder: l.sortOrder,
      })),
    },
    client,
  );
  return { created };
}
