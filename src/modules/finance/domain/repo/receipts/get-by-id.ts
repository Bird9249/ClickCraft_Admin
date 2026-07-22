import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq, sql } from "drizzle-orm";

export async function getReceiptById(id: string, client: DbTransaction) {
  const [r] = await client
    .select({
      id: schema.receipt.id,
      number: schema.receipt.number,
      status: schema.receipt.status,
      customerId: schema.receipt.customerId,
      invoiceId: schema.receipt.invoiceId,
      paymentId: schema.receipt.paymentId,
      issueDate: schema.receipt.issueDate,
      amount: schema.receipt.amount,
      currency: schema.receipt.currency,
      notes: schema.receipt.notes,
      showSignature: schema.receipt.showSignature,
      createdBy: schema.receipt.createdBy,
      createdAt: schema.receipt.createdAt,
      updatedAt: schema.receipt.updatedAt,
      customerName: schema.customer.name,
      customerAddress: schema.customer.address,
      customerTaxId: schema.customer.taxId,
      customerPhone: schema.customer.phone,
      customerEmail: schema.customer.email,
      invoiceNumber: schema.invoice.number,
    })
    .from(schema.receipt)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.receipt.customerId}`,
    )
    .leftJoin(
      schema.invoice,
      sql`${schema.invoice.id} = ${schema.receipt.invoiceId}`,
    )
    .where(eq(schema.receipt.id, id));

  return r ?? null;
}
