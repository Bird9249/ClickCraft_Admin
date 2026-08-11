CREATE TABLE "ledger_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"entry_date" timestamp with time zone NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"related_party" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_type" ON "ledger_entry" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_entry_date" ON "ledger_entry" USING btree ("entry_date");
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_category" ON "ledger_entry" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "ledger_entry_by_related_party" ON "ledger_entry" USING btree ("related_party");
