import { describe, expect, it } from "bun:test";
import { parseLedgerCsv } from "./ledger-csv";

describe("parseLedgerCsv", () => {
  it("parses ledger CSV rows", () => {
    const csv = `วันที่,ประเภท,รายการ,จำนวนเงิน,ผู้เกี่ยวข้อง,คงเหลือสะสม,Column 1
16/01/2026,รายรับ,ລົງທຶນ,"5,803,000",All,"5,803,000","note one"
16/01/2026,รายจ่าย,ເງິນເດືອນ,"1,000,000",Bird,"4,803,000",`;

    const result = parseLedgerCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.skipped).toBe(0);
    expect(result.rows[0]?.type).toBe("income");
    expect(result.rows[0]?.amount).toBe(5_803_000);
    expect(result.rows[0]?.relatedParty).toBe("All");
    expect(result.rows[0]?.notes).toBe("note one");
    expect(result.rows[1]?.type).toBe("expense");
    expect(result.rows[1]?.notes).toBeNull();
  });

  it("returns error for empty csv", () => {
    const result = parseLedgerCsv("header only");
    expect(result.rows).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
