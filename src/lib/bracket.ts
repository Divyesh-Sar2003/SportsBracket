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
    return (a.created_at || "").localeCompare(b.created_at || "");
  });

  const totalPlayers = sorted.length;
  const bracketSize = nearestPowerOfTwo(totalPlayers);
  const totalRounds = Math.log2(bracketSize);
  const matches: GeneratedMatch[] = [];

  const participantSlots = Array(bracketSize).fill<Participant | null>(null);
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
        participant_a_id: participantSlots[slotIndex]?.id,
        participant_b_id: participantSlots[slotIndex + 1]?.id,
      };

      if (previousRoundMatchIds.length) {
        const sourceIndex = Math.floor(i / 2);
        match.next_match_id = previousRoundMatchIds[sourceIndex];
        match.winner_slot_in_next = i % 2 === 0 ? "A" : "B";
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
        status: "SCHEDULED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  });
  await batch.commit();
};

