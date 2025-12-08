import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import {
  fetchRegistrations,
  updateRegistrationStatus,
} from "@/services/firestore/registrations";
import { addParticipant } from "@/services/firestore/participants";
import { fetchUsers, User } from "@/services/firestore/users";
import { Registration, RegistrationStatus } from "@/types/tournament";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  sendGameRegistrationApprovalNotification,
  sendGameRegistrationRejectionNotification
} from "@/utils/notifications";

const statusVariant: Record<RegistrationStatus, "default" | "secondary" | "destructive" | "outline"> =
{
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const RegistrationsManagement = () => {
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialData = async () => {
      const [tournamentsResponse, usersResponse] = await Promise.all([
        fetchTournaments(),
        fetchUsers(),
      ]);
      setTournaments(tournamentsResponse);
      setUsers(usersResponse);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!tournamentId) {
      setGames([]);
      setRegistrations([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [gamesResponse, registrationsResponse] = await Promise.all([
        fetchGames(tournamentId),
        fetchRegistrations({ tournamentId, gameId: gameId || undefined }),
      ]);
      setGames(gamesResponse);
      setRegistrations(registrationsResponse);
      setLoading(false);
    };

    loadData();
  }, [tournamentId, gameId]);

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === tournamentId),
    [tournaments, tournamentId]
  );

  const handleDecision = async (
    registration: Registration,
    decision: Extract<RegistrationStatus, "approved" | "rejected">
  ) => {
    try {
      await updateRegistrationStatus(registration.id, decision);

      // Find the game name for the notification
      const game = games.find(g => g.id === registration.game_id);
      const gameName = game?.name || "Unknown Game";

      if (decision === "approved") {
        const participantId = await addParticipant({
          tournament_id: registration.tournament_id,
          game_id: registration.game_id,
          type: "USER",
          user_id: registration.user_id,
        });

        await sendGameRegistrationApprovalNotification(registration.user_id, {
          tournamentName: selectedTournament?.name || "Tournament",
          gameName: gameName,
        });

        console.debug("Participant created:", participantId);
      } else if (decision === "rejected") {
        await sendGameRegistrationRejectionNotification(registration.user_id, {
          tournamentName: selectedTournament?.name || "Tournament",
          gameName: gameName,
        });
      }

      toast({
        title: `Registration ${decision}`,
        description: decision === "approved" ? "Player added to participants list." : "Player notified of rejection.",
      });
      const refreshed = await fetchRegistrations({
        tournamentId: registration.tournament_id,
        gameId: gameId || undefined,
      });
      setRegistrations(refreshed);
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
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
              <SelectItem value="all">All games</SelectItem>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Registrations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Approve or reject player registrations for the selected tournament.
            </p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {!tournamentId ? (
            <p className="text-muted-foreground text-sm">Select a tournament to view registrations.</p>
          ) : registrations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No registrations found.</p>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {users.find((user) => user.id === registration.user_id)?.name ?? registration.user_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {users.find((user) => user.id === registration.user_id)?.email ?? ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Game: {games.find((game) => game.id === registration.game_id)?.name ?? "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[registration.status]}>{registration.status}</Badge>
                    {registration.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleDecision(registration, "approved")}>
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDecision(registration, "rejected")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
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

export default RegistrationsManagement;

