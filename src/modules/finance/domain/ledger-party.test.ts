import { describe, expect, it } from "bun:test";
import { resolveLedgerParty } from "./ledger-party";

describe("resolveLedgerParty", () => {
  it("maps income customer to customer name", async () => {
    const client = {
      select: () => ({
        from: () => ({
          where: async () => [{ name: "Life Football" }],
        }),
      }),
    } as never;

    const result = await resolveLedgerParty(
      {
        type: "income",
        entryDate: new Date(),
        category: "ພັດທະນາ",
        amount: 1000,
        partyType: "customer",
        customerId: "cust-1",
        relatedParty: null,
        notes: null,
      },
      client,
    );

    expect(result.partyType).toBe("customer");
    expect(result.customerId).toBe("cust-1");
    expect(result.relatedParty).toBe("Life Football");
  });

  it("maps expense to internal party", async () => {
    const client = {} as never;
    const result = await resolveLedgerParty(
      {
        type: "expense",
        entryDate: new Date(),
        category: "ເງິນເດືອນ",
        amount: 1000,
        relatedParty: "Bird",
        notes: null,
      },
      client,
    );

    expect(result.partyType).toBe("internal");
    expect(result.relatedParty).toBe("Bird");
  });
});
