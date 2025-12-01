import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, Gamepad2 } from "lucide-react";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchUsers } from "@/services/firestore/users";
import { fetchMatches } from "@/services/firestore/matches";

const Overview = () => {
  const [stats, setStats] = useState({
    activeTournamentsCount: 0,
    activeTournamentName: "Loading...",
    totalGames: 0,
    registeredPlayers: 0,
    scheduledMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [tournaments, users, games] = await Promise.all([
          fetchTournaments(),
          fetchUsers(),
          fetchGames(),
        ]);

        const activeTournaments = tournaments.filter((t) => t.is_active);
        const mainTournament = activeTournaments[0] || tournaments[0];

        let matchesCount = 0;
        if (mainTournament) {
          const matches = await fetchMatches({ tournamentId: mainTournament.id });
          matchesCount = matches.length;
        }

        setStats({
          activeTournamentsCount: activeTournaments.length,
          activeTournamentName: mainTournament ? mainTournament.name : "No Tournaments",
          totalGames: games.length,
          registeredPlayers: users.length,
          scheduledMatches: matchesCount,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setStats(prev => ({ ...prev, activeTournamentName: "Error loading data" }));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome to the Sports Week Admin Dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.activeTournamentsCount}</div>
            <p className="text-xs text-muted-foreground">{stats.activeTournamentName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.totalGames}</div>
            <p className="text-xs text-muted-foreground">Across all tournaments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.registeredPlayers}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Matches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : stats.scheduledMatches}</div>
            <p className="text-xs text-muted-foreground">For current tournament</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
            <div>
              <h3 className="font-semibold">Create a Tournament</h3>
              <p className="text-sm text-muted-foreground">Set up Sports Week 2025 with start and end dates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
            <div>
              <h3 className="font-semibold">Add Games</h3>
              <p className="text-sm text-muted-foreground">Configure games like Chess, Cricket, Volleyball, etc.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
            <div>
              <h3 className="font-semibold">Create Teams</h3>
              <p className="text-sm text-muted-foreground">Build teams and pairs for various games</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
            <div>
              <h3 className="font-semibold">Schedule Matches</h3>
              <p className="text-sm text-muted-foreground">Create match fixtures with dates, times, and venues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;