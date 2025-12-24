import { Navigate, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
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

const AdminDashboard = () => {
  const { loading, isAdmin } = useAuth();

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
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <AdminHeader />

          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/registrations" element={<RegistrationsManagement />} />
              <Route path="/participants" element={<ParticipantsManagement />} />
              <Route path="/tournaments" element={<TournamentsManagement />} />
              <Route path="/games" element={<GamesManagement />} />
              <Route path="/teams" element={<TeamsManagement />} />
              <Route path="/matches" element={<MatchesManagement />} />
              <Route path="/leaderboard" element={<LeaderboardManagement />} />
              <Route path="/users" element={<UsersManagement />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;