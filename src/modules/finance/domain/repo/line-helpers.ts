import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { LineInputDTO } from "../contracts";
import { childRowValues, parentRowValues } from "../line-pricing";

type LineTable = typeof schema.quotationLine | typeof schema.invoiceLine;

export async function insertQuotationLines(
  quotationId: string,
  lines: LineInputDTO[],
  client: DbTransaction,
) {
  await insertNestedLines(schema.quotationLine, { quotationId }, lines, client);
}

export async function insertInvoiceLines(
  invoiceId: string,
  lines: LineInputDTO[],
  client: DbTransaction,
) {
  await insertNestedLines(schema.invoiceLine, { invoiceId }, lines, client);
}

async function insertNestedLines(
  table: LineTable,
  parentRef: Record<string, string>,
  lines: LineInputDTO[],
  client: DbTransaction,
) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parentValues = parentRowValues(line);
    const [parent] = await client
      .insert(table)
      .values({
        ...parentRef,
        description: line.description,
        quantity: parentValues.quantity,
        unitPrice: parentValues.unitPrice,
        amount: parentValues.amount,
        sortOrder: line.sortOrder ?? i,
        parentLineId: null,
        priceOn: parentValues.priceOn,
      })
      .returning({ id: table.id });

    if (!parent) throw new Error("Failed to insert line");

    const children = line.children ?? [];
    if (children.length === 0) continue;

    await client.insert(table).values(
      children.map((child, j) => ({
        ...parentRef,
        ...childRowValues(child, parentValues.priceOn, child.sortOrder ?? j),
        parentLineId: parent.id,
        priceOn: null,
      })),
    );
  }
}
