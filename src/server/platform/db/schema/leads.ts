import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";
import { customer } from "./customers";
import { quotation } from "./finance";

export const quotationLead = pgTable(
  "quotation_lead",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    status: text("status").notNull().default("new"),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    addressText: text("address_text").notNull(),
    addressHouse: text("address_house"),
    addressCity: text("address_city"),
    addressProvince: text("address_province"),
    presetId: text("preset_id").notNull(),
    presetName: text("preset_name"),
    phaseIndex: integer("phase_index").notNull().default(0),
    phaseLabel: text("phase_label"),
    selectedFeatures: jsonb("selected_features").notNull().default([]),
    estimatedSubtotal: integer("estimated_subtotal").notNull().default(0),
    currency: text("currency").notNull().default("LAK"),
    source: text("source").notNull().default("website"),
    sourceUrl: text("source_url"),
    clientMeta: jsonb("client_meta"),
    notes: text("notes"),
    contactedAt: timestamp("contacted_at", {
      withTimezone: true,
      mode: "date",
    }),
    contactedBy: text("contacted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    convertedAt: timestamp("converted_at", {
      withTimezone: true,
      mode: "date",
    }),
    convertedBy: text("converted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    customerId: text("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    quotationId: text("quotation_id").references(() => quotation.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("quotation_lead_by_status").on(t.status),
    index("quotation_lead_by_phone").on(t.phone),
    index("quotation_lead_by_created").on(t.createdAt),
  ],
);
