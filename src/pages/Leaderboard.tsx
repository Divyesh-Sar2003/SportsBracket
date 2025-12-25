import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchLeaderboard } from "@/services/firestore/leaderboard";
import { fetchMatches } from "@/services/firestore/matches";
import { fetchGames } from "@/services/firestore/games";
import { fetchParticipants } from "@/services/firestore/participants";
import { fetchUsers, User } from "@/services/firestore/users";
import { LeaderboardEntry, Match, Participant, Game } from "@/types/tournament";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Medal, Clock, MapPin, Trophy, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LeaderboardPage = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  useEffect(() => {
    fetchTournaments().then((data) => {
      setTournaments(data);
      if (data.length > 0) {
        setTournamentId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setEntries([]);
      setMatches([]);
      setGames([]);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchLeaderboard(tournamentId),
      fetchMatches({ tournamentId }),
      fetchGames(tournamentId),
      fetchParticipants({ tournamentId })
    ]).then(([leaderboardData, matchesData, gamesData, participantsData]) => {
      setEntries(leaderboardData);
      setMatches(matchesData);
      setGames(gamesData);
      setParticipants(participantsData);
    })
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const participantsMap = useMemo(() => {
    return participants.reduce<Record<string, Participant>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [participants]);

  const usersMap = useMemo(() => {
    return users.reduce<Record<string, User>>((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});
  }, [users]);

  const getParticipantName = (participantId?: string) => {
    if (!participantId) return "TBD";
    const p = participantsMap[participantId];
    if (!p) return "TBD";
    if (p.type === 'USER' && p.user_id) return usersMap[p.user_id]?.name || "Unknown";
    return "Team " + (p.team_id?.slice(-4) || "");
  };

  const podium = entries.slice(0, 3);
  const tableEntries = entries.slice(3);

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-wide">Standings</p>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Track the top performers across all sports and divisions. Standings update automatically
              after each verified match result.
            </p>
          </div>
          <div className="w-full md:w-64">
            <p className="text-xs uppercase text-muted-foreground font-medium mb-1">Tournament</p>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem value={tournament.id} key={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Top Performers</CardTitle>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {podium.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {podium.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border bg-gradient-to-br from-background to-muted/50 p-5 flex flex-col"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide">
                        {entry.entity_type.toLowerCase()}
                      </span>
                      <Medal className={`h-5 w-5 ${index === 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="text-2xl font-bold mt-3">{entry.name}</h3>
                    <div className="mt-auto pt-6 flex items-center justify-between text-sm font-medium">
                      <span>{entry.points} pts</span>
                      <span>
                        {entry.wins}-{entry.losses}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {tableEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Full Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Rank</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Points</th>
                      <th className="py-2 pr-4">Wins</th>
                      <th className="py-2 pr-4">Losses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableEntries.map((entry, index) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{entry.rank ?? index + 4}</td>
                        <td className="py-2 pr-4 font-medium">{entry.name}</td>
                        <td className="py-2 pr-4 capitalize">{entry.entity_type.toLowerCase()}</td>
                        <td className="py-2 pr-4">{entry.points}</td>
                        <td className="py-2 pr-4">{entry.wins}</td>
                        <td className="py-2 pr-4">{entry.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Ongoing Matches */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Live & Upcoming
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10">Ongoing</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {matches.filter(m => m.status.toUpperCase() !== 'COMPLETED' && m.status.toUpperCase() !== 'CANCELLED').length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No ongoing matches</p>
              ) : (
                matches.filter(m => m.status.toUpperCase() !== 'COMPLETED' && m.status.toUpperCase() !== 'CANCELLED').slice(0, 5).map(match => (
                  <div key={match.id} className="p-4 bg-background rounded-xl border border-primary/20 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded">
                        {games.find(g => g.id === match.game_id)?.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        LIVE
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-foreground">{getParticipantName(match.participant_a_id)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 min-w-[40px]">
                        <div className="text-[9px] font-black text-muted-foreground/50 italic">VS</div>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
                          <Clock className="h-2.5 w-2.5" />
                          {match.match_time ? new Date(match.match_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-bold text-sm text-foreground">{getParticipantName(match.participant_b_id)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Recent Results
              </CardTitle>
              <Badge variant="secondary">Finished</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {matches.filter(m => m.status.toUpperCase() === 'COMPLETED').length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No completed matches yet</p>
              ) : (
                matches.filter(m => m.status.toUpperCase() === 'COMPLETED').slice(0, 5).map(match => (
                  <div key={match.id} className="p-4 bg-muted/40 rounded-xl border border-border shadow-sm transition-all hover:bg-muted/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-0.5 bg-muted rounded">
                        {games.find(g => g.id === match.game_id)?.name}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[9px] font-bold px-1.5 py-0">MATCH OVER</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className={`flex-1 text-center p-2 rounded-lg transition-colors ${match.winner_participant_id === match.participant_a_id ? "bg-green-500/10 border border-green-500/20" : "opacity-60"}`}>
                        <p className={`font-bold text-sm truncate ${match.winner_participant_id === match.participant_a_id ? "text-green-600" : "text-muted-foreground font-medium"}`}>
                          {getParticipantName(match.participant_a_id)}
                        </p>
                        {match.winner_participant_id === match.participant_a_id && (
                          <div className="flex items-center justify-center gap-1">
                            <Trophy className="h-2.5 w-2.5 text-green-600" />
                            <span className="text-[9px] font-black text-green-600 tracking-tighter uppercase">Winner</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] font-black text-muted-foreground/30 px-1 py-0.5">FT</div>
                      </div>
                      <div className={`flex-1 text-center p-2 rounded-lg transition-colors ${match.winner_participant_id === match.participant_b_id ? "bg-green-500/10 border border-green-500/20" : "opacity-60"}`}>
                        <p className={`font-bold text-sm truncate ${match.winner_participant_id === match.participant_b_id ? "text-green-600" : "text-muted-foreground font-medium"}`}>
                          {getParticipantName(match.participant_b_id)}
                        </p>
                        {match.winner_participant_id === match.participant_b_id && (
                          <div className="flex items-center justify-center gap-1">
                            <Trophy className="h-2.5 w-2.5 text-green-600" />
                            <span className="text-[9px] font-black text-green-600 tracking-tighter uppercase">Winner</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;

