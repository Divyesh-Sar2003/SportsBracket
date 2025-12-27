import { Navigate, Routes, Route, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import { PlayerHeader } from "../components/PlayerHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Target } from "lucide-react";
import ProfileManagement from "./player/ProfileManagement";
import GameRegistration from "./player/GameRegistration";
import MyGames from "./player/MyGames";
import MyMatches from "./player/MyMatches";
import MyTournaments from "./player/MyTournaments";
import Notifications from "./player/Notifications";
import PlayerSchedule from "./player/PlayerSchedule";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { fetchRegistrations } from "@/services/firestore/registrations";
import { fetchUserParticipants, fetchParticipantsByTeamIds } from "@/services/firestore/participants";
import { fetchMatchesForParticipants, fetchMatchResultsForMatches } from "@/services/firestore/matches";
import { fetchTeams } from "@/services/firestore/teams";
import { createNotification } from "@/services/firestore/notifications";
import { format } from "date-fns";

const PlayerDashboard = () => {
  const { user, loading, isAdmin } = useAuth();
  const { setIsLoading } = useLoading();
  const [profileName, setProfileName] = useState<string>("");
  const [stats, setStats] = useState({
    activeTournaments: 0,
    matchesPlayed: 0,
    wins: 0,
    upcomingMatches: 0
  });

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    let d: Date;
    if (typeof date === 'object' && date.toDate) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Profile Name
          const profileDoc = await getDoc(doc(db, "profiles", user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setProfileName(data.name || user.displayName || user.email || "User");
          } else {
            setProfileName(user.displayName || user.email || "User");
          }

          // Stats & Data
          const registrations = await fetchRegistrations({ userId: user.uid });
          const uniqueTournamentIds = Array.from(new Set(registrations.map(r => r.tournament_id)));

          // Fetch Tournament Details
          const tournamentPromises = uniqueTournamentIds.map(id => getDoc(doc(db, "tournaments", id)));
          const tournamentDocs = await Promise.all(tournamentPromises);
          const activeTournamentsData = tournamentDocs
            .map(d => {
              if (!d.exists()) return null;
              const tData = { id: d.id, ...d.data() } as any;
              const reg = registrations.find(r => r.tournament_id === d.id);
              return { ...tData, userRegistrationStatus: reg?.status };
            })
            .filter(t => t !== null && (t.is_active || t.status === 'active' || t.status === 'draft'));

          setTournaments(activeTournamentsData);

          const participants = await fetchUserParticipants(user.uid);
          const userTeams = await fetchTeams({ userId: user.uid });
          const teamIds = userTeams.map(t => t.id);
          const teamParticipants = await fetchParticipantsByTeamIds(teamIds);

          const allMyParticipants = [...participants, ...teamParticipants];
          const participantIds = allMyParticipants.map(p => p.id);

          let matches = await fetchMatchesForParticipants(participantIds);

          // Sort matches by date descending for recent activity
          matches.sort((a, b) => {
            const dateA = new Date(a.match_time || a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.match_time || b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });

          // Generate Recent Activity from latest 5 matches
          const activity = matches.slice(0, 5).map(m => ({
            title: `Match: ${m.round_name}`,
            description: `Status: ${m.status}`,
            date: formatDate(m.match_time || m.created_at)
          }));

          // If no matches, maybe use registrations
          if (activity.length === 0 && registrations.length > 0) {
            const sortedRegs = [...registrations].sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
            activity.push(...sortedRegs.slice(0, 5).map(r => ({
              title: "Joined Tournament",
              description: "Registration Approved",
              date: formatDate(r.created_at)
            })));
          }

          setRecentActivity(activity);

          const played = matches.filter(m => m.status === 'COMPLETED').length;
          const upcoming = matches.filter(m => m.status === 'SCHEDULED').length;

          const completedMatchIds = matches.filter(m => m.status === 'COMPLETED').map(m => m.id);
          const results = await fetchMatchResultsForMatches(completedMatchIds);

          const winsCount = results.filter(r => participantIds.includes(r.winner_participant_id)).length;

          setStats({
            activeTournaments: uniqueTournamentIds.length,
            matchesPlayed: played,
            wins: winsCount,
            upcomingMatches: upcoming
          });

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setProfileName(user.displayName || user.email || "User");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      setIsLoading(true);
      fetchData();
    }
  }, [user, setIsLoading]);

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <PlayerSidebar />

        <div className="flex-1 flex flex-col">
          <PlayerHeader />

          <main className="flex-1 p-6">
            <Routes>
              <Route index element={
                <>
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold">Player Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {profileName}!</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tournaments Joined</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.activeTournaments}</div>
                        <p className="text-xs text-muted-foreground">Active tournaments</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.matchesPlayed}</div>
                        <p className="text-xs text-muted-foreground">Total matches</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wins</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.wins}</div>
                        <p className="text-xs text-muted-foreground">Victories achieved</p>
                      </CardContent>
                    </Card>

                    <Link to="/dashboard/schedule">
                      <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
                          <Calendar className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats.upcomingMatches}</div>
                          <p className="text-xs text-muted-foreground">Scheduled matches</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest tournament activities</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {recentActivity.length > 0 ? (
                          <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                              <div key={index} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                <div>
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{activity.date}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            No recent activity yet. Join a tournament to get started!
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Current Tournaments</CardTitle>
                        <CardDescription>Tournaments you're participating in</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {tournaments.length > 0 ? (
                          <div className="space-y-4">
                            {tournaments.map((tournament) => (
                              <div key={tournament.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                <div>
                                  <p className="font-medium">{tournament.name}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant={tournament.status === 'active' || tournament.is_active ? 'default' : 'secondary'} className="text-[10px] h-5">
                                      {tournament.status || (tournament.is_active ? 'active' : 'inactive')}
                                    </Badge>
                                    {tournament.userRegistrationStatus && (
                                      <Badge
                                        variant={tournament.userRegistrationStatus === 'approved' ? 'outline' : 'secondary'}
                                        className={cn(
                                          "text-[10px] h-5",
                                          tournament.userRegistrationStatus === 'approved' ? "text-green-600 border-green-600" : "text-amber-600 border-amber-600"
                                        )}
                                      >
                                        {tournament.userRegistrationStatus.toUpperCase()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(tournament.start_date)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            No active tournaments. Browse available tournaments to join!
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              } />
              <Route path="register" element={<GameRegistration />} />
              <Route path="my-games" element={<MyGames />} />
              <Route path="matches" element={<MyMatches />} />
              <Route path="schedule" element={<PlayerSchedule />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="tournaments" element={<MyTournaments />} />
              <Route path="profile" element={<ProfileManagement />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PlayerDashboard;
