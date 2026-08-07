import type { LineInputDTO, SubItemInputDTO } from "../contracts";

type FormSubItem = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  sortOrder?: number;
  children?: FormSubItem[];
};

type FormLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
  priceOn?: "parent" | "children";
  children?: FormSubItem[];
};

function mapSubItemsToApi(items: FormSubItem[]): SubItemInputDTO[] {
  return items.map((item, j) => ({
    description: item.description,
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    sortOrder: item.sortOrder ?? j,
    children: mapSubItemsToApi(item.children ?? []),
  }));
}

function mapSubItemsToForm(items: SubItemInputDTO[]) {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    sortOrder: item.sortOrder,
    children: mapSubItemsToForm(item.children ?? []),
  }));
}

export function mapFormLinesToApi(lines: FormLine[]): LineInputDTO[] {
  return lines.map((l, i) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    sortOrder: i,
    priceOn: l.priceOn ?? "parent",
    children: mapSubItemsToApi(l.children ?? []),
  }));
}

export function mapApiLinesToForm(
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    sortOrder: number;
    priceOn?: "parent" | "children";
    children?: SubItemInputDTO[];
  }>,
) {
  return lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    sortOrder: l.sortOrder,
    priceOn: l.priceOn ?? "parent",
    children: mapSubItemsToForm(l.children ?? []),
  }));
}
