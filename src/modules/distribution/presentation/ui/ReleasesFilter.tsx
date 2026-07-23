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
import { useDistributionAppsQuery } from "../api/queries";

const SEARCH_FIELDS = ["version", "buildNumber", "fileName"] as const;

const STATUS_TABS = [
  { value: "all", label: "ທັງໝົດ" },
  { value: "draft", label: "ຮ່າງ" },
  { value: "published", label: "ເຜີຍແຜ່" },
  { value: "archived", label: "ເກັບໄວ້" },
] as const;

export function ReleasesFilter() {
  const nav = useNavigate({ from: "/app/distribution" });
  const search = useSearch({ from: "/app/distribution" }) as OffsetPageQueryDTO;
  const filters = (search.filters as FilterConditionDTO[] | undefined) ?? [];
  const appsQuery = useDistributionAppsQuery();
  const apps = appsQuery.data?.data ?? [];

  const versionFilter = findCondition(filters, "version");
  const statusFilter = findCondition(filters, "status");
  const appFilter = findCondition(filters, "appId");
  const statusValue = (statusFilter?.value as string) || "all";
  const appValue = (appFilter?.value as string) || "all";

  const [searchValue, setSearchValue] = useState<string>(
    (versionFilter?.value as string) || "",
  );

  useEffect(
    () => setSearchValue((versionFilter?.value as string) || ""),
    [versionFilter?.value],
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

  const hasFilter =
    !!versionFilter?.value || !!statusFilter?.value || !!appFilter?.value;

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

      <Tabs
        value={appValue}
        onValueChange={(val) => {
          let nextFilters: FilterConditionDTO[] | undefined = filters;
          if (val === "all") {
            nextFilters = removeConditions(filters, "appId");
          } else {
            nextFilters = upsertCondition(filters, {
              field: "appId",
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
          <TabsTrigger value="all">ແອັບທັງໝົດ</TabsTrigger>
          {apps.map((app) => (
            <TabsTrigger key={app.id} value={app.id}>
              {app.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <Input
          placeholder="ຄົນຫາ version, build, ຊື່ໄຟລ໌..."
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
