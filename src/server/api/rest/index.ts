import { Elysia } from "elysia";
import { auditRoutes } from "@/modules/audit/api";
import { authRoutes } from "@/modules/auth/api";
import { customersRoutes } from "@/modules/customers/api";
import { dashboardRoutes } from "@/modules/dashboard/api";
import { financeRoutes } from "@/modules/finance/api";
import { leadsRoutes } from "@/modules/leads/api";
import { rolesRoutes } from "@/modules/roles/api";
import { uploadRoutes } from "@/modules/upload/api";
import { usersRoutes } from "@/modules/users/api";

export function createRestRoutes() {
  return new Elysia()
    .use(authRoutes)
    .use(usersRoutes)
    .use(rolesRoutes)
    .use(auditRoutes)
    .use(uploadRoutes)
    .use(customersRoutes)
    .use(financeRoutes)
    .use(leadsRoutes)
    .use(dashboardRoutes);
}
