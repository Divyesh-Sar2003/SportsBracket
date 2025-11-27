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

