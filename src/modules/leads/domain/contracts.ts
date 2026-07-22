import { z } from "zod";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LeadFeatureSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  phaseNumber: z.number().int().min(0),
  phaseLabel: z.string().min(1),
  priceLak: z.number().int().min(0),
});
export type LeadFeatureDTO = z.infer<typeof LeadFeatureSchema>;

export const CreatePublicLeadSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(40),
  email: z.string().email().optional().nullable(),
  addressText: z.string().trim().min(1).max(500),
  addressHouse: z.string().trim().max(200).optional().nullable(),
  addressCity: z.string().trim().max(200).optional().nullable(),
  addressProvince: z.string().trim().max(200).optional().nullable(),
  presetId: z.string().trim().min(1).max(100),
  presetName: z.string().trim().max(200).optional().nullable(),
  phaseIndex: z.number().int().min(0).max(20),
  phaseLabel: z.string().trim().max(200).optional().nullable(),
  selectedFeatures: z.array(LeadFeatureSchema).min(1).max(100),
  estimatedSubtotal: z.number().int().min(0).max(1_000_000_000_000),
  currency: z.string().default("LAK"),
  sourceUrl: z.string().url().max(2000).optional().nullable(),
  /** Honeypot — bots fill this; humans leave empty */
  website: z.string().max(200).optional().nullable(),
});
export type CreatePublicLeadDTO = z.infer<typeof CreatePublicLeadSchema>;

export const UpdateLeadSchema = z.object({
  notes: z.string().max(5000).optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "lost"]).optional(),
});
export type UpdateLeadDTO = z.infer<typeof UpdateLeadSchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;
