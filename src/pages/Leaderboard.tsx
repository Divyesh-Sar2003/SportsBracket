import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchLeaderboard } from "@/services/firestore/leaderboard";
import { fetchMatches, fetchMatchResultsForMatches } from "@/services/firestore/matches";
import { fetchGames } from "@/services/firestore/games";
import { fetchParticipants } from "@/services/firestore/participants";
import { fetchUsers, User } from "@/services/firestore/users";
import { fetchTeams } from "@/services/firestore/teams";
import { LeaderboardEntry, Match, Participant, Game, Team, MatchResult } from "@/types/tournament";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Medal, Clock, MapPin, Trophy, PlayCircle, Layout } from "lucide-react";
import { useLoading } from "@/contexts/LoadingContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentBracket from "@/components/TournamentBracket";
import { cn } from "@/lib/utils";

const LeaderboardPage = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { setIsLoading } = useLoading();
  const [activeTab, setActiveTab] = useState("standings");

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
      setTeams([]);
      setGameId("");
      return;
    }
    setLoading(true);

    const loadData = async () => {
      try {
        const [leaderboardData, matchesData, gamesData, participantsData, teamsData] = await Promise.all([
          fetchLeaderboard(tournamentId, activeTab === 'standings' && gameId && gameId !== 'ALL' ? gameId : undefined),
          fetchMatches({ tournamentId }),
          fetchGames(tournamentId),
          fetchParticipants({ tournamentId }),
          fetchTeams({ tournamentId })
        ]);
        setEntries(leaderboardData);
        setMatches(matchesData);
        setGames(gamesData);
        setParticipants(participantsData);
        setTeams(teamsData);

        if (matchesData.length > 0) {
          const matchIds = matchesData.map(m => m.id);
          const resultsData = await fetchMatchResultsForMatches(matchIds);
          setResults(resultsData);
        }

        if (gamesData.length > 0 && !gameId) {
          setGameId(gamesData[0].id);
        }
      } catch (error) {
        console.error("Error loading leaderboard data:", error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      setIsLoading(true);
      loadData();
    }
  }, [tournamentId, gameId, activeTab, setIsLoading]);

  useEffect(() => {
    if (activeTab === "bracket" && gameId === "ALL" && games.length > 0) {
      setGameId(games[0].id);
    }
  }, [activeTab, gameId, games]);

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

  const teamsMap = useMemo(() => {
    return teams.reduce<Record<string, Team>>((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});
  }, [teams]);

  const gamesMap = useMemo(() => {
    return games.reduce<Record<string, Game>>((acc, g) => {
      acc[g.id] = g;
      return acc;
    }, {});
  }, [games]);

  const resultsMap = useMemo(() => {
    return results.reduce<Record<string, MatchResult>>((acc, r) => {
      acc[r.match_id] = r;
      return acc;
    }, {});
  }, [results]);

  const getParticipantName = (participantId?: string) => {
    if (!participantId) return "TBD";
    const p = participantsMap[participantId];
    if (!p) return "TBD";
    if (p.type === 'USER' && p.user_id) return usersMap[p.user_id]?.name || "Unknown";
    if (p.type === 'TEAM' && p.team_id) return teamsMap[p.team_id]?.name || `Team ${p.team_id.slice(-4)}`;
    return "Unknown";
  };

  const podium = entries.slice(0, 3);
  const tableEntries = entries.slice(3);

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Trophy className="h-10 w-10 text-yellow-500" />
              TOURNAMENT HUB
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl">
              Real-time standings and visual brackets for the current competition.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <p className="text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-1.5 opacity-70">
                ACTIVE TOURNAMENT
              </p>
              <Select value={tournamentId} onValueChange={setTournamentId}>
                <SelectTrigger className="bg-background border-muted-foreground/20 h-11">
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

            <div className="w-full md:w-64 animate-in fade-in slide-in-from-right-2">
              <p className="text-[10px] uppercase text-muted-foreground font-black tracking-widest mb-1.5 opacity-70">
                {activeTab === 'standings' ? 'FILTER STANDINGS' : 'SELECT GAME'}
              </p>
              <Select value={gameId} onValueChange={setGameId} disabled={!tournamentId}>
                <SelectTrigger className="bg-background border-muted-foreground/20 h-11">
                  <SelectValue placeholder="Select choice" />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === 'standings' && <SelectItem value="ALL">Total Standings</SelectItem>}
                  {games.map((g) => (
                    <SelectItem value={g.id} key={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="standings" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/50 p-1 h-12">
              <TabsTrigger value="standings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 transition-all font-bold">
                <Medal className="h-4 w-4 mr-2" />
                Standings
              </TabsTrigger>
              <TabsTrigger value="bracket" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 transition-all font-bold">
                <Layout className="h-4 w-4 mr-2" />
                Visual Bracket
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="standings" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid gap-6">
              <Card className="border-none shadow-xl bg-gradient-to-b from-card to-card/50">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 p-6 px-8">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Performers
                  </CardTitle>
                  {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </CardHeader>
                <CardContent className="p-8">
                  {podium.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-muted-foreground font-medium">No standings data available for this tournament yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                      {podium.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={cn(
                            "relative overflow-hidden group rounded-2xl border p-6 flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1",
                            index === 0
                              ? "bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/20 ring-1 ring-yellow-500/10"
                              : index === 1
                                ? "bg-gradient-to-br from-slate-300/10 via-slate-300/5 to-transparent border-slate-300/20"
                                : "bg-gradient-to-br from-orange-400/10 via-orange-400/5 to-transparent border-orange-400/20"
                          )}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted/50 px-2 py-1 rounded">
                              RANK {index + 1}
                            </span>
                            <Medal
                              className={cn(
                                "h-8 w-8",
                                index === 0 ? "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" :
                                  index === 1 ? "text-slate-400" : "text-orange-400"
                              )}
                            />
                          </div>
                          <h3 className="text-2xl font-black truncate group-hover:text-primary transition-colors">{entry.name}</h3>
                          <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-tighter opacity-70">
                            {entry.entity_type}
                          </p>
                          <div className="mt-8 pt-6 border-t border-muted-foreground/10 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-muted-foreground uppercase">Points</span>
                              <span className="text-xl font-black text-primary">{entry.points}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-black text-muted-foreground uppercase">W/L Record</span>
                              <span className="text-lg font-bold">
                                {entry.wins}<span className="text-muted-foreground mx-1">-</span>{entry.losses}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {tableEntries.length > 0 && (
                <Card className="border-muted/20 shadow-lg overflow-hidden">
                  <CardHeader className="bg-muted/5 border-b">
                    <CardTitle className="text-lg font-bold">Full Leaderboard</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left bg-muted/10 border-b">
                            <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider pl-8 w-20">RK</th>
                            <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Entity Name</th>
                            <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Wins</th>
                            <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Losses</th>
                            <th className="py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right pr-8">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableEntries.map((entry, index) => (
                            <tr key={entry.id} className="border-b last:border-0 hover:bg-primary/5 transition-colors group">
                              <td className="py-4 px-6 pl-8 font-black text-muted-foreground/60 group-hover:text-primary transition-colors">
                                #{entry.rank ?? index + 4}
                              </td>
                              <td className="py-4 px-6 font-black text-foreground">{entry.name}</td>
                              <td className="py-4 px-6">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-2 border-muted-foreground/20">
                                  {entry.entity_type}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right font-medium text-green-600">{entry.wins}</td>
                              <td className="py-4 px-6 text-right font-medium text-red-500">{entry.losses}</td>
                              <td className="py-4 px-6 text-right font-black text-primary pr-8">{entry.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-primary/20 bg-primary/5 shadow-inner">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/10">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    MATCH TICKER
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-2 py-0.5 animate-pulse">
                    LIVE NOW
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {matches.filter(m => m.status.toUpperCase() !== 'COMPLETED' && m.status.toUpperCase() !== 'CANCELLED').length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground font-medium italic">No active matches at the moment.</p>
                    </div>
                  ) : (
                    matches.filter(m => m.status.toUpperCase() !== 'COMPLETED' && m.status.toUpperCase() !== 'CANCELLED').slice(0, 5).map(match => (
                      <div key={match.id} className="p-5 bg-background rounded-2xl border border-primary/10 shadow-sm transition-all hover:shadow-lg group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                          <Layout className="h-12 w-12 text-primary" />
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2.5 py-1 bg-primary/10 rounded-full border border-primary/5">
                            {gamesMap[match.game_id]?.name || "SPORT"}
                          </span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase opacity-50">{match.round_name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-base truncate leading-tight group-hover:text-primary transition-colors">{getParticipantName(match.participant_a_id)}</p>
                          </div>
                          <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                            <div className="text-[10px] font-black text-muted-foreground/30 italic">VS</div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-black bg-muted/50 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3" />
                              {match.match_time ? new Date(match.match_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className="font-black text-base truncate leading-tight group-hover:text-primary transition-colors">{getParticipantName(match.participant_b_id)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-muted/20">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    RECENT RESULTS
                  </CardTitle>
                  <Badge variant="secondary" className="font-black text-[10px]">ALL OVER</Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {matches.filter(m => m.status.toUpperCase() === 'COMPLETED').length === 0 ? (
                    <div className="py-12 text-center italic text-muted-foreground font-medium">No match results recorded yet.</div>
                  ) : (
                    matches.filter(m => m.status.toUpperCase() === 'COMPLETED').slice(0, 5).map(match => (
                      <div key={match.id} className="p-5 bg-muted/20 rounded-2xl border border-transparent shadow-sm transition-all hover:bg-muted/40 hover:border-muted-foreground/10 group">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 py-1 bg-background rounded-full border border-border">
                            {gamesMap[match.game_id]?.name || "SPORT"}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/50">{match.round_name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className={cn("flex-1 p-3 rounded-xl transition-all flex flex-col items-center justify-center", match.winner_participant_id === match.participant_a_id ? "bg-green-500/10 border border-green-500/20" : "opacity-50 grayscale")}>
                            <p className={cn("text-xs font-black text-center mb-1", match.winner_participant_id === match.participant_a_id ? "text-green-600" : "text-muted-foreground")}>
                              {getParticipantName(match.participant_a_id)}
                            </p>
                            {match.winner_participant_id === match.participant_a_id && (
                              <Badge className="bg-green-600 hover:bg-green-600 text-[8px] font-black h-4 px-1 leading-none border-none">WINNER</Badge>
                            )}
                          </div>
                          <div className="text-[10px] font-black text-muted-foreground/30 italic">FT</div>
                          <div className={cn("flex-1 p-3 rounded-xl transition-all flex flex-col items-center justify-center", match.winner_participant_id === match.participant_b_id ? "bg-green-500/10 border border-green-500/20" : "opacity-50 grayscale")}>
                            <p className={cn("text-xs font-black text-center mb-1", match.winner_participant_id === match.participant_b_id ? "text-green-600" : "text-muted-foreground")}>
                              {getParticipantName(match.participant_b_id)}
                            </p>
                            {match.winner_participant_id === match.participant_b_id && (
                              <Badge className="bg-green-600 hover:bg-green-600 text-[8px] font-black h-4 px-1 leading-none border-none">WINNER</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bracket" className="space-y-8 animate-in zoom-in-95 duration-500">
            <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden min-h-[500px]">
              <CardHeader className="bg-primary/5 border-b p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black">TOURNAMENT BRACKET</CardTitle>
                    <p className="text-muted-foreground text-sm font-medium">
                      {gameId ? `Visual representation of ${gamesMap[gameId]?.name} single-elimination progress.` : "Select a game to view bracket."}
                    </p>
                  </div>
                  {gameId && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-background font-bold border-primary/20">{gamesMap[gameId]?.game_type} MATCHES</Badge>
                      <Badge variant="outline" className="bg-background font-bold border-primary/20">{gamesMap[gameId]?.players_per_team} PLAYERS PER SIDE</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col overflow-hidden">
                {gameId ? (
                  <TournamentBracket
                    matches={matches}
                    resultsMap={resultsMap}
                    participantsMap={participantsMap}
                    usersMap={usersMap}
                    teamsMap={teamsMap}
                    gameId={gameId}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
                    <Layout className="h-16 w-16 mb-4 opacity-10" />
                    <p className="text-xl font-bold">Please select a game to view the tournament bracket.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeaderboardPage;

