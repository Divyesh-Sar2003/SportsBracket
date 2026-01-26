import {
  addDoc,
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
import { Participant } from "@/types/tournament";
import { getDoc } from "firebase/firestore";

const participantsCollection = collection(db, "participants");

export const fetchParticipantById = async (id: string) => {
  const docSnap = await getDoc(doc(db, "participants", id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as Participant) };
  }
  return null;
};

export const fetchParticipants = async (options: {
  tournamentId?: string;
  gameId?: string;
}) => {
  const constraints: any[] = [];

  if (options.tournamentId) {
    constraints.push(where("tournament_id", "==", options.tournamentId));
  }

  if (options.gameId) {
    constraints.push(where("game_id", "==", options.gameId));
  }

  constraints.push(orderBy("created_at", "asc"));

  const participantsQuery = query(participantsCollection, ...constraints);
  const snapshot = await getDocs(participantsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Participant) }));
};

export const fetchUserParticipants = async (userId: string) => {
  const q = query(participantsCollection, where("user_id", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Participant) }));
};

export const fetchParticipantsByTeamIds = async (teamIds: string[]) => {
  if (teamIds.length === 0) return [];

  // Chunking for 'in' query
  const chunks = [];
  for (let i = 0; i < teamIds.length; i += 10) {
    chunks.push(teamIds.slice(i, i + 10));
  }

  const allParticipants: Participant[] = [];
  for (const chunk of chunks) {
    const q = query(participantsCollection, where("team_id", "in", chunk));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => allParticipants.push({ id: d.id, ...d.data() } as Participant));
  }

  return allParticipants;
};

export const addParticipant = async (
  participant: Omit<Participant, "id" | "created_at" | "updated_at">
) => {
  const ref = await addDoc(participantsCollection, {
    ...participant,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

export const updateParticipant = async (
  participantId: string,
  updates: Partial<Participant>
) => {
  await updateDoc(doc(db, "participants", participantId), {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

export const deleteParticipant = async (participantId: string) => {
  await deleteDoc(doc(db, "participants", participantId));
};

