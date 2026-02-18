#!/usr/bin/env bun

import { db } from "@/server/platform/db/client";
import { logger } from "@/server/platform/observability/logger";
import { syncFromCode } from "@/modules/roles/domain/repo/sync-from-code";
import { createUserService } from "@/modules/users/domain/service/create";

async function seedAdminUser() {
  try {
    logger.info("Starting admin user seed...");

    logger.info("Syncing RBAC roles...");
    await syncFromCode(db);
    logger.info("RBAC roles synced successfully");

    logger.info("Creating admin user...");
    await db.transaction(async (tx) => {
      const { created } = await createUserService(tx, {
        input: {
          email: "admin@admin.com",
          name: "Admin",
          password: "123456",
          roleId: "admin",
        },
      });
      logger.info(`Admin user created successfully with ID: ${created.id}`);
    });

    logger.info("Admin user seed completed successfully!");
  } catch (error) {
    logger.error("Seed failed:", error);
    process.exit(1);
  }
}

seedAdminUser();
