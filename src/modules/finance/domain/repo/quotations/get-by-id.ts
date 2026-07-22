import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq, sql } from "drizzle-orm";

export async function getQuotationById(id: string, client: DbTransaction) {
  const [qt] = await client
    .select({
      id: schema.quotation.id,
      number: schema.quotation.number,
      status: schema.quotation.status,
      customerId: schema.quotation.customerId,
      issueDate: schema.quotation.issueDate,
      validUntil: schema.quotation.validUntil,
      currency: schema.quotation.currency,
      subtotal: schema.quotation.subtotal,
      taxAmount: schema.quotation.taxAmount,
      total: schema.quotation.total,
      taxNote: schema.quotation.taxNote,
      notes: schema.quotation.notes,
      internalNotes: schema.quotation.internalNotes,
      paymentSchedule: schema.quotation.paymentSchedule,
      showSignature: schema.quotation.showSignature,
      createdBy: schema.quotation.createdBy,
      createdAt: schema.quotation.createdAt,
      updatedAt: schema.quotation.updatedAt,
      customerName: schema.customer.name,
      customerAddress: schema.customer.address,
      customerTaxId: schema.customer.taxId,
      customerPhone: schema.customer.phone,
      customerEmail: schema.customer.email,
    })
    .from(schema.quotation)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.quotation.customerId}`,
    )
    .where(eq(schema.quotation.id, id));

  if (!qt) return null;

  const lines = await client
    .select()
    .from(schema.quotationLine)
    .where(eq(schema.quotationLine.quotationId, id))
    .orderBy(schema.quotationLine.sortOrder);

  return { ...qt, lines };
}
