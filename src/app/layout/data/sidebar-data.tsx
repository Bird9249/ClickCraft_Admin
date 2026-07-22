import {
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  Receipt,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "ທົ່ວໄປ",
      items: [
        {
          title: "ແຜງຄວບຄຸມ",
          url: "/app/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "ການເງິນ",
      items: [
        {
          title: "ຄຳຂໍໃບສະເໜີລາຄາ",
          url: "/app/leads",
          icon: Inbox,
          requiredPermissions: ["leads:read"],
        },
        {
          title: "ລູກຄ້າ",
          url: "/app/customers",
          icon: Building2,
          requiredPermissions: ["customers:read"],
        },
        {
          title: "ໃບສະເໜີລາຄາ",
          url: "/app/quotations",
          icon: ScrollText,
          requiredPermissions: ["finance:read"],
        },
        {
          title: "ໃບເກັບເງິນ",
          url: "/app/invoices",
          icon: FileText,
          requiredPermissions: ["finance:read"],
        },
        {
          title: "ໃບຮັບເງິນ",
          url: "/app/receipts",
          icon: Receipt,
          requiredPermissions: ["finance:read"],
        },
      ],
    },
    {
      title: "ການຄວບຄຸມການເຂົ້າເຖິງ",
      items: [
        {
          title: "ບົດບາດ",
          url: "/app/roles",
          icon: UserCog,
          requiredPermissions: ["users:read"],
        },
        {
          title: "ຜູ້ໃຊ້",
          url: "/app/users",
          icon: Users,
          requiredPermissions: ["users:read"],
        },
        {
          title: "ບັນທຶກການກວດກາ",
          url: "/app/audit",
          icon: ShieldCheck,
          requiredPermissions: ["audit:read"],
        },
      ],
    },
  ],
};
