ALTER TABLE "quotation_line" ADD COLUMN "parent_line_id" text;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD COLUMN "parent_line_id" text;--> statement-breakpoint
ALTER TABLE "quotation_line" ADD CONSTRAINT "quotation_line_parent_line_id_quotation_line_id_fk" FOREIGN KEY ("parent_line_id") REFERENCES "public"."quotation_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_parent_line_id_invoice_line_id_fk" FOREIGN KEY ("parent_line_id") REFERENCES "public"."invoice_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotation_line_by_parent" ON "quotation_line" USING btree ("parent_line_id");--> statement-breakpoint
CREATE INDEX "invoice_line_by_parent" ON "invoice_line" USING btree ("parent_line_id");
