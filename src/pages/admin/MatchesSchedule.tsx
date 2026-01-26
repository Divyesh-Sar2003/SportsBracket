import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, isValid, isBefore, startOfToday } from "date-fns";
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
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/services/firestore/notifications";
import { Tournament, Game, Team, Match, Participant } from "@/types/tournament";
import { fetchParticipants } from "@/services/firestore/participants";
import { fetchUsers, User } from "@/services/firestore/users";

const MatchesSchedule = () => {
    const { user: currentUser } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [games, setGames] = useState<Game[]>([]); // Games for selected tournament
    const [allGames, setAllGames] = useState<Game[]>([]); // All games for global lookup
    const [teams, setTeams] = useState<Team[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();

    // Form State
    const [selectedTournamentId, setSelectedTournamentId] = useState("");
    const [selectedGameId, setSelectedGameId] = useState("");
    // We now select Participant IDs, not raw Team IDs
    const [participantAId, setParticipantAId] = useState("");
    const [participantBId, setParticipantBId] = useState("");
    const [matchTime, setMatchTime] = useState("");
    const [location, setLocation] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadInitialData();
        loadMatches();
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
            loadParticipantsAndTeams(selectedTournamentId, selectedGameId);
        } else {
            setTeams([]);
            setParticipants([]);
            setParticipantAId("");
            setParticipantBId("");
        }
    }, [selectedTournamentId, selectedGameId]);

    const loadInitialData = async () => {
        try {
            const [tournamentData, allGamesData, usersData] = await Promise.all([
                fetchTournaments(),
                fetchGames(),
                fetchUsers()
            ]);
            setTournaments(tournamentData);
            setAllGames(allGamesData);
            setUsers(usersData);
        } catch (error) {
            console.error("Error loading initial data:", error);
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

    const loadParticipantsAndTeams = async (tournamentId: string, gameId: string) => {
        try {
            const [teamsData, participantsData] = await Promise.all([
                fetchTeams({ tournamentId, gameId }),
                fetchParticipants({ tournamentId, gameId })
            ]);
            setTeams(teamsData);
            setParticipants(participantsData);
        } catch (error) {
            console.error("Error loading participants/teams:", error);
        }
    };

    const loadMatches = async () => {
        setLoading(true);
        try {
            // Fetch all matches globally or per tournament. 
            // We'll fetch all matches for simplicity to show on calendar.
            // If optimization needed, we can fetch range-based.
            const tournamentsList = await fetchTournaments();
            if (tournamentsList.length === 0) {
                setMatches([]);
            } else {
                const allMatches = await Promise.all(tournamentsList.map(tour => fetchMatches({ tournamentId: tour.id })));
                setMatches(allMatches.flat());
            }
        } catch (error) {
            console.error("Error loading matches:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMatch = async () => {
        if (!selectedDate || !selectedTournamentId || !selectedGameId || !participantAId || !participantBId || !matchTime) {
            toast({ title: "Please fill all fields", variant: "destructive" });
            return;
        }

        if (participantAId === participantBId) {
            toast({ title: "Participants must be different", variant: "destructive" });
            return;
        }

        // Combine date and time
        const [hours, minutes] = matchTime.split(':').map(Number);
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(hours, minutes);

        if (isBefore(startDateTime, new Date())) {
            toast({ title: "Cannot schedule match in the past", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const matchData = {
                tournament_id: selectedTournamentId,
                game_id: selectedGameId,
                participant_a_id: participantAId,
                participant_b_id: participantBId,
                match_time: startDateTime.toISOString(),
                status: 'SCHEDULED' as const,
                venue: location,
                round_index: 0,
                round_name: "Scheduled Match",
                match_order: 0,
            };

            await createMatch(matchData, {
                id: currentUser?.uid || "unknown",
                name: currentUser?.displayName || currentUser?.email || "Admin"
            });

            toast({ title: "Match scheduled successfully" });
            setDialogOpen(false);
            loadMatches();
            resetForm();

            // Notifications
            const pA = participants.find(p => p.id === participantAId);
            const pB = participants.find(p => p.id === participantBId);
            const game = games.find(g => g.id === selectedGameId);

            const notifyUser = async (uid: string) => {
                await createNotification({
                    user_id: uid,
                    title: "New Match Scheduled",
                    message: `A new match for ${game?.name || 'your game'} has been scheduled at ${format(startDateTime, 'PPp')}.`,
                    type: "MATCH_SCHEDULED",
                    payload: { match_id: "new", game_id: selectedGameId }
                });
            };

            const resolveAndNotify = async (p?: Participant) => {
                if (!p) return;
                if (p.type === 'USER' && p.user_id) {
                    await notifyUser(p.user_id);
                } else if (p.type === 'TEAM' && p.team_id) {
                    const team = teams.find(t => t.id === p.team_id);
                    if (team?.player_ids) {
                        for (const uid of team.player_ids) {
                            await notifyUser(uid);
                        }
                    }
                }
            };

            await Promise.all([resolveAndNotify(pA), resolveAndNotify(pB)]);

        } catch (error: any) {
            toast({ title: "Error scheduling match", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setParticipantAId("");
        setParticipantBId("");
        setMatchTime("");
        setLocation("");
    };

    const getMatchesForDate = (date: Date) => {
        return matches.filter(m => {
            if (!m.match_time) return false;
            const matchDate = (m.match_time as any)?.toDate
                ? (m.match_time as any).toDate()
                : new Date(m.match_time!);
            if (!isValid(matchDate)) return false;
            return isSameDay(matchDate, date);
        });
    };

    // Helper maps
    const gamesMap = useMemo(() => {
        return allGames.reduce<Record<string, Game>>((acc, g) => { acc[g.id] = g; return acc; }, {});
    }, [allGames]);

    const usersMap = useMemo(() => {
        return users.reduce<Record<string, User>>((acc, u) => { acc[u.id] = u; return acc; }, {});
    }, [users]);

    const teamsMap = useMemo(() => {
        return teams.reduce<Record<string, Team>>((acc, t) => { acc[t.id] = t; return acc; }, {});
    }, [teams]);

    const getParticipantName = (participantId: string) => {
        // We often don't have the participant object handy here for the *list* unless we fetch ALL participants globally.
        // But for the form we have `participants` state.
        // For the match cards in calendar, we only have match.participant_a_id.
        // If we want to show names in calendar, we'd need to fetch participants for those matches or rely on a global participant fetch (expensive).
        // For now, request was "specify the game name". Names of players in calendar might be nice but let's stick to Game Name request first.
        return "Participant";
    };

    const getResolvedParticipantNameFromObject = (p: Participant) => {
        if (p.type === 'USER' && p.user_id) return usersMap[p.user_id]?.name || "Unknown User";
        if (p.type === 'TEAM' && p.team_id) return teamsMap[p.team_id]?.name || "Unknown Team";
        return "Unknown";
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

    // Derived state for form
    const selectedGame = games.find(g => g.id === selectedGameId);
    const isSinglePlayer = selectedGame?.game_type === 'SINGLE';
    const formLabel = isSinglePlayer ? "Player" : "Team";

    // Filter participants based on game type
    const availableParticipants = useMemo(() => {
        return participants.filter(p => {
            if (isSinglePlayer) return p.type === 'USER';
            return p.type === 'TEAM';
        });
    }, [participants, isSinglePlayer]);

    const eliminatedUserIds = useMemo(() => {
        if (!selectedGameId) return new Set<string>();
        const eliminatedUsers = new Set<string>();
        matches
            .filter(m => m.game_id === selectedGameId && m.status?.toUpperCase() === 'COMPLETED')
            .forEach(m => {
                const loserId = m.participant_a_id === m.winner_participant_id ? m.participant_b_id : m.participant_a_id;
                if (loserId) {
                    const loserParticipant = participants.find(p => p.id === loserId);
                    if (loserParticipant) {
                        if (loserParticipant.type === 'USER' && loserParticipant.user_id) {
                            eliminatedUsers.add(loserParticipant.user_id);
                        } else if (loserParticipant.type === 'TEAM' && loserParticipant.team_id) {
                            const team = teams.find(t => t.id === loserParticipant.team_id);
                            if (team?.player_ids) {
                                team.player_ids.forEach(uid => eliminatedUsers.add(uid));
                            }
                        }
                    }
                }
            });
        return eliminatedUsers;
    }, [matches, selectedGameId, participants, teams]);

    const eliminatedParticipantIds = useMemo(() => {
        if (!selectedGameId) return new Set<string>();
        const eliminated = new Set<string>();

        // Identify participants that include eliminated users
        participants.forEach(p => {
            if (p.type === 'USER' && p.user_id && eliminatedUserIds.has(p.user_id)) {
                eliminated.add(p.id);
            } else if (p.type === 'TEAM' && p.team_id) {
                const team = teams.find(t => t.id === p.team_id);
                if (team?.player_ids?.some(uid => eliminatedUserIds.has(uid))) {
                    eliminated.add(p.id);
                }
            }
        });
        return eliminated;
    }, [participants, teams, eliminatedUserIds]);

    const scheduledParticipantIds = useMemo(() => {
        if (!selectedGameId) return new Set<string>();
        const scheduled = new Set<string>();
        matches
            .filter(m => m.game_id === selectedGameId && m.status?.toUpperCase() === 'SCHEDULED')
            .forEach(m => {
                if (m.participant_a_id) scheduled.add(m.participant_a_id);
                if (m.participant_b_id) scheduled.add(m.participant_b_id);
            });
        return scheduled;
    }, [matches, selectedGameId]);

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
                                                const gameName = gamesMap[match.game_id]?.name || "Unknown Game";

                                                if (!isValid(matchDate)) return null;

                                                return (
                                                    <div key={match.id} className="text-xs p-1 rounded bg-secondary truncate">
                                                        {format(matchDate, "HH:mm")} - {gameName}
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
                        {/* Existing Matches List for Selected Date */}
                        {selectedDate && getMatchesForDate(selectedDate).length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Scheduled Matches</h3>
                                {getMatchesForDate(selectedDate).map(match => {
                                    const matchDate = (match.match_time as any)?.toDate
                                        ? (match.match_time as any).toDate()
                                        : new Date(match.match_time!);
                                    const timeString = isValid(matchDate) ? format(matchDate, "HH:mm") : "TBD";
                                    const gameName = gamesMap[match.game_id]?.name || "Unknown Game";

                                    return (
                                        <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{timeString}</span>
                                                <span className="font-medium">{gameName}</span>
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
                            {selectedDate && isBefore(selectedDate, startOfToday()) ? (
                                <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
                                    Cannot schedule new matches for past dates.
                                </div>
                            ) : (
                                <>
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
                                            <Label>{formLabel} A</Label>
                                            <Select value={participantAId} onValueChange={setParticipantAId} disabled={!selectedGameId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${formLabel.toLowerCase()}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableParticipants.map(p => {
                                                        const isScheduled = scheduledParticipantIds.has(p.id);
                                                        const isEliminated = eliminatedParticipantIds.has(p.id);
                                                        return (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={p.id}
                                                                disabled={isScheduled || isEliminated}
                                                            >
                                                                {getResolvedParticipantNameFromObject(p)}
                                                                {isScheduled && " (Already Scheduled)"}
                                                                {isEliminated && " (Eliminated)"}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{formLabel} B</Label>
                                            <Select value={participantBId} onValueChange={setParticipantBId} disabled={!selectedGameId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select ${formLabel.toLowerCase()}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableParticipants.filter(p => p.id !== participantAId).map(p => {
                                                        const isScheduled = scheduledParticipantIds.has(p.id);
                                                        const isEliminated = eliminatedParticipantIds.has(p.id);
                                                        return (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={p.id}
                                                                disabled={isScheduled || isEliminated}
                                                            >
                                                                {getResolvedParticipantNameFromObject(p)}
                                                                {isScheduled && " (Already Scheduled)"}
                                                                {isEliminated && " (Eliminated)"}
                                                            </SelectItem>
                                                        );
                                                    })}
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

                                    <Button onClick={handleCreateMatch} disabled={submitting || !matchTime || !participantAId || !participantBId} className="w-full">
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Schedule Match
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchesSchedule;
