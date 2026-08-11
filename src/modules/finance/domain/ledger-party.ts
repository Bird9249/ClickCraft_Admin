import { schema } from "@/server/platform/db/client";
import type { CreateLedgerEntryDTO } from "./contracts";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export type ResolvedLedgerParty = {
  partyType: "customer" | "internal" | null;
  customerId: string | null;
  relatedParty: string | null;
};

export async function resolveLedgerParty(
  input: CreateLedgerEntryDTO,
  client: DbTransaction,
): Promise<ResolvedLedgerParty> {
  if (input.type === "expense") {
    return {
      partyType: "internal",
      customerId: null,
      relatedParty: input.relatedParty?.trim() || null,
    };
  }

  if (!input.partyType) {
    return {
      partyType: null,
      customerId: null,
      relatedParty: input.relatedParty?.trim() || null,
    };
  }

  if (input.partyType === "customer") {
    if (!input.customerId) {
      throw new Error("Customer is required for income entries");
    }
    const [c] = await client
      .select({ name: schema.customer.name })
      .from(schema.customer)
      .where(eq(schema.customer.id, input.customerId));
    if (!c) throw new Error("Customer not found");
    return {
      partyType: "customer",
      customerId: input.customerId,
      relatedParty: c.name,
    };
  }

  if (input.partyType === "internal") {
    const name = input.relatedParty?.trim();
    if (!name) throw new Error("Related party is required");
    return {
      partyType: "internal",
      customerId: null,
      relatedParty: name,
    };
  }

  throw new Error("Income entry requires customer or internal party");
}

export {
  isInternalPartyName,
  LEDGER_INTERNAL_PARTY_NAMES,
} from "./ledger-party-constants";
