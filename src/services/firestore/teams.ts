import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Team } from "@/types/tournament";

const teamsCollection = collection(db, "teams");

export const fetchTeams = async (options: { tournamentId: string; gameId?: string }) => {
  const constraints = [
    where("tournament_id", "==", options.tournamentId),
    orderBy("created_at", "desc"),
  ];
  if (options.gameId) {
    constraints.splice(1, 0, where("game_id", "==", options.gameId));
  }

  const teamsQuery = query(teamsCollection, ...constraints);
  const snapshot = await getDocs(teamsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Team) }));
};

export const createTeam = async (team: Omit<Team, "id" | "created_at" | "updated_at">) => {
  const ref = await addDoc(teamsCollection, {
    ...team,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateTeam = async (teamId: string, updates: Partial<Team>) => {
  await updateDoc(doc(db, "teams", teamId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

export const addPlayerToTeam = async (teamId: string, playerId: string) => {
  await updateDoc(doc(db, "teams", teamId), {
    player_ids: arrayUnion(playerId),
    updated_at: serverTimestamp(),
  });
};

export const deleteTeam = async (teamId: string) => {
  await deleteDoc(doc(db, "teams", teamId));
};

