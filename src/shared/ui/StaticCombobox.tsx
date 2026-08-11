import { Check, ChevronsUpDown } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/kit";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function StaticCombobox({
  value,
  onValueChange,
  options,
  placeholder = "ເລືອກ...",
  searchPlaceholder = "ຄົ້ນຫາ...",
  emptyLabel = "ບໍ່ພົບລາຍການ",
  className,
  disabled,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    e.stopPropagation();
    el.scrollTop += e.deltaY;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  const showCustomOption =
    search.trim().length > 0 &&
    !options.some((opt) => opt.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[60] w-[var(--radix-popover-trigger-width)] p-0"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList ref={listRef} onWheel={handleWheel}>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onValueChange(opt);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {opt}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === opt ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
              {showCustomOption ? (
                <CommandItem
                  value={search.trim()}
                  onSelect={() => {
                    onValueChange(search.trim());
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  ໃຊ້ &quot;{search.trim()}&quot;
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
