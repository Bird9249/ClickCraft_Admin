import { EditIcon, ExternalLinkIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Badge,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import type { QuotationsListResult } from "@/modules/finance/domain/types";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { quotationsApi } from "../api/client";

type QRow = QuotationsListResult["data"][number];

const STATUS_LABEL: Record<string, string> = {
  draft: "ຮ່າງ",
  sent: "ສົ່ງແລ້ວ",
  accepted: "ຍອມຮັບ",
  rejected: "ປະຕິເສດ",
  void: "ຍົກເລີກ",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  void: "outline",
};

type Props = {
  data: QRow[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (row: QRow) => void;
};

export function QuotationsTable({
  data,
  isLoading,
  offset,
  limit,
  totalCount,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onEdit,
}: Props) {
  const columns: TanstackReactTable.ColumnDef<QRow>[] = useMemo(
    () => [
      createSortableColumn<QRow>("number", "ເລກທີ", { size: 120 }),
      {
        id: "customerName",
        header: "ລູກຄ້າ",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.customerName ?? "-"}</span>
        ),
        size: 160,
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => (
          <Badge
            variant={STATUS_VARIANT[row.original.status] ?? "secondary"}
          >
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 90,
      },
      createSortableColumn<QRow>("issueDate", "ວັນທີ", {
        size: 100,
        cell: (info) => {
          const v = info.getValue<Date | null>();
          return v ? formatDateLocal(v) : "-";
        },
      }),
      {
        id: "total",
        header: "ລວມທັງໝົດ",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.currency}{" "}
            {(row.original.total ?? 0).toLocaleString()}
          </span>
        ),
        size: 120,
      },
      {
        id: "actions",
        size: 80,
        cell: ({ row }: { row: { original: QRow } }) => (
          <RowActions
            actions={[
              {
                label: "ແກ້ໄຂ",
                icon: <EditIcon className="h-4 w-4" />,
                onClick: () => onEdit(row.original),
              },
              {
                label: "PDF",
                icon: <ExternalLinkIcon className="h-4 w-4" />,
                onClick: () =>
                  window.open(quotationsApi.pdfUrl(row.original.id), "_blank"),
              },
            ]}
            maxInline={2}
          />
        ),
      },
    ],
    [onEdit],
  );

  return (
    <DataTable<QRow, unknown>
      noDataMessage="ບໍ່ພົບໃບສະເໜີລາຄາ"
      isLoading={isLoading}
      columns={columns}
      data={data}
      offset={offset}
      limit={limit}
      totalCount={totalCount}
      onPaginationChange={(p) => onPaginationChange(p.offset, p.limit)}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortingChange={(s) => {
        if (s[0]?.id) onSortingChange(s[0].id, !!s[0].desc);
      }}
    />
  );
}
