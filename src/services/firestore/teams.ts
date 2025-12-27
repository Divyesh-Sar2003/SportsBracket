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
  QueryConstraint
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Team } from "@/types/tournament";

const teamsCollection = collection(db, "teams");

export const fetchTeams = async (options: { tournamentId?: string; gameId?: string; userId?: string }) => {
  const constraints: QueryConstraint[] = [];

  if (options.tournamentId) {
    constraints.push(where("tournament_id", "==", options.tournamentId));
  }

  if (options.gameId) {
    constraints.push(where("game_id", "==", options.gameId));
  }

  if (options.userId) {
    constraints.push(where("player_ids", "array-contains", options.userId));
  }

  const teamsQuery = query(teamsCollection, ...constraints);
  const snapshot = await getDocs(teamsQuery);
  const teams = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Team) }));

  // Sort in memory
  return teams.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });
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

