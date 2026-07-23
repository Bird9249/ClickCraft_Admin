import { useNavigate, useSearch } from "@tanstack/react-router";
import { PlusIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { ReleasesListResult } from "@/modules/distribution/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { findCondition } from "@/shared/contracts/query-helpers";
import { useReleasesQuery } from "../api/queries";
import { ManageAppsDialog } from "../ui/ManageAppsDialog";
import { ReleasesFilter } from "../ui/ReleasesFilter";
import { ReleasesTable } from "../ui/ReleasesTable";
import { ShareLinksPanel } from "../ui/ShareLinksPanel";
import { UploadReleaseDialog } from "../ui/UploadReleaseDialog";

type ReleaseRow = ReleasesListResult["data"][number];

export function DistributionPage() {
  const nav = useNavigate({ from: "/app/distribution" });
  const search = useSearch({ from: "/app/distribution" }) as OffsetPageQueryDTO;
  const canWrite = useActionPermission(["distribution:write"]);
  const canRead = useActionPermission(["distribution:read"]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [linksRelease, setLinksRelease] = useState<ReleaseRow | null>(null);

  const selectedAppId =
    (findCondition(search.filters, "appId")?.value as string | undefined) ??
    null;

  const list = useReleasesQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort ?? [{ field: "createdAt", dir: "desc" }],
    filters: search.filters,
  });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ຈ່າຍແຈກແອັບ</h2>
            <p className="text-muted-foreground">
              ອັບໂຫຼດ Android build, ເຜີຍແຜ່ ແລະ ແບ່ງປັນລິ້ງດາວໂຫຼດໃຫ້ຜູ້ທົດສອບ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAppsOpen(true)}>
              <Settings2Icon className="h-4 w-4" />
              ແອັບ
            </Button>
            {canWrite && (
              <Button onClick={() => setUploadOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                ອັບໂຫຼດ APK
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <ReleasesFilter />
          <ReleasesTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            canWrite={canWrite}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={list.data?.meta?.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort?.[0]?.field ?? "createdAt"}
            sortOrder={
              (search.sort?.[0]?.dir as "asc" | "desc" | undefined) ?? "desc"
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onManageLinks={canRead ? setLinksRelease : undefined}
          />
        </div>
      </Main>

      <UploadReleaseDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultAppId={selectedAppId}
      />
      <ManageAppsDialog
        open={appsOpen}
        onOpenChange={setAppsOpen}
        canWrite={canWrite}
      />
      {linksRelease && (
        <ShareLinksPanel
          open={!!linksRelease}
          onOpenChange={(open) => {
            if (!open) setLinksRelease(null);
          }}
          releaseId={linksRelease.id}
          releaseLabel={`${linksRelease.appName} ${linksRelease.version} (${linksRelease.buildNumber})`}
          canWrite={canWrite}
        />
      )}
    </>
  );
}
