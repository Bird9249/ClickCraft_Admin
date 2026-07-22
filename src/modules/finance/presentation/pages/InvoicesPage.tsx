import { useNavigate, useSearch } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useInvoicesQuery } from "../api/queries";
import { InvoicesFilter } from "../ui/InvoicesFilter";
import { InvoicesTable } from "../ui/InvoicesTable";

export function InvoicesPage() {
  const nav = useNavigate({ from: "/app/invoices" });
  const search = useSearch({ from: "/app/invoices" }) as OffsetPageQueryDTO;
  const list = useInvoicesQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });
  const canWrite = useActionPermission(["finance:write"]);

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">ໃບເກັບເງິນ</h2>
            <p className="text-muted-foreground">ຈັດການໃບເກັບເງິນ.</p>
          </div>
          {canWrite && (
            <Button onClick={() => nav({ to: "/app/invoices/create" })}>
              <PlusIcon className="h-4 w-4" />
              ສ້າງໃໝ່
            </Button>
          )}
        </div>

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <InvoicesFilter />
          <InvoicesTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={list.data?.meta?.total ?? 0}
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
            onEdit={(inv) =>
              nav({
                to: "/app/invoices/$id/edit",
                params: { id: inv.id },
              })
            }
          />
        </div>
      </Main>
    </>
  );
}
