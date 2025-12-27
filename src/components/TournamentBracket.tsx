import React, { useMemo } from "react";
import { Match, Participant, Team, MatchResult } from "@/types/tournament";
import { User } from "@/services/firestore/users";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TournamentBracketProps {
    matches: Match[];
    resultsMap: Record<string, MatchResult>;
    participantsMap: Record<string, Participant>;
    usersMap: Record<string, User>;
    teamsMap: Record<string, Team>;
    gameId: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
    matches,
    resultsMap,
    participantsMap,
    usersMap,
    teamsMap,
    gameId,
}) => {
    const filteredMatches = useMemo(() => {
        return matches.filter((m) => m.game_id === gameId);
    }, [matches, gameId]);

    const rounds = useMemo(() => {
        const grouped = filteredMatches.reduce<Record<number, Match[]>>((acc, match) => {
            const round = match.round_index;
            if (!acc[round]) acc[round] = [];
            acc[round].push(match);
            return acc;
        }, {});

        // Sort rounds and match orders
        const sortedRoundKeys = Object.keys(grouped)
            .map(Number)
            .sort((a, b) => a - b);

        return sortedRoundKeys.map((key) => {
            return {
                index: key,
                name: grouped[key][0]?.round_name || `Round ${key + 1}`,
                matches: grouped[key].sort((a, b) => a.match_order - b.match_order),
            };
        });
    }, [filteredMatches]);

    const getParticipantName = (pId?: string) => {
        if (!pId) return "TBD";
        const p = participantsMap[pId];
        if (!p) return "TBD";
        if (p.type === "USER" && p.user_id) return usersMap[p.user_id]?.name || "Unknown User";
        if (p.type === "TEAM" && p.team_id) return teamsMap[p.team_id]?.name || `Team ${p.team_id.slice(-4)}`;
        return "Unknown";
    };

    if (filteredMatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                <Trophy className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No bracket generated for this game yet</p>
                <p className="text-sm">Admin needs to generate the bracket in Matches Management.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto pb-12 pt-8">
            <div className="inline-flex min-w-full gap-16 px-8 md:px-12">
                {rounds.map((round, rIdx) => (
                    <div key={round.index} className="flex flex-col gap-8 min-w-[280px]">
                        <div className="mb-6 text-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-4 py-1.5 bg-primary/5 rounded-full inline-block border border-primary/10 shadow-sm">
                                {round.name}
                            </h3>
                        </div>
                        <div className="flex flex-col flex-1 justify-around gap-4">
                            {round.matches.map((match) => {
                                const isCompleted = match.status.toUpperCase() === "COMPLETED";
                                const isAWinner = isCompleted && match.winner_participant_id === match.participant_a_id;
                                const isBWinner = isCompleted && match.winner_participant_id === match.participant_b_id;
                                const result = resultsMap[match.id];

                                return (
                                    <div key={match.id} className="relative py-4 group">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Card
                                                        className={cn(
                                                            "w-64 shadow-lg border-muted/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40",
                                                            isCompleted ? "bg-muted/5" : "bg-background",
                                                            "relative z-10"
                                                        )}
                                                    >
                                                        <CardContent className="p-0">
                                                            {/* Participant A */}
                                                            <div
                                                                className={cn(
                                                                    "flex items-center justify-between px-4 py-3 border-b transition-colors",
                                                                    isAWinner ? "bg-green-500/10" : "hover:bg-muted/50"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <span
                                                                        className={cn(
                                                                            "text-sm font-black truncate",
                                                                            isAWinner ? "text-green-600" : "text-foreground/80",
                                                                            !match.participant_a_id ? "italic opacity-40 font-medium" : ""
                                                                        )}
                                                                    >
                                                                        {getParticipantName(match.participant_a_id)}
                                                                    </span>
                                                                    {isAWinner && <Trophy className="h-3.5 w-3.5 text-green-600 shrink-0 animate-bounce" />}
                                                                </div>
                                                                {isCompleted && result && (
                                                                    <span className="text-xs font-black text-muted-foreground ml-2">
                                                                        {/* Points/Score can go here */}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Participant B */}
                                                            <div
                                                                className={cn(
                                                                    "flex items-center justify-between px-4 py-3 transition-colors",
                                                                    isBWinner ? "bg-green-500/10" : "hover:bg-muted/50"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <span
                                                                        className={cn(
                                                                            "text-sm font-black truncate",
                                                                            isBWinner ? "text-green-600" : "text-foreground/80",
                                                                            !match.participant_b_id ? "italic opacity-40 font-medium" : ""
                                                                        )}
                                                                    >
                                                                        {getParticipantName(match.participant_b_id)}
                                                                    </span>
                                                                    {isBWinner && <Trophy className="h-3.5 w-3.5 text-green-600 shrink-0 animate-bounce" />}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </TooltipTrigger>
                                                {isCompleted && result?.score_details && (
                                                    <TooltipContent side="top" className="bg-primary text-primary-foreground font-black text-[10px] uppercase p-2 px-3">
                                                        SCORE: {result.score_details}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>

                                        {/* Premium Connecting lines */}
                                        {rIdx < rounds.length - 1 && (
                                            <>
                                                <div className="absolute top-1/2 -right-16 w-16 h-[2px] bg-gradient-to-r from-primary/20 to-primary/5 transition-all group-hover:from-primary/40 group-hover:to-primary/10" />
                                                {/* Visual indicator for next match connection */}
                                                <div className="absolute top-1/2 -right-16 translate-x-1/2 w-2 h-2 rounded-full bg-primary/20 border border-primary/10" />
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentBracket;
