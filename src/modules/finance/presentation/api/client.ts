import type {
  CreateFromQuotationDTO,
  CreateInvoiceDTO,
  CreatePaymentDTO,
  CreateQuotationDTO,
  UpdateFinanceSettingsDTO,
  UpdateInvoiceDTO,
  UpdateQuotationDTO,
  UpdateReceiptDTO,
} from "@/modules/finance/domain/contracts";
import type {
  InvoiceByIdResult,
  InvoicesListResult,
  QuotationByIdResult,
  QuotationsListResult,
  ReceiptByIdResult,
  ReceiptsListResult,
} from "@/modules/finance/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { config } from "@/shared/lib/config";
import { fetcher } from "@/shared/lib/fetcher";

function buildListUrl(base: string, query: OffsetPageQueryDTO) {
  const url = new URL(`${config.apiUrl}${base}`);
  url.searchParams.set("limit", String(query.limit ?? 20));
  url.searchParams.set("offset", String(query.offset ?? 0));
  if (query.sort) url.searchParams.set("sort", JSON.stringify(query.sort));
  if (query.filters)
    url.searchParams.set("filters", JSON.stringify(query.filters));
  return url.toString();
}

export const quotationsApi = {
  list: (q: OffsetPageQueryDTO) =>
    fetcher.get<QuotationsListResult>(buildListUrl("/quotations", q)),
  get: (id: string) =>
    fetcher.get<QuotationByIdResult>(`${config.apiUrl}/quotations/${id}`),
  create: (input: CreateQuotationDTO) =>
    fetcher.post(`${config.apiUrl}/quotations`, input),
  update: (id: string, input: UpdateQuotationDTO) =>
    fetcher.put(`${config.apiUrl}/quotations/${id}`, input),
  send: (id: string) =>
    fetcher.post(`${config.apiUrl}/quotations/${id}/send`),
  accept: (id: string) =>
    fetcher.post(`${config.apiUrl}/quotations/${id}/accept`),
  reject: (id: string) =>
    fetcher.post(`${config.apiUrl}/quotations/${id}/reject`),
  void: (id: string) =>
    fetcher.post(`${config.apiUrl}/quotations/${id}/void`),
  duplicate: (id: string) =>
    fetcher.post(`${config.apiUrl}/quotations/${id}/duplicate`),
  pdfUrl: (id: string) => `${config.apiUrl}/quotations/${id}/pdf`,
};

export const invoicesApi = {
  list: (q: OffsetPageQueryDTO) =>
    fetcher.get<InvoicesListResult>(buildListUrl("/invoices", q)),
  get: (id: string) =>
    fetcher.get<InvoiceByIdResult>(`${config.apiUrl}/invoices/${id}`),
  create: (input: CreateInvoiceDTO) =>
    fetcher.post(`${config.apiUrl}/invoices`, input),
  fromQuotation: (input: CreateFromQuotationDTO) =>
    fetcher.post(`${config.apiUrl}/invoices/from-quotation`, input),
  update: (id: string, input: UpdateInvoiceDTO) =>
    fetcher.put(`${config.apiUrl}/invoices/${id}`, input),
  issue: (id: string) =>
    fetcher.post(`${config.apiUrl}/invoices/${id}/issue`),
  void: (id: string) =>
    fetcher.post(`${config.apiUrl}/invoices/${id}/void`),
  pdfUrl: (id: string) => `${config.apiUrl}/invoices/${id}/pdf`,
};

export const receiptsApi = {
  list: (q: OffsetPageQueryDTO) =>
    fetcher.get<ReceiptsListResult>(buildListUrl("/receipts", q)),
  get: (id: string) =>
    fetcher.get<ReceiptByIdResult>(`${config.apiUrl}/receipts/${id}`),
  createPayment: (input: CreatePaymentDTO) =>
    fetcher.post(`${config.apiUrl}/receipts`, input),
  update: (id: string, input: UpdateReceiptDTO) =>
    fetcher.patch(`${config.apiUrl}/receipts/${id}`, input),
  void: (id: string) =>
    fetcher.post(`${config.apiUrl}/receipts/${id}/void`),
  pdfUrl: (id: string) => `${config.apiUrl}/receipts/${id}/pdf`,
};

export type FinanceSettingsDTO = {
  id: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  qrImageKey: string | null;
  updatedAt: string | Date;
};

export const financeSettingsApi = {
  get: () =>
    fetcher.get<FinanceSettingsDTO>(`${config.apiUrl}/finance-settings`),
  update: (input: UpdateFinanceSettingsDTO) =>
    fetcher.put<FinanceSettingsDTO>(
      `${config.apiUrl}/finance-settings`,
      input,
    ),
};
