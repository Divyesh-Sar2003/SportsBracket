import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Game } from "@/types/tournament";

const gamesCollection = collection(db, "games");

export const fetchGames = async (tournamentId?: string) => {
  const constraints = [orderBy("created_at", "desc")];
  if (tournamentId) {
    constraints.unshift(where("tournament_id", "==", tournamentId));
  }

  const gamesQuery = query(gamesCollection, ...constraints);
  const snapshot = await getDocs(gamesQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Game) }));
};

