/** Internal team / partner names — not convertible to customers */
export const LEDGER_INTERNAL_PARTY_NAMES = [
  "All",
  "Bird",
  "Alex",
  "Nin",
  "Lay",
  "Kong",
  "Koy",
  "Noy",
] as const;

export function isInternalPartyName(name: string | null | undefined) {
  if (!name) return false;
  return (LEDGER_INTERNAL_PARTY_NAMES as readonly string[]).includes(name);
}
