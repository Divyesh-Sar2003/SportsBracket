import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchParticipants, updateParticipant, deleteParticipant } from "@/services/firestore/participants";
import { Participant } from "@/types/tournament";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ParticipantsManagement = () => {
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments().then(setTournaments);
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setGames([]);
      setParticipants([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      const [gamesResponse, participantsResponse] = await Promise.all([
        fetchGames(tournamentId),
        fetchParticipants({ tournamentId, gameId: gameId || undefined }),
      ]);
      setGames(gamesResponse);
      setParticipants(participantsResponse);
      setLoading(false);
    };

    load();
  }, [tournamentId, gameId]);

  const selectedGame = useMemo(() => games.find((g) => g.id === gameId), [games, gameId]);

  const handleSeedUpdate = async (participant: Participant, seed: number) => {
    try {
      await updateParticipant(participant.id, { seed });
      toast({ title: "Seed updated" });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleRemove = async (participantId: string) => {
    try {
      await deleteParticipant(participantId);
      setParticipants((prev) => prev.filter((participant) => participant.id !== participantId));
      toast({ title: "Participant removed" });
    } catch (error: any) {
      toast({ title: "Removal failed", description: error.message, variant: "destructive" });
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

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Participants</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage seeds and eligibility for bracket generation.
            </p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {!tournamentId ? (
            <p className="text-muted-foreground text-sm">Select a tournament to view participants.</p>
          ) : participants.length === 0 ? (
            <p className="text-muted-foreground text-sm">No participants found.</p>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex flex-col gap-3 border rounded-lg p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{participant.user_id || participant.team_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {participant.type === "USER" ? "Player" : "Team"} •
                      {" "}{selectedGame?.name ?? "Tournament Game"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Seed</p>
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        defaultValue={participant.seed ?? ""}
                        onBlur={(event) => {
                          const nextSeed = Number(event.target.value);
                          if (!Number.isNaN(nextSeed) && nextSeed > 0) {
                            handleSeedUpdate(participant, nextSeed);
                          }
                        }}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(participant.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantsManagement;

