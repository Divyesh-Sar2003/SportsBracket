import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlayCircle } from "lucide-react";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchParticipants } from "@/services/firestore/participants";
import { fetchMatches, updateMatch, submitMatchResult } from "@/services/firestore/matches";
import { Participant, Match } from "@/types/tournament";
import { generateSingleEliminationBracket, persistGeneratedMatches } from "@/lib/bracket";
import { useToast } from "@/hooks/use-toast";

type TournamentOption = { id: string; name: string };

const MatchesManagement = () => {
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments().then(setTournaments);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!tournamentId) {
        setGames([]);
        setParticipants([]);
        setMatches([]);
        return;
      }

      setLoading(true);
      const [gamesResponse, participantsResponse, matchesResponse] = await Promise.all([
        fetchGames(tournamentId),
        fetchParticipants({ tournamentId, gameId: gameId || undefined }),
        fetchMatches({ tournamentId, gameId: gameId || undefined }),
      ]);
      setGames(gamesResponse);
      setParticipants(participantsResponse);
      setMatches(matchesResponse);
      setLoading(false);
    };

    load();
  }, [tournamentId, gameId]);

  const participantsMap = useMemo(() => {
    return participants.reduce<Record<string, Participant>>((acc, participant) => {
      acc[participant.id] = participant;
      return acc;
    }, {});
  }, [participants]);

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
      const generated = generateSingleEliminationBracket(participants);
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
      });

      if (match.next_match_id && match.winner_slot_in_next) {
        await updateMatch(
          match.next_match_id,
          match.winner_slot_in_next === "A"
            ? { participant_a_id: winnerId }
            : { participant_b_id: winnerId }
        );
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
                            <div className="flex items-center justify-between">
                              <span>{participantA?.user_id || participantA?.team_id || "TBD"}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!participantA}
                                onClick={() => participantA && handleResult(match, participantA.id)}
                              >
                                Win
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{participantB?.user_id || participantB?.team_id || "TBD"}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!participantB}
                                onClick={() => participantB && handleResult(match, participantB.id)}
                              >
                                Win
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              value={match.match_time || ""}
                              onChange={(event) =>
                                updateMatch(match.id, {
                                  match_time: event.target.value,
                                })
                              }
                            />
                            <Input
                              placeholder="Venue"
                              value={match.venue || ""}
                              onChange={(event) =>
                                updateMatch(match.id, {
                                  venue: event.target.value,
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