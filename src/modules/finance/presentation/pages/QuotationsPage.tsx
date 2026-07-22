import { useNavigate, useSearch } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useQuotationsQuery } from "../api/queries";
import { QuotationsFilter } from "../ui/QuotationsFilter";
import { QuotationsTable } from "../ui/QuotationsTable";

export function QuotationsPage() {
  const nav = useNavigate({ from: "/app/quotations" });
  const search = useSearch({ from: "/app/quotations" }) as OffsetPageQueryDTO;
  const list = useQuotationsQuery({
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
            <h2 className="font-bold text-2xl tracking-tight">
              ໃບສະເໜີລາຄາ
            </h2>
            <p className="text-muted-foreground">ຈັດການໃບສະເໜີລາຄາ.</p>
          </div>
          {canWrite && (
            <Button onClick={() => nav({ to: "/app/quotations/create" })}>
              <PlusIcon className="h-4 w-4" />
              ສ້າງໃໝ່
            </Button>
          )}
        </div>

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <QuotationsFilter />
          <QuotationsTable
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
            onEdit={(q) =>
              nav({
                to: "/app/quotations/$id/edit",
                params: { id: q.id },
              })
            }
          />
        </div>
      </Main>
    </>
  );
}
