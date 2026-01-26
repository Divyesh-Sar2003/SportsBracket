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
  CalendarClock,
  History,
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

import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, permission: null },
  { title: "Registrations", url: "/admin/registrations", icon: ClipboardCheck, permission: "registrations" },
  { title: "Participants", url: "/admin/participants", icon: Users, permission: "participants" },
  { title: "Tournaments", url: "/admin/tournaments", icon: Trophy, permission: "tournaments" },
  { title: "Games", url: "/admin/games", icon: Gamepad2, permission: "games" },
  { title: "Teams", url: "/admin/teams", icon: Swords, permission: "teams" },
  { title: "Schedule", url: "/admin/schedule", icon: CalendarClock, permission: "schedule" },
  { title: "Matches", url: "/admin/matches", icon: Calendar, permission: "matches" },
  { title: "Leaderboard", url: "/admin/leaderboard", icon: BarChart3, permission: "leaderboard" },
  { title: "Users", url: "/admin/users", icon: UserCheck, permission: "super_admin" },
  { title: "Audit Logs", url: "/admin/audit", icon: History, permission: "audit" },
];

export function AdminSidebar() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { isSuperAdmin, permissions } = useAuth();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (isSuperAdmin) return true;
    if (item.permission === "super_admin") return false;
    if (!item.permission) return true;
    return permissions?.[item.permission as keyof typeof permissions] ?? false;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/admin"
                        ? (location.pathname === "/admin" || location.pathname === "/admin/")
                        : location.pathname === item.url
                    }
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                      onClick={handleLinkClick}
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
