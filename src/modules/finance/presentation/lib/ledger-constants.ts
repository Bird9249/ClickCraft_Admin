/** Default category suggestions derived from ledger CSV import */
export const LEDGER_INCOME_CATEGORIES = [
  "ລົງທຶນ",
  "ຄ່າ Server/Domain",
  "ພັດທະນາ",
  "ຄ່າພັດທະນາ",
  "ເຄຣມ",
  "ຄ່າບຳລຸງຮັກສາ",
] as const;

export const LEDGER_EXPENSE_CATEGORIES = [
  "ເງິນເດືອນ",
  "ຄ່າບໍລິຫານ",
  "Domain",
  "Tool",
  "ປັນຜົນ",
  "ຄ່າ Server/Domain",
  "ອຸປະກອນ",
  "ຄ່ານາຍຫນ້າ",
  "Marketing",
] as const;

export const LEDGER_RELATED_PARTIES = [
  "All",
  "Bird",
  "Alex",
  "Nin",
  "Lay",
  "Kong",
  "Koy",
  "Noy",
  "Life Football",
  "Slurp",
  "Freedom",
  "Amazing",
  "Mineral",
  "Fanglao",
] as const;

/** Default category suggestions derived from ledger CSV import */
export {
  isInternalPartyName,
  LEDGER_INTERNAL_PARTY_NAMES as LEDGER_INTERNAL_PARTIES,
} from "@/modules/finance/domain/ledger-party-constants";

export {
  ledgerSourceLabel,
  type LedgerSourceType,
} from "@/modules/finance/domain/ledger-source-constants";

export function ledgerTypeLabel(type: "income" | "expense") {
  return type === "income" ? "ລາຍຮັບ" : "ລາຍຈ່າຍ";
}

export function formatLak(amount: number) {
  return `LAK ${amount.toLocaleString()}`;
}
