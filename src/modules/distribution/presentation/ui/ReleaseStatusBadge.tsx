import { Badge } from "@/components/kit";

const LABELS: Record<string, string> = {
  draft: "ຮ່າງ",
  published: "ເຜີຍແຜ່",
  archived: "ເກັບໄວ້",
};

export function ReleaseStatusBadge({ status }: { status: string }) {
  const variant =
    status === "published"
      ? "default"
      : status === "archived"
        ? "outline"
        : "secondary";
  return <Badge variant={variant}>{LABELS[status] ?? status}</Badge>;
}
