import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { LeaderboardEntry } from "@/types/tournament";

const leaderboardCollection = collection(db, "leaderboard");

export const fetchLeaderboard = async (tournamentId: string, gameId?: string) => {
  const constraints = [
    where("tournament_id", "==", tournamentId),
  ];

  if (gameId && gameId !== "ALL") {
    constraints.push(where("game_id", "==", gameId));
  } else {
    // If ALL or undefined, fetch global entries where game_id is explicitly null
    constraints.push(where("game_id", "==", null));
  }

  const leaderboardQuery = query(
    leaderboardCollection,
    ...constraints,
    orderBy("points", "desc")
  );
  const snapshot = await getDocs(leaderboardQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as LeaderboardEntry) }));
};

export const fetchLeaderboardEntry = async (tournamentId: string, entityId: string, gameId?: string) => {
  const constraints = [
    where("tournament_id", "==", tournamentId),
    where("entity_id", "==", entityId),
  ];
  if (gameId) {
    constraints.push(where("game_id", "==", gameId));
  }

  const q = query(leaderboardCollection, ...constraints);
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as LeaderboardEntry) };
};

export const upsertLeaderboardEntry = async (
  entryId: string,
  entry: Omit<LeaderboardEntry, "id" | "updated_at">
) => {
  await setDoc(
    doc(db, "leaderboard", entryId),
    {
      ...entry,
      updated_at: serverTimestamp(),
      created_at: entry.created_at || serverTimestamp(),
    },
    { merge: true }
  );
};

export const recordMatchResultToLeaderboard = async (options: {
  tournamentId: string;
  gameId: string;
  winnerId: string;
  loserId?: string;
  winnerName: string;
  loserName?: string;
  winnerType: "USER" | "TEAM";
  loserType?: "USER" | "TEAM";
  pointsForWin: number;
}) => {
  const { tournamentId, gameId, winnerId, loserId, winnerName, loserName, winnerType, loserType, pointsForWin } = options;

  const updateEntry = async (gId: string | null, isWinner: boolean, entityId: string, name: string, type: "USER" | "TEAM") => {
    const entryId = gId ? `${tournamentId}_${gId}_${entityId}` : `${tournamentId}_${entityId}`;

    await setDoc(
      doc(db, "leaderboard", entryId),
      {
        tournament_id: tournamentId,
        game_id: gId,
        entity_id: entityId,
        name: name,
        entity_type: type,
        points: increment(isWinner ? pointsForWin : 0),
        wins: increment(isWinner ? 1 : 0),
        losses: increment(isWinner ? 0 : 1),
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Update game-specific entries
  await updateEntry(gameId, true, winnerId, winnerName, winnerType);
  if (loserId && loserName && loserType) {
    await updateEntry(gameId, false, loserId, loserName, loserType);
  }

  // Update tournament-wide entries
  await updateEntry(null, true, winnerId, winnerName, winnerType);
  if (loserId && loserName && loserType) {
    await updateEntry(null, false, loserId, loserName, loserType);
  }
};

export const clearLeaderboardForTournament = async (tournamentId: string) => {
  const q = query(leaderboardCollection, where("tournament_id", "==", tournamentId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();
};
