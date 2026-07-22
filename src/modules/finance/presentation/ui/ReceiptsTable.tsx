import { ExternalLinkIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Badge,
  confirm,
  createSortableColumn,
  DataTable,
  toast,
  type TanstackReactTable,
} from "@/components/kit";
import type { ReceiptsListResult } from "@/modules/finance/domain/types";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { receiptsApi } from "../api/client";
import { useUpdateReceipt, useVoidReceipt } from "../api/queries";

type RRow = ReceiptsListResult["data"][number];

type Props = {
  data: RRow[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
};

export function ReceiptsTable({
  data,
  isLoading,
  offset,
  limit,
  totalCount,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
}: Props) {
  const voidReceipt = useVoidReceipt();
  const updateReceipt = useUpdateReceipt();

  const columns: TanstackReactTable.ColumnDef<RRow>[] = useMemo(
    () => [
      createSortableColumn<RRow>("number", "ເລກທີ", { size: 120 }),
      {
        id: "customerName",
        header: "ລູກຄ້າ",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.customerName ?? "-"}</span>
        ),
        size: 160,
      },
      {
        id: "invoiceNumber",
        header: "ໃບເກັບເງິນ",
        cell: ({ row }) => (
          <span className="text-sm font-mono">
            {row.original.invoiceNumber ?? "-"}
          </span>
        ),
        size: 120,
      },
      {
        id: "status",
        header: "ສະຖານະ",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "void" ? "outline" : "default"}
          >
            {row.original.status === "void" ? "ຍົກເລີກ" : "ອອກແລ້ວ"}
          </Badge>
        ),
        size: 90,
      },
      createSortableColumn<RRow>("issueDate", "ວັນທີ", {
        size: 100,
        cell: (info) => {
          const v = info.getValue<Date | null>();
          return v ? formatDateLocal(v) : "-";
        },
      }),
      {
        id: "amount",
        header: "ຈໍານວນ",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.currency}{" "}
            {(row.original.amount ?? 0).toLocaleString()}
          </span>
        ),
        size: 120,
      },
      {
        id: "actions",
        size: 80,
        cell: ({ row }: { row: { original: RRow } }) => {
          const actions: {
            label: string;
            icon?: React.ReactNode;
            variant?: "destructive";
            onClick: () => void;
          }[] = [
            {
              label: "PDF",
              icon: <ExternalLinkIcon className="h-4 w-4" />,
              onClick: () =>
                window.open(receiptsApi.pdfUrl(row.original.id), "_blank"),
            },
          ];

          if (row.original.status !== "void") {
            const showing = row.original.showSignature !== false;
            actions.push({
              label: showing ? "ເຊື່ອງລາຍເຊັນ" : "ສະແດງລາຍເຊັນ",
              onClick: () => {
                toast.promise(
                  updateReceipt.mutateAsync({
                    id: row.original.id,
                    input: { showSignature: !showing },
                  }),
                  {
                    loading: "ກໍາລັງບັນທຶກ...",
                    success: "ອັບເດດການຕັ້ງຄ່າ PDF ສໍາເລັດ",
                    error: "ບັນທຶກລົ້ມເຫຼວ",
                  },
                );
              },
            });
            actions.push({
              label: "ຍົກເລີກ",
              variant: "destructive",
              onClick: async () => {
                const ok = await confirm({
                  title: "ຍົກເລີກໃບຮັບເງິນ",
                  description:
                    "ການຍົກເລີກຈະຫຼຸດຍອດຊໍາລະຂອງໃບເກັບເງິນ. ທ່ານແນ່ໃຈບໍ?",
                  actionText: "ຍົກເລີກ",
                  ActionProps: { variant: "destructive" },
                });
                if (ok)
                  toast.promise(voidReceipt.run(row.original.id), {
                    loading: "ກໍາລັງດໍາເນີນການ...",
                    success: "ຍົກເລີກໃບຮັບເງິນສໍາເລັດ",
                    error: "ຍົກເລີກລົ້ມເຫຼວ",
                  });
              },
            });
          }

          return <RowActions actions={actions} maxInline={2} />;
        },
      },
    ],
    [voidReceipt, updateReceipt],
  );

  return (
    <DataTable<RRow, unknown>
      noDataMessage="ບໍ່ພົບໃບຮັບເງິນ"
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
