import { Navigate, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminPermissions } from "@/types/tournament";
import GamesManagement from "./GamesManagement";
import TeamsManagement from "./TeamsManagement";
import MatchesManagement from "./MatchesManagement";
import TournamentsManagement from "./TournamentsManagement";
import Overview from "./Overview";
import RegistrationsManagement from "./RegistrationsManagement";
import ParticipantsManagement from "./ParticipantsManagement";
import LeaderboardManagement from "./LeaderboardManagement";
import MatchesSchedule from "./MatchesSchedule";
import UsersManagement from "./UsersManagement";
import AuditLogs from "./AuditLogs";

const AdminDashboard = () => {
  const { loading, isAdmin, isSuperAdmin, permissions } = useAuth();

  // Remove body padding-top for dashboard layout
  useEffect(() => {
    const body = document.body;
    const originalPaddingTop = body.style.paddingTop;
    body.style.paddingTop = '0';

    return () => {
      body.style.paddingTop = originalPaddingTop;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground transition-all animate-pulse">Loading secure environment...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Helper to check if admin has access to a specific module
  const hasAccess = (perm: keyof AdminPermissions) => isSuperAdmin || (permissions?.[perm] ?? false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <AdminHeader />

          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Overview />} />

              {/* Granular Permissioned Routes */}
              <Route path="/registrations" element={hasAccess('registrations') ? <RegistrationsManagement /> : <Navigate to="/admin" />} />
              <Route path="/participants" element={hasAccess('participants') ? <ParticipantsManagement /> : <Navigate to="/admin" />} />
              <Route path="/tournaments" element={hasAccess('tournaments') ? <TournamentsManagement /> : <Navigate to="/admin" />} />
              <Route path="/games" element={hasAccess('games') ? <GamesManagement /> : <Navigate to="/admin" />} />
              <Route path="/teams" element={hasAccess('teams') ? <TeamsManagement /> : <Navigate to="/admin" />} />
              <Route path="/schedule" element={hasAccess('schedule') ? <MatchesSchedule /> : <Navigate to="/admin" />} />
              <Route path="/matches" element={hasAccess('matches') ? <MatchesManagement /> : <Navigate to="/admin" />} />
              <Route path="/leaderboard" element={hasAccess('leaderboard') ? <LeaderboardManagement /> : <Navigate to="/admin" />} />

              {/* Super Admin Only Routes */}
              <Route path="/users" element={isSuperAdmin ? <UsersManagement /> : <Navigate to="/admin" />} />
              <Route path="/audit" element={hasAccess('audit') ? <AuditLogs /> : <Navigate to="/admin" />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;