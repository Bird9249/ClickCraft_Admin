ALTER TABLE "quotation" ADD COLUMN "show_signature" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "show_signature" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt" ADD COLUMN "show_signature" boolean DEFAULT true NOT NULL;
