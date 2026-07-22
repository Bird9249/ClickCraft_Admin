import { PlusIcon, TrashIcon } from "lucide-react";
import type { Control } from "react-hook-form";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button, Input } from "@/components/kit";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleTotalPercent,
} from "@/modules/finance/domain/payment-schedule";

export type PaymentScheduleFormItem = {
  percent: number;
  label: string;
  condition: string;
  dueDays?: number | null;
};

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name?: string;
  readOnly?: boolean;
};

export function PaymentScheduleEditor({
  control,
  name = "paymentSchedule",
  readOnly = false,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  const watched = useWatch({ control, name }) as
    | PaymentScheduleFormItem[]
    | undefined;
  const total = paymentScheduleTotalPercent(watched ?? []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm">
            {"\u0ec0\u0e87\u0eb7\u0ec8\u0ead\u0e99\u0ec4\u0e82\u0e81\u0eb2\u0e99\u0e8a\u0eb3\u0ea5\u0eb0\u0ec0\u0e87\u0eb4\u0e99"}
          </h3>
          <p className="text-muted-foreground text-xs">
            {"\u0e95\u0eb1\u0ec9\u0e87\u0e84\u0ec8\u0eb2 % / \u0e8a\u0eb7\u0ec8\u0e87\u0ea7\u0e94 / \u0ec0\u0e87\u0eb7\u0ec8\u0ead\u0e99\u0ec4\u0e82\u0e81\u0eb2\u0e99\u0e88\u0ec8\u0eb2\u0e22\u0ec1\u0e95\u0ec8\u0ea5\u0eb0\u0e87\u0ea7\u0e94"}
          </p>
        </div>
        <span
          className={
            total === 100
              ? "font-mono text-muted-foreground text-xs"
              : "font-mono text-destructive text-xs"
          }
        >
          {total}% / 100%
        </span>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/20 p-3 md:grid-cols-12"
          >
            <div className="md:col-span-2">
              <label className="mb-1 block text-muted-foreground text-xs">
                %
              </label>
              <Controller
                control={control}
                name={`${name}.${index}.percent`}
                render={({ field: f }) => (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    disabled={readOnly}
                    value={f.value ?? 0}
                    onChange={(e) => f.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
            <div className="md:col-span-4">
              <label className="mb-1 block text-muted-foreground text-xs">
                Label
              </label>
              <Controller
                control={control}
                name={`${name}.${index}.label`}
                render={({ field: f }) => (
                  <Input
                    disabled={readOnly}
                    value={f.value ?? ""}
                    onChange={f.onChange}
                  />
                )}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-muted-foreground text-xs">
                Due +days
              </label>
              <Controller
                control={control}
                name={`${name}.${index}.dueDays`}
                render={({ field: f }) => (
                  <Input
                    type="number"
                    min={0}
                    disabled={readOnly}
                    value={f.value ?? 0}
                    onChange={(e) => f.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
            <div className="flex items-end md:col-span-4">
              {readOnly || fields.length <= 1 ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(index)}
                >
                  <TrashIcon className="size-4" />
                  {"\u0ea5\u0eb6\u0e9a"}
                </Button>
              )}
            </div>
            <div className="md:col-span-12">
              <label className="mb-1 block text-muted-foreground text-xs">
                {"\u0ec0\u0e87\u0eb7\u0ec8\u0ead\u0e99\u0ec4\u0e82\u0e81\u0eb2\u0e99\u0e8a\u0eb3\u0ea5\u0eb0"}
              </label>
              <Controller
                control={control}
                name={`${name}.${index}.condition`}
                render={({ field: f }) => (
                  <Textarea
                    disabled={readOnly}
                    rows={2}
                    value={f.value ?? ""}
                    onChange={f.onChange}
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {readOnly ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              percent: 0,
              label: `M${fields.length + 1}`,
              condition: "",
              dueDays: 0,
            })
          }
        >
          <PlusIcon className="size-4" />
          {"\u0ec0\u0e9e\u0eb5\u0ec8\u0ea1\u0e87\u0ea7\u0e94"}
        </Button>
      )}

      {total !== 100 ? (
        <p className="text-destructive text-xs">
          Milestone percentages must total 100%
        </p>
      ) : null}

      {!readOnly && fields.length === 0 ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            DEFAULT_PAYMENT_SCHEDULE.forEach((item) => append({ ...item }))
          }
        >
          Reset 40/30/30
        </Button>
      ) : null}
    </div>
  );
}
