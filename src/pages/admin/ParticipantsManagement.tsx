import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchRegistrations } from "@/services/firestore/registrations";
import { fetchUsers, User } from "@/services/firestore/users";
import { Registration, RegistrationStatus } from "@/types/tournament";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusVariant: Record<RegistrationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const ParticipantsManagement = () => {
  const [tournamentId, setTournamentId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    let d: Date;
    if (typeof date === 'object' && date.toDate) {
      d = date.toDate();
    } else if (typeof date === 'object' && date.seconds) {
      d = new Date(date.seconds * 1000);
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

    const load = async () => {
      setLoading(true);
      const [gamesResponse, registrationsResponse] = await Promise.all([
        fetchGames(tournamentId),
        fetchRegistrations({
          tournamentId,
          gameId: gameId && gameId !== "all" ? gameId : undefined,
          status: statusFilter !== "all" ? statusFilter as RegistrationStatus : undefined
        }),
      ]);
      setGames(gamesResponse);
      setRegistrations(registrationsResponse);
      setLoading(false);
    };

    load();
  }, [tournamentId, gameId, statusFilter]);

  const filteredRegistrations = useMemo(() => {
    return registrations;
  }, [registrations]);

  const getUserDetails = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return {
      name: user?.name ?? userId,
      email: user?.email ?? "",
    };
  };

  const getGameName = (gameId: string) => {
    return games.find((g) => g.id === gameId)?.name ?? "Unknown Game";
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

        <div className="flex flex-col gap-2 w-full sm:w-64">
          <p className="text-sm font-medium">Registration Status</p>
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!tournamentId}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved">Approved only</SelectItem>
              <SelectItem value="pending">Pending only</SelectItem>
              <SelectItem value="rejected">Rejected only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Participants List</CardTitle>
            <p className="text-sm text-muted-foreground">
              View all user registrations with approval status and game details.
            </p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {!tournamentId ? (
            <p className="text-muted-foreground text-sm">Select a tournament to view participants.</p>
          ) : filteredRegistrations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No registrations found.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Game</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((registration) => {
                      const userDetails = getUserDetails(registration.user_id);
                      return (
                        <tr key={registration.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium">{userDetails.name}</p>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {userDetails.email}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {getGameName(registration.game_id)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusVariant[registration.status]}>
                              {registration.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(registration.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tournamentId && filteredRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{registrations.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {registrations.filter(r => r.status === "approved").length}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {registrations.filter(r => r.status === "pending").length}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {registrations.filter(r => r.status === "rejected").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParticipantsManagement;

