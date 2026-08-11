ALTER TABLE "ledger_entry" ADD COLUMN "source_type" text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD COLUMN "payment_id" text;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD COLUMN "invoice_id" text;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD COLUMN "receipt_id" text;
--> statement-breakpoint
UPDATE "ledger_entry" SET "source_type" = 'csv_import' WHERE "notes" LIKE 'CSV_IMPORT%';
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_receipt_id_receipt_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipt"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_source_type" ON "ledger_entry" USING btree ("source_type");
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_payment" ON "ledger_entry" USING btree ("payment_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entry_payment_id_unique" ON "ledger_entry" ("payment_id") WHERE "payment_id" IS NOT NULL;
