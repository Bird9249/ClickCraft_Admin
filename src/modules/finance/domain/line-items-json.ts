import { z } from "zod";
import { MAX_SUB_ITEM_DEPTH, subItemDepth } from "./line-pricing";

const ImportSubItemSchema: z.ZodType<{
  description: string;
  quantity: number;
  unitPrice: number;
  children: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    children: unknown[];
  }>;
}> = z.lazy(() =>
  z.object({
    description: z.string().trim().min(1, "description is required"),
    quantity: z.coerce.number().int().min(1).default(1),
    unitPrice: z.coerce.number().int().min(0).default(0),
    children: z.array(ImportSubItemSchema).default([]),
  }),
);

const ImportLineSchema = z
  .object({
    description: z.string().trim().min(1, "description is required"),
    quantity: z.coerce.number().int().min(1).default(1),
    unitPrice: z.coerce.number().int().min(0).default(0),
    priceOn: z.enum(["parent", "children"]).default("parent"),
    children: z.array(ImportSubItemSchema).default([]),
  })
  .superRefine((line, ctx) => {
    const depth = subItemDepth(line.children);
    if (depth > MAX_SUB_ITEM_DEPTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["children"],
        message: `Sub-items can nest at most ${MAX_SUB_ITEM_DEPTH} levels`,
      });
    }
  });

export const LineItemsJsonSchema = z.object({
  version: z.literal(1).default(1),
  lines: z.array(ImportLineSchema).min(1, "lines must not be empty"),
});

export type LineItemsJson = z.infer<typeof LineItemsJsonSchema>;

export type FormLineFromJson = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  priceOn: "parent" | "children";
  children: FormSubItemFromJson[];
};

export type FormSubItemFromJson = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  children: FormSubItemFromJson[];
};

function toFormSubItems(
  items: z.infer<typeof ImportSubItemSchema>[],
): FormSubItemFromJson[] {
  return items.map((item, index) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    sortOrder: index,
    children: toFormSubItems(item.children ?? []),
  }));
}

export function toFormLinesFromJson(
  doc: LineItemsJson,
  startSortOrder = 0,
): FormLineFromJson[] {
  return doc.lines.map((line, index) => ({
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    sortOrder: startSortOrder + index,
    priceOn: line.priceOn ?? "parent",
    children: toFormSubItems(line.children ?? []),
  }));
}

/** Accepts full document `{ version, lines }` or a bare `lines` array. */
export function parseLineItemsJson(raw: unknown): LineItemsJson {
  if (Array.isArray(raw)) {
    return LineItemsJsonSchema.parse({ version: 1, lines: raw });
  }
  return LineItemsJsonSchema.parse(raw);
}

export function parseLineItemsJsonText(text: string): LineItemsJson {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON");
  }
  return parseLineItemsJson(raw);
}

export const LINE_ITEMS_JSON_TEMPLATE: LineItemsJson = {
  version: 1,
  lines: [
    {
      description: "1) Simple line — price on parent (no children)",
      quantity: 1,
      unitPrice: 1_000_000,
      priceOn: "parent",
      children: [],
    },
    {
      description: "2) Grouped line — price on children (1 level)",
      quantity: 1,
      unitPrice: 0,
      priceOn: "children",
      children: [
        {
          description: "Child A",
          quantity: 1,
          unitPrice: 500_000,
          children: [],
        },
        {
          description: "Child B",
          quantity: 2,
          unitPrice: 250_000,
          children: [],
        },
      ],
    },
    {
      description: "3) Nested children example — price on leaf children (2 levels max)",
      quantity: 1,
      unitPrice: 0,
      priceOn: "children",
      children: [
        {
          description: "Child group (no price — has nested children)",
          quantity: 1,
          unitPrice: 0,
          children: [
            {
              description: "Grandchild / leaf item",
              quantity: 1,
              unitPrice: 300_000,
              children: [],
            },
            {
              description: "Another leaf item",
              quantity: 3,
              unitPrice: 100_000,
              children: [],
            },
          ],
        },
        {
          description: "Sibling child without nesting",
          quantity: 1,
          unitPrice: 200_000,
          children: [],
        },
      ],
    },
  ],
};

export function lineItemsJsonTemplateText(): string {
  return `${JSON.stringify(LINE_ITEMS_JSON_TEMPLATE, null, 2)}\n`;
}

export function downloadLineItemsJsonTemplate(
  filename = "line-items-template.json",
): void {
  const blob = new Blob([lineItemsJsonTemplateText()], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
