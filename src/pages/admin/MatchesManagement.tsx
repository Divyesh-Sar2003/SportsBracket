import { useEffect, useMemo, useState } from "react";
import { isBefore } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlayCircle } from "lucide-react";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchParticipants } from "@/services/firestore/participants";
import { fetchMatches, updateMatch, submitMatchResult } from "@/services/firestore/matches";
import { recordMatchResultToLeaderboard } from "@/services/firestore/leaderboard";
import { Participant, Match, Team } from "@/types/tournament";
import { generateSingleEliminationBracket, persistGeneratedMatches } from "@/lib/bracket";
import { useToast } from "@/hooks/use-toast";
import { fetchUsers, User } from "@/services/firestore/users";
import { fetchTeams } from "@/services/firestore/teams";
import { useAuth } from "@/contexts/AuthContext";

type TournamentOption = { id: string; name: string };

const MatchesManagement = () => {
  const { user: currentUser } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments().then(setTournaments);
    fetchUsers().then(setUsers);
  }, []);

  useEffect(() => {
    setGameId("");
  }, [tournamentId]);

  useEffect(() => {
    const load = async () => {
      if (!tournamentId) {
        setGames([]);
        setParticipants([]);
        setMatches([]);
        setTeams([]);
        return;
      }

      setLoading(true);
      try {
        const [gamesResponse, participantsResponse, matchesResponse, teamsResponse] = await Promise.all([
          fetchGames(tournamentId),
          fetchParticipants({ tournamentId, gameId: gameId || undefined }),
          fetchMatches({ tournamentId, gameId: gameId || undefined }),
          fetchTeams({ tournamentId, gameId: gameId || undefined }),
        ]);
        setGames(gamesResponse);
        setParticipants(participantsResponse);
        setMatches(matchesResponse);
        setTeams(teamsResponse);
      } catch (error: any) {
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive",
        });
        setGames([]);
        setParticipants([]);
        setMatches([]);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tournamentId, gameId]);

  const participantsMap = useMemo(() => {
    return participants.reduce<Record<string, Participant>>((acc, participant) => {
      acc[participant.id] = participant;
      return acc;
    }, {});
  }, [participants]);

  const usersMap = useMemo(() => {
    return users.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  const teamsMap = useMemo(() => {
    return teams.reduce<Record<string, Team>>((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {});
  }, [teams]);

  const getParticipantName = (participant?: Participant) => {
    if (!participant) return "TBD";
    if (participant.type === "USER" && participant.user_id) {
      return usersMap[participant.user_id]?.name || "Unknown User";
    }
    if (participant.type === "TEAM" && participant.team_id) {
      return teamsMap[participant.team_id]?.name || "Unknown Team";
    }
    return "Unknown Participant";
  };

  const eliminatedUserIds = useMemo(() => {
    const eliminatedUsers = new Set<string>();
    matches
      .filter(m => m.status.toUpperCase() === 'COMPLETED')
      .forEach(m => {
        const loserId = m.participant_a_id === m.winner_participant_id ? m.participant_b_id : m.participant_a_id;
        if (loserId) {
          const loserParticipant = participants.find(p => p.id === loserId);
          if (loserParticipant) {
            if (loserParticipant.type === 'USER' && loserParticipant.user_id) {
              eliminatedUsers.add(loserParticipant.user_id);
            } else if (loserParticipant.type === 'TEAM' && loserParticipant.team_id) {
              const team = teams.find(t => t.id === loserParticipant.team_id);
              if (team?.player_ids) {
                team.player_ids.forEach(uid => eliminatedUsers.add(uid));
              }
            }
          }
        }
      });
    return eliminatedUsers;
  }, [matches, participants, teams]);

  const activeParticipants = useMemo(() => {
    return participants.filter(p => {
      if (p.type === 'USER' && p.user_id && eliminatedUserIds.has(p.user_id)) return false;
      if (p.type === 'TEAM' && p.team_id) {
        const team = teams.find(t => t.id === p.team_id);
        if (team?.player_ids?.some(uid => eliminatedUserIds.has(uid))) return false;
      }
      return true;
    });
  }, [participants, teams, eliminatedUserIds]);

  const groupedMatches = useMemo(() => {
    return matches.reduce<Record<number, Match[]>>((groups, match) => {
      if (!groups[match.round_index]) {
        groups[match.round_index] = [];
      }
      groups[match.round_index].push(match);
      return groups;
    }, {});
  }, [matches]);

  const handleGenerateBracket = async () => {
    if (!tournamentId || !gameId) {
      toast({
        title: "Select tournament and game",
        description: "Both tournament and game are required to generate bracket.",
        variant: "destructive",
      });
      return;
    }

    if (participants.length < 2) {
      toast({
        title: "Not enough participants",
        description: "At least two participants are required to create a bracket.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const generated = generateSingleEliminationBracket(activeParticipants);
      await persistGeneratedMatches(tournamentId, gameId, generated);
      const refreshed = await fetchMatches({ tournamentId, gameId });
      setMatches(refreshed);
      toast({ title: "Bracket generated", description: "Matches created successfully." });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (match: Match, winnerId: string) => {
    try {
      await submitMatchResult(match.id, {
        tournament_id: match.tournament_id,
        game_id: match.game_id,
        winner_participant_id: winnerId,
        score_details: "",
        points_awarded: { [winnerId]: 3 },
        submitted_by: "admin",
      }, {
        id: currentUser?.uid || "unknown",
        name: currentUser?.displayName || currentUser?.email || "Admin"
      });

      if (match.next_match_id && match.winner_slot_in_next) {
        await updateMatch(
          match.next_match_id,
          match.winner_slot_in_next === "A"
            ? { participant_a_id: winnerId }
            : { participant_b_id: winnerId },
          {
            id: currentUser?.uid || "unknown",
            name: currentUser?.displayName || currentUser?.email || "Admin"
          }
        );
      }

      // Update Leaderboard
      const winnerParticipant = participantsMap[winnerId];
      const loserId = match.participant_a_id === winnerId ? match.participant_b_id : match.participant_a_id;
      const loserParticipant = loserId ? participantsMap[loserId] : undefined;

      if (winnerParticipant) {
        await recordMatchResultToLeaderboard({
          tournamentId: match.tournament_id,
          gameId: match.game_id,
          winnerId: winnerId,
          loserId: loserId,
          winnerName: getParticipantName(winnerParticipant),
          loserName: loserParticipant ? getParticipantName(loserParticipant) : undefined,
          winnerType: winnerParticipant.type,
          loserType: loserParticipant?.type,
          pointsForWin: 3,
        });
      }

      const refreshed = await fetchMatches({ tournamentId, gameId: gameId || undefined });
      setMatches(refreshed);
      toast({ title: "Result recorded" });
    } catch (error: any) {
      toast({ title: "Failed to record result", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2 w-full sm:w-64">
          <p className="text-sm font-medium">Tournament</p>
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
        <div className="flex flex-col gap-2 w-full sm:w-64">
          <p className="text-sm font-medium">Game</p>
          <Select value={gameId} onValueChange={setGameId} disabled={!tournamentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent>
              {games.map((game) => (
                <SelectItem value={game.id} key={game.id}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleGenerateBracket} disabled={!gameId || loading}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Generate Bracket
        </Button>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Match Schedule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Auto-generated bracket with manual override support.
            </p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {!tournamentId ? (
            <p className="text-muted-foreground text-sm">Select a tournament and game to view matches.</p>
          ) : matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No matches yet. Generate a bracket or create matches manually.
            </p>
          ) : (
            Object.entries(groupedMatches).map(([roundIndex, roundMatches]) => (
              <div key={roundIndex} className="mb-6">
                <p className="text-sm font-semibold mb-3 uppercase text-muted-foreground">
                  Round {Number(roundIndex) + 1}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {roundMatches.map((match) => {
                    const participantA = match.participant_a_id
                      ? participantsMap[match.participant_a_id]
                      : undefined;
                    const participantB = match.participant_b_id
                      ? participantsMap[match.participant_b_id]
                      : undefined;
                    return (
                      <Card key={match.id}>
                        <CardContent className="space-y-3 pt-4">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Match</p>
                            <p className="font-semibold">{match.round_name}</p>
                          </div>
                          <div className="space-y-2">
                            <div className={`flex items-center justify-between p-2 rounded-md ${match.status.toUpperCase() === 'COMPLETED'
                              ? match.winner_participant_id === participantA?.id
                                ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 opacity-70"
                              : ""
                              }`}>
                              <span className="truncate max-w-[150px] font-medium" title={getParticipantName(participantA)}>
                                {getParticipantName(participantA)}
                              </span>
                              <Button
                                variant={match.winner_participant_id === participantA?.id ? "default" : "outline"}
                                size="sm"
                                disabled={!participantA || match.status.toUpperCase() === 'COMPLETED'}
                                onClick={() => participantA && handleResult(match, participantA.id)}
                                className={match.winner_participant_id === participantA?.id ? "bg-green-600 hover:bg-green-700 h-7" : "h-7"}
                              >
                                {match.winner_participant_id === participantA?.id ? "Winner" : "Win"}
                              </Button>
                            </div>
                            <div className={`flex items-center justify-between p-2 rounded-md ${match.status.toUpperCase() === 'COMPLETED'
                              ? match.winner_participant_id === participantB?.id
                                ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 opacity-70"
                              : ""
                              }`}>
                              <span className="truncate max-w-[150px] font-medium" title={getParticipantName(participantB)}>
                                {getParticipantName(participantB)}
                              </span>
                              <Button
                                variant={match.winner_participant_id === participantB?.id ? "default" : "outline"}
                                size="sm"
                                disabled={!participantB || match.status.toUpperCase() === 'COMPLETED'}
                                onClick={() => participantB && handleResult(match, participantB.id)}
                                className={match.winner_participant_id === participantB?.id ? "bg-green-600 hover:bg-green-700 h-7" : "h-7"}
                              >
                                {match.winner_participant_id === participantB?.id ? "Winner" : "Win"}
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              disabled={match.status.toUpperCase() === 'COMPLETED'}
                              value={(() => {
                                if (!match.match_time) return "";
                                let date: Date;
                                if ((match.match_time as any)?.toDate) {
                                  date = (match.match_time as any).toDate();
                                } else if (match.match_time instanceof Date) {
                                  date = match.match_time;
                                } else {
                                  date = new Date(match.match_time as string);
                                }
                                if (isNaN(date.getTime())) return "";
                                // Format for datetime-local: YYYY-MM-DDThh:mm
                                return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                              })()}
                              onChange={(event) => {
                                const newDate = new Date(event.target.value);
                                if (isBefore(newDate, new Date())) {
                                  toast({
                                    title: "Invalid date",
                                    description: "Cannot set match time in the past.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                updateMatch(match.id, {
                                  match_time: newDate.toISOString(),
                                }, {
                                  id: currentUser?.uid || "unknown",
                                  name: currentUser?.displayName || currentUser?.email || "Admin"
                                });
                              }}
                            />
                            <Input
                              placeholder="Venue"
                              disabled={match.status.toUpperCase() === 'COMPLETED'}
                              value={match.venue || ""}
                              onChange={(event) =>
                                updateMatch(match.id, {
                                  venue: event.target.value,
                                }, {
                                  id: currentUser?.uid || "unknown",
                                  name: currentUser?.displayName || currentUser?.email || "Admin"
                                })
                              }
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchesManagement;