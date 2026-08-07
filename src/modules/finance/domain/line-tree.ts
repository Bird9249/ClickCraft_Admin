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

export function buildLineTree(flat: FlatLineRow[]): NestedLineOutput[] {
  const childrenByParent = new Map<string, FlatLineRow[]>();

  for (const row of flat) {
    if (!row.parentLineId) continue;
    const siblings = childrenByParent.get(row.parentLineId) ?? [];
    siblings.push(row);
    childrenByParent.set(row.parentLineId, siblings);
  }

  return flat
    .filter((row) => !row.parentLineId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((parent) => {
      const childRows = (childrenByParent.get(parent.id) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const priceOn = resolvePriceOn(parent.amount, childRows, parent.priceOn);

      return {
        id: parent.id,
        description: parent.description,
        quantity: parent.quantity,
        unitPrice: parent.unitPrice,
        amount: parent.amount,
        sortOrder: parent.sortOrder,
        priceOn,
        children: childRows.map((child) => ({
          description: child.description,
          quantity: child.quantity,
          unitPrice: child.unitPrice,
          sortOrder: child.sortOrder,
        })),
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
    children: line.children.map((child) => ({
      description: child.description,
      quantity: child.quantity,
      unitPrice: child.unitPrice,
      sortOrder: child.sortOrder,
    })),
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

    for (const child of parent.children) {
      const childAmount = child.quantity * child.unitPrice;
      rows.push({
        description: child.description,
        quantity: child.quantity,
        unitPrice: child.unitPrice,
        amount: priceOnChildren ? childAmount : 0,
        depth: 1,
        isGroup: false,
        isSubItem: true,
        showSubItemPrice: priceOnChildren,
      });
    }
  }

  return rows;
}
