import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { createRegistration, fetchRegistrations } from "@/services/firestore/registrations";
import { useAuth } from "@/contexts/AuthContext";
import { Tournament, Game, Registration } from "@/types/tournament";
import { Loader2, Trophy, Users, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GameRegistration = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
    const [games, setGames] = useState<Game[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingGames, setLoadingGames] = useState(false);

    // Fetch all tournaments on component mount
    useEffect(() => {
        const loadTournaments = async () => {
            setLoading(true);
            try {
                const tournamentsData = await fetchTournaments();
                console.log("Fetched tournaments:", tournamentsData);
                // Show all tournaments (removed strict filtering for debugging)
                const availableTournaments = tournamentsData.filter(t => t.is_active);
                console.log("Available tournaments:", availableTournaments);
                setTournaments(availableTournaments);

                if (availableTournaments.length === 0) {
                    toast({
                        title: "No Tournaments",
                        description: "No active tournaments found. Please ensure tournaments are created in admin panel.",
                    });
                }
            } catch (error) {
                console.error("Error loading tournaments:", error);
                toast({
                    title: "Error",
                    description: "Failed to load tournaments",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadTournaments();
    }, [toast]);

    // Fetch games and user's registrations when tournament is selected
    useEffect(() => {
        if (!selectedTournamentId || !user) {
            setGames([]);
            setRegistrations([]);
            return;
        }

        const loadGamesAndRegistrations = async () => {
            setLoadingGames(true);
            try {
                const [gamesData, userRegistrations] = await Promise.all([
                    fetchGames(selectedTournamentId),
                    fetchRegistrations({ tournamentId: selectedTournamentId }),
                ]);

                console.log("Fetched games for tournament:", selectedTournamentId, gamesData);
                // Show all games (removed strict is_active filter for now)
                setGames(gamesData);

                console.log("User registrations:", userRegistrations);
                // Filter registrations for current user
                const userRegs = userRegistrations.filter(r => r.user_id === user.uid);
                console.log("User's registrations:", userRegs);
                setRegistrations(userRegs);

                if (gamesData.length === 0) {
                    toast({
                        title: "No Games",
                        description: "No games found in this tournament. Please ensure games are created in admin panel.",
                    });
                }
            } catch (error) {
                console.error("Error loading games:", error);
                toast({
                    title: "Error",
                    description: "Failed to load games",
                    variant: "destructive",
                });
            } finally {
                setLoadingGames(false);
            }
        };

        loadGamesAndRegistrations();
    }, [selectedTournamentId, user, toast]);

    const getRegistrationStatus = (gameId: string) => {
        return registrations.find(r => r.game_id === gameId);
    };

    const handleRegister = async (gameId: string) => {
        if (!user || !selectedTournamentId) return;

        try {
            await createRegistration({
                tournament_id: selectedTournamentId,
                game_id: gameId,
                user_id: user.uid,
            });

            toast({
                title: "Registration Submitted",
                description: "Your registration has been submitted for admin approval.",
            });

            // Reload registrations
            const userRegistrations = await fetchRegistrations({
                tournamentId: selectedTournamentId
            });
            const userRegs = userRegistrations.filter(r => r.user_id === user.uid);
            setRegistrations(userRegs);
        } catch (error: any) {
            console.error("Error registering:", error);
            toast({
                title: "Registration Failed",
                description: error.message || "Failed to submit registration",
                variant: "destructive",
            });
        }
    };

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

    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

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
                <h1 className="text-3xl font-bold mb-2">Register for Games</h1>
                <p className="text-muted-foreground">
                    Browse available tournaments and register for games
                </p>
            </div>

            {/* Tournament Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Tournament</CardTitle>
                    <CardDescription>Choose a tournament to view available games</CardDescription>
                </CardHeader>
                <CardContent>
                    {tournaments.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                No active tournaments available at the moment. Please check back later.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a tournament" />
                            </SelectTrigger>
                            <SelectContent>
                                {tournaments.map((tournament) => (
                                    <SelectItem value={tournament.id} key={tournament.id}>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4" />
                                            <span>{tournament.name}</span>
                                            <Badge variant="outline" className="ml-2">
                                                {tournament.status}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {/* Tournament Info */}
            {selectedTournament && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            {selectedTournament.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-medium">
                                {selectedTournament.start_date
                                    ? new Date(selectedTournament.start_date).toLocaleDateString()
                                    : "TBA"}
                            </span>
                        </div>
                        {selectedTournament.end_date && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">End Date:</span>
                                <span className="font-medium">
                                    {new Date(selectedTournament.end_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Available Games */}
            {selectedTournamentId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Available Games</CardTitle>
                        <CardDescription>
                            {games.length} game{games.length !== 1 ? 's' : ''} available for registration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingGames ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : games.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    No active games available in this tournament yet.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {games.map((game) => {
                                    const registration = getRegistrationStatus(game.id);
                                    const isRegistered = !!registration;
                                    const isPending = registration?.status === "pending";
                                    const isApproved = registration?.status === "approved";
                                    const isRejected = registration?.status === "rejected";

                                    return (
                                        <Card key={game.id} className="relative overflow-hidden">
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-start justify-between">
                                                    <span>{game.name}</span>
                                                    {isApproved && (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                    )}
                                                    {isPending && (
                                                        <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                                    )}
                                                    {isRejected && (
                                                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">Type:</span>
                                                        <Badge variant="secondary">
                                                            {getGameTypeLabel(game.game_type)}
                                                        </Badge>
                                                    </div>
                                                    {game.game_type !== "SINGLE" && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">Players per team:</span>
                                                            <span className="font-medium">{game.players_per_team}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {isRegistered && (
                                                    <div className="pt-2">
                                                        <Badge
                                                            variant={
                                                                isApproved ? "default" :
                                                                    isPending ? "secondary" :
                                                                        "destructive"
                                                            }
                                                            className="w-full justify-center py-2"
                                                        >
                                                            {isApproved && "✓ Approved"}
                                                            {isPending && "⏳ Pending Approval"}
                                                            {isRejected && "✗ Rejected"}
                                                        </Badge>
                                                    </div>
                                                )}

                                                {!isRegistered && (
                                                    <Button
                                                        className="w-full"
                                                        onClick={() => handleRegister(game.id)}
                                                    >
                                                        Register Now
                                                    </Button>
                                                )}

                                                {isRejected && (
                                                    <Button
                                                        className="w-full"
                                                        variant="outline"
                                                        onClick={() => handleRegister(game.id)}
                                                    >
                                                        Register Again
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!selectedTournamentId && tournaments.length > 0 && (
                <Alert>
                    <AlertDescription>
                        Please select a tournament above to view available games.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};

export default GameRegistration;
