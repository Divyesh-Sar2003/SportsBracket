import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Trophy, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchTournaments } from "@/services/firestore/tournaments";
import { fetchGames } from "@/services/firestore/games";
import { fetchTeams } from "@/services/firestore/teams";
import { createMatch, fetchMatches, updateMatch } from "@/services/firestore/matches";
import { createNotification } from "@/services/firestore/notifications";
import { Tournament, Game, Team, Match } from "@/types/tournament";

const MatchesSchedule = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();

    // Form State
    const [selectedTournamentId, setSelectedTournamentId] = useState("");
    const [selectedGameId, setSelectedGameId] = useState("");
    const [teamAId, setTeamAId] = useState("");
    const [teamBId, setTeamBId] = useState("");
    const [matchTime, setMatchTime] = useState("");
    const [location, setLocation] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedTournamentId) {
            loadGames(selectedTournamentId);
        } else {
            setGames([]);
            setSelectedGameId("");
        }
    }, [selectedTournamentId]);

    useEffect(() => {
        if (selectedTournamentId && selectedGameId) {
            loadTeams(selectedTournamentId, selectedGameId);
        } else {
            setTeams([]);
            setTeamAId("");
            setTeamBId("");
        }
    }, [selectedTournamentId, selectedGameId]);

    // Refresh matches when month changes (or just fetch all for now?)
    // Better to fetch per selected tournament typically, but for a global calendar we might want all.
    // For now, let's fetch all matches. If it gets heavy, we optimize.
    useEffect(() => {
        loadMatches();
    }, []);

    const loadInitialData = async () => {
        try {
            const tournamentData = await fetchTournaments();
            setTournaments(tournamentData);
        } catch (error) {
            console.error("Error loading tournaments:", error);
        }
    };

    const loadGames = async (tournamentId: string) => {
        try {
            const gamesData = await fetchGames(tournamentId);
            setGames(gamesData);
        } catch (error) {
            console.error("Error loading games:", error);
        }
    };

    const loadTeams = async (tournamentId: string, gameId: string) => {
        try {
            const teamsData = await fetchTeams({ tournamentId, gameId });
            setTeams(teamsData);
        } catch (error) {
            console.error("Error loading teams:", error);
        }
    };

    const loadMatches = async () => {
        setLoading(true);
        try {
            // Fetch all matches for now.
            // Ensure we have tournaments loaded.
            let currentTournaments = tournaments;
            if (tournaments.length === 0) {
                currentTournaments = await fetchTournaments();
                setTournaments(currentTournaments);
            }

            if (currentTournaments.length === 0) {
                setMatches([]);
            } else {
                const allMatches = await Promise.all(currentTournaments.map(tour => fetchMatches({ tournamentId: tour.id })));
                setMatches(allMatches.flat());
            }

        } catch (error) {
            console.error("Error loading matches:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMatch = async () => {
        if (!selectedDate || !selectedTournamentId || !selectedGameId || !teamAId || !teamBId || !matchTime) {
            toast({ title: "Please fill all fields", variant: "destructive" });
            return;
        }

        if (teamAId === teamBId) {
            toast({ title: "Teams must be different", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            // Combine date and time
            const [hours, minutes] = matchTime.split(':').map(Number);
            const startDateTime = new Date(selectedDate);
            startDateTime.setHours(hours, minutes);

            const matchData = {
                tournament_id: selectedTournamentId,
                game_id: selectedGameId,
                participant_a_id: teamAId,
                participant_b_id: teamBId,
                match_time: startDateTime.toISOString(),
                status: 'SCHEDULED' as const,
                venue: location,
                round_index: 0,
                round_name: "Scheduled Match",
                match_order: 0,
            };

            await createMatch(matchData);

            toast({ title: "Match scheduled successfully" });
            setDialogOpen(false);
            loadMatches();
            resetForm();

            // Notifications
            const teamA = teams.find(t => t.id === teamAId);
            const teamB = teams.find(t => t.id === teamBId);

            const notifyPlayers = async (team: Team | undefined) => {
                if (!team) return;
                for (const playerId of team.player_ids) {
                    await createNotification({
                        user_id: playerId,
                        title: "Match Scheduled",
                        message: `Your match vs ${team === teamA ? teamB?.name : teamA?.name} is scheduled on ${startDateTime.toLocaleString()}`,
                        type: "match_scheduled"
                    });
                }
            };

            await notifyPlayers(teamA);
            await notifyPlayers(teamB);

        } catch (error: any) {
            toast({ title: "Error scheduling match", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTeamAId("");
        setTeamBId("");
        setMatchTime("");
        setLocation("");
        // Keep Tournament/Game selected for convenience
    };

    const getMatchesForDate = (date: Date) => {
        return matches.filter(m => {
            if (!m.match_time) return false;
            // Handle both Firestore Timestamp and string
            const matchDate = (m.match_time as any)?.toDate
                ? (m.match_time as any).toDate()
                : new Date(m.match_time!);
            if (!isValid(matchDate)) return false;
            return isSameDay(matchDate, date);
        });
    };

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            days.push(day);
            day = new Date(day.setDate(day.getDate() + 1));
        }
        weeks.push(days);
        days = [];
    }

    // Fix: the while loop logic above modifies 'day' in place via setDate which returns timestamp.
    // correctly using addDays from date-fns is safer or just reconstructing. 
    // Actually eachDayOfInterval gives us the array correctly.
    // Let's rely on `calendarDays` and chunk it.

    const calendarChunks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        calendarChunks.push(calendarDays.slice(i, i + 7));
    }


    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Matches Schedule</h1>
                    <p className="text-muted-foreground">Manage and view match schedules</p>
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

            {/* Calendar Grid */}
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
                                            setSelectedDate(date);
                                            setDialogOpen(true);
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
                                            {dayMatches.slice(0, 3).map((match) => {
                                                const matchDate = (match.match_time as any)?.toDate
                                                    ? (match.match_time as any).toDate()
                                                    : new Date(match.match_time!);

                                                if (!isValid(matchDate)) return null;

                                                return (
                                                    <div key={match.id} className="text-xs p-1 rounded bg-secondary truncate">
                                                        {format(matchDate, "HH:mm")} - Match
                                                    </div>
                                                );
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

            {/* Schedule Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Schedule for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Existing Matches List */}
                        {selectedDate && getMatchesForDate(selectedDate).length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Scheduled Matches</h3>
                                {getMatchesForDate(selectedDate).map(match => {
                                    // Helper to find names (would be better to have helper functions or map)
                                    // For MVP we just show IDs or better fetch names. 
                                    const matchDate = (match.match_time as any)?.toDate
                                        ? (match.match_time as any).toDate()
                                        : new Date(match.match_time!);
                                    const timeString = isValid(matchDate) ? format(matchDate, "HH:mm") : "TBD";

                                    return (
                                        <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{timeString}</span>
                                                <span className="font-medium">Match {match.id.slice(-4)}</span> {/* Placeholder name */}
                                            </div>
                                            {match.venue && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {match.venue}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Schedule New Match
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tournament</Label>
                                    <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select tournament" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tournaments.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Game</Label>
                                    <Select value={selectedGameId} onValueChange={setSelectedGameId} disabled={!selectedTournamentId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select game" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {games.map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Team A</Label>
                                    <Select value={teamAId} onValueChange={setTeamAId} disabled={!selectedGameId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teams.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Team B</Label>
                                    <Select value={teamBId} onValueChange={setTeamBId} disabled={!selectedGameId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teams.filter(t => t.id !== teamAId).map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input
                                        type="time"
                                        value={matchTime}
                                        onChange={(e) => setMatchTime(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input
                                        placeholder="Court 1, Field A, etc."
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button onClick={handleCreateMatch} disabled={submitting || !matchTime || !teamAId || !teamBId} className="w-full">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Schedule Match
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchesSchedule;
