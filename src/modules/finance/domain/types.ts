import type { listQuotations } from "./repo/quotations/list";
import type { getQuotationById } from "./repo/quotations/get-by-id";
import type { listInvoices } from "./repo/invoices/list";
import type { getInvoiceById } from "./repo/invoices/get-by-id";
import type { listReceipts } from "./repo/receipts/list";
import type { getReceiptById } from "./repo/receipts/get-by-id";

export type QuotationsListResult = Awaited<ReturnType<typeof listQuotations>>;
export type QuotationByIdResult = Awaited<ReturnType<typeof getQuotationById>>;
export type InvoicesListResult = Awaited<ReturnType<typeof listInvoices>>;
export type InvoiceByIdResult = Awaited<ReturnType<typeof getInvoiceById>>;
export type ReceiptsListResult = Awaited<ReturnType<typeof listReceipts>>;
export type ReceiptByIdResult = Awaited<ReturnType<typeof getReceiptById>>;
