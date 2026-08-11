import type {
  CreateFromQuotationDTO,
  CreateInvoiceDTO,
  CreateLedgerEntryDTO,
  ConvertLedgerPartyDTO,
  CreatePaymentDTO,
  CreateQuotationDTO,
  LinkLedgerPaymentDTO,
  UpdateFinanceSettingsDTO,
  UpdateInvoiceDTO,
  UpdateLedgerEntryDTO,
  UpdateQuotationDTO,
  UpdateReceiptDTO,
} from "@/modules/finance/domain/contracts";
import type {
  InvoiceByIdResult,
  InvoicesListResult,
  LedgerEntryByIdResult,
  LedgerListResult,
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
  autoLedgerOnPayment: boolean;
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

export type LedgerSummaryDTO = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  entryCount: number;
};

export type LedgerListResponse = LedgerListResult & {
  summary: LedgerSummaryDTO;
};

export type LedgerLookupsDTO = {
  categories: string[];
  relatedParties: string[];
};

export type LedgerImportResultDTO = {
  imported: number;
  skipped: number;
  errors: string[];
  batchId: string;
  summary: LedgerSummaryDTO;
};

export type ConvertibleRelatedPartyDTO = {
  name: string;
  entryCount: number;
};

export type ConvertLedgerPartyResultDTO = {
  updatedCount: number;
  sourceRelatedParty: string;
  customerId: string;
  customerName: string;
};

export type LedgerReconciliationSuggestionDTO = {
  ledgerEntryId: string;
  paymentId: string;
  ledgerAmount: number;
  paymentAmount: number;
  ledgerDate: string | Date;
  paymentDate: string | Date;
  relatedParty: string | null;
  customerName: string;
  receiptNumber: string;
  invoiceNumber: string;
};

export type LedgerReconciliationDTO = {
  unlinkedLedgerCount: number;
  unlinkedPaymentCount: number;
  unlinkedLedger: Array<{
    id: string;
    entryDate: string | Date;
    category: string;
    amount: number;
    relatedParty: string | null;
    customerId: string | null;
    sourceType: string;
    notes: string | null;
  }>;
  unlinkedPayments: Array<{
    paymentId: string;
    paidAt: string | Date;
    amount: number;
    method: string;
    reference: string | null;
    receiptId: string;
    receiptNumber: string;
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
  }>;
  suggestions: LedgerReconciliationSuggestionDTO[];
};

export type LinkLedgerPaymentResultDTO = {
  updated: LedgerEntryByIdResult;
};

export const ledgerApi = {
  list: (q: OffsetPageQueryDTO) =>
    fetcher.get<LedgerListResponse>(buildListUrl("/ledger", q)),
  get: (id: string) =>
    fetcher.get<LedgerEntryByIdResult>(`${config.apiUrl}/ledger/${id}`),
  summary: () =>
    fetcher.get<LedgerSummaryDTO>(`${config.apiUrl}/ledger/summary`),
  lookups: () =>
    fetcher.get<LedgerLookupsDTO>(`${config.apiUrl}/ledger/lookups`),
  create: (input: CreateLedgerEntryDTO) =>
    fetcher.post(`${config.apiUrl}/ledger`, input),
  update: (id: string, input: UpdateLedgerEntryDTO) =>
    fetcher.put(`${config.apiUrl}/ledger/${id}`, input),
  remove: (id: string) => fetcher.delete(`${config.apiUrl}/ledger/${id}`),
  importCsv: (file: File, mode: "append" | "replace") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    return fetcher.postForm<LedgerImportResultDTO>(
      `${config.apiUrl}/ledger/import`,
      fd,
    );
  },
  convertibleParties: () =>
    fetcher.get<ConvertibleRelatedPartyDTO[]>(
      `${config.apiUrl}/ledger/convertible-parties`,
    ),
  convertParty: (input: ConvertLedgerPartyDTO) =>
    fetcher.post<ConvertLedgerPartyResultDTO>(
      `${config.apiUrl}/ledger/convert-party`,
      input,
    ),
  reconciliation: () =>
    fetcher.get<LedgerReconciliationDTO>(
      `${config.apiUrl}/ledger/reconciliation`,
    ),
  linkPayment: (input: LinkLedgerPaymentDTO) =>
    fetcher.post<LinkLedgerPaymentResultDTO>(
      `${config.apiUrl}/ledger/link-payment`,
      input,
    ),
};
