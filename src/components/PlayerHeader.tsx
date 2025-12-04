import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export function PlayerHeader() {
  const { signOut, user } = useAuth();
  const [profileName, setProfileName] = useState<string>("");

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
        <span className="text-sm text-muted-foreground">{profileName}</span>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
