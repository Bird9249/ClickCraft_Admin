import type { DbTransaction } from "@/shared/types";
import { schema } from "@/server/platform/db/client";
import { eq } from "drizzle-orm";
import type { ConvertLedgerPartyDTO } from "../contracts";
import { isInternalPartyName } from "../ledger-party-constants";
import {
  convertRelatedPartyToCustomer,
  countLedgerByRelatedParty,
  listConvertibleRelatedParties,
} from "../repo/ledger/convert-party";

export async function listConvertibleRelatedPartiesService(
  client: DbTransaction,
) {
  return listConvertibleRelatedParties(client);
}

export async function convertLedgerPartyService(
  client: DbTransaction,
  input: ConvertLedgerPartyDTO,
) {
  const source = input.sourceRelatedParty.trim();
  if (isInternalPartyName(source)) {
    throw new Error("Cannot convert internal party to customer");
  }

  const [customer] = await client
    .select({ id: schema.customer.id, name: schema.customer.name })
    .from(schema.customer)
    .where(eq(schema.customer.id, input.customerId));
  if (!customer) throw new Error("Customer not found");

  const matchCount = await countLedgerByRelatedParty(source, client);
  if (matchCount === 0) {
    throw new Error("No ledger entries found for this related party");
  }

  const updated = await convertRelatedPartyToCustomer(
    {
      sourceRelatedParty: source,
      customerId: customer.id,
      customerName: customer.name,
    },
    client,
  );

  return {
    updatedCount: updated.length,
    sourceRelatedParty: source,
    customerId: customer.id,
    customerName: customer.name,
  };
}
