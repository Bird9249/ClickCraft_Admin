import { describe, expect, test } from "bun:test";
import { ledgerSourceLabel } from "./ledger-source-constants";

describe("ledgerSourceLabel", () => {
  test("maps known source types", () => {
    expect(ledgerSourceLabel("manual")).toBe("ມື");
    expect(ledgerSourceLabel("csv_import")).toBe("CSV");
    expect(ledgerSourceLabel("payment")).toBe("ການຊໍາລະ");
  });
});
