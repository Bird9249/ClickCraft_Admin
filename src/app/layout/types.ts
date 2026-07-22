import type { LinkProps } from "@tanstack/react-router";
import type { PermissionId } from "@/modules/roles/domain/contracts/permissions";

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  requiredPermissions?: PermissionId[];
};

type NavLink = BaseNavItem & {
  url: LinkProps["to"] | (string & {});
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps["to"] | (string & {}) })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title: string;
  requiredPermissions?: PermissionId[];
  items: NavItem[];
};

type SidebarData = {
  navGroups: NavGroup[];
};

export type { NavCollapsible, NavGroup, NavItem, NavLink, SidebarData };
