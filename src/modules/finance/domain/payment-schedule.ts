export type PaymentScheduleItem = {
  percent: number;
  label: string;
  condition: string;
  dueDays?: number | null;
};

/** Default 40/30/30 terms — same copy as Website quotation print */
export const DEFAULT_PAYMENT_SCHEDULE: PaymentScheduleItem[] = [
  {
    percent: 40,
    label: "ງວດ 1 (ມັດຈຳ 40%)",
    condition: "ຊຳລະກ່ອນເລີ່ມດຳເນີນໂຄງການ (ເລີ່ມຂຶ້ນໂຄງສ້າງ ແລະ ອອກແບບ UI/UX)",
    dueDays: 0,
  },
  {
    percent: 30,
    label: "ງວດ 2 (30%)",
    condition: "ຊຳລະຫຼັງຈາກລູກຄ້າອະນຸມັດໜ້າຕາລະບົບທັງໝົດ (Design Approval)",
    dueDays: 30,
  },
  {
    percent: 30,
    label: "ງວດ 3 (30%)",
    condition: "ຊຳລະຫຼັງຈາກທົດສອບລະບົບ, ຕິດຕັ້ງຂຶ້ນ Server ຈິງ ແລະ ສົ່ງມອບວຽກ",
    dueDays: 60,
  },
];

export function paymentScheduleTotalPercent(
  items: Array<{ percent: number }>,
): number {
  return items.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
}

export function normalizePaymentSchedule(
  value: unknown,
): PaymentScheduleItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_PAYMENT_SCHEDULE.map((item) => ({ ...item }));
  }
  return value.map((raw, index) => {
    const item = (raw ?? {}) as Partial<PaymentScheduleItem>;
    const fallback =
      DEFAULT_PAYMENT_SCHEDULE[index] ?? DEFAULT_PAYMENT_SCHEDULE[0]!;
    return {
      percent: Number(item.percent) || 0,
      label: String(item.label ?? fallback.label),
      condition: String(item.condition ?? fallback.condition ?? ""),
      dueDays:
        item.dueDays == null
          ? (fallback.dueDays ?? null)
          : Number(item.dueDays),
    };
  });
}
