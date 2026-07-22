import { RequirePermissions } from "@/modules/auth/presentation/ui/RequirePermissions";
import { LazyPage } from "@/shared/ui/LazyPage";
import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { lazy } from "react";

const RootLayout = lazy(() =>
  import("./layout/RootLayout").then((module) => ({
    default: module.RootLayout,
  })),
);
const ErrorBoundary = lazy(() =>
  import("./error/ErrorBoundary").then((module) => ({
    default: module.ErrorBoundary,
  })),
);
const AuthLayout = lazy(() =>
  import("./layout/AuthLayout").then((module) => ({
    default: module.AuthLayout,
  })),
);

const LoginPage = lazy(() =>
  import("@/modules/auth/presentation/pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const AuthenticatedLayout = lazy(() =>
  import("./layout/AuthenticatedLayout").then((module) => ({
    default: module.AuthenticatedLayout,
  })),
);
const DashboardPage = lazy(() =>
  import("@/modules/dashboard/presentation/pages/DashboardPage").then(
    (module) => ({
      default: module.DashboardPage,
    }),
  ),
);
const RolesPage = lazy(() =>
  import("@/modules/roles/presentation/pages/RolesPage").then((module) => ({
    default: module.RolesPage,
  })),
);
const RoleCreatePage = lazy(() =>
  import("@/modules/roles/presentation/pages/RoleCreatePage").then(
    (module) => ({
      default: module.RoleCreatePage,
    }),
  ),
);
const RoleEditPage = lazy(() =>
  import("@/modules/roles/presentation/pages/RoleEditPage").then((module) => ({
    default: module.RoleEditPage,
  })),
);
const AuditPage = lazy(() =>
  import("@/modules/audit/presentation/pages/AuditPage").then((module) => ({
    default: module.AuditPage,
  })),
);
const AuditDetailPage = lazy(() =>
  import("@/modules/audit/presentation/pages/AuditDetailPage").then(
    (module) => ({
      default: module.AuditDetailPage,
    }),
  ),
);
const UsersPage = lazy(() =>
  import("@/modules/users/presentation/pages/UsersPage").then((module) => ({
    default: module.UsersPage,
  })),
);
const UserCreatePage = lazy(() =>
  import("@/modules/users/presentation/pages/UserCreatePage").then(
    (module) => ({
      default: module.UserCreatePage,
    }),
  ),
);
const UserEditPage = lazy(() =>
  import("@/modules/users/presentation/pages/UserEditPage").then((module) => ({
    default: module.UserEditPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/modules/auth/presentation/pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/modules/settings/presentation/pages/SettingsPage").then(
    (module) => ({
      default: module.SettingsPage,
    }),
  ),
);
const Forbidden = lazy(() =>
  import("./error/Forbidden").then((module) => ({
    default: module.Forbidden,
  })),
);

const LeadsPage = lazy(() =>
  import("@/modules/leads/presentation/pages/LeadsPage").then((module) => ({
    default: module.LeadsPage,
  })),
);
const LeadDetailPage = lazy(() =>
  import("@/modules/leads/presentation/pages/LeadDetailPage").then(
    (module) => ({ default: module.LeadDetailPage }),
  ),
);

const CustomersPage = lazy(() =>
  import("@/modules/customers/presentation/pages/CustomersPage").then(
    (module) => ({ default: module.CustomersPage }),
  ),
);
const CustomerCreatePage = lazy(() =>
  import(
    "@/modules/customers/presentation/pages/CustomerCreatePage"
  ).then((module) => ({ default: module.CustomerCreatePage })),
);
const CustomerEditPage = lazy(() =>
  import("@/modules/customers/presentation/pages/CustomerEditPage").then(
    (module) => ({ default: module.CustomerEditPage }),
  ),
);

const QuotationsPage = lazy(() =>
  import("@/modules/finance/presentation/pages/QuotationsPage").then(
    (module) => ({ default: module.QuotationsPage }),
  ),
);
const QuotationCreatePage = lazy(() =>
  import(
    "@/modules/finance/presentation/pages/QuotationCreatePage"
  ).then((module) => ({ default: module.QuotationCreatePage })),
);
const QuotationEditPage = lazy(() =>
  import("@/modules/finance/presentation/pages/QuotationEditPage").then(
    (module) => ({ default: module.QuotationEditPage }),
  ),
);

const InvoicesPage = lazy(() =>
  import("@/modules/finance/presentation/pages/InvoicesPage").then(
    (module) => ({ default: module.InvoicesPage }),
  ),
);
const InvoiceCreatePage = lazy(() =>
  import(
    "@/modules/finance/presentation/pages/InvoiceCreatePage"
  ).then((module) => ({ default: module.InvoiceCreatePage })),
);
const InvoiceEditPage = lazy(() =>
  import("@/modules/finance/presentation/pages/InvoiceEditPage").then(
    (module) => ({ default: module.InvoiceEditPage }),
  ),
);

const ReceiptsPage = lazy(() =>
  import("@/modules/finance/presentation/pages/ReceiptsPage").then(
    (module) => ({ default: module.ReceiptsPage }),
  ),
);

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorBoundary,
  beforeLoad: ({ location }) => {
    if (
      location.pathname === "/" ||
      location.pathname === "/app" ||
      location.pathname === "/app/"
    ) {
      throw redirect({ to: "/app/dashboard", replace: true });
    }
  },
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/login",
  component: LoginPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AuthenticatedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: () => (
    <LazyPage>
      <DashboardPage />
    </LazyPage>
  ),
});

const rolesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/roles",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:ban"]}>
      <LazyPage>
        <RolesPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const roleCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/roles/create",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:ban"]}>
      <LazyPage>
        <RoleCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const roleEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/roles/$id/edit",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:ban"]}>
      <LazyPage>
        <RoleEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const auditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit",
  component: () => (
    <RequirePermissions all={["audit:read"]}>
      <LazyPage>
        <AuditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const auditDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit/$id",
  component: () => (
    <RequirePermissions all={["audit:read"]}>
      <LazyPage>
        <AuditDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users",
  component: () => (
    <RequirePermissions all={["users:read"]}>
      <LazyPage>
        <UsersPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const userCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/create",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:create"]}>
      <LazyPage>
        <UserCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const userEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/$id/edit",
  component: () => (
    <RequirePermissions all={["users:read"]} any={["users:update"]}>
      <LazyPage>
        <UserEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: () => (
    <LazyPage>
      <ProfilePage />
    </LazyPage>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: () => (
    <LazyPage>
      <SettingsPage />
    </LazyPage>
  ),
});

const leadsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/leads",
  component: () => (
    <RequirePermissions all={["leads:read"]}>
      <LazyPage>
        <LeadsPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const leadDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/leads/$id",
  component: () => (
    <RequirePermissions all={["leads:read"]}>
      <LazyPage>
        <LeadDetailPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const customersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers",
  component: () => (
    <RequirePermissions all={["customers:read"]}>
      <LazyPage>
        <CustomersPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const customerCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers/create",
  component: () => (
    <RequirePermissions all={["customers:read"]} any={["customers:create"]}>
      <LazyPage>
        <CustomerCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const customerEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/customers/$id/edit",
  component: () => (
    <RequirePermissions all={["customers:read"]} any={["customers:update"]}>
      <LazyPage>
        <CustomerEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const quotationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/quotations",
  component: () => (
    <RequirePermissions all={["finance:read"]}>
      <LazyPage>
        <QuotationsPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const quotationCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/quotations/create",
  component: () => (
    <RequirePermissions all={["finance:read"]} any={["finance:write"]}>
      <LazyPage>
        <QuotationCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const quotationEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/quotations/$id/edit",
  component: () => (
    <RequirePermissions all={["finance:read"]} any={["finance:write"]}>
      <LazyPage>
        <QuotationEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const invoicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/invoices",
  component: () => (
    <RequirePermissions all={["finance:read"]}>
      <LazyPage>
        <InvoicesPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const invoiceCreateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/invoices/create",
  component: () => (
    <RequirePermissions all={["finance:read"]} any={["finance:write"]}>
      <LazyPage>
        <InvoiceCreatePage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const invoiceEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/invoices/$id/edit",
  component: () => (
    <RequirePermissions all={["finance:read"]} any={["finance:write"]}>
      <LazyPage>
        <InvoiceEditPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const receiptsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/receipts",
  component: () => (
    <RequirePermissions all={["finance:read"]}>
      <LazyPage>
        <ReceiptsPage />
      </LazyPage>
    </RequirePermissions>
  ),
});

const forbiddenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/errors/forbidden",
  component: () => (
    <LazyPage>
      <Forbidden />
    </LazyPage>
  ),
});

export const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([loginRoute]),
  appRoute.addChildren([
    dashboardRoute,
    rolesRoute,
    roleCreateRoute,
    roleEditRoute,
    usersRoute,
    userCreateRoute,
    userEditRoute,
    auditRoute,
    auditDetailRoute,
    profileRoute,
    settingsRoute,
    leadsRoute,
    leadDetailRoute,
    customersRoute,
    customerCreateRoute,
    customerEditRoute,
    quotationsRoute,
    quotationCreateRoute,
    quotationEditRoute,
    invoicesRoute,
    invoiceCreateRoute,
    invoiceEditRoute,
    receiptsRoute,
  ]),
  forbiddenRoute,
]);
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
