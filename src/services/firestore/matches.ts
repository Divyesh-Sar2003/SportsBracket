import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Match, MatchResult } from "@/types/tournament";

const matchesCollection = collection(db, "matches");
const resultsCollection = collection(db, "match_results");

export const fetchMatches = async (options: { tournamentId: string; gameId?: string }) => {
  const constraints = [
    where("tournament_id", "==", options.tournamentId),
    orderBy("round_index", "asc"),
    orderBy("match_order", "asc"),
  ];
  if (options.gameId) {
    constraints.splice(1, 0, where("game_id", "==", options.gameId));
  }

  const matchesQuery = query(matchesCollection, ...constraints);
  const snapshot = await getDocs(matchesQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Match) }));
};

export const fetchMatchesForParticipants = async (participantIds: string[]) => {
  if (participantIds.length === 0) return [];

  // Firestore 'in' limitation is 10. We might need to chunk if > 10.
  // For now, let's process in chunks of 10.
  const chunks = [];
  for (let i = 0; i < participantIds.length; i += 10) {
    chunks.push(participantIds.slice(i, i + 10));
  }

  const allMatches: Match[] = [];

  for (const chunk of chunks) {
    // Query where participant_a_id is in the chunk
    const qA = query(matchesCollection, where("participant_a_id", "in", chunk));
    const snapA = await getDocs(qA);

    // Query where participant_b_id is in the chunk
    const qB = query(matchesCollection, where("participant_b_id", "in", chunk));
    const snapB = await getDocs(qB);

    const matchesMap = new Map();

    snapA.docs.forEach(d => matchesMap.set(d.id, { id: d.id, ...d.data() }));
    snapB.docs.forEach(d => matchesMap.set(d.id, { id: d.id, ...d.data() }));

    matchesMap.forEach(m => allMatches.push(m as Match));
  }

  // Remove potential duplicates just in case some logic overlaps (though map handles it per chunk)
  // Across chunks shouldn't overlap if IDs are unique.
  // Actually, if a user plays against themselves (unlikely), it might appear.
  // But wait, if we have multiple chunks, we should deduplicate globally.

  const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
  return uniqueMatches;
};

export const createMatch = async (match: Omit<Match, "id" | "created_at" | "updated_at">) => {
  const ref = await addDoc(matchesCollection, {
    ...match,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateMatch = async (matchId: string, updates: Partial<Match>) => {
  await updateDoc(doc(db, "matches", matchId), { ...updates, updated_at: serverTimestamp() });
};

export const submitMatchResult = async (
  matchId: string,
  result: Omit<MatchResult, "id" | "match_id" | "created_at" | "updated_at">
) => {
  const ref = await addDoc(resultsCollection, {
    ...result,
    match_id: matchId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await updateMatch(matchId, {
    status: "COMPLETED",
  });

  return ref.id;
};

export const fetchMatchResultsForMatches = async (matchIds: string[]) => {
  if (matchIds.length === 0) return [];

  // Chunking for 'in' query
  const chunks = [];
  for (let i = 0; i < matchIds.length; i += 10) {
    chunks.push(matchIds.slice(i, i + 10));
  }

  const allResults: MatchResult[] = [];

  for (const chunk of chunks) {
    const q = query(resultsCollection, where("match_id", "in", chunk));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => allResults.push({ id: d.id, ...d.data() } as MatchResult));
  }

  return allResults;
};

