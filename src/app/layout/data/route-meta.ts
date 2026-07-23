import type { LinkProps } from "@tanstack/react-router";

export type RouteMeta = {
  /** Display label shown in the breadcrumb trail. */
  label: string;
  /** Parent route id used to build the breadcrumb chain. */
  parent?: string;
};

/**
 * Maps a TanStack route id (the `path` pattern) to breadcrumb metadata.
 * `parent` references another concrete route id so we can build a trail even
 * for routes that are not physically nested (e.g. `/app/users/$id/edit`).
 */
export const routeMeta: Record<string, RouteMeta> = {
  "/app/dashboard": { label: "ແຜງຄວບຄຸມ" },
  "/app/distribution": { label: "ຈ່າຍແຈກແອັບ" },
  "/d/$token": { label: "ດາວໂຫຼດ" },
  "/app/leads": { label: "ຄຳຂໍໃບສະເໜີລາຄາ" },
  "/app/leads/$id": {
    label: "ລາຍລະອຽດຄຳຂໍ",
    parent: "/app/leads",
  },
  "/app/customers": { label: "ລູກຄ້າ" },
  "/app/customers/create": {
    label: "ສ້າງລູກຄ້າ",
    parent: "/app/customers",
  },
  "/app/customers/$id/edit": {
    label: "ແກ້ໄຂລູກຄ້າ",
    parent: "/app/customers",
  },
  "/app/quotations": { label: "ໃບສະເໜີລາຄາ" },
  "/app/quotations/create": {
    label: "ສ້າງໃບສະເໜີລາຄາ",
    parent: "/app/quotations",
  },
  "/app/quotations/$id/edit": {
    label: "ແກ້ໄຂໃບສະເໜີລາຄາ",
    parent: "/app/quotations",
  },
  "/app/invoices": { label: "ໃບເກັບເງິນ" },
  "/app/invoices/create": {
    label: "ສ້າງໃບເກັບເງິນ",
    parent: "/app/invoices",
  },
  "/app/invoices/$id/edit": {
    label: "ແກ້ໄຂໃບເກັບເງິນ",
    parent: "/app/invoices",
  },
  "/app/receipts": { label: "ໃບຮັບເງິນ" },
  "/app/roles": { label: "ບົດບາດ" },
  "/app/roles/create": {
    label: "ສ້າງບົດບາດ",
    parent: "/app/roles",
  },
  "/app/roles/$id/edit": {
    label: "ແກ້ໄຂບົດບາດ",
    parent: "/app/roles",
  },
  "/app/users": { label: "ຜູ້ໃຊ້" },
  "/app/users/create": {
    label: "ສ້າງຜູ້ໃຊ້",
    parent: "/app/users",
  },
  "/app/users/$id/edit": {
    label: "ແກ້ໄຂຜູ້ໃຊ້",
    parent: "/app/users",
  },
  "/app/audit": { label: "ບັນທຶກການກວດກາ" },
  "/app/audit/$id": {
    label: "ລາຍລະອຽດການກວດກາ",
    parent: "/app/audit",
  },
  "/app/profile": { label: "ໂປຣໄຟລ໌" },
  "/app/settings": { label: "ການຕັ້ງຄ່າ" },
};

export const HOME_ROUTE = "/app/dashboard" satisfies LinkProps["to"];
