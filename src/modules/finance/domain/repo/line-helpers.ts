import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { LineInputDTO, SubItemInputDTO } from "../contracts";
import { parentRowValues, subItemRowValues } from "../line-pricing";

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

    await insertSubItems(
      table,
      parentRef,
      line.children ?? [],
      parent.id,
      parentValues.priceOn,
      client,
    );
  }
}

async function insertSubItems(
  table: LineTable,
  parentRef: Record<string, string>,
  items: SubItemInputDTO[],
  parentLineId: string,
  priceOn: "parent" | "children",
  client: DbTransaction,
) {
  for (let j = 0; j < items.length; j++) {
    const item = items[j];
    const rowValues = subItemRowValues(item, priceOn, item.sortOrder ?? j);
    const [inserted] = await client
      .insert(table)
      .values({
        ...parentRef,
        ...rowValues,
        parentLineId,
        priceOn: null,
      })
      .returning({ id: table.id });

    if (!inserted) throw new Error("Failed to insert sub-item");

    const nested = item.children ?? [];
    if (nested.length > 0) {
      await insertSubItems(
        table,
        parentRef,
        nested,
        inserted.id,
        priceOn,
        client,
      );
    }
  }
}
