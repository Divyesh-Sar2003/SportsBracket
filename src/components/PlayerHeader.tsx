import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { fetchNotifications } from "@/services/firestore/notifications";

export function PlayerHeader() {
  const { signOut, user } = useAuth();
  const [profileName, setProfileName] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user?.uid) {
        try {
          const profileDoc = await getDoc(doc(db, "profiles", user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setProfileName(data.name || user.displayName || user.email || "");
          } else {
            setProfileName(user.displayName || user.email || "");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfileName(user.displayName || user.email || "");
        }
      }
    };

    fetchProfileName();
  }, [user]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (user?.uid) {
        try {
          const notifications = await fetchNotifications(user.uid) as any[];
          const unread = notifications.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error("Error loading notifications:", error);
        }
      }
    };

    loadNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Link to="/dashboard" className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Player Dashboard</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/dashboard/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">{profileName}</span>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
