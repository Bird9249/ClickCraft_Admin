/** How a ledger entry was created — safe for client import. */
export const LEDGER_SOURCE_TYPES = ["manual", "csv_import", "payment"] as const;

export type LedgerSourceType = (typeof LEDGER_SOURCE_TYPES)[number];

export function ledgerSourceLabel(sourceType: LedgerSourceType | null | undefined) {
  switch (sourceType) {
    case "csv_import":
      return "CSV";
    case "payment":
      return "ການຊໍາລະ";
    case "manual":
    default:
      return "ມື";
  }
}
