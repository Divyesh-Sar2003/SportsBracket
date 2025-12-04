import {
  Trophy,
  Calendar,
  Users,
  Gamepad2,
  LayoutDashboard,
  ClipboardCheck,
  Swords,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Registrations", url: "/admin/registrations", icon: ClipboardCheck },
  { title: "Participants", url: "/admin/participants", icon: Users },
  { title: "Tournaments", url: "/admin/tournaments", icon: Trophy },
  { title: "Games", url: "/admin/games", icon: Gamepad2 },
  { title: "Teams", url: "/admin/teams", icon: Swords },
  { title: "Matches", url: "/admin/matches", icon: Calendar },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: BarChart3 },
  { title: "Users", url: "/admin/users", icon: UserCheck },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
