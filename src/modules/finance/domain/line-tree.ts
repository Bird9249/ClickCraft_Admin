import type { LineInputDTO, SubItemInputDTO } from "./contracts";
import { lineGroupAmount, resolvePriceOn } from "./line-pricing";

/** Flat row as stored in the database. */
export type FlatLineRow = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  parentLineId: string | null;
  priceOn?: string | null;
};

export type NestedLineOutput = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
  priceOn: "parent" | "children";
  children: SubItemInputDTO[];
};

function mapSubItemRows(
  allRows: FlatLineRow[],
  parentId: string,
): SubItemInputDTO[] {
  return allRows
    .filter((row) => row.parentLineId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => ({
      description: row.description,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      sortOrder: row.sortOrder,
      children: mapSubItemRows(allRows, row.id),
    }));
}

export function buildLineTree(flat: FlatLineRow[]): NestedLineOutput[] {
  return flat
    .filter((row) => !row.parentLineId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((parent) => {
      const childRows = flat.filter((row) => row.parentLineId === parent.id);
      const priceOn = resolvePriceOn(parent.amount, childRows, parent.priceOn);

      return {
        id: parent.id,
        description: parent.description,
        quantity: parent.quantity,
        unitPrice: parent.unitPrice,
        amount: parent.amount,
        sortOrder: parent.sortOrder,
        priceOn,
        children: mapSubItemRows(flat, parent.id),
      };
    });
}

export function toLineInputs(tree: NestedLineOutput[]): LineInputDTO[] {
  return tree.map((line) => ({
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    sortOrder: line.sortOrder,
    priceOn: line.priceOn,
    children: mapSubItemsToInput(line.children),
  }));
}

function mapSubItemsToInput(items: SubItemInputDTO[]): SubItemInputDTO[] {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    sortOrder: item.sortOrder,
    children: mapSubItemsToInput(item.children ?? []),
  }));
}

export type PdfLineRow = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  depth: number;
  isGroup: boolean;
  isSubItem: boolean;
  showSubItemPrice?: boolean;
};

function appendPdfRows(
  rows: PdfLineRow[],
  items: SubItemInputDTO[],
  depth: number,
  priceOn: "parent" | "children",
) {
  for (const item of items) {
    const nested = item.children ?? [];
    const hasNested = nested.length > 0;
    const showPrice = priceOn === "children" && !hasNested;
    const childAmount = item.quantity * item.unitPrice;

    rows.push({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: showPrice ? childAmount : 0,
      depth,
      isGroup: hasNested,
      isSubItem: true,
      showSubItemPrice: showPrice,
    });

    if (hasNested) {
      appendPdfRows(rows, nested, depth + 1, priceOn);
    }
  }
}

/** Flatten nested lines into PDF display rows (group header + indented sub-items). */
export function linesToPdfRows(
  flat: FlatLineRow[] | NestedLineOutput[],
): PdfLineRow[] {
  const tree =
    flat.length > 0 && "parentLineId" in flat[0]
      ? buildLineTree(flat as FlatLineRow[])
      : (flat as NestedLineOutput[]);

  const rows: PdfLineRow[] = [];

  for (const parent of tree) {
    const hasChildren = parent.children.length > 0;
    const priceOnChildren = parent.priceOn === "children" && hasChildren;
    const groupAmount = lineGroupAmount({
      description: parent.description,
      quantity: parent.quantity,
      unitPrice: parent.unitPrice,
      sortOrder: parent.sortOrder,
      priceOn: parent.priceOn,
      children: parent.children,
    });

    rows.push({
      description: parent.description,
      quantity: parent.quantity,
      unitPrice: parent.unitPrice,
      amount: priceOnChildren ? groupAmount : parent.amount,
      depth: 0,
      isGroup: hasChildren,
      isSubItem: false,
    });

    appendPdfRows(rows, parent.children, 1, parent.priceOn);
  }

  return rows;
}
