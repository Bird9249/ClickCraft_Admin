import { env } from "@/server/platform/config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client } from "@/server/utils/s3-client";

/** Load QR image from S3 as a data URI for PDF embedding. */
export async function loadBankQrDataUri(
  key: string | null | undefined,
): Promise<string | null> {
  if (!key?.trim()) return null;
  const bucket = env.S3_BUCKET;
  if (!bucket) return null;

  try {
    const client = createS3Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    const body = response.Body;
    if (!body || typeof body.transformToByteArray !== "function") return null;

    const bytes = await body.transformToByteArray();
    if (!bytes?.length) return null;

    const contentType = response.ContentType?.startsWith("image/")
      ? response.ContentType
      : "image/png";
    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}
