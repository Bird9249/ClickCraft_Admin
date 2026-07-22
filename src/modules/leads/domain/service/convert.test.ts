import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/platform/db/client";
import { createLead } from "../repo/create";
import { convertLeadService, LeadAlreadyConvertedError } from "./convert";

const MARKER = "TEST_LEAD_CONVERT";

describe("convertLeadService", () => {
  beforeAll(async () => {
    await db
      .delete(schema.quotationLead)
      .where(eq(schema.quotationLead.sourceUrl, `test://${MARKER}`));
  });

  test("creates customer + draft quotation from lead", async () => {
    const lead = await createLead(
      {
        companyName: "Convert Test Co",
        contactName: "Tester",
        phone: "02099998888",
        addressText: "A, B, C",
        addressHouse: "A",
        addressCity: "B",
        addressProvince: "C",
        presetId: "hotel",
        presetName: "Hotel Management",
        phaseIndex: 0,
        phaseLabel: "Phase 1",
        selectedFeatures: [
          {
            key: "f1",
            label: "Feature One",
            phaseNumber: 1,
            phaseLabel: "Phase 1",
            priceLak: 1_000_000,
          },
        ],
        estimatedSubtotal: 1_000_000,
        currency: "LAK",
        sourceUrl: `test://${MARKER}`,
        email: null,
      },
      db,
    );

    const result = await convertLeadService(db, {
      id: lead.id,
      actorId: null,
    });

    expect(result.customerId).toBeTruthy();
    expect(result.quotationId).toBeTruthy();
    expect(result.lead?.status).toBe("converted");

    const [quotation] = await db
      .select()
      .from(schema.quotation)
      .where(eq(schema.quotation.id, result.quotationId));
    expect(quotation?.status).toBe("draft");
    expect(quotation?.sourcePresetId).toBe("hotel");
    expect(quotation?.total).toBe(1_000_000);

    await expect(
      convertLeadService(db, { id: lead.id, actorId: null }),
    ).rejects.toBeInstanceOf(LeadAlreadyConvertedError);
  });
});
