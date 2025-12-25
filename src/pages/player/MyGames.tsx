import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRegistrations } from "@/services/firestore/registrations";
import { fetchGames } from "@/services/firestore/games";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchTeams } from "@/services/firestore/teams";
import { Registration, Game, Tournament, Team } from "@/types/tournament";
import { Loader2, Trophy, Users, Calendar, CheckCircle2, Clock, XCircle, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchUsers, User } from "@/services/firestore/users";

const MyGames = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

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
        const loadData = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // Fetch all data
                const [allRegistrations, allGames, allTournaments, allTeams, allUsers] = await Promise.all([
                    fetchRegistrations({}),
                    fetchGames(),
                    fetchTournaments(),
                    fetchTeams({ userId: user.uid }),
                    fetchUsers()
                ]);

                // Filter registrations for current user
                const userRegistrations = allRegistrations.filter(r => r.user_id === user.uid);

                setRegistrations(userRegistrations);
                setGames(allGames);
                setTournaments(allTournaments);
                setTeams(allTeams);
                setUsers(allUsers);
            } catch (error) {
                console.error("Error loading data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load your games",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, toast]);

    const getGame = (gameId: string) => games.find(g => g.id === gameId);
    const getTournament = (tournamentId: string) => tournaments.find(t => t.id === tournamentId);
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || "Unknown User";

    const getGameTypeLabel = (type: string) => {
        switch (type) {
            case "SINGLE":
                return "Single Player";
            case "PAIR":
                return "Pair (2 Players)";
            case "TEAM":
                return "Team";
            default:
                return type;
        }
    };

    const pendingRegistrations = registrations.filter(r => r.status === "pending");
    const approvedRegistrations = registrations.filter(r => r.status === "approved");
    const rejectedRegistrations = registrations.filter(r => r.status === "rejected");

    const RegistrationCard = ({ registration }: { registration: Registration }) => {
        const game = getGame(registration.game_id);
        const tournament = getTournament(registration.tournament_id);

        if (!game || !tournament) return null;

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">{game.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                {tournament.name}
                            </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge
                                variant={
                                    registration.status === "approved" ? "default" :
                                        registration.status === "pending" ? "secondary" :
                                            "destructive"
                                }
                            >
                                {registration.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {registration.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                {registration.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                                {registration.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Type:</span>
                        </div>
                        <Badge variant="outline">
                            {getGameTypeLabel(game.game_type)}
                        </Badge>

                        {tournament.start_date && (
                            <>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Start:</span>
                                </div>
                                <span className="font-medium">
                                    {formatDate(tournament.start_date)}
                                </span>
                            </>
                        )}
                    </div>

                    {registration.notes && (
                        <div className="pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Note:</span> {registration.notes}
                            </p>
                        </div>
                    )}

                    <div className="pt-2 text-xs text-muted-foreground">
                        Registered on {formatDate(registration.created_at)}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">My Games</h1>
                <p className="text-muted-foreground">
                    View and manage your game registrations
                </p>
            </div>

            {registrations.length === 0 && teams.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <Alert>
                            <AlertDescription className="text-center">
                                You haven't registered for any games or joined any teams yet. Visit the <strong>Register for Games</strong> page to get started!
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-5 max-w-3xl">
                        <TabsTrigger value="all">
                            All ({registrations.length})
                        </TabsTrigger>
                        <TabsTrigger value="teams">
                            Teams ({teams.length})
                        </TabsTrigger>
                        <TabsTrigger value="pending">
                            Pending ({pendingRegistrations.length})
                        </TabsTrigger>
                        <TabsTrigger value="approved">
                            Approved ({approvedRegistrations.length})
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            Rejected ({rejectedRegistrations.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        {registrations.length === 0 ? (
                            <Alert>
                                <AlertDescription>No registrations found.</AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {registrations.map(registration => (
                                    <RegistrationCard key={registration.id} registration={registration} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="teams" className="space-y-4">
                        {teams.length === 0 ? (
                            <Alert>
                                <AlertDescription>You are not part of any teams yet.</AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {teams.map(team => {
                                    const tournament = getTournament(team.tournament_id);
                                    const game = getGame(team.game_id);
                                    const teamMembers = team.player_ids
                                        .filter(id => id !== user?.uid)
                                        .map(id => getUserName(id));

                                    return (
                                        <Card key={team.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-lg">{team.name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-2">
                                                            <Trophy className="h-4 w-4" />
                                                            {tournament?.name} - {game?.name}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant={team.status === 'confirmed' ? "default" : "secondary"}>
                                                        {team.status}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground min-w-[60px]">
                                                        <Users className="h-4 w-4" />
                                                        <span>Type:</span>
                                                    </div>
                                                    <span className="font-medium">{team.is_pair ? "Pair" : "Team"}</span>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <UserPlus className="h-4 w-4" />
                                                        <span>Teammates:</span>
                                                    </div>
                                                    {teamMembers.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2 pl-6">
                                                            {teamMembers.map((name, index) => (
                                                                <Badge key={index} variant="outline" className="bg-muted/50">
                                                                    {name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground pl-6 italic">
                                                            No other members yet
                                                        </span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        {pendingRegistrations.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    No pending registrations. All your registrations have been processed.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingRegistrations.map(registration => (
                                    <RegistrationCard key={registration.id} registration={registration} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="approved" className="space-y-4">
                        {approvedRegistrations.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    No approved registrations yet. Check back later!
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {approvedRegistrations.map(registration => (
                                    <RegistrationCard key={registration.id} registration={registration} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="rejected" className="space-y-4">
                        {rejectedRegistrations.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    No rejected registrations. Great!
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {rejectedRegistrations.map(registration => (
                                    <RegistrationCard key={registration.id} registration={registration} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default MyGames;
