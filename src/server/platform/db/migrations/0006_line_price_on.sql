ALTER TABLE "quotation_line" ADD COLUMN "price_on" text DEFAULT 'parent';--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "price_on" text DEFAULT 'parent';
