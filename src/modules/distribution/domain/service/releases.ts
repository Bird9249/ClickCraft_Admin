import type { DbTransaction } from "@/shared/types";
import type { CreateReleaseDTO, UpdateReleaseDTO } from "../contracts";
import { getAppById } from "../repo/apps/get-by-id";
import { createRelease } from "../repo/releases/create";
import { getReleaseById } from "../repo/releases/get-by-id";
import { updateRelease } from "../repo/releases/update";

export class ReleaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleaseValidationError";
  }
}

export class ReleaseConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReleaseConflictError";
  }
}

function assertApk(input: CreateReleaseDTO) {
  if (input.platform !== "android") {
    throw new ReleaseValidationError("Only android platform is supported");
  }
  if (!input.fileName.toLowerCase().endsWith(".apk")) {
    throw new ReleaseValidationError("fileName must end with .apk");
  }
}

export async function createReleaseService(
  client: DbTransaction,
  input: CreateReleaseDTO,
  actorId?: string | null,
) {
  assertApk(input);

  const app = await getAppById(input.appId, client);
  if (!app) throw new ReleaseValidationError("App not found");

  try {
    const created = await createRelease(
      { ...input, platform: "android", createdByUserId: actorId },
      client,
    );
    return getReleaseById(created.id, client);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (
      message.includes("distribution_release_app_platform_version_build") ||
      message.includes("unique")
    ) {
      throw new ReleaseConflictError(
        "Release with this version and build already exists",
      );
    }
    throw e;
  }
}

export async function updateReleaseService(
  client: DbTransaction,
  id: string,
  input: UpdateReleaseDTO,
) {
  const existing = await getReleaseById(id, client);
  if (!existing) return null;
  if (existing.status === "archived") {
    throw new ReleaseValidationError("Cannot update archived release");
  }

  await updateRelease(id, { changelog: input.changelog ?? null }, client);
  return getReleaseById(id, client);
}

export async function publishReleaseService(client: DbTransaction, id: string) {
  const existing = await getReleaseById(id, client);
  if (!existing) return null;
  if (existing.status === "archived") {
    throw new ReleaseValidationError("Cannot publish archived release");
  }
  if (existing.status === "published") {
    return existing;
  }
  if (!existing.fileKey) {
    throw new ReleaseValidationError("Release has no file");
  }

  await updateRelease(
    id,
    { status: "published", publishedAt: new Date() },
    client,
  );
  return getReleaseById(id, client);
}

export async function archiveReleaseService(client: DbTransaction, id: string) {
  const existing = await getReleaseById(id, client);
  if (!existing) return null;
  if (existing.status === "archived") {
    return existing;
  }

  await updateRelease(id, { status: "archived" }, client);
  return getReleaseById(id, client);
}
