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

const participantsCollection = collection(db, "participants");

export const fetchParticipants = async (options: {
  tournamentId: string;
  gameId?: string;
}) => {
  const constraints = [
    where("tournament_id", "==", options.tournamentId),
    orderBy("created_at", "asc"),
  ];

  if (options.gameId) {
    constraints.splice(1, 0, where("game_id", "==", options.gameId));
  }

  const participantsQuery = query(participantsCollection, ...constraints);
  const snapshot = await getDocs(participantsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Participant) }));
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

