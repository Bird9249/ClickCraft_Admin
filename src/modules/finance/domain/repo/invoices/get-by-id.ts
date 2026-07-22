import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq, sql } from "drizzle-orm";

export async function getInvoiceById(id: string, client: DbTransaction) {
  const [inv] = await client
    .select({
      id: schema.invoice.id,
      number: schema.invoice.number,
      status: schema.invoice.status,
      customerId: schema.invoice.customerId,
      quotationId: schema.invoice.quotationId,
      issueDate: schema.invoice.issueDate,
      dueDate: schema.invoice.dueDate,
      milestoneLabel: schema.invoice.milestoneLabel,
      currency: schema.invoice.currency,
      subtotal: schema.invoice.subtotal,
      taxAmount: schema.invoice.taxAmount,
      total: schema.invoice.total,
      amountPaid: schema.invoice.amountPaid,
      taxNote: schema.invoice.taxNote,
      notes: schema.invoice.notes,
      showSignature: schema.invoice.showSignature,
      createdBy: schema.invoice.createdBy,
      createdAt: schema.invoice.createdAt,
      updatedAt: schema.invoice.updatedAt,
      customerName: schema.customer.name,
      customerAddress: schema.customer.address,
      customerTaxId: schema.customer.taxId,
      customerPhone: schema.customer.phone,
      customerEmail: schema.customer.email,
    })
    .from(schema.invoice)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.invoice.customerId}`,
    )
    .where(eq(schema.invoice.id, id));

  if (!inv) return null;

  const lines = await client
    .select()
    .from(schema.invoiceLine)
    .where(eq(schema.invoiceLine.invoiceId, id))
    .orderBy(schema.invoiceLine.sortOrder);

  return { ...inv, lines };
}
