import { Link } from "@tanstack/react-router";
import symbolUrl from "@/assets/brand/symbol.webp";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/kit";

export function SidebarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="h-12 gap-2.5 hover:bg-sidebar-accent/70 data-[state=open]:bg-transparent"
        >
          <Link to="/app/dashboard">
            <img
              src={symbolUrl}
              alt=""
              aria-hidden
              className="size-8 shrink-0 object-contain"
            />
            <div className="grid min-w-0 flex-1 text-start leading-tight">
              <span className="truncate font-semibold text-[15px] tracking-tight">
                ClickCraft
              </span>
              <span className="truncate font-medium text-muted-foreground text-xs">
                Admin
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
