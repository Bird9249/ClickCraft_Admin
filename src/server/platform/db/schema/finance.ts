import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  type AnyPgColumn,
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
    /** builtin | attachment */
    documentMode: text("document_mode").notNull().default("builtin"),
    attachmentFileKey: text("attachment_file_key"),
    attachmentFileName: text("attachment_file_name"),
    attachmentContentType: text("attachment_content_type"),
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
    /** When set, this row is a description-only sub-item of the parent line. */
    parentLineId: text("parent_line_id").references(
      (): AnyPgColumn => quotationLine.id,
      { onDelete: "cascade" },
    ),
    /** Where pricing lives for grouped lines: parent | children */
    priceOn: text("price_on").default("parent"),
    meta: jsonb("meta"),
  },
  (t) => [
    index("quotation_line_by_quotation").on(t.quotationId),
    index("quotation_line_by_parent").on(t.parentLineId),
  ],
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
    /** When set, this row is a description-only sub-item of the parent line. */
    parentLineId: text("parent_line_id").references(
      (): AnyPgColumn => invoiceLine.id,
      { onDelete: "cascade" },
    ),
    /** Where pricing lives for grouped lines: parent | children */
    priceOn: text("price_on").default("parent"),
    meta: jsonb("meta"),
  },
  (t) => [
    index("invoice_line_by_invoice").on(t.invoiceId),
    index("invoice_line_by_parent").on(t.parentLineId),
  ],
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
  /** Auto-create income ledger entry when recording a payment */
  autoLedgerOnPayment: boolean("auto_ledger_on_payment").notNull().default(false),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Cashbook ledger entry (income / expense) */
export const ledgerEntry = pgTable(
  "ledger_entry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    /** income | expense */
    type: text("type").notNull(),
    entryDate: timestamp("entry_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    /** Category / item label e.g. ເງິນເດືອນ, ພັດທະນາ */
    category: text("category").notNull(),
    /** Always positive; sign derived from type */
    amount: integer("amount").notNull(),
    /** Related party e.g. customer name, team member, All */
    relatedParty: text("related_party"),
    /** customer | internal — income party source */
    partyType: text("party_type"),
    customerId: text("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    /** manual | csv_import | payment */
    sourceType: text("source_type").notNull().default("manual"),
    paymentId: text("payment_id").references(() => payment.id, {
      onDelete: "set null",
    }),
    invoiceId: text("invoice_id").references(() => invoice.id, {
      onDelete: "set null",
    }),
    receiptId: text("receipt_id").references(() => receipt.id, {
      onDelete: "set null",
    }),
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
    index("ledger_entry_by_type").on(t.type),
    index("ledger_entry_by_entry_date").on(t.entryDate),
    index("ledger_entry_by_category").on(t.category),
    index("ledger_entry_by_related_party").on(t.relatedParty),
    index("ledger_entry_by_customer").on(t.customerId),
    index("ledger_entry_by_source_type").on(t.sourceType),
    index("ledger_entry_by_payment").on(t.paymentId),
    uniqueIndex("ledger_entry_payment_id_unique")
      .on(t.paymentId)
      .where(sql`${t.paymentId} is not null`),
  ],
);
