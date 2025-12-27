import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMatchesForParticipants, fetchMatchResultsForMatches } from "@/services/firestore/matches";
import { fetchUserParticipants, fetchParticipantsByTeamIds, fetchParticipants } from "@/services/firestore/participants";
import { fetchTeams } from "@/services/firestore/teams";
import { fetchGames } from "@/services/firestore/games";
import { fetchUsers, User } from "@/services/firestore/users";
import { Match, Participant, Team, Game } from "@/types/tournament";
import { Loader2, Clock, MapPin, Trophy, Calendar } from "lucide-react";
import { format, isValid } from "date-fns";

const MyMatches = () => {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [myTeams, userParticipants, allGames, allUsers] = await Promise.all([
                    fetchTeams({ userId: user.uid }),
                    fetchUserParticipants(user.uid),
                    fetchGames(),
                    fetchUsers()
                ]);

                const teamIds = myTeams.map(t => t.id);
                const teamParticipants = await fetchParticipantsByTeamIds(teamIds);

                const allMyParticipants = [...userParticipants, ...teamParticipants];
                const myParticipantIds = allMyParticipants.map(p => p.id);

                const [myMatches, allParticipantsData] = await Promise.all([
                    fetchMatchesForParticipants(myParticipantIds),
                    fetchParticipants({}) // Fetch all to resolve names
                ]);

                setMatches(myMatches);
                setParticipants(allParticipantsData);
                setTeams(myTeams);
                setGames(allGames);
                setUsers(allUsers);
            } catch (error) {
                console.error("Error loading matches:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const usersMap = useMemo(() => {
        return users.reduce<Record<string, User>>((acc, u) => { acc[u.id] = u; return acc; }, {});
    }, [users]);

    const teamsMap = useMemo(() => {
        // We need more than just 'myTeams' to resolve names of opponents
        return []; // Ideally we fetch all teams involved in matches
    }, []);

    const getParticipantName = (pId?: string) => {
        if (!pId) return "TBD";
        const p = participants.find(part => part.id === pId);
        if (!p) return "Participant";
        if (p.type === 'USER' && p.user_id) return usersMap[p.user_id]?.name || "User";
        // For teams, we might need a global team fetch or just the name from Participant if we store it
        return "Team " + (p.team_id?.slice(-4) || "");
    };

    const getGameName = (gameId: string) => {
        return games.find(g => g.id === gameId)?.name || "Unknown Game";
    };

    const formatDate = (dateValue: any) => {
        if (!dateValue) return "TBD";
        const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
        return isValid(date) ? format(date, "PPp") : "TBD";
    };

    const upcomingMatches = matches.filter(m => m.status.toUpperCase() !== 'COMPLETED' && m.status.toUpperCase() !== 'CANCELLED');
    const pastMatches = matches.filter(m => m.status.toUpperCase() === 'COMPLETED');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">My Matches</h1>
                <p className="text-muted-foreground">Detailed view of your scheduled and past matches</p>
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-primary" />
                        Upcoming Matches
                    </h2>
                    {upcomingMatches.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {upcomingMatches.map(match => (
                                <Card key={match.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="mb-2">{getGameName(match.game_id)}</Badge>
                                                <CardTitle className="text-lg">{match.round_name}</CardTitle>
                                            </div>
                                            <Badge>{match.status}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between text-sm py-2 border-y">
                                            <div className="text-center flex-1 font-semibold">{getParticipantName(match.participant_a_id)}</div>
                                            <div className="px-3 text-muted-foreground font-bold italic">VS</div>
                                            <div className="text-center flex-1 font-semibold">{getParticipantName(match.participant_b_id)}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pt-2">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>{formatDate(match.match_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span className="truncate">{match.venue || "Venue TBD"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No upcoming matches scheduled yet.
                            </CardContent>
                        </Card>
                    )}
                </section>

                <section>
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Match History
                    </h2>
                    {pastMatches.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {pastMatches.map(match => (
                                <Card key={match.id} className="bg-muted/20">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2">{getGameName(match.game_id)}</Badge>
                                                <CardTitle className="text-lg opacity-80">{match.round_name}</CardTitle>
                                            </div>
                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between text-sm py-2 border-y">
                                            <div className={`text-center flex-1 ${match.winner_participant_id === match.participant_a_id ? "font-bold text-green-600" : "opacity-60"}`}>
                                                {getParticipantName(match.participant_a_id)}
                                                {match.winner_participant_id === match.participant_a_id && " 🏆"}
                                            </div>
                                            <div className="px-3 text-muted-foreground font-bold italic">VS</div>
                                            <div className={`text-center flex-1 ${match.winner_participant_id === match.participant_b_id ? "font-bold text-green-600" : "opacity-60"}`}>
                                                {getParticipantName(match.participant_b_id)}
                                                {match.winner_participant_id === match.participant_b_id && " 🏆"}
                                            </div>
                                        </div>
                                        <div className="text-center text-xs text-muted-foreground">
                                            Match played on {formatDate(match.match_time)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No past match history available.
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </div>
    );
};

export default MyMatches;
