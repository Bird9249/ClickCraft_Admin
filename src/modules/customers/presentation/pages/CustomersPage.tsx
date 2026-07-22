import { useNavigate, useSearch } from "@tanstack/react-router";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { useActionPermission } from "@/modules/auth/presentation/model/useActionPermission";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { useCustomersQuery } from "../api/queries";
import { CustomersFilter } from "../ui/CustomersFilter";
import { CustomersTable } from "../ui/CustomersTable";
import { CustomersToolbar } from "../ui/CustomersToolbar";

export function CustomersPage() {
  const nav = useNavigate({ from: "/app/customers" });
  const search = useSearch({ from: "/app/customers" }) as OffsetPageQueryDTO;

  const list = useCustomersQuery({
    offset: search.offset,
    limit: search.limit,
    sort: search.sort,
    filters: search.filters,
  });

  const canManage = useActionPermission(["customers:create"]);

  return (
    <>
      <Header />
      <Main>
        <CustomersToolbar
          canManage={!!canManage}
          onCreate={() => nav({ to: "/app/customers/create" })}
        />
        <div className="flex flex-col rounded-xl border bg-card pt-2">
          <CustomersFilter />
          <CustomersTable
            data={list.data?.data ?? []}
            isLoading={list.isLoading}
            offset={Number(search.offset ?? 0)}
            limit={Number(search.limit ?? 20)}
            totalCount={list.data?.meta?.total ?? 0}
            onPaginationChange={(offset, limit) =>
              nav({ search: { ...search, offset, limit } })
            }
            sortBy={search.sort ? search.sort[0]?.field : undefined}
            sortOrder={
              search.sort
                ? (search.sort[0]?.dir as "asc" | "desc")
                : undefined
            }
            onSortingChange={(id, desc) =>
              nav({
                search: {
                  ...search,
                  sort: [{ field: id, dir: desc ? "desc" : "asc" }],
                },
              })
            }
            onEdit={(c) =>
              nav({
                to: "/app/customers/$id/edit",
                params: { id: c.id },
              })
            }
          />
        </div>
      </Main>
    </>
  );
}
