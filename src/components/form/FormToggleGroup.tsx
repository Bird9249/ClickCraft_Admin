import type * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Field, useFieldError } from "@/components/form/Field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type FormToggleGroupOption = {
  label: React.ReactNode;
  value: string;
};

type Props = {
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  requiredMark?: boolean;
  options: FormToggleGroupOption[];
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
};

export function FormToggleGroup({
  name,
  label,
  hint,
  requiredMark,
  options,
  className,
  variant = "outline",
  size = "sm",
}: Props) {
  const { control } = useFormContext();
  const error = useFieldError(name);

  return (
    <Field name={name} label={label} hint={hint} requiredMark={requiredMark}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ToggleGroup
            type="single"
            variant={variant}
            size={size}
            value={field.value ?? ""}
            onValueChange={(value) => {
              if (value) field.onChange(value);
            }}
            className={className}
            aria-invalid={!!error}
          >
            {options.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
    </Field>
  );
}
