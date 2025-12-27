import { useEffect, useMemo, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchMatches } from "@/services/firestore/matches";
import { fetchParticipants } from "@/services/firestore/participants";
import { Match, Participant } from "@/types/tournament";
import { Loader2, MapPin, Clock } from "lucide-react";

const formatDateTime = (value?: string) => {
  if (!value) return "TBD";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const SchedulePage = () => {
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const { setIsLoading } = useLoading();

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
      setGames([]);
      setMatches([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      const [gamesResponse, matchesResponse, participantsResponse] = await Promise.all([
        fetchGames(tournamentId),
        fetchMatches({ tournamentId, gameId: gameId || undefined }),
        fetchParticipants({ tournamentId, gameId: gameId || undefined }),
      ]);
      setGames(gamesResponse);
      setMatches(matchesResponse);
      setParticipants(participantsResponse);
      setLoading(false);
      setIsLoading(false);
    };
    if (tournamentId) {
      setIsLoading(true);
      load();
    }
  }, [tournamentId, gameId, setIsLoading]);

  const participantLookup = useMemo(() => {
    return participants.reduce<Record<string, Participant>>((acc, participant) => {
      acc[participant.id] = participant;
      return acc;
    }, {});
  }, [participants]);

  const upcomingMatches = matches.filter((match) => match.status !== "COMPLETED");

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-muted-foreground tracking-wide">Live Schedule</p>
            <h1 className="text-3xl font-bold">Matches & Fixtures</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Stay on top of every match happening this week. Filter by tournament or sport to find
              exact fixtures, venues, and kickoff times.
            </p>
          </div>
          <div className="w-full md:w-[28rem] flex flex-col gap-3">
            <div>
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
            <div>
              <p className="text-xs uppercase text-muted-foreground font-medium mb-1">Game</p>
              <Select value={gameId} onValueChange={setGameId} disabled={!tournamentId}>
                <SelectTrigger>
                  <SelectValue placeholder="All games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All games</SelectItem>
                  {games.map((game) => (
                    <SelectItem value={game.id} key={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming & Live Matches</CardTitle>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {!tournamentId ? (
              <p className="text-sm text-muted-foreground">Select a tournament to view fixtures.</p>
            ) : upcomingMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scheduled matches yet. Check back later once brackets are published.
              </p>
            ) : (
              <div className="grid gap-4">
                {upcomingMatches.map((match) => {
                  const participantA = match.participant_a_id
                    ? participantLookup[match.participant_a_id]
                    : undefined;
                  const participantB = match.participant_b_id
                    ? participantLookup[match.participant_b_id]
                    : undefined;
                  const gameName = games.find((game) => game.id === match.game_id)?.name ?? "Tournament Game";

                  return (
                    <div key={match.id} className="rounded-xl border bg-background p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground tracking-wide">{gameName}</p>
                          <h3 className="text-lg font-semibold">{match.round_name}</h3>
                        </div>
                        <Badge variant={match.status === "SCHEDULED" ? "secondary" : "default"}>
                          {match.status === "SCHEDULED" ? "Scheduled" : match.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-muted-foreground">Participant A</p>
                          <p className="text-lg font-medium">
                            {participantA?.user_id || participantA?.team_id || "TBD"}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-muted-foreground">Participant B</p>
                          <p className="text-lg font-medium">
                            {participantB?.user_id || participantB?.team_id || "TBD"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(match.match_time)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {match.venue || "Venue TBD"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchedulePage;

