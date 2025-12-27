import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRegistrations } from "@/services/firestore/registrations";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { Tournament, Registration } from "@/types/tournament";
import { Loader2, Trophy, Calendar, CheckCircle2, Clock, XCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const MyTournaments = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [tournaments, setTournaments] = useState<(Tournament & { userStatus?: string })[]>([]);
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
                const [allRegistrations, allTournaments] = await Promise.all([
                    fetchRegistrations({ userId: user.uid }),
                    fetchTournaments()
                ]);

                const userTournamentIds = Array.from(new Set(allRegistrations.map(r => r.tournament_id)));

                const userTournaments = allTournaments
                    .filter(t => userTournamentIds.includes(t.id))
                    .map(t => {
                        const reg = allRegistrations.find(r => r.tournament_id === t.id);
                        return { ...t, userStatus: reg?.status };
                    });

                setTournaments(userTournaments);
            } catch (error) {
                console.error("Error loading tournaments:", error);
                toast({
                    title: "Error",
                    description: "Failed to load your tournaments",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, toast]);

    const activeTournaments = tournaments.filter(t => t.status === 'active' || t.is_active);
    const pendingTournaments = tournaments.filter(t => t.userStatus === 'pending');
    const pastTournaments = tournaments.filter(t => t.status === 'completed');

    const TournamentCard = ({ tournament }: { tournament: Tournament & { userStatus?: string } }) => {
        return (
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className={cn(
                    "h-2 w-full",
                    tournament.status === 'active' ? "bg-green-500" :
                        tournament.status === 'completed' ? "bg-gray-500" : "bg-blue-500"
                )} />
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">{tournament.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                Tournament
                            </CardDescription>
                        </div>
                        <Badge variant={tournament.status === 'active' ? "default" : "secondary"}>
                            {tournament.status?.toUpperCase() || (tournament.is_active ? 'ACTIVE' : 'INACTIVE')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Start Date</p>
                                <p className="font-medium">{formatDate(tournament.start_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">End Date</p>
                                <p className="font-medium">{formatDate(tournament.end_date)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Registration:</span>
                            <Badge
                                variant={tournament.userStatus === 'approved' ? 'outline' : 'secondary'}
                                className={cn(
                                    tournament.userStatus === 'approved' ? "text-green-600 border-green-600" :
                                        tournament.userStatus === 'pending' ? "text-amber-600 border-amber-600" : "text-red-600 border-red-600"
                                )}
                            >
                                {tournament.userStatus?.toUpperCase() || 'N/A'}
                            </Badge>
                        </div>
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
                <h1 className="text-3xl font-bold mb-2">My Tournaments</h1>
                <p className="text-muted-foreground">
                    Tournaments you have registered for or participated in
                </p>
            </div>

            {tournaments.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <Alert>
                            <AlertDescription className="text-center py-8">
                                <p className="mb-4">You haven't joined any tournaments yet.</p>
                                <a href="/dashboard/register" className="text-primary font-medium hover:underline">
                                    Browse available tournaments to join!
                                </a>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">All ({tournaments.length})</TabsTrigger>
                        <TabsTrigger value="active">Active ({activeTournaments.length})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({pendingTournaments.length})</TabsTrigger>
                        <TabsTrigger value="past">Past ({pastTournaments.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tournaments.map(tournament => (
                            <TournamentCard key={tournament.id} tournament={tournament} />
                        ))}
                    </TabsContent>

                    <TabsContent value="active" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeTournaments.length > 0 ? (
                            activeTournaments.map(tournament => (
                                <TournamentCard key={tournament.id} tournament={tournament} />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                No active tournaments currently.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="pending" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pendingTournaments.length > 0 ? (
                            pendingTournaments.map(tournament => (
                                <TournamentCard key={tournament.id} tournament={tournament} />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                No pending registrations.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="past" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pastTournaments.length > 0 ? (
                            pastTournaments.map(tournament => (
                                <TournamentCard key={tournament.id} tournament={tournament} />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                No past tournaments found.
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default MyTournaments;
