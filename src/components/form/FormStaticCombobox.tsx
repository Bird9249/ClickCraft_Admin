import type * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import { StaticCombobox } from "@/shared/ui/StaticCombobox";

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FormStaticCombobox({
  name,
  label,
  hint,
  requiredMark,
  options,
  placeholder,
  searchPlaceholder,
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
          <StaticCombobox
            value={field.value ?? ""}
            onValueChange={field.onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            disabled={disabled}
            className={className}
            aria-invalid={!!error}
          />
        )}
      />
    </Field>
  );
}
