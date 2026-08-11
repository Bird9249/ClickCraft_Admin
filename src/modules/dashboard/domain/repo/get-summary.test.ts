import { describe, expect, it } from "bun:test";
import { getDashboardSummary } from "./get-summary";
import { db } from "@/server/platform/db/client";

describe("getDashboardSummary ledger", () => {
  it("includes ledger block with numeric fields", async () => {
    const summary = await getDashboardSummary(db);

    expect(summary.ledger).toBeDefined();
    expect(typeof summary.ledger.totalIncome).toBe("number");
    expect(typeof summary.ledger.totalExpense).toBe("number");
    expect(typeof summary.ledger.balance).toBe("number");
    expect(typeof summary.ledger.incomeThisMonth).toBe("number");
    expect(typeof summary.ledger.expenseThisMonth).toBe("number");
    expect(typeof summary.ledger.unlinkedLedgerCount).toBe("number");
    expect(typeof summary.ledger.unlinkedPaymentCount).toBe("number");
    expect(summary.ledger.balance).toBe(
      summary.ledger.totalIncome - summary.ledger.totalExpense,
    );
  });

  it("extends monthly series with ledger fields", async () => {
    const summary = await getDashboardSummary(db);

    expect(summary.monthlySeries.length).toBeGreaterThan(0);
    const point = summary.monthlySeries[0]!;
    expect(typeof point.ledgerIncome).toBe("number");
    expect(typeof point.ledgerExpense).toBe("number");
    expect(typeof point.ledgerNet).toBe("number");
    expect(point.ledgerNet).toBe(point.ledgerIncome - point.ledgerExpense);
  });
});
