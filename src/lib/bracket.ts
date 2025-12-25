import { Participant, Match } from "@/types/tournament";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export interface GeneratedMatch {
  id: string;
  round_index: number;
  round_name: string;
  match_order: number;
  participant_a_id?: string;
  participant_b_id?: string;
  next_match_id?: string;
  winner_slot_in_next?: "A" | "B";
}

const roundName = (roundIndex: number, totalRounds: number) => {
  const remaining = totalRounds - roundIndex;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semi Final";
  if (remaining === 2) return "Quarter Final";
  return `Round ${roundIndex + 1}`;
};

const nearestPowerOfTwo = (value: number) => {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(1, value))));
};

export const generateSingleEliminationBracket = (
  participants: Participant[],
  existingMatches: Match[] = []
): GeneratedMatch[] => {
  const sorted = [...participants].sort((a, b) => {
    if (a.seed && b.seed) return a.seed - b.seed;
    if (a.seed) return -1;
    if (b.seed) return 1;
    const getTime = (date: any) => {
      if (!date) return 0;
      if (typeof date === "string") return new Date(date).getTime();
      if (date.toDate) return date.toDate().getTime(); // Firestore Timestamp
      if (date instanceof Date) return date.getTime();
      return 0;
    };

    const timeA = getTime(a.created_at);
    const timeB = getTime(b.created_at);
    return timeA - timeB;
  });

  const totalPlayers = sorted.length;
  const bracketSize = nearestPowerOfTwo(totalPlayers);
  const totalRounds = Math.log2(bracketSize);
  const matches: GeneratedMatch[] = [];

  const participantSlots = new Array<Participant | null>(bracketSize).fill(null);
  sorted.forEach((participant, index) => {
    participantSlots[index] = participant;
  });

  let currentRoundSize = bracketSize / 2;
  let previousRoundMatchIds: string[] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const roundMatchIds: string[] = [];
    for (let i = 0; i < currentRoundSize; i++) {
      const matchId = existingMatches.shift()?.id || crypto.randomUUID();
      const slotIndex = i * 2;
      const match: GeneratedMatch = {
        id: matchId,
        round_index: roundIndex,
        round_name: roundName(roundIndex, totalRounds - 1),
        match_order: i,
        participant_a_id: roundIndex === 0 ? participantSlots[slotIndex]?.id : undefined,
        participant_b_id: roundIndex === 0 ? participantSlots[slotIndex + 1]?.id : undefined,
      };

      if (previousRoundMatchIds.length) {
        const prevMatchAId = previousRoundMatchIds[i * 2];
        const prevMatchBId = previousRoundMatchIds[i * 2 + 1];

        const prevMatchA = matches.find((m) => m.id === prevMatchAId);
        if (prevMatchA) {
          prevMatchA.next_match_id = matchId;
          prevMatchA.winner_slot_in_next = "A";
        }

        const prevMatchB = matches.find((m) => m.id === prevMatchBId);
        if (prevMatchB) {
          prevMatchB.next_match_id = matchId;
          prevMatchB.winner_slot_in_next = "B";
        }
      }

      matches.push(match);
      roundMatchIds.push(matchId);
    }
    previousRoundMatchIds = roundMatchIds;
    currentRoundSize = currentRoundSize / 2;
  }

  return matches;
};

export const persistGeneratedMatches = async (
  tournamentId: string,
  gameId: string,
  matches: GeneratedMatch[]
) => {
  const batch = writeBatch(db);
  matches.forEach((match) => {
    const ref = doc(db, "matches", match.id);
    batch.set(
      ref,
      {
        tournament_id: tournamentId,
        game_id: gameId,
        ...match,
        participant_a_id: match.participant_a_id ?? null,
        participant_b_id: match.participant_b_id ?? null,
        next_match_id: match.next_match_id ?? null,
        winner_slot_in_next: match.winner_slot_in_next ?? null,
        status: "SCHEDULED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  });
  await batch.commit();
};

