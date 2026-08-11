ALTER TABLE "ledger_entry" ADD COLUMN "party_type" text;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD COLUMN "customer_id" text;
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_customer" ON "ledger_entry" USING btree ("customer_id");
