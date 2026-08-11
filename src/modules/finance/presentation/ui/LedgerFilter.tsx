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

const SEARCH_FIELDS = ["category", "relatedParty", "notes"] as const;

const TYPE_TABS = [
  { value: "all", label: "ທັງໝົດ" },
  { value: "income", label: "ລາຍຮັບ" },
  { value: "expense", label: "ລາຍຈ່າຍ" },
] as const;

export function LedgerFilter() {
  const nav = useNavigate({ from: "/app/ledger" });
  const search = useSearch({ from: "/app/ledger" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];

  const searchFilter = findCondition(filters, "category");
  const typeFilter = findCondition(filters, "type");
  const typeValue = (typeFilter?.value as string) || "all";

  const [searchValue, setSearchValue] = useState<string>(
    (searchFilter?.value as string) || "",
  );

  useEffect(
    () => setSearchValue((searchFilter?.value as string) || ""),
    [searchFilter?.value],
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

  const hasFilter = !!searchFilter?.value || !!typeFilter?.value;

  return (
    <div className="mb-4 flex flex-col gap-2 px-2">
      <Tabs
        value={typeValue}
        onValueChange={(val) => {
          let nextFilters: FilterConditionDTO[] | undefined = filters;
          if (val === "all") {
            nextFilters = removeConditions(filters, "type");
          } else {
            nextFilters = upsertCondition(filters, {
              field: "type",
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
          {TYPE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <Input
          placeholder="ຄົ້ນຫາລາຍການ, ຜູ້ກ່ຽວຂ້ອງ, ຫມາຍເຫດ..."
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
            <XIcon className="h-4 w-4" /> ລ້າງ
          </Button>
        ) : null}
      </div>
    </div>
  );
}
