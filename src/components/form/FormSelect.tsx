import type * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  placeholder?: string;
  options: FormSelectOption[];
  disabled?: boolean;
  className?: string;
};

export function FormSelect({
  name,
  label,
  hint,
  requiredMark,
  placeholder,
  options,
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
          <Select
            value={field.value ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={className}
              id={name}
              aria-invalid={!!error}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}
