import { Badge } from "@/components/kit";

const STATUS_LABEL: Record<string, string> = {
  new: "ໃໝ່",
  contacted: "ຕິດຕໍ່ແລ້ວ",
  qualified: "ມີໂອກາດ",
  converted: "ແປງແລ້ວ",
  lost: "ປິດ",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "default",
  contacted: "secondary",
  qualified: "default",
  converted: "outline",
  lost: "destructive",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
