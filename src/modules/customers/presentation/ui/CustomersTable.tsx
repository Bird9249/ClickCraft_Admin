import { EditIcon, TrashIcon } from "lucide-react";
import { useMemo } from "react";
import {
  confirm,
  createSortableColumn,
  DataTable,
  type TanstackReactTable,
  toast,
} from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import type { CustomersListResult } from "@/modules/customers/domain/types";
import { RowActions } from "@/shared/ui/RowActions";
import { useDeleteCustomer } from "../api/queries";

type CustomerRow = CustomersListResult["data"][number];

type CustomersTableProps = {
  data: CustomerRow[];
  isLoading?: boolean;
  offset: number;
  limit: number;
  totalCount: number;
  onPaginationChange: (offset: number, limit: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortingChange: (id: string, desc: boolean) => void;
  onEdit: (row: CustomerRow) => void;
};

export function CustomersTable({
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
}: CustomersTableProps) {
  const { has } = usePermissions();
  const deleteCustomer = useDeleteCustomer();

  const canUpdate = has("customers:update");
  const canDelete = has("customers:delete");

  const columns: TanstackReactTable.ColumnDef<CustomerRow>[] = useMemo(
    () => [
      createSortableColumn<CustomerRow>("name", "ຊື່", { size: 160 }),
      createSortableColumn<CustomerRow>("nameLocal", "ຊື່ທ້ອງຖິ່ນ", {
        size: 140,
      }),
      {
        id: "type",
        header: "ປະເພດ",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.type === "company" ? "ບໍລິສັດ" : "ບຸກຄົນ"}
          </span>
        ),
        size: 80,
      },
      createSortableColumn<CustomerRow>("email", "ອີເມວ", { size: 160 }),
      createSortableColumn<CustomerRow>("phone", "ໂທລະສັບ", { size: 120 }),
      {
        id: "actions",
        size: 80,
        cell: ({ row }: { row: { original: CustomerRow } }) => {
          const id = row.original.id;
          const actions: {
            label: string;
            icon?: React.ReactNode;
            variant?: "destructive";
            onClick: () => void;
          }[] = [];

          if (canUpdate)
            actions.push({
              label: "ແກ້ໄຂ",
              icon: <EditIcon className="h-4 w-4" />,
              onClick: () => onEdit(row.original),
            });

          if (canDelete)
            actions.push({
              label: "ລຶບ",
              variant: "destructive",
              icon: <TrashIcon className="h-4 w-4" />,
              onClick: async () => {
                const ok = await confirm({
                  title: "ລຶບລູກຄ້າ",
                  description: "ທ່ານແນ່ໃຈບໍ່ວ່າຈະລຶບລູກຄ້ານີ້?",
                  actionText: "ລຶບ",
                  ActionProps: { variant: "destructive" },
                });
                if (ok)
                  toast.promise(deleteCustomer.run(id), {
                    loading: "ກໍາລັງລຶບ...",
                    success: "ລຶບລູກຄ້າສໍາເລັດ",
                    error: "ລຶບລູກຄ້າລົ້ມເຫຼວ",
                  });
              },
            });

          return <RowActions actions={actions} maxInline={2} />;
        },
      },
    ],
    [canDelete, canUpdate, deleteCustomer, onEdit],
  );

  return (
    <DataTable<CustomerRow, unknown>
      noDataMessage="ບໍ່ພົບລູກຄ້າ"
      isLoading={isLoading}
      columns={columns}
      data={data}
      offset={offset}
      limit={limit}
      totalCount={totalCount}
      onPaginationChange={(p) => onPaginationChange(p.offset, p.limit)}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortingChange={(sorting) => {
        if (sorting[0]?.id === "") return;
        onSortingChange(sorting[0]?.id as string, !!sorting[0]?.desc);
      }}
    />
  );
}
