import { useMemo } from "react";
import {
  confirm,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import type { ReleasesListResult } from "@/modules/distribution/domain/types";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { useArchiveRelease, usePublishRelease } from "../api/queries";
import { ReleaseStatusBadge } from "./ReleaseStatusBadge";

type Row = ReleasesListResult["data"][number];

type Props = {
  data: Row[];
  isLoading?: boolean;
  canWrite?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onManageLinks?: (row: Row) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReleasesTable({
  data,
  isLoading,
  canWrite,
  offset,
  limit,
  totalCount,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onManageLinks,
}: Props) {
  const publishRelease = usePublishRelease();
  const archiveRelease = useArchiveRelease();

  const columns = useMemo<TanstackReactTable.ColumnDef<Row>[]>(
    () => [
      {
        id: "appName",
        header: "ແອັບ",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.appName}</span>
        ),
        size: 120,
      },
      createSortableColumn<Row>("version", "Version", { size: 100 }),
      createSortableColumn<Row>("buildNumber", "Build", { size: 90 }),
      {
        id: "platform",
        header: "ແພລດຟອມ",
        cell: ({ row }) => (
          <span className="text-sm uppercase">{row.original.platform}</span>
        ),
        size: 90,
      },
      {
        id: "fileName",
        header: "ໄຟລ໌",
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate text-sm">
            {row.original.fileName}
          </span>
        ),
        size: 180,
      },
      {
        id: "fileSize",
        header: "ຂະໜາດ",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {formatBytes(row.original.fileSize)}
          </span>
        ),
        size: 90,
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => <ReleaseStatusBadge status={row.original.status} />,
        size: 100,
      },
      createSortableColumn<Row>("publishedAt", "ເຜີຍແຜ່", {
        size: 110,
        cell: (info) => {
          const v = info.getValue<Date | null>();
          return v ? formatDateLocal(v) : "-";
        },
      }),
      createSortableColumn<Row>("createdAt", "ສ້າງເມື່ອ", {
        size: 110,
        cell: (info) => {
          const v = info.getValue<Date | null>();
          return v ? formatDateLocal(v) : "-";
        },
      }),
      {
        id: "actions",
        size: 180,
        cell: ({ row }) => {
          const actions: {
            label: string;
            onClick: () => void;
            variant?: "destructive" | "secondary" | "outline";
          }[] = [];

          if (row.original.status === "published" && onManageLinks) {
            actions.push({
              label: "ລິ້ງ",
              onClick: () => onManageLinks(row.original),
            });
          }

          if (canWrite && row.original.status === "draft") {
            actions.push({
              label: "ເຜີຍແຜ່",
              onClick: async () => {
                const ok = await confirm({
                  title: "ເຜີຍແຜ່ release?",
                  description: `${row.original.version} (${row.original.buildNumber})`,
                });
                if (ok) publishRelease.mutate(row.original.id);
              },
            });
          }

          if (canWrite && row.original.status !== "archived") {
            actions.push({
              label: "ເກັບໄວ້",
              variant: "outline",
              onClick: async () => {
                const ok = await confirm({
                  title: "ເກັບໄວ້ release ໄວ້?",
                  description: "ລິ້ງແບ່ງປັນເກົ່າຈະໃຊ້ບໍ່ໄດ້ຫຼັງຈາກເກັບໄວ້.",
                });
                if (ok) archiveRelease.mutate(row.original.id);
              },
            });
          }

          if (actions.length === 0) return null;
          return <RowActions actions={actions} maxInline={2} />;
        },
      },
    ],
    [canWrite, publishRelease, archiveRelease, onManageLinks],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      offset={offset}
      limit={limit}
      totalCount={totalCount}
      onPaginationChange={onPaginationChange}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortingChange={onSortingChange}
    />
  );
}
