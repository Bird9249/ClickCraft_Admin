import type { LineInputDTO } from "./contracts";
import { scaleLineForMilestone } from "./line-pricing";
import { toLineInputs } from "./line-tree";

type QuotationForInvoice = {
  number: string;
  total: number;
  documentMode?: string | null;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    sortOrder: number;
    priceOn?: string | null;
    children?: QuotationForInvoice["lines"];
  }>;
};

export function invoiceLinesFromQuotation(
  qt: QuotationForInvoice,
  percent: number,
): LineInputDTO[] {
  const useAttachment =
    qt.documentMode === "attachment" || qt.lines.length === 0;

  if (useAttachment) {
    const milestoneTotal = Math.round((qt.total * percent) / 100);
    return [
      {
        description: `<p>ຕາມໃບສະເໜີລາຄາ ${qt.number}</p>`,
        quantity: 1,
        unitPrice: milestoneTotal,
        sortOrder: 0,
        priceOn: "parent",
        children: [],
      },
    ];
  }

  return toLineInputs(qt.lines).map((line) =>
    scaleLineForMilestone(line, percent),
  );
}
