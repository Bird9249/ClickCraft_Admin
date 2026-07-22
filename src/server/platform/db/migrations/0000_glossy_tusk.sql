CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"request_id" text,
	"trace_id" text,
	"tenant_id" text,
	"actor_id" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"result" text DEFAULT 'success',
	"error" text,
	"ip" text,
	"user_agent" text,
	"path" text,
	"method" text,
	"before" jsonb,
	"after" jsonb,
	"meta" jsonb,
	"prev_hash" text,
	"hash" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean,
	"image" text,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" date,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'company' NOT NULL,
	"name" text NOT NULL,
	"name_local" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"address" text,
	"tax_id" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_sequence" (
	"id" text PRIMARY KEY NOT NULL,
	"doc_type" text NOT NULL,
	"year_month" text NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "document_sequence_type_ym" UNIQUE("doc_type","year_month")
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"customer_id" text NOT NULL,
	"quotation_id" text,
	"issue_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"milestone_label" text,
	"currency" text DEFAULT 'LAK' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"tax_note" text DEFAULT 'VAT 0%',
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invoice_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "invoice_line" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" integer NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"method" text DEFAULT 'transfer' NOT NULL,
	"reference" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"customer_id" text NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"currency" text DEFAULT 'LAK' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"tax_note" text DEFAULT 'VAT 0%',
	"notes" text,
	"internal_notes" text,
	"payment_schedule" jsonb,
	"source_preset_id" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "quotation_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "quotation_line" (
	"id" text PRIMARY KEY NOT NULL,
	"quotation_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'LAK' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "receipt_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "quotation_lead" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address_text" text NOT NULL,
	"address_house" text,
	"address_city" text,
	"address_province" text,
	"preset_id" text NOT NULL,
	"preset_name" text,
	"phase_index" integer DEFAULT 0 NOT NULL,
	"phase_label" text,
	"selected_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_subtotal" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'LAK' NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"source_url" text,
	"client_meta" jsonb,
	"notes" text,
	"contacted_at" timestamp with time zone,
	"contacted_by" text,
	"converted_at" timestamp with time zone,
	"converted_by" text,
	"customer_id" text,
	"quotation_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"message_type" text NOT NULL,
	"segment" text,
	"concurrency" text DEFAULT 'sequential' NOT NULL,
	"payload" jsonb NOT NULL,
	"metadata" jsonb,
	"locked_until" timestamp with time zone DEFAULT to_timestamp(0) NOT NULL,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"processed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"started_attempts" smallint DEFAULT 0 NOT NULL,
	"finished_attempts" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac_role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" varchar[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rbac_user_role" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "rbac_user_role_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_quotation_id_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_line" ADD CONSTRAINT "quotation_line_quotation_id_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lead" ADD CONSTRAINT "quotation_lead_contacted_by_user_id_fk" FOREIGN KEY ("contacted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lead" ADD CONSTRAINT "quotation_lead_converted_by_user_id_fk" FOREIGN KEY ("converted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lead" ADD CONSTRAINT "quotation_lead_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lead" ADD CONSTRAINT "quotation_lead_quotation_id_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_user_role" ADD CONSTRAINT "rbac_user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_user_role" ADD CONSTRAINT "rbac_user_role_role_id_rbac_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."rbac_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_by_time" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_by_tenant_time" ON "audit_logs" USING btree ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_by_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_by_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "customer_by_name" ON "customer" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customer_by_deleted" ON "customer" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "invoice_by_customer" ON "invoice" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoice_by_quotation" ON "invoice" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "invoice_by_status" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_line_by_invoice" ON "invoice_line" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payment_by_invoice" ON "payment" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "quotation_by_customer" ON "quotation" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "quotation_by_status" ON "quotation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotation_by_issue_date" ON "quotation" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "quotation_line_by_quotation" ON "quotation_line" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "receipt_by_customer" ON "receipt" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "receipt_by_invoice" ON "receipt" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "quotation_lead_by_status" ON "quotation_lead" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotation_lead_by_phone" ON "quotation_lead" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "quotation_lead_by_created" ON "quotation_lead" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "outbox_aggregate_type_aggregate_id" ON "outbox" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "outbox_created_at" ON "outbox" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "outbox_processed_at" ON "outbox" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "outbox_locked_until" ON "outbox" USING btree ("locked_until");
--> statement-breakpoint
-- Seed: default admin user (email admin@admin.com / password 123456)
-- Password hashed with Bun.password.hash (argon2id), same as app runtime.
INSERT INTO "rbac_role" ("id", "name", "description", "permissions")
VALUES (
	'admin',
	'admin',
	'Default administrator role',
	ARRAY[
		'users:create', 'users:read', 'users:update', 'users:delete', 'users:ban',
		'audit:read',
		'customers:create', 'customers:read', 'customers:update', 'customers:delete',
		'finance:read', 'finance:write', 'finance:issue', 'finance:void',
		'leads:read', 'leads:update', 'leads:convert'
	]::varchar[]
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "user" (
	"id", "name", "email", "email_verified", "role", "banned", "created_at", "updated_at"
)
VALUES (
	'seed_admin_user',
	'Admin',
	'admin@admin.com',
	true,
	'admin',
	false,
	now(),
	now()
)
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
INSERT INTO "account" (
	"id", "account_id", "provider_id", "user_id", "password", "created_at", "updated_at"
)
VALUES (
	'seed_admin_account',
	'seed_admin_user',
	'credential',
	'seed_admin_user',
	'$argon2id$v=19$m=65536,t=2,p=1$zVkNoAesBjlDWUyGbsVwxeBUa8WLoLb6vxouYZMalLw$X8fdFlTM976Fx0xMeoB1C3L3520T9gaR/U1S/6cWEXw',
	now(),
	now()
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "rbac_user_role" ("user_id", "role_id")
VALUES ('seed_admin_user', 'admin')
ON CONFLICT DO NOTHING;