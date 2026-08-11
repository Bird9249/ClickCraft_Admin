import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { LedgerListResult } from "@/modules/finance/domain/types";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRightLeftIcon, FileUpIcon, Link2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useLedgerQuery } from "../api/queries";
import { LedgerConvertPartyDialog } from "../ui/LedgerConvertPartyDialog";
import { LedgerFilter } from "../ui/LedgerFilter";
import { LedgerFormDialog } from "../ui/LedgerFormDialog";
import { LedgerImportDialog } from "../ui/LedgerImportDialog";
import { LedgerReconcileDialog } from "../ui/LedgerReconcileDialog";
import { LedgerSummaryCards } from "../ui/LedgerSummaryCards";
import { LedgerTable } from "../ui/LedgerTable";

type LedgerRow = LedgerListResult["data"][number];

export function LedgerPage() {
  const nav = useNavigate({ from: "/app/ledger" });
  const search = useSearch({ from: "/app/ledger" }) as OffsetPageQueryDTO;
  const list = useLedgerQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });

  const canManage = useActionPermission(["finance:write"]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerRow | null>(null);
  const [defaultType, setDefaultType] = useState<"income" | "expense">(
    "expense",
  );

  const openCreate = (type: "income" | "expense") => {
    setEditing(null);
    setDefaultType(type);
    setDialogOpen(true);
  };

  const openEdit = (row: LedgerRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ລາຍຮັບ-ລາຍຈ່າຍ</h2>
            <p className="text-muted-foreground">
              ບັນທຶກການເຄື່ອນໄຫວເງິນສົດຂອງ ClickCraft
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileUpIcon className="h-4 w-4" />
                ນຳເຂົ້າ CSV
              </Button>
              <Button variant="outline" onClick={() => setReconcileOpen(true)}>
                <Link2Icon className="h-4 w-4" />
                ຈັດຄູ່ລາຍການ
              </Button>
              <Button variant="outline" onClick={() => setConvertOpen(true)}>
                <ArrowRightLeftIcon className="h-4 w-4" />
                ແປງເປັນລູກຄ້າ
              </Button>
              <Button variant="outline" onClick={() => openCreate("income")}>
                <PlusIcon className="h-4 w-4" />
                ລາຍຮັບ
              </Button>
              <Button onClick={() => openCreate("expense")}>
                <PlusIcon className="h-4 w-4" />
                ລາຍຈ່າຍ
              </Button>
            </div>
          ) : null}
        </div>

        <LedgerSummaryCards
          summary={list.data?.summary}
          isLoading={list.isLoading}
        />

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <LedgerFilter />
          <LedgerTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 50)}
            totalCount={list.data?.meta?.total ?? 0}
            canManage={!!canManage}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort?.[0]?.field}
            sortOrder={search.sort?.[0]?.dir as "asc" | "desc" | undefined}
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onEdit={openEdit}
          />
        </div>
      </Main>

      <LedgerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        defaultType={defaultType}
      />

      <LedgerImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <LedgerConvertPartyDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
      />

      <LedgerReconcileDialog
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
      />
    </>
  );
}
