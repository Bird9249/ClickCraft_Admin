ALTER TABLE "quotation" ADD COLUMN "document_mode" text DEFAULT 'builtin' NOT NULL;
--> statement-breakpoint
ALTER TABLE "quotation" ADD COLUMN "attachment_file_key" text;
--> statement-breakpoint
ALTER TABLE "quotation" ADD COLUMN "attachment_file_name" text;
--> statement-breakpoint
ALTER TABLE "quotation" ADD COLUMN "attachment_content_type" text;
