import { useNavigate, useSearch } from "@tanstack/react-router";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useReceiptsQuery } from "../api/queries";
import { ReceiptsFilter } from "../ui/ReceiptsFilter";
import { ReceiptsTable } from "../ui/ReceiptsTable";

export function ReceiptsPage() {
  const nav = useNavigate({ from: "/app/receipts" });
  const search = useSearch({ from: "/app/receipts" }) as OffsetPageQueryDTO;
  const list = useReceiptsQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4">
          <h2 className="font-bold text-2xl tracking-tight">ໃບຮັບເງິນ</h2>
          <p className="text-muted-foreground">ລາຍການໃບຮັບເງິນທັງໝົດ.</p>
        </div>

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <ReceiptsFilter />
          <ReceiptsTable
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
          />
        </div>
      </Main>
    </>
  );
}
