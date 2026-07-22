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

const SEARCH_FIELDS = ["name", "nameLocal", "email", "phone"] as const;

export function CustomersFilter() {
  const nav = useNavigate({ from: "/app/customers" });
  const search = useSearch({ from: "/app/customers" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];

  const nameFilter = findCondition(filters, "name");
  const typeFilter = findCondition(filters, "type");
  const typeValue = (typeFilter?.value as string) || "all";

  const [searchValue, setSearchValue] = useState<string>(
    (nameFilter?.value as string) || "",
  );

  useEffect(
    () => setSearchValue((nameFilter?.value as string) || ""),
    [nameFilter?.value],
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

  const hasFilter = !!nameFilter?.value || !!typeFilter?.value;

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
        <TabsList>
          <TabsTrigger value="all">ທັງໝົດ</TabsTrigger>
          <TabsTrigger value="company">ບໍລິສັດ</TabsTrigger>
          <TabsTrigger value="individual">ບຸກຄົນ</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <Input
          placeholder="ຄົ້ນຫາຊື່, ອີເມວ, ໂທລະສັບ..."
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
