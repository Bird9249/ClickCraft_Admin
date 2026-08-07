import type { LineInputDTO } from "../contracts";
import { lineGroupAmount } from "../line-pricing";

export interface LineInput {
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  priceOn?: "parent" | "children";
  children?: Array<{ quantity: number; unitPrice: number }>;
}

export interface TotalsResult {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function computeTotals(lines: LineInputDTO[] | LineInput[]): TotalsResult {
  let subtotal = 0;
  let taxAmount = 0;

  for (const line of lines) {
    const amount =
      "children" in line && Array.isArray(line.children)
        ? lineGroupAmount(line as LineInputDTO)
        : line.quantity * line.unitPrice;
    subtotal += amount;
    taxAmount += line.taxAmount ?? 0;
  }

  return {
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
  };
}

export function lineAmount(line: LineInput): number {
  return line.quantity * line.unitPrice;
}
