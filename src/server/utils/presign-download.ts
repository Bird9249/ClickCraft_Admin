import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/server/platform/config";
import { createS3Client } from "./s3-client";

export type PresignDownloadOptions = {
  key: string;
  /** Suggested download filename */
  fileName?: string;
  /** URL validity in seconds (default 600 = 10 min) */
  expiresIn?: number;
  contentType?: string | null;
};

/**
 * Presigned GET URL for short-lived public downloads (e.g. distribution APK).
 */
export async function getPresignedDownloadUrl(
  options: PresignDownloadOptions,
): Promise<{ downloadUrl: string; key: string } | null> {
  const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    return null;
  }

  const client = createS3Client();
  const expiresIn = options.expiresIn ?? 600;
  const safeName = (options.fileName ?? "download.apk").replace(
    /[^\w.\-()+ ]+/g,
    "_",
  );

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: options.key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
    ...(options.contentType
      ? { ResponseContentType: options.contentType }
      : {}),
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn });
  return { downloadUrl, key: options.key };
}
