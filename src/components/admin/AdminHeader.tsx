import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminHeader() {
  const { signOut, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Link to="/admin" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Admin Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.displayName}</span>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}