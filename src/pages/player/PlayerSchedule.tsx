import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMatchResultsForMatches, fetchMatchesForParticipants } from "@/services/firestore/matches"; // Modified import
import { fetchUserParticipants, fetchParticipantsByTeamIds } from "@/services/firestore/participants";
import { fetchTeams } from "@/services/firestore/teams";
import { Match, Team, Participant } from "@/types/tournament"; // Ensure Match is imported
import { useNavigate } from "react-router-dom";
import { fetchGames } from "@/services/firestore/games";
import { fetchUsers, User } from "@/services/firestore/users";
import { fetchParticipants } from "@/services/firestore/participants";

const PlayerSchedule = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [games, setGames] = useState<any[]>([]);
    const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [teamsState, setTeamsState] = useState<Team[]>([]);

    useEffect(() => {
        const loadSchedule = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch basic data for mapping
                const [gamesData, usersData, allTeams] = await Promise.all([
                    fetchGames(),
                    fetchUsers(),
                    fetchTeams({ userId: user.uid })
                ]);

                setGames(gamesData);
                setUsers(usersData);
                setTeamsState(allTeams);

                // Find all participant IDs relevant to the user
                const teamIds = allTeams.map(t => t.id);

                const [userParticipants, teamParticipants] = await Promise.all([
                    fetchUserParticipants(user.uid),
                    fetchParticipantsByTeamIds(teamIds)
                ]);

                const allMyParticipants = [...userParticipants, ...teamParticipants];
                const participantIds = allMyParticipants.map(p => p.id);

                const myMatches = await fetchMatchesForParticipants(participantIds);
                setMatches(myMatches);

            } catch (error) {
                console.error("Error loading schedule:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSchedule();
    }, [user]);

    const getMatchesForDate = (date: Date) => {
        return matches.filter(m => {
            if (!m.match_time) return false;
            const matchDate = (m.match_time as any)?.toDate
                ? (m.match_time as any).toDate()
                : new Date(m.match_time!);
            return isSameDay(matchDate, date);
        });
    };

    const getGameName = (gameId: string) => {
        return games.find(g => g.id === gameId)?.name || "Unknown Game";
    };

    const handleMatchClick = () => {
        setDialogOpen(false);
        navigate("/dashboard/matches"); // Or where the detailed matches list is
    };

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const calendarChunks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        calendarChunks.push(calendarDays.slice(i, i + 7));
    }
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Schedule</h1>
                    <p className="text-muted-foreground">View and track your upcoming matches</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b">
                        {dayNames.map(day => (
                            <div key={day} className="p-4 text-center font-medium text-sm text-muted-foreground border-r last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {calendarChunks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                            {week.map((date, dayIndex) => {
                                const dayMatches = getMatchesForDate(date);
                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                const isCurrentMonth = isSameMonth(date, currentMonth);

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`min-h-[120px] p-2 border-r last:border-r-0 transition-colors cursor-pointer hover:bg-muted/50
                                            ${!isCurrentMonth ? 'bg-muted/10 text-muted-foreground' : ''}
                                            ${isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''}
                                            ${isToday(date) ? 'bg-accent/50' : ''}
                                        `}
                                        onClick={() => {
                                            if (dayMatches.length > 0) {
                                                setSelectedDate(date);
                                                setDialogOpen(true);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
                                                ${isToday(date) ? 'bg-primary text-primary-foreground' : ''}
                                            `}>
                                                {format(date, "d")}
                                            </span>
                                            {dayMatches.length > 0 && (
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                    {dayMatches.length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {dayMatches.slice(0, 3).map(match => {
                                                const matchDate = (match.match_time as any)?.toDate
                                                    ? (match.match_time as any).toDate()
                                                    : new Date(match.match_time!);
                                                return (
                                                    <div key={match.id} className="text-xs p-1 rounded bg-secondary truncate">
                                                        {format(matchDate, "HH:mm")} - {getGameName(match.game_id)}
                                                    </div>
                                                )
                                            })}
                                            {dayMatches.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    + {dayMatches.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Matches on {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedDate && getMatchesForDate(selectedDate).map(match => {
                            const matchDate = (match.match_time as any)?.toDate
                                ? (match.match_time as any).toDate()
                                : new Date(match.match_time!);
                            return (
                                <div
                                    key={match.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={handleMatchClick}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">{getGameName(match.game_id)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{format(matchDate, "HH:mm")}</span>
                                        </div>
                                        {match.venue && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>{match.venue}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm">View Details</Button>
                                </div>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlayerSchedule;
