import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

type Props = {
  name: string;
  control: Control<unknown>;
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

export function LineDescriptionField({
  name,
  control,
  placeholder = "ຄໍາອະທິບາຍ",
  compact = false,
  className,
}: Props) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <RichTextEditor
          value={field.value ?? ""}
          onChange={field.onChange}
          placeholder={placeholder}
          compact={compact}
          className={className}
          minHeightClass={compact ? "min-h-[64px]" : "min-h-[88px]"}
        />
      )}
    />
  );
}
