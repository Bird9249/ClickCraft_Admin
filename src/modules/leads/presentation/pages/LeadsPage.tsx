import { useNavigate, useSearch } from "@tanstack/react-router";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useLeadsQuery } from "../api/queries";
import { LeadsFilter } from "../ui/LeadsFilter";
import { LeadsTable } from "../ui/LeadsTable";

export function LeadsPage() {
  const nav = useNavigate({ from: "/app/leads" });
  const search = useSearch({ from: "/app/leads" }) as OffsetPageQueryDTO;
  const list = useLeadsQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort ?? [{ field: "createdAt", dir: "desc" }],
    filters: search.filters,
  });

  return (
    <>
      <Header />
      <Main>
        <div className="mb-4">
          <h2 className="font-bold text-2xl tracking-tight">
            {"ຄຳຂໍໃບສະເໜີລາຄາ"}
          </h2>
          <p className="text-muted-foreground">
            {"Lead ຈາກ Website — ຕິດຕາມການຕິດຕໍ່ ແລະ ແປງເປັນໃບສະເໜີລາຄາ"}
          </p>
        </div>

        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <LeadsFilter />
          <LeadsTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={list.data?.meta?.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort?.[0]?.field ?? "createdAt"}
            sortOrder={
              (search.sort?.[0]?.dir as "asc" | "desc" | undefined) ?? "desc"
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onOpen={(row) =>
              nav({ to: "/app/leads/$id", params: { id: row.id } })
            }
          />
        </div>
      </Main>
    </>
  );
}
