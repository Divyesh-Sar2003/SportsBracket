import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Tournament } from "@/types/tournament";

const tournamentsCollection = collection(db, "tournaments");

export const fetchTournaments = async () => {
  const tournamentsQuery = query(tournamentsCollection, orderBy("created_at", "desc"));
  const snapshot = await getDocs(tournamentsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Tournament) }));
};

