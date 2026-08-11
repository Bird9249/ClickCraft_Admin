import { useMemo } from "react";
import {
  Badge,
  confirm,
  createSortableColumn,
  DataTable,
  toast,
  type TanstackReactTable,
} from "@/components/kit";
import type { LedgerListResult } from "@/modules/finance/domain/types";
import { formatDateLocal } from "@/shared/lib/date-time";
import { RowActions } from "@/shared/ui/RowActions";
import { useDeleteLedgerEntry } from "../api/queries";
import {
  formatLak,
  ledgerSourceLabel,
  ledgerTypeLabel,
} from "../lib/ledger-constants";

type LRow = LedgerListResult["data"][number];

type Props = {
  data: LRow[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  canManage?: boolean;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (row: LRow) => void;
};

export function LedgerTable({
  data,
  isLoading,
  offset,
  limit,
  totalCount,
  canManage,
  onPaginationChange,
  sortBy,
  sortOrder,
  onSortingChange,
  onEdit,
}: Props) {
  const deleteEntry = useDeleteLedgerEntry();

  const columns: TanstackReactTable.ColumnDef<LRow>[] = useMemo(
    () => [
      createSortableColumn<LRow>("entryDate", "ວັນທີ", {
        size: 100,
        cell: (info) => {
          const v = info.getValue<Date | null>();
          return v ? formatDateLocal(v) : "-";
        },
      }),
      {
        id: "type",
        header: "ປະເພດ",
        cell: ({ row }) => (
          <Badge
            variant={row.original.type === "income" ? "default" : "secondary"}
          >
            {ledgerTypeLabel(row.original.type as "income" | "expense")}
          </Badge>
        ),
        size: 90,
      },
      createSortableColumn<LRow>("category", "ລາຍການ", { size: 160 }),
      {
        id: "amount",
        header: "ຈໍານວນ",
        cell: ({ row }) => (
          <span
            className={
              row.original.type === "income"
                ? "font-mono text-emerald-600 text-sm"
                : "font-mono text-red-600 text-sm"
            }
          >
            {row.original.type === "income" ? "+" : "-"}
            {formatLak(row.original.amount)}
          </span>
        ),
        size: 130,
      },
      createSortableColumn<LRow>("relatedParty", "ຜູ້ກ່ຽວຂ້ອງ", {
        size: 120,
        cell: (info) => {
          const v = info.getValue<string | null>();
          return v ?? "-";
        },
      }),
      {
        id: "sourceType",
        header: "ແຫຼ່ງ",
        cell: ({ row }) => {
          const sourceType = row.original.sourceType as
            | "manual"
            | "csv_import"
            | "payment"
            | null;
          const isUnlinkedIncome =
            row.original.type === "income" &&
            !row.original.paymentId &&
            sourceType !== "payment";
          if (isUnlinkedIncome) {
            return (
              <Badge variant="outline" className="text-amber-700 text-xs">
                ຍັງບໍ່ຜູກ
              </Badge>
            );
          }
          if (!sourceType || sourceType === "manual") return null;
          const docRef =
            sourceType === "payment"
              ? (row.original.receiptNumber ?? row.original.invoiceNumber)
              : null;
          return (
            <div className="flex flex-col gap-0.5">
              <Badge variant="outline" className="w-fit text-xs">
                {ledgerSourceLabel(sourceType)}
              </Badge>
              {docRef ? (
                <span className="font-mono text-muted-foreground text-xs">
                  {docRef}
                </span>
              ) : null}
            </div>
          );
        },
        size: 100,
      },
      {
        id: "runningBalance",
        header: "ຄົງເຫຼືອ",
        cell: ({ row }) => (
          <span className="font-mono text-sm tabular-nums">
            {formatLak(row.original.runningBalance ?? 0)}
          </span>
        ),
        size: 130,
      },
      {
        id: "notes",
        header: "ຫມາຍເຫດ",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-muted-foreground text-xs">
            {row.original.notes ?? ""}
          </span>
        ),
        size: 180,
      },
      ...(canManage
        ? [
            {
              id: "actions",
              size: 70,
              cell: ({ row }: { row: { original: LRow } }) => {
                const linkedToPayment = row.original.sourceType === "payment";
                return (
                <RowActions
                  actions={[
                    ...(linkedToPayment
                      ? []
                      : [
                          {
                            label: "ແກ້ໄຂ",
                            onClick: () => onEdit(row.original),
                          },
                          {
                            label: "ລຶບ",
                            variant: "destructive" as const,
                            onClick: async () => {
                              const ok = await confirm({
                                title: "ລຶບລາຍການ",
                                description:
                                  "ທ່ານແນ່ໃຈບໍວ່າຕ້ອງການລຶບລາຍການນີ້?",
                                actionText: "ລຶບ",
                                ActionProps: { variant: "destructive" },
                              });
                              if (ok) {
                                toast.promise(
                                  deleteEntry.mutateAsync(row.original.id),
                                  {
                                    loading: "ກໍາລັງລຶບ...",
                                    success: "ລຶບລາຍການສໍາເລັດ",
                                    error: "ລຶບລາຍການລົ້ມເຫຼວ",
                                  },
                                );
                              }
                            },
                          },
                        ]),
                  ]}
                  maxInline={2}
                />
              );
              },
            } satisfies TanstackReactTable.ColumnDef<LRow>,
          ]
        : []),
    ],
    [canManage, deleteEntry, onEdit],
  );

  return (
    <DataTable<LRow, unknown>
      noDataMessage="ບໍ່ພົບລາຍການ"
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
