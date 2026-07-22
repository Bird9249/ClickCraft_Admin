import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreateFromQuotationDTO,
  CreateInvoiceDTO,
  CreatePaymentDTO,
  CreateQuotationDTO,
  UpdateInvoiceDTO,
  UpdateQuotationDTO,
} from "@/modules/finance/domain/contracts";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { invoicesApi, quotationsApi, receiptsApi } from "./client";

// ─── Quotations ───────────────────────────────────────────────────────────────

export const quotationsKeys = {
  all: ["quotations"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["quotations", "list", q] as const,
  detail: (id: string) => ["quotations", "detail", id] as const,
};

export function useQuotationsQuery(q: Partial<OffsetPageQueryDTO> = {}) {
  const query: OffsetPageQueryDTO = {
    limit: q.limit ?? 20,
    offset: q.offset ?? 0,
    sort: q.sort,
    filters: q.filters,
  };
  return useQuery({
    queryKey: quotationsKeys.list(query),
    queryFn: () => quotationsApi.list(query),
  });
}

export function useQuotationQuery(id: string) {
  return useQuery({
    queryKey: quotationsKeys.detail(id),
    queryFn: () => quotationsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuotationDTO) => quotationsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationsKeys.all }),
    onError: () => toast.error("ສ້າງໃບສະເໜີລາຄາລົ້ມເຫຼວ"),
  });
}

export function useUpdateQuotation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateQuotationDTO) => quotationsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quotationsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: quotationsKeys.all });
    },
    onError: () => toast.error("ແກ້ໄຂໃບສະເໜີລາຄາລົ້ມເຫຼວ"),
  });
}

export function useQuotationAction(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: quotationsKeys.detail(id) });
    qc.invalidateQueries({ queryKey: quotationsKeys.all });
  };
  return {
    send: useMutation({
      mutationFn: () => quotationsApi.send(id),
      onSuccess: invalidate,
    }),
    accept: useMutation({
      mutationFn: () => quotationsApi.accept(id),
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: () => quotationsApi.reject(id),
      onSuccess: invalidate,
    }),
    void: useMutation({
      mutationFn: () => quotationsApi.void(id),
      onSuccess: invalidate,
    }),
    duplicate: useMutation({
      mutationFn: () => quotationsApi.duplicate(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: quotationsKeys.all }),
    }),
  };
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoicesKeys = {
  all: ["invoices"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["invoices", "list", q] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

export function useInvoicesQuery(q: Partial<OffsetPageQueryDTO> = {}) {
  const query: OffsetPageQueryDTO = {
    limit: q.limit ?? 20,
    offset: q.offset ?? 0,
    sort: q.sort,
    filters: q.filters,
  };
  return useQuery({
    queryKey: invoicesKeys.list(query),
    queryFn: () => invoicesApi.list(query),
  });
}

export function useInvoiceQuery(id: string) {
  return useQuery({
    queryKey: invoicesKeys.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceDTO) => invoicesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicesKeys.all }),
    onError: () => toast.error("ສ້າງໃບເກັບເງິນລົ້ມເຫຼວ"),
  });
}

export function useCreateInvoicesFromQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFromQuotationDTO) =>
      invoicesApi.fromQuotation(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoicesKeys.all }),
    onError: () => toast.error("ສ້າງໃບເກັບເງິນຈາກໃບສະເໜີລົ້ມເຫຼວ"),
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInvoiceDTO) => invoicesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoicesKeys.detail(id) });
      qc.invalidateQueries({ queryKey: invoicesKeys.all });
    },
    onError: () => toast.error("ແກ້ໄຂໃບເກັບເງິນລົ້ມເຫຼວ"),
  });
}

export function useInvoiceAction(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: invoicesKeys.detail(id) });
    qc.invalidateQueries({ queryKey: invoicesKeys.all });
    qc.invalidateQueries({ queryKey: receiptsKeys.all });
  };
  return {
    issue: useMutation({
      mutationFn: () => invoicesApi.issue(id),
      onSuccess: invalidate,
    }),
    void: useMutation({
      mutationFn: () => invoicesApi.void(id),
      onSuccess: invalidate,
    }),
  };
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

export const receiptsKeys = {
  all: ["receipts"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["receipts", "list", q] as const,
  detail: (id: string) => ["receipts", "detail", id] as const,
};

export function useReceiptsQuery(q: Partial<OffsetPageQueryDTO> = {}) {
  const query: OffsetPageQueryDTO = {
    limit: q.limit ?? 20,
    offset: q.offset ?? 0,
    sort: q.sort,
    filters: q.filters,
  };
  return useQuery({
    queryKey: receiptsKeys.list(query),
    queryFn: () => receiptsApi.list(query),
  });
}

export function useReceiptQuery(id: string) {
  return useQuery({
    queryKey: receiptsKeys.detail(id),
    queryFn: () => receiptsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentDTO) => receiptsApi.createPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoicesKeys.all });
      qc.invalidateQueries({ queryKey: receiptsKeys.all });
    },
    onError: () => toast.error("ບັນທຶກການຊໍາລະລົ້ມເຫຼວ"),
  });
}

export function useUpdateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { showSignature: boolean; notes?: string | null };
    }) => receiptsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: receiptsKeys.all });
    },
    onError: () => toast.error("ບັນທຶກລົ້ມເຫລວ"),
  });
}

export function useVoidReceipt() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => receiptsApi.void(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: receiptsKeys.all });
      qc.invalidateQueries({ queryKey: invoicesKeys.all });
    },
  });
  const run = (id: string) =>
    new Promise<void>((resolve, reject) => {
      base.mutate(id, {
        onSuccess: () => resolve(),
        onError: (e) => reject(e),
      });
    });
  return { ...base, run };
}
