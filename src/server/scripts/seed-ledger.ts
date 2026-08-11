import { readFileSync } from "node:fs";
import { join } from "node:path";
import { importLedgerCsvService } from "@/modules/finance/domain/service/ledger-import";
import { db } from "@/server/platform/db/client";
import { logger } from "@/server/platform/observability/logger";

const CSV_PATH = join(
  process.cwd(),
  "Income Expense ClickCraft - รายการ.csv",
);

async function main() {
  const raw = readFileSync(CSV_PATH, "utf8");
  const result = await importLedgerCsvService(db, {
    csvText: raw,
    mode: "replace",
  });

  logger.info(
    `Ledger seed complete: ${result.imported} rows | income ${result.summary.totalIncome.toLocaleString()} | expense ${result.summary.totalExpense.toLocaleString()} | balance ${result.summary.balance.toLocaleString()}`,
  );
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
