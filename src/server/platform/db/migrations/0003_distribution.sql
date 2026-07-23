CREATE TABLE "distribution_app" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "distribution_app_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "distribution_release" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"platform" text DEFAULT 'android' NOT NULL,
	"version" text NOT NULL,
	"build_number" text NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" bigint NOT NULL,
	"content_type" text,
	"checksum_sha256" text,
	"changelog" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "distribution_release_app_platform_version_build" UNIQUE("app_id","platform","version","build_number")
);
--> statement-breakpoint
CREATE TABLE "distribution_share_link" (
	"id" text PRIMARY KEY NOT NULL,
	"release_id" text NOT NULL,
	"token" text NOT NULL,
	"label" text,
	"expires_at" timestamp with time zone,
	"max_downloads" integer,
	"download_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "distribution_share_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "distribution_release" ADD CONSTRAINT "distribution_release_app_id_distribution_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."distribution_app"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "distribution_release" ADD CONSTRAINT "distribution_release_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "distribution_share_link" ADD CONSTRAINT "distribution_share_link_release_id_distribution_release_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."distribution_release"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "distribution_share_link" ADD CONSTRAINT "distribution_share_link_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "distribution_release_by_app" ON "distribution_release" USING btree ("app_id");
--> statement-breakpoint
CREATE INDEX "distribution_release_by_status" ON "distribution_release" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "distribution_release_by_created" ON "distribution_release" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "distribution_share_link_by_release" ON "distribution_share_link" USING btree ("release_id");
--> statement-breakpoint
CREATE INDEX "distribution_share_link_by_token" ON "distribution_share_link" USING btree ("token");
--> statement-breakpoint
INSERT INTO "distribution_app" ("id", "name", "slug", "created_at", "updated_at")
VALUES ('clickcraft', 'ClickCraft', 'clickcraft', now(), now())
ON CONFLICT ("id") DO NOTHING;
