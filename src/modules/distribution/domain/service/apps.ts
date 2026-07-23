import type { DbTransaction } from "@/shared/types";
import type { CreateAppDTO } from "../contracts";
import { createApp } from "../repo/apps/create";
import { listApps } from "../repo/apps/list";

export class AppConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppConflictError";
  }
}

export async function listAppsService(client: DbTransaction) {
  return listApps(client);
}

export async function createAppService(
  client: DbTransaction,
  input: CreateAppDTO,
) {
  try {
    return await createApp(input, client);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("unique") || message.includes("slug")) {
      throw new AppConflictError("App slug already exists");
    }
    throw e;
  }
}
