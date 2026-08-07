import type { LineInputDTO, SubItemInputDTO } from "./contracts";

export type PriceOn = "parent" | "children";

/** Max nesting under a top-level line (level 1 + level 2 sub-items). */
export const MAX_SUB_ITEM_DEPTH = 2;

export function resolvePriceOn(
  parentAmount: number,
  children: Array<{ amount: number }>,
  stored?: string | null,
): PriceOn {
  if (stored === "parent" || stored === "children") return stored;
  if (children.length === 0) return "parent";
  const childrenTotal = children.reduce((sum, c) => sum + c.amount, 0);
  return parentAmount > 0 || childrenTotal === 0 ? "parent" : "children";
}

function sumLeafAmounts(items: SubItemInputDTO[], priceOn: PriceOn): number {
  let sum = 0;
  for (const item of items) {
    const nested = item.children ?? [];
    if (priceOn === "children" && nested.length === 0) {
      sum += item.quantity * item.unitPrice;
    } else if (nested.length > 0) {
      sum += sumLeafAmounts(nested, priceOn);
    }
  }
  return sum;
}

export function lineGroupAmount(line: LineInputDTO): number {
  const children = line.children ?? [];
  if (children.length === 0) {
    return line.quantity * line.unitPrice;
  }
  if (line.priceOn === "children") {
    return sumLeafAmounts(children, "children");
  }
  return line.quantity * line.unitPrice;
}

export function parentRowValues(line: LineInputDTO) {
  const hasChildren = (line.children?.length ?? 0) > 0;
  const priceOn = line.priceOn ?? "parent";

  if (!hasChildren || priceOn === "parent") {
    const amount = line.quantity * line.unitPrice;
    return {
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount,
      priceOn: "parent" as const,
    };
  }

  return {
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    priceOn: "children" as const,
  };
}

export function subItemRowValues(
  item: SubItemInputDTO,
  priceOn: PriceOn,
  sortOrder: number,
) {
  const hasChildren = (item.children?.length ?? 0) > 0;

  if (priceOn === "children" && !hasChildren) {
    const amount = item.quantity * item.unitPrice;
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
      sortOrder,
    };
  }

  return {
    description: item.description,
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    sortOrder,
  };
}

function scaleSubItems(
  items: SubItemInputDTO[],
  factor: number,
): SubItemInputDTO[] {
  return items.map((item) => {
    const nested = item.children ?? [];
    if (nested.length > 0) {
      return {
        ...item,
        quantity: 1,
        unitPrice: 0,
        children: scaleSubItems(nested, factor),
      };
    }
    return {
      ...item,
      unitPrice: Math.round(item.unitPrice * factor),
      children: [],
    };
  });
}

export function scaleLineForMilestone(
  line: LineInputDTO,
  percent: number,
): LineInputDTO {
  const factor = percent / 100;
  if (line.priceOn === "children") {
    return {
      ...line,
      quantity: line.quantity,
      unitPrice: 0,
      children: scaleSubItems(line.children ?? [], factor),
    };
  }

  return {
    ...line,
    unitPrice: Math.round(line.unitPrice * factor),
    children: line.children ?? [],
  };
}

export function subItemDepth(items: SubItemInputDTO[], depth = 1): number {
  if (items.length === 0) return 0;
  let max = depth;
  for (const item of items) {
    const nested = item.children ?? [];
    if (nested.length > 0) {
      max = Math.max(max, subItemDepth(nested, depth + 1));
    }
  }
  return max;
}
