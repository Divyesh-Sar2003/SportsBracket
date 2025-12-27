import { useEffect, useMemo, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchLeaderboard, clearLeaderboardForTournament, recordMatchResultToLeaderboard } from "@/services/firestore/leaderboard";
import { fetchGames } from "@/services/firestore/games";
import { fetchMatches } from "@/services/firestore/matches";
import { fetchParticipants } from "@/services/firestore/participants";
import { fetchUsers, User } from "@/services/firestore/users";
import { fetchTeams } from "@/services/firestore/teams";
import { LeaderboardEntry, Match, Participant, Team } from "@/types/tournament";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Trophy, Medal, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LeaderboardManagement = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { setIsLoading } = useLoading();
  const [syncing, setSyncing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments().then(setTournaments);
    fetchUsers().then(setUsers);
  }, []);

  const usersMap = useMemo(() => {
    return users.reduce<Record<string, User>>((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});
  }, [users]);

  const teamsMap = useMemo(() => {
    return teams.reduce<Record<string, Team>>((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});
  }, [teams]);

  const participantsMap = useMemo(() => {
    return participants.reduce<Record<string, Participant>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [participants]);

  const getParticipantName = (p?: Participant) => {
    if (!p) return "Unknown";
    if (p.type === 'USER' && p.user_id) return usersMap[p.user_id]?.name || "Unknown User";
    if (p.type === 'TEAM' && p.team_id) return teamsMap[p.team_id]?.name || `Team ${p.team_id.slice(-4)}`;
    return "Unknown";
  };

  useEffect(() => {
    if (!tournamentId) {
      setEntries([]);
      setGames([]);
      setGameId("");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [gamesData, teamsData, participantsData] = await Promise.all([
          fetchGames(tournamentId),
          fetchTeams({ tournamentId }),
          fetchParticipants({ tournamentId })
        ]);
        setGames(gamesData);
        setTeams(teamsData);
        setParticipants(participantsData);

        const leaderboardData = await fetchLeaderboard(tournamentId, gameId === "ALL" ? undefined : (gameId || undefined));
        setEntries(leaderboardData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      setIsLoading(true);
      load();
    } else {
      load(); // Still call to clear states if needed
    }
  }, [tournamentId, gameId, setIsLoading]);

  const handleSyncLeaderboard = async () => {
    if (!tournamentId) return;

    setSyncing(true);
    try {
      toast({
        title: "Recalculating Leaderboard",
        description: "Processing all completed matches...",
      });

      // 1. Clear old standings
      await clearLeaderboardForTournament(tournamentId);

      // 2. Fetch all completed matches for this tournament
      const matches = await fetchMatches({ tournamentId });
      const completedMatches = matches.filter(m => m.status.toUpperCase() === 'COMPLETED');

      // 3. Re-process matches one by one to avoid race conditions on increments
      // In a real app, you might want a more sophisticated cloud function
      for (const match of completedMatches) {
        if (!match.winner_participant_id) continue;

        const winnerId = match.winner_participant_id;
        const loserId = match.participant_a_id === winnerId ? match.participant_b_id : match.participant_a_id;

        const winnerP = participantsMap[winnerId];
        const loserP = loserId ? participantsMap[loserId] : undefined;

        if (winnerP) {
          await recordMatchResultToLeaderboard({
            tournamentId: match.tournament_id,
            gameId: match.game_id,
            winnerId: winnerId,
            loserId: loserId,
            winnerName: getParticipantName(winnerP),
            loserName: loserP ? getParticipantName(loserP) : undefined,
            winnerType: winnerP.type,
            loserType: loserP?.type,
            pointsForWin: 3,
          });
        }
      }

      // 4. Refresh UI
      const refreshed = await fetchLeaderboard(tournamentId, gameId === "ALL" ? undefined : (gameId || undefined));
      setEntries(refreshed);

      toast({
        title: "Success",
        description: "Leaderboard has been synchronized with match results.",
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-wrap gap-4 items-end flex-1">
          <div className="flex flex-col gap-2 w-full sm:w-64">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70">Tournament</p>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger className="bg-muted/30 border-none h-11 font-bold">
                <SelectValue placeholder="Select tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem value={tournament.id} key={tournament.id} className="font-medium">
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-64">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70">Game Filter</p>
            <Select value={gameId} onValueChange={setGameId} disabled={!tournamentId}>
              <SelectTrigger className="bg-muted/30 border-none h-11 font-bold">
                <SelectValue placeholder="Tournament Wide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold">Total Standings</SelectItem>
                {games.map((game) => (
                  <SelectItem value={game.id} key={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSyncLeaderboard}
          disabled={!tournamentId || syncing}
          variant="outline"
          className="h-11 px-6 font-black border-primary/20 hover:bg-primary/5 transition-all gap-2"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          SYNC STANDINGS
        </Button>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-gradient-to-b from-card to-card/50">
        <CardHeader className="border-b bg-muted/10 p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <Trophy className="h-7 w-7 text-yellow-500" />
                STANDINGS MANAGEMENT
              </CardTitle>
              <CardDescription className="font-medium">
                {gameId && gameId !== 'ALL'
                  ? `Leaderboard for ${games.find(g => g.id === gameId)?.name || 'Sport'}`
                  : "Overall tournament-wide leaderboard rankings."}
              </CardDescription>
            </div>
            {loading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!tournamentId ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <Search className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">Please select a tournament to view statistics.</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <AlertCircle className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">No leaderboard data found.</p>
              <p className="text-sm">Click 'Sync Standings' to generate from match history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-muted/10 border-b">
                    <th className="py-5 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] w-24">RANK</th>
                    <th className="py-5 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ENTITY NAME</th>
                    <th className="py-5 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">TYPE</th>
                    <th className="py-5 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">WINS</th>
                    <th className="py-5 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">LOSSES</th>
                    <th className="py-5 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">POINTS</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-primary/5 transition-all group">
                      <td className="py-6 px-8">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all",
                          index === 0 ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-110" :
                            index === 1 ? "bg-slate-300 text-slate-700" :
                              index === 2 ? "bg-orange-300 text-orange-800" :
                                "bg-muted text-muted-foreground"
                        )}>
                          {entry.rank ?? index + 1}
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <p className="font-black text-lg group-hover:text-primary transition-colors">{entry.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-50">ID: {entry.entity_id}</p>
                      </td>
                      <td className="py-6 px-8">
                        <Badge variant="secondary" className="font-black text-[10px] px-3 py-1 bg-muted">
                          {entry.entity_type}
                        </Badge>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span className="text-lg font-bold text-green-600 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">{entry.wins}</span>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span className="text-lg font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">{entry.losses}</span>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <span className="text-2xl font-black text-primary">{entry.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardManagement;
