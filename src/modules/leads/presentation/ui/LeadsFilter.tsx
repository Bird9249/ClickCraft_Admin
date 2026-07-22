import { useNavigate, useSearch } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  useDebounceCallback,
} from "@/components/kit";
import type {
  FilterConditionDTO,
  OffsetPageQueryDTO,
} from "@/shared/contracts/base";
import {
  findCondition,
  removeConditions,
  upsertCondition,
  upsertOrGroup,
} from "@/shared/contracts/query-helpers";

const SEARCH_FIELDS = ["companyName", "contactName", "phone"] as const;

const STATUS_TABS = [
  { value: "all", label: "ທັງໝົດ" },
  { value: "new", label: "ໃໝ່" },
  { value: "contacted", label: "ຕິດຕໍ່ແລ້ວ" },
  { value: "qualified", label: "ມີໂອກາດ" },
  { value: "converted", label: "ແປງແລ້ວ" },
  { value: "lost", label: "ປິດ" },
] as const;

export function LeadsFilter() {
  const nav = useNavigate({ from: "/app/leads" });
  const search = useSearch({ from: "/app/leads" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];

  const companyFilter = findCondition(filters, "companyName");
  const statusFilter = findCondition(filters, "status");
  const statusValue = (statusFilter?.value as string) || "all";

  const [searchValue, setSearchValue] = useState<string>(
    (companyFilter?.value as string) || "",
  );

  useEffect(
    () => setSearchValue((companyFilter?.value as string) || ""),
    [companyFilter?.value],
  );

  const debounced = useDebounceCallback((val: string) => {
    setSearchValue(val);
    let nextFilters: FilterConditionDTO[] | undefined = filters;
    if (val) {
      nextFilters = upsertOrGroup(
        filters,
        SEARCH_FIELDS.map((field) => ({
          field,
          op: "contains" as const,
          value: val,
        })),
      );
    } else {
      for (const field of SEARCH_FIELDS) {
        nextFilters = removeConditions(nextFilters, field);
      }
    }
    nav({
      search: {
        ...search,
        offset: 0,
        filters: nextFilters?.length ? nextFilters : undefined,
      },
    });
  }, 400);

  const hasFilter = !!companyFilter?.value || !!statusFilter?.value;

  return (
    <div className="mb-4 flex flex-col gap-2 px-2">
      <Tabs
        value={statusValue}
        onValueChange={(val) => {
          let nextFilters: FilterConditionDTO[] | undefined = filters;
          if (val === "all") {
            nextFilters = removeConditions(filters, "status");
          } else {
            nextFilters = upsertCondition(filters, {
              field: "status",
              op: "eq",
              value: val,
            });
          }
          nav({
            search: {
              ...search,
              offset: 0,
              filters: nextFilters?.length ? nextFilters : undefined,
            },
          });
        }}
      >
        <TabsList className="flex h-auto flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <Input
          placeholder="ຄົ້ນຫາຊື່ບໍລິສັດ, ຜູ້ຕິດຕໍ່, ເບີ..."
          defaultValue={searchValue}
          onChange={(e) => debounced(e.target.value)}
          className="h-8 sm:max-w-xs"
        />
        {hasFilter ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              nav({ search: { ...search, filters: undefined, offset: 0 } })
            }
            className="max-sm:w-full"
          >
            <XIcon className="h-4 w-4" /> {"ລ້າງ"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
