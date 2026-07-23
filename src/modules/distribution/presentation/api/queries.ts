import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/kit";
import type {
  CreateAppDTO,
  CreateReleaseDTO,
  CreateShareLinkDTO,
} from "@/modules/distribution/domain/contracts";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { distributionApi, shareLinkAbsoluteUrl } from "./client";

export const distributionKeys = {
  all: ["distribution"] as const,
  apps: ["distribution", "apps"] as const,
  releases: (q: Partial<OffsetPageQueryDTO>) =>
    ["distribution", "releases", q] as const,
  release: (id: string) => ["distribution", "release", id] as const,
  shareLinks: (releaseId: string) =>
    ["distribution", "share-links", releaseId] as const,
};

export function useDistributionAppsQuery() {
  return useQuery({
    queryKey: distributionKeys.apps,
    queryFn: () => distributionApi.listApps(),
  });
}

export function useCreateApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppDTO) => distributionApi.createApp(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distributionKeys.apps });
      toast.success("ສ້າງແອັບແລ້ວ");
    },
    onError: () => toast.error("ສ້າງແອັບບໍ່ສໍເລັດ"),
  });
}

export function useReleasesQuery(q: Partial<OffsetPageQueryDTO> = {}) {
  const query: OffsetPageQueryDTO = {
    limit: q.limit ?? 20,
    offset: q.offset ?? 0,
    sort: q.sort,
    filters: q.filters,
  };
  return useQuery({
    queryKey: distributionKeys.releases(query),
    queryFn: () => distributionApi.listReleases(query),
  });
}

export function useCreateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReleaseDTO) =>
      distributionApi.createRelease(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distributionKeys.all });
      toast.success("ສ້າງ release ແລ້ວ");
    },
    onError: () => toast.error("ສ້າງ release ບໍ່ສໍເລັດ"),
  });
}

export function usePublishRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => distributionApi.publishRelease(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distributionKeys.all });
      toast.success("ເຜີຍແຜ່ release ແລ້ວ");
    },
    onError: () => toast.error("ເຜີຍແຜ່ release ບໍ່ສໍເລັດ"),
  });
}

export function useArchiveRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => distributionApi.archiveRelease(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: distributionKeys.all });
      toast.success("ເກັບໄວ້ release ແລ້ວ");
    },
    onError: () => toast.error("ເກັບໄວ້ release ບໍ່ສໍເລັດ"),
  });
}

export function useShareLinksQuery(releaseId: string, enabled = true) {
  return useQuery({
    queryKey: distributionKeys.shareLinks(releaseId),
    queryFn: () => distributionApi.listShareLinks(releaseId),
    enabled: !!releaseId && enabled,
  });
}

export function useCreateShareLink(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShareLinkDTO) =>
      distributionApi.createShareLink(releaseId, input),
    onSuccess: async (created) => {
      qc.invalidateQueries({
        queryKey: distributionKeys.shareLinks(releaseId),
      });
      const url = shareLinkAbsoluteUrl(created.publicPath);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("ສ້າງລິ້ງ ແລະ ສໍເນົາແລ້ວ");
      } catch {
        toast.success("ສ້າງລິ້ງແລ້ວ");
      }
    },
    onError: () => toast.error("ສ້າງລິ້ງບໍ່ສໍເລັດ"),
  });
}

export function useRevokeShareLink(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => distributionApi.revokeShareLink(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: distributionKeys.shareLinks(releaseId),
      });
      toast.success("ຖອນລິ້ງແລ້ວ");
    },
    onError: () => toast.error("ຖອນລິ້ງບໍ່ສໍເລັດ"),
  });
}

export function usePublicShareMeta(token: string) {
  return useQuery({
    queryKey: ["distribution", "public", token],
    queryFn: () => distributionApi.getPublicMeta(token),
    enabled: !!token,
    retry: false,
  });
}
