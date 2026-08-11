import type * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  currency?: string;
  min?: number;
  disabled?: boolean;
  className?: string;
};

export function FormAmountInput({
  name,
  label,
  hint,
  requiredMark,
  currency = "LAK",
  min = 1,
  disabled,
  className,
}: Props) {
  const { control } = useFormContext();
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <InputGroup className={className}>
            <InputGroupInput
              id={name}
              type="number"
              min={min}
              disabled={disabled}
              aria-invalid={!!error}
              value={field.value ?? ""}
              onChange={(e) => {
                const next = e.target.value;
                field.onChange(next === "" ? "" : Number(next));
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{currency}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        )}
      />
    </Field>
  );
}
