import type { LineInputDTO } from "../contracts";

type FormLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
  priceOn?: "parent" | "children";
  children?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    sortOrder?: number;
  }>;
};

export function mapFormLinesToApi(lines: FormLine[]): LineInputDTO[] {
  return lines.map((l, i) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    sortOrder: i,
    priceOn: l.priceOn ?? "parent",
    children: (l.children ?? []).map((c, j) => ({
      description: c.description,
      quantity: c.quantity ?? 1,
      unitPrice: c.unitPrice ?? 0,
      sortOrder: j,
    })),
  }));
}

export function mapApiLinesToForm(
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    sortOrder: number;
    priceOn?: "parent" | "children";
    children?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      sortOrder: number;
    }>;
  }>,
) {
  return lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    sortOrder: l.sortOrder,
    priceOn: l.priceOn ?? "parent",
    children: (l.children ?? []).map((c) => ({
      description: c.description,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      sortOrder: c.sortOrder,
    })),
  }));
}
