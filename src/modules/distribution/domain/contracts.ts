import { z } from "zod";

export const RELEASE_STATUSES = ["draft", "published", "archived"] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RELEASE_PLATFORMS = ["android"] as const;
export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number];

const apkFileName = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine((name) => name.toLowerCase().endsWith(".apk"), {
    message: "fileName must end with .apk",
  });

export const CreateReleaseSchema = z.object({
  appId: z.string().trim().min(1).max(64),
  platform: z.literal("android").default("android"),
  version: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[0-9A-Za-z.+_-]+$/, "invalid version"),
  buildNumber: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[0-9A-Za-z._-]+$/, "invalid buildNumber"),
  fileKey: z.string().trim().min(1).max(1024),
  fileName: apkFileName,
  fileSize: z.number().int().positive().max(5_000_000_000),
  contentType: z.string().trim().max(200).optional().nullable(),
  checksumSha256: z.string().trim().max(128).optional().nullable(),
  changelog: z.string().trim().max(10_000).optional().nullable(),
});
export type CreateReleaseDTO = z.infer<typeof CreateReleaseSchema>;

export const UpdateReleaseSchema = z.object({
  changelog: z.string().trim().max(10_000).optional().nullable(),
});
export type UpdateReleaseDTO = z.infer<typeof UpdateReleaseSchema>;

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;

export const CreateShareLinkSchema = z.object({
  label: z.string().trim().max(200).optional().nullable(),
  /** Default 7 days when omitted */
  expiresInDays: z
    .union([z.literal(1), z.literal(7), z.literal(30)])
    .default(7),
  /** null/undefined = unlimited */
  maxDownloads: z.number().int().positive().max(100_000).optional().nullable(),
});
export type CreateShareLinkDTO = z.infer<typeof CreateShareLinkSchema>;

export const CreateAppSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
});
export type CreateAppDTO = z.infer<typeof CreateAppSchema>;

export const TokenParamSchema = z.object({
  token: z.string().min(16).max(200),
});
export type TokenParamDTO = z.infer<typeof TokenParamSchema>;
