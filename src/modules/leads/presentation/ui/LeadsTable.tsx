import { EyeIcon } from "lucide-react";
import { useMemo } from "react";
import {
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
} from "@/components/kit";
import type { LeadsListResult } from "@/modules/leads/domain/types";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { LeadStatusBadge } from "./LeadStatusBadge";

type Row = LeadsListResult["data"][number];

type Props = {
  data: Row[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onOpen: (row: Row) => void;
};

export function LeadsTable({
  data,
  isLoading,
  offset,
  limit,
  totalCount,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onOpen,
}: Props) {
  const columns = useMemo<TanstackReactTable.ColumnDef<Row>[]>(
    () => [
      createSortableColumn<Row>("createdAt", "ວັນທີ", {
        size: 100,
        cell: (info) => {
          const v = info.getValue<Date | null>();
          return v ? formatDateLocal(v) : "-";
        },
      }),
      createSortableColumn<Row>("companyName", "ບໍລິສັດ", { size: 160 }),
      createSortableColumn<Row>("contactName", "ຜູ້ຕິດຕໍ່", { size: 140 }),
      createSortableColumn<Row>("phone", "ເບີໂທ", { size: 120 }),
      {
        id: "preset",
        header: "ແພັກເກັດ",
        cell: ({ row }) =>
          `${row.original.presetName ?? row.original.presetId}${
            row.original.phaseLabel ? ` / ${row.original.phaseLabel}` : ""
          }`,
        size: 160,
      },
      createSortableColumn<Row>("estimatedSubtotal", "ຍອດປະມານ", {
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {(row.original.estimatedSubtotal ?? 0).toLocaleString()}{" "}
            {row.original.currency}
          </span>
        ),
      }),
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
        size: 100,
      },
      {
        id: "actions",
        size: 90,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                label: "ເປີດ",
                icon: <EyeIcon className="h-4 w-4" />,
                onClick: () => onOpen(row.original),
              },
            ]}
            maxInline={2}
          />
        ),
      },
    ],
    [onOpen],
  );

  return (
    <DataTable<Row, unknown>
      noDataMessage="ບໍ່ພົບຄຳຂໍໃບສະເໜີລາຄາ"
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
