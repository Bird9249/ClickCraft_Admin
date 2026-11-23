import type { LineInputDTO } from "./contracts";

type QuotationForInvoice = {
  number: string;
  total: number;
};

type MilestoneForInvoice = {
  percent: number;
  label?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Invoice lines from a quotation milestone.
 * One billable row named after the milestone — not the QT line items.
 */
export function invoiceLinesFromQuotation(
  qt: QuotationForInvoice,
  milestone: MilestoneForInvoice,
): LineInputDTO[] {
  const milestoneTotal = Math.round((qt.total * milestone.percent) / 100);
  const label = milestone.label?.trim() || `Milestone ${milestone.percent}%`;

  return [
    {
      description: `<p>${escapeHtml(label)}</p>`,
      quantity: 1,
      unitPrice: milestoneTotal,
      sortOrder: 0,
      priceOn: "parent",
      children: [],
    },
  ];
}
