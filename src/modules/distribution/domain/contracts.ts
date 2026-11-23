import { z } from "zod";
import { validateDistributionFileName } from "./release-file-policy";

export const RELEASE_STATUSES = ["draft", "published", "archived"] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RELEASE_PLATFORMS = ["android", "file"] as const;
export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number];

const releasePlatformSchema = z.enum(RELEASE_PLATFORMS);

const distributionFileNameSchema = z.string().trim().min(1).max(255);

function refineReleaseFileName(
  data: { platform: ReleasePlatform; fileName: string },
  ctx: z.RefinementCtx,
) {
  const message = validateDistributionFileName(data.platform, data.fileName);
  if (message) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
      path: ["fileName"],
    });
  }
}

export const CreateReleaseSchema = z
  .object({
    appId: z.string().trim().min(1).max(64),
    platform: releasePlatformSchema.default("android"),
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
    fileName: distributionFileNameSchema,
    fileSize: z.number().int().positive().max(5_000_000_000),
    contentType: z.string().trim().max(200).optional().nullable(),
    checksumSha256: z.string().trim().max(128).optional().nullable(),
    changelog: z.string().trim().max(10_000).optional().nullable(),
  })
  .superRefine(refineReleaseFileName);
export type CreateReleaseDTO = z.infer<typeof CreateReleaseSchema>;

export const UpdateReleaseSchema = z.object({
  changelog: z.string().trim().max(10_000).optional().nullable(),
});
export type UpdateReleaseDTO = z.infer<typeof UpdateReleaseSchema>;

export const ReplaceReleaseFileSchema = z.object({
  fileKey: z.string().trim().min(1).max(1024),
  fileName: distributionFileNameSchema,
  fileSize: z.number().int().positive().max(5_000_000_000),
  contentType: z.string().trim().max(200).optional().nullable(),
  checksumSha256: z.string().trim().max(128).optional().nullable(),
});
export type ReplaceReleaseFileDTO = z.infer<typeof ReplaceReleaseFileSchema>;

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

const shareLinkExpiresInDays = z.union([
  z.literal(1),
  z.literal(7),
  z.literal(30),
]);

export const ExtendShareLinkExpirySchema = z.object({
  expiresInDays: shareLinkExpiresInDays.default(7),
});
export type ExtendShareLinkExpiryDTO = z.infer<
  typeof ExtendShareLinkExpirySchema
>;

export const AddShareLinkDownloadsSchema = z.object({
  addDownloads: z.number().int().positive().max(100_000),
});
export type AddShareLinkDownloadsDTO = z.infer<
  typeof AddShareLinkDownloadsSchema
>;

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
