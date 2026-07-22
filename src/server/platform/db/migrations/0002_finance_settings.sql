CREATE TABLE "finance_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"bank_name" text,
	"account_name" text,
	"account_number" text,
	"qr_image_key" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
INSERT INTO "finance_settings" ("id", "updated_at") VALUES ('default', now())
ON CONFLICT ("id") DO NOTHING;
