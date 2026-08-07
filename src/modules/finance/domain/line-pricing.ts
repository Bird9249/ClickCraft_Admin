import type { LineInputDTO } from "./contracts";

export type PriceOn = "parent" | "children";

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

export function lineGroupAmount(line: LineInputDTO): number {
  const children = line.children ?? [];
  if (children.length === 0) {
    return line.quantity * line.unitPrice;
  }
  if (line.priceOn === "children") {
    return children.reduce(
      (sum, child) => sum + child.quantity * child.unitPrice,
      0,
    );
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

export function childRowValues(
  child: LineInputDTO["children"][number],
  priceOn: PriceOn,
  sortOrder: number,
) {
  if (priceOn === "children") {
    const amount = child.quantity * child.unitPrice;
    return {
      description: child.description,
      quantity: child.quantity,
      unitPrice: child.unitPrice,
      amount,
      sortOrder,
    };
  }

  return {
    description: child.description,
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    sortOrder,
  };
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
      children: (line.children ?? []).map((child) => ({
        ...child,
        unitPrice: Math.round(child.unitPrice * factor),
      })),
    };
  }

  return {
    ...line,
    unitPrice: Math.round(line.unitPrice * factor),
    children: line.children ?? [],
  };
}
