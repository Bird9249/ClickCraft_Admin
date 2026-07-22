import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { user } from "./auth";
import { customer } from "./customers";

export const documentSequence = pgTable(
  "document_sequence",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    docType: text("doc_type").notNull(),
    yearMonth: text("year_month").notNull(),
    lastValue: integer("last_value").notNull().default(0),
  },
  (t) => [unique("document_sequence_type_ym").on(t.docType, t.yearMonth)],
);

export const quotation = pgTable(
  "quotation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    number: text("number").notNull().unique(),
    status: text("status").notNull().default("draft"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "restrict" }),
    issueDate: timestamp("issue_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    validUntil: timestamp("valid_until", {
      withTimezone: true,
      mode: "date",
    }),
    currency: text("currency").notNull().default("LAK"),
    subtotal: integer("subtotal").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    total: integer("total").notNull().default(0),
    taxNote: text("tax_note").default("VAT 0%"),
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    /** Payment milestones: [{ percent, label, condition, dueDays? }] */
    paymentSchedule: jsonb("payment_schedule"),
    /** Show signature block on printed PDF */
    showSignature: boolean("show_signature").notNull().default(true),
    sourcePresetId: text("source_preset_id"),
    createdBy: text("created_by").references(() => user.id, {
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
    index("quotation_by_customer").on(t.customerId),
    index("quotation_by_status").on(t.status),
    index("quotation_by_issue_date").on(t.issueDate),
  ],
);

export const quotationLine = pgTable(
  "quotation_line",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    quotationId: text("quotation_id")
      .notNull()
      .references(() => quotation.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: integer("unit_price").notNull().default(0),
    amount: integer("amount").notNull().default(0),
    meta: jsonb("meta"),
  },
  (t) => [index("quotation_line_by_quotation").on(t.quotationId)],
);

export const invoice = pgTable(
  "invoice",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    number: text("number").notNull().unique(),
    status: text("status").notNull().default("draft"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "restrict" }),
    quotationId: text("quotation_id").references(() => quotation.id, {
      onDelete: "set null",
    }),
    issueDate: timestamp("issue_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    dueDate: timestamp("due_date", {
      withTimezone: true,
      mode: "date",
    }),
    milestoneLabel: text("milestone_label"),
    currency: text("currency").notNull().default("LAK"),
    subtotal: integer("subtotal").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    total: integer("total").notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    taxNote: text("tax_note").default("VAT 0%"),
    notes: text("notes"),
    /** Show signature block on printed PDF */
    showSignature: boolean("show_signature").notNull().default(true),
    createdBy: text("created_by").references(() => user.id, {
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
    index("invoice_by_customer").on(t.customerId),
    index("invoice_by_quotation").on(t.quotationId),
    index("invoice_by_status").on(t.status),
  ],
);

export const invoiceLine = pgTable(
  "invoice_line",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: integer("unit_price").notNull().default(0),
    amount: integer("amount").notNull().default(0),
    meta: jsonb("meta"),
  },
  (t) => [index("invoice_line_by_invoice").on(t.invoiceId)],
);

export const payment = pgTable(
  "payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    paidAt: timestamp("paid_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    method: text("method").notNull().default("transfer"),
    reference: text("reference"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("payment_by_invoice").on(t.invoiceId)],
);

export const receipt = pgTable(
  "receipt",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    number: text("number").notNull().unique(),
    status: text("status").notNull().default("issued"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "restrict" }),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "restrict" }),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "restrict" }),
    issueDate: timestamp("issue_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("LAK"),
    notes: text("notes"),
    /** Show signature block on printed PDF */
    showSignature: boolean("show_signature").notNull().default(true),
    createdBy: text("created_by").references(() => user.id, {
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
    index("receipt_by_customer").on(t.customerId),
    index("receipt_by_invoice").on(t.invoiceId),
  ],
);

/** Singleton global settings for invoice bank payment block */
export const financeSettings = pgTable("finance_settings", {
  id: text("id").primaryKey().default("default"),
  bankName: text("bank_name"),
  accountName: text("account_name"),
  accountNumber: text("account_number"),
  qrImageKey: text("qr_image_key"),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});
