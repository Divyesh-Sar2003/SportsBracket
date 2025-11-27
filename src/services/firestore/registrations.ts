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
import { RegistrationStatus, Registration } from "@/types/tournament";

const registrationsCollection = collection(db, "registrations");

export const fetchRegistrations = async (options: {
  tournamentId?: string;
  gameId?: string;
  status?: RegistrationStatus;
}) => {
  const conditions = [];
  if (options.tournamentId) {
    conditions.push(where("tournament_id", "==", options.tournamentId));
  }
  if (options.gameId) {
    conditions.push(where("game_id", "==", options.gameId));
  }
  if (options.status) {
    conditions.push(where("status", "==", options.status));
  }

  const registrationsQuery = query(
    registrationsCollection,
    ...conditions,
    orderBy("created_at", "desc")
  );
  const snapshot = await getDocs(registrationsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Registration) }));
};

export const createRegistration = async (
  registration: Omit<Registration, "id" | "created_at" | "updated_at" | "status">
) => {
  await addDoc(registrationsCollection, {
    ...registration,
    status: "pending",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

export const updateRegistrationStatus = async (
  registrationId: string,
  status: RegistrationStatus
) => {
  await updateDoc(doc(db, "registrations", registrationId), {
    status,
    updated_at: serverTimestamp(),
  });
};

