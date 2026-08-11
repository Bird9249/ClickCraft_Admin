import { describe, expect, it } from "bun:test";
import { convertLedgerPartyService } from "./ledger-convert-party";

describe("convertLedgerPartyService", () => {
  it("rejects internal party names", async () => {
    await expect(
      convertLedgerPartyService({} as never, {
        sourceRelatedParty: "Bird",
        customerId: "cust-1",
      }),
    ).rejects.toThrow("Cannot convert internal party");
  });
});
