import { CornerDownRightIcon, PlusIcon, TrashIcon } from "lucide-react";
import type { Control } from "react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/kit";
import { lineGroupAmount } from "@/modules/finance/domain/line-pricing";

type SubItemField = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
};

type LineField = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  priceOn: "parent" | "children";
  children: SubItemField[];
};

type Props = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  currency?: string;
};

function SubItemsEditor({
  name,
  control,
  priceOn,
}: {
  name: string;
  control: Control<unknown>;
  priceOn: "parent" | "children";
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="ml-4 space-y-1 border-l-2 border-muted pl-3">
      {fields.map((field, childIdx) => (
        <div
          key={field.id}
          className={
            priceOn === "children"
              ? "grid grid-cols-[auto_1fr_72px_96px_32px] items-center gap-2"
              : "flex items-center gap-2"
          }
        >
          <CornerDownRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            placeholder="ລາຍລະອຽດ sub-item"
            {...control.register(`${name}.${childIdx}.description`)}
          />
          {priceOn === "children" ? (
            <>
              <input
                type="number"
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
                {...control.register(`${name}.${childIdx}.quantity`, {
                  valueAsNumber: true,
                })}
              />
              <input
                type="number"
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
                {...control.register(`${name}.${childIdx}.unitPrice`, {
                  valueAsNumber: true,
                })}
              />
            </>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => remove(childIdx)}
          >
            <TrashIcon className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() =>
          append({
            description: "",
            quantity: 1,
            unitPrice: 0,
            sortOrder: fields.length,
          })
        }
      >
        <PlusIcon className="mr-1 h-3 w-3" />
        ເພີ່ມ sub-item
      </Button>
    </div>
  );
}

function ParentLineRow({
  name,
  idx,
  control,
  onRemove,
}: {
  name: string;
  idx: number;
  control: Control<unknown>;
  onRemove: () => void;
}) {
  const linePath = `${name}.${idx}`;
  const childrenPath = `${linePath}.children`;
  const priceOn =
    (useWatch({ control, name: `${linePath}.priceOn` }) as
      | "parent"
      | "children"
      | undefined) ?? "parent";
  const children =
    (useWatch({ control, name: childrenPath }) as SubItemField[] | undefined) ??
    [];
  const hasChildren = children.length > 0;
  const priceOnChildren = hasChildren && priceOn === "children";

  return (
    <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
      <div
        className={
          priceOnChildren
            ? "grid grid-cols-[1fr_40px] items-center gap-2"
            : "grid grid-cols-[1fr_80px_120px_40px] items-center gap-2"
        }
      >
        <input
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          placeholder="ຄໍາອະທິບາຍ"
          {...control.register(`${linePath}.description`)}
        />
        {!priceOnChildren ? (
          <>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-right text-sm"
              {...control.register(`${linePath}.quantity`, {
                valueAsNumber: true,
              })}
            />
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-right text-sm"
              {...control.register(`${linePath}.unitPrice`, {
                valueAsNumber: true,
              })}
            />
          </>
        ) : (
          <div />
        )}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <TrashIcon className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {hasChildren ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">ລາຄາຢູ່:</span>
          <Controller
            control={control}
            name={`${linePath}.priceOn`}
            render={({ field }) => (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={field.value === "parent" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => field.onChange("parent")}
                >
                  ລາຍການຫຼັກ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={field.value === "children" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => field.onChange("children")}
                >
                  sub-item
                </Button>
              </>
            )}
          />
        </div>
      ) : null}

      {hasChildren ? (
        <SubItemsEditor
          name={childrenPath}
          control={control}
          priceOn={priceOn}
        />
      ) : null}
    </div>
  );
}

export function LineItemsEditor({ name, control, currency = "LAK" }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const watchedLines = (useWatch({ control, name }) as LineField[] | undefined) ?? [];

  const total = watchedLines.reduce((acc, line) => {
    return (
      acc +
      lineGroupAmount({
        description: line?.description ?? "",
        quantity: line?.quantity ?? 0,
        unitPrice: line?.unitPrice ?? 0,
        sortOrder: line?.sortOrder ?? 0,
        priceOn: line?.priceOn ?? "parent",
        children: line?.children ?? [],
      })
    );
  }, 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_80px_120px_40px] gap-2 text-sm font-medium text-muted-foreground">
        <span>ລາຍການ</span>
        <span className="text-right">ຈໍານວນ</span>
        <span className="text-right">ລາຄາ/ໜ່ວຍ</span>
        <span />
      </div>

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <ParentLineRow
            key={field.id}
            name={name}
            idx={idx}
            control={control}
            onRemove={() => remove(idx)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            description: "",
            quantity: 1,
            unitPrice: 0,
            sortOrder: fields.length,
            priceOn: "parent",
            children: [],
          })
        }
      >
        <PlusIcon className="mr-1 h-4 w-4" />
        ເພີ່ມລາຍການ
      </Button>

      <div className="border-t pt-2 text-right text-sm font-semibold">
        ລວມ: {currency} {total.toLocaleString()}
      </div>
    </div>
  );
}

export type { LineField, SubItemField };
