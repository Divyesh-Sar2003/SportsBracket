import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { LeaderboardEntry } from "@/types/tournament";

const leaderboardCollection = collection(db, "leaderboard");

export const fetchLeaderboard = async (tournamentId: string) => {
  const leaderboardQuery = query(
    leaderboardCollection,
    where("tournament_id", "==", tournamentId),
    orderBy("points", "desc")
  );
  const snapshot = await getDocs(leaderboardQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as LeaderboardEntry) }));
};

export const upsertLeaderboardEntry = async (
  entryId: string,
  entry: Omit<LeaderboardEntry, "id" | "created_at" | "updated_at">
) => {
  await setDoc(
    doc(db, "leaderboard", entryId),
    {
      ...entry,
      updated_at: serverTimestamp(),
      created_at: entry.created_at ?? serverTimestamp(),
    },
    { merge: true }
  );
};

