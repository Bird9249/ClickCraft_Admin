import {
  CornerDownRightIcon,
  FileDownIcon,
  FileUpIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { useRef } from "react";
import type { Control } from "react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button, confirm, toast } from "@/components/kit";
import {
  downloadLineItemsJsonTemplate,
  type LineItemsJson,
  parseLineItemsJsonText,
  toFormLinesFromJson,
} from "@/modules/finance/domain/line-items-json";
import {
  lineGroupAmount,
  MAX_SUB_ITEM_DEPTH,
} from "@/modules/finance/domain/line-pricing";
import { LineDescriptionField } from "./LineDescriptionField";

type SubItemField = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  children: SubItemField[];
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

function emptySubItem(sortOrder: number): SubItemField {
  return {
    description: "",
    quantity: 1,
    unitPrice: 0,
    sortOrder,
    children: [],
  };
}

function SubItemRow({
  name,
  control,
  priceOn,
  depth,
  onRemove,
}: {
  name: string;
  control: Control<unknown>;
  priceOn: "parent" | "children";
  depth: number;
  onRemove: () => void;
}) {
  const childrenPath = `${name}.children`;
  const nested =
    (useWatch({ control, name: childrenPath }) as SubItemField[] | undefined) ??
    [];
  const hasNested = nested.length > 0;
  const showLeafPrice = priceOn === "children" && !hasNested;
  const canNest = depth < MAX_SUB_ITEM_DEPTH;

  const nestedArray = useFieldArray({ control, name: childrenPath });

  return (
    <div className="space-y-2">
      <div
        className={
          showLeafPrice
            ? "grid grid-cols-[auto_1fr_72px_96px_32px] items-start gap-2"
            : "grid grid-cols-[auto_1fr_32px] items-start gap-2"
        }
      >
        <CornerDownRightIcon className="mt-2.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <LineDescriptionField
          name={`${name}.description`}
          control={control}
          placeholder="ລາຍລະອຽດ sub-item"
          compact
        />
        {showLeafPrice ? (
          <>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
              {...control.register(`${name}.quantity`, {
                valueAsNumber: true,
              })}
            />
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
              {...control.register(`${name}.unitPrice`, {
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
          onClick={onRemove}
        >
          <TrashIcon className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      {hasNested ? (
        <SubItemsEditor
          name={childrenPath}
          control={control}
          priceOn={priceOn}
          depth={depth + 1}
        />
      ) : null}

      {canNest && !hasNested ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => nestedArray.append(emptySubItem(0))}
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          ເພີ່ມ sub-item ຊັ້ນຍ່ອຍ
        </Button>
      ) : null}
    </div>
  );
}

function SubItemsEditor({
  name,
  control,
  priceOn,
  depth,
}: {
  name: string;
  control: Control<unknown>;
  priceOn: "parent" | "children";
  depth: number;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div
      className="space-y-2 border-muted border-l-2 pl-3"
      style={{ marginLeft: depth > 1 ? 12 : 16 }}
    >
      {fields.map((field, childIdx) => (
        <SubItemRow
          key={field.id}
          name={`${name}.${childIdx}`}
          control={control}
          priceOn={priceOn}
          depth={depth}
          onRemove={() => remove(childIdx)}
        />
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => append(emptySubItem(fields.length))}
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
  const childrenArray = useFieldArray({ control, name: childrenPath });

  return (
    <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
      <div
        className={
          priceOnChildren
            ? "grid grid-cols-[1fr_40px] items-start gap-2"
            : "grid grid-cols-[1fr_80px_120px_40px] items-start gap-2"
        }
      >
        <LineDescriptionField
          name={`${linePath}.description`}
          control={control}
          placeholder="ຄໍາອະທິບາຍ"
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
          depth={1}
        />
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => childrenArray.append(emptySubItem(0))}
        >
          <PlusIcon className="mr-1 h-3 w-3" />
          ເພີ່ມ sub-item
        </Button>
      )}
    </div>
  );
}

export function LineItemsEditor({ name, control, currency = "LAK" }: Props) {
  const { fields, append, remove, replace } = useFieldArray({ control, name });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watchedLines =
    (useWatch({ control, name }) as LineField[] | undefined) ?? [];

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

  const importFromJsonFile = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.error("ອ່ານໄຟລ໌ບໍ່ສຳເລັດ");
      return;
    }

    let doc: LineItemsJson;
    try {
      doc = parseLineItemsJsonText(text);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid JSON";
      toast.error(`JSON ບໍ່ຖືກຕ້ອງ: ${message}`);
      return;
    }

    const imported = toFormLinesFromJson(doc, fields.length);
    let mode: "append" | "replace" = "append";

    if (fields.length > 0) {
      const replaceAll = await confirm({
        title: "ນຳເຂົ້າລາຍການຈາກ JSON",
        description: `ພົບ ${imported.length} ລາຍການ. ກົດ "ແທນທີ່ທັງໝົດ" ເພື່ອລຶບລາຍການເກົ່າ, ຫຼືກົດຍົກເລີກເພື່ອເພີ່ມຕໍ່.`,
        actionText: "ແທນທີ່ທັງໝົດ",
        ActionProps: { variant: "destructive" },
      });
      mode = replaceAll ? "replace" : "append";
    }

    if (mode === "replace") {
      replace(toFormLinesFromJson(doc, 0));
      toast.success(`ແທນທີ່ດ້ວຍ ${imported.length} ລາຍການ`);
      return;
    }

    for (const line of imported) append(line);
    toast.success(`ເພີ່ມ ${imported.length} ລາຍການ`);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_80px_120px_40px] gap-2 font-medium text-muted-foreground text-sm">
        <span>ລາຍການ</span>
        <span className="text-right">ຈໍານວນ</span>
        <span className="text-right">ລາຄາ/ໜ່ວຍ</span>
        <span />
      </div>

      <div className="flex flex-col gap-3">
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

      <div className="flex flex-wrap items-center gap-2">
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadLineItemsJsonTemplate()}
        >
          <FileDownIcon className="mr-1 h-4 w-4" />
          ດາວໂຫຼດ template JSON
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUpIcon className="mr-1 h-4 w-4" />
          ອັບໂຫຼດ JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void importFromJsonFile(file);
          }}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        ດາວໂຫຼດ template → ແກ້ໄຂລາຍການ → ອັບໂຫຼດ JSON ເພື່ອເພີ່ມ ຫຼື ແທນທີ່ລາຍການ
      </p>

      <div className="border-t pt-2 text-right font-semibold text-sm">
        ລວມ: {currency} {total.toLocaleString()}
      </div>
    </div>
  );
}

export type { LineField, SubItemField };
