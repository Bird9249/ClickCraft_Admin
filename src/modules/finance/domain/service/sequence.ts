import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { sql } from "drizzle-orm";

type DocType = "quotation" | "invoice" | "receipt";

const PREFIX: Record<DocType, string> = {
  quotation: "QT",
  invoice: "INV",
  receipt: "RC",
};

export async function nextDocNumber(
  client: DbTransaction,
  docType: DocType,
): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [row] = await client
    .insert(schema.documentSequence)
    .values({ docType, yearMonth, lastValue: 1 })
    .onConflictDoUpdate({
      target: [schema.documentSequence.docType, schema.documentSequence.yearMonth],
      set: {
        lastValue: sql`${schema.documentSequence.lastValue} + 1`,
      },
    })
    .returning();

  const seq = row?.lastValue ?? 1;
  const prefix = PREFIX[docType];
  return `${prefix}-${yearMonth}${String(seq).padStart(3, "0")}`;
}
