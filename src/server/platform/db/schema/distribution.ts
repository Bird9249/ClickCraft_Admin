import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";

export const distributionApp = pgTable("distribution_app", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const distributionRelease = pgTable(
  "distribution_release",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    appId: text("app_id")
      .notNull()
      .references(() => distributionApp.id, { onDelete: "cascade" }),
    platform: text("platform").notNull().default("android"),
    version: text("version").notNull(),
    buildNumber: text("build_number").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    contentType: text("content_type"),
    checksumSha256: text("checksum_sha256"),
    changelog: text("changelog"),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    unique("distribution_release_app_platform_version_build").on(
      t.appId,
      t.platform,
      t.version,
      t.buildNumber,
    ),
    index("distribution_release_by_app").on(t.appId),
    index("distribution_release_by_status").on(t.status),
    index("distribution_release_by_created").on(t.createdAt),
  ],
);

export const distributionShareLink = pgTable(
  "distribution_share_link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    releaseId: text("release_id")
      .notNull()
      .references(() => distributionRelease.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    label: text("label"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    maxDownloads: integer("max_downloads"),
    downloadCount: integer("download_count").notNull().default(0),
    lastDownloadedAt: timestamp("last_downloaded_at", {
      withTimezone: true,
      mode: "date",
    }),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("distribution_share_link_by_release").on(t.releaseId),
    index("distribution_share_link_by_token").on(t.token),
  ],
);
