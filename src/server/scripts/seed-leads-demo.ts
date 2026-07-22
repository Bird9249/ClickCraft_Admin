#!/usr/bin/env bun

/**
 * Seed demo quotation leads for ClickCraft Admin P1.
 *
 * Usage: bun run db:seed:leads
 *
 * Idempotent: removes previous rows tagged with DEMO_SEED_MARKER first.
 */

import { eq } from "drizzle-orm";
import { createLead } from "@/modules/leads/domain/repo/create";
import { db, schema } from "@/server/platform/db/client";
import { logger } from "@/server/platform/observability/logger";

const DEMO_SEED_MARKER = "DEMO_SEED_P1_LEADS";

async function clearPreviousDemo() {
  const deleted = await db
    .delete(schema.quotationLead)
    .where(eq(schema.quotationLead.sourceUrl, `seed://${DEMO_SEED_MARKER}`))
    .returning({ id: schema.quotationLead.id });
  if (deleted.length > 0) {
    logger.info(`Cleared ${deleted.length} previous demo lead(s)`);
  }
}

async function main() {
  await clearPreviousDemo();

  const samples = [
    {
      companyName: "Demo Hotel Riverside",
      contactName: "Somsak Demo",
      phone: "02011112222",
      addressText: "Ban Demo, Chanthabuly, Vientiane",
      addressHouse: "Ban Demo",
      addressCity: "Chanthabuly",
      addressProvince: "Vientiane",
      presetId: "hotel",
      presetName: "Hotel Management",
      phaseIndex: 0,
      phaseLabel: "Phase 1",
      selectedFeatures: [
        {
          key: "p1-0",
          label: "Booking engine",
          phaseNumber: 1,
          phaseLabel: "Phase 1",
          priceLak: 8_000_000,
        },
        {
          key: "p1-1",
          label: "Front desk",
          phaseNumber: 1,
          phaseLabel: "Phase 1",
          priceLak: 6_000_000,
        },
      ],
      estimatedSubtotal: 14_000_000,
    },
    {
      companyName: "Demo Moto Shop",
      contactName: "Noy Demo",
      phone: "02033334444",
      addressText: "Ban Demo 2, Sikhot, Vientiane",
      addressHouse: "Ban Demo 2",
      addressCity: "Sikhot",
      addressProvince: "Vientiane",
      presetId: "motorcycle-dealership",
      presetName: "Motorcycle Dealership ERP",
      phaseIndex: 0,
      phaseLabel: "Phase 1",
      selectedFeatures: [
        {
          key: "p1-0",
          label: "Inventory",
          phaseNumber: 1,
          phaseLabel: "Phase 1",
          priceLak: 10_000_000,
        },
      ],
      estimatedSubtotal: 10_000_000,
    },
  ] as const;

  for (const sample of samples) {
    await createLead(
      {
        ...sample,
        currency: "LAK",
        sourceUrl: `seed://${DEMO_SEED_MARKER}`,
        email: null,
      },
      db,
    );
  }

  logger.info(`Seeded ${samples.length} demo lead(s)`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
