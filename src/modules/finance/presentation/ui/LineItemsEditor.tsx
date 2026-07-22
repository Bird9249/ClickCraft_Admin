import { PlusIcon, TrashIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/kit";

type LineField = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
};

type Props = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  currency?: string;
};

export function LineItemsEditor({ name, control, currency = "LAK" }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name });

  const total = fields.reduce(
    (acc, f) => {
      const line = f as unknown as LineField;
      return acc + (line.quantity || 0) * (line.unitPrice || 0);
    },
    0,
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_80px_120px_40px] gap-2 text-sm font-medium text-muted-foreground">
        <span>ລາຍການ</span>
        <span className="text-right">ຈໍານວນ</span>
        <span className="text-right">ລາຄາ/ໜ່ວຍ</span>
        <span />
      </div>

      {fields.map((field, idx) => {
        const line = field as unknown as LineField;
        return (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_80px_120px_40px] gap-2 items-center"
          >
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="ຄໍາອະທິບາຍ"
              defaultValue={line.description}
              {...control.register(`${name}.${idx}.description`)}
            />
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
              defaultValue={line.quantity}
              {...control.register(`${name}.${idx}.quantity`, {
                valueAsNumber: true,
              })}
            />
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
              defaultValue={line.unitPrice}
              {...control.register(`${name}.${idx}.unitPrice`, {
                valueAsNumber: true,
              })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => remove(idx)}
            >
              <TrashIcon className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({ description: "", quantity: 1, unitPrice: 0, sortOrder: fields.length })
        }
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        ເພີ່ມລາຍການ
      </Button>

      <div className="text-right text-sm font-semibold pt-2 border-t">
        ລວມ: {currency} {total.toLocaleString()}
      </div>
    </div>
  );
}
