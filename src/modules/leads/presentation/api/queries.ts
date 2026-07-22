import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type { UpdateLeadDTO } from "@/modules/leads/domain/contracts";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { leadsApi } from "./client";

export const leadsKeys = {
  all: ["leads"] as const,
  list: (q: Partial<OffsetPageQueryDTO>) => ["leads", "list", q] as const,
  detail: (id: string) => ["leads", "detail", id] as const,
};

export function useLeadsQuery(q: Partial<OffsetPageQueryDTO> = {}) {
  const query: OffsetPageQueryDTO = {
    limit: q.limit ?? 20,
    offset: q.offset ?? 0,
    sort: q.sort,
    filters: q.filters,
  };
  return useQuery({
    queryKey: leadsKeys.list(query),
    queryFn: () => leadsApi.list(query),
  });
}

export function useLeadQuery(id: string) {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: () => leadsApi.get(id),
    enabled: !!id,
  });
}

export function useUpdateLead(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLeadDTO) => leadsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
    onError: () => toast.error("ແກ້ໄຂ lead ລົ້ມເຫຼວ"),
  });
}

export function useLeadActions(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: leadsKeys.detail(id) });
    qc.invalidateQueries({ queryKey: leadsKeys.all });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  return {
    markContacted: useMutation({
      mutationFn: () => leadsApi.markContacted(id),
      onSuccess: () => {
        invalidate();
        toast.success("ມາກວ່າຕິດຕໍ່ແລ້ວ");
      },
      onError: () => toast.error("ປ່ຽນສະຖານະລົ້ມເຫຼວ"),
    }),
    markLost: useMutation({
      mutationFn: () => leadsApi.markLost(id),
      onSuccess: () => {
        invalidate();
        toast.success("ປິດຄຳຂໍແລ້ວ");
      },
      onError: () => toast.error("ປິດຄຳຂໍລົ້ມເຫຼວ"),
    }),
    convert: useMutation({
      mutationFn: () => leadsApi.convert(id),
      onSuccess: () => {
        invalidate();
        toast.success("ແປງເປັນລູກຄ້າ + ໃບສະເໜີລາຄາແລ້ວ");
      },
      onError: () => toast.error("ແປງ lead ລົ້ມເຫຼວ"),
    }),
  };
}
