import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreatePublicLeadDTO, LeadFeatureDTO } from "../contracts";

export type CreateLeadInput = Omit<CreatePublicLeadDTO, "website"> & {
  clientMeta?: { userAgent?: string; locale?: string } | null;
};

export async function createLead(input: CreateLeadInput, client: DbTransaction) {
  const features = input.selectedFeatures as LeadFeatureDTO[];
  const [row] = await client
    .insert(schema.quotationLead)
    .values({
      status: "new",
      companyName: input.companyName,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email ?? null,
      addressText: input.addressText,
      addressHouse: input.addressHouse ?? null,
      addressCity: input.addressCity ?? null,
      addressProvince: input.addressProvince ?? null,
      presetId: input.presetId,
      presetName: input.presetName ?? null,
      phaseIndex: input.phaseIndex,
      phaseLabel: input.phaseLabel ?? null,
      selectedFeatures: features,
      estimatedSubtotal: input.estimatedSubtotal,
      currency: input.currency ?? "LAK",
      source: "website",
      sourceUrl: input.sourceUrl ?? null,
      clientMeta: input.clientMeta ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create lead");
  return row;
}
