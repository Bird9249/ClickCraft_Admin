import type { DbTransaction } from "@/shared/types";
import type { LinkLedgerPaymentDTO } from "../contracts";
import { linkLedgerToPayment } from "../repo/ledger/link-payment";
import { getReconciliationSnapshot } from "../repo/ledger/reconciliation";

export async function getLedgerReconciliationService(client: DbTransaction) {
  return getReconciliationSnapshot(client);
}

export async function linkLedgerPaymentService(
  client: DbTransaction,
  input: LinkLedgerPaymentDTO,
) {
  const updated = await linkLedgerToPayment(
    {
      ledgerEntryId: input.ledgerEntryId,
      paymentId: input.paymentId,
    },
    client,
  );
  return { updated };
}
