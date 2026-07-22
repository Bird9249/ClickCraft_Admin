import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from "@/modules/customers/domain/contracts";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { customersApi } from "./client";

export const customersKeys = {
  all: ["customers"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) =>
    ["customers", "list", q] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};

export function useCustomersQuery(query: Partial<OffsetPageQueryDTO> = {}) {
  const q: OffsetPageQueryDTO = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
    sort: query.sort,
    filters: query.filters,
  };
  return useQuery({
    queryKey: customersKeys.list(q),
    queryFn: () => customersApi.list(q),
  });
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: customersKeys.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerDTO) => customersApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customersKeys.all });
    },
    onError: () => toast.error("\u0EA5\u0EB5\u0EC9\u0EA1\u0EC0\u0EAB\u0EBC\u0EA7\u0EAD\u0EB0\u0E99\u0EB8\u0EAD\u0EAD\u0EB0\u0EAB\u0EB2\u0E99"),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerDTO) =>
      customersApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customersKeys.detail(id) });
      qc.invalidateQueries({ queryKey: customersKeys.all });
    },
    onError: () => toast.error("\u0EA5\u0EB5\u0EC9\u0EA1\u0EC0\u0EAB\u0EBC\u0EA7\u0EAD\u0EB0\u0E9B\u0EB1\u0E9A\u0E9B\u0EBB\u0E87\u0EAD\u0EB0\u0EAB\u0EB2\u0E99"),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  const base = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customersKeys.all });
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
