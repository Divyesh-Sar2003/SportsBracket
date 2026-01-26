import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { RegistrationStatus, Registration } from "@/types/tournament";
import { createNotification } from "./notifications";
import { logAdminAction } from "./audit";

const registrationsCollection = collection(db, "registrations");

export const fetchRegistrations = async (options: {
  tournamentId?: string;
  gameId?: string;
  status?: RegistrationStatus;
  userId?: string;
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
  if (options.userId) {
    conditions.push(where("user_id", "==", options.userId));
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
  status: RegistrationStatus,
  adminInfo?: { id: string; name: string }
) => {
  const regDoc = await getDoc(doc(db, "registrations", registrationId));
  if (!regDoc.exists()) return;

  const registration = regDoc.data() as Registration;

  await updateDoc(doc(db, "registrations", registrationId), {
    status,
    updated_at: serverTimestamp(),
    processed_by_id: adminInfo?.id,
    processed_by_name: adminInfo?.name,
  });

  // Create notification for the user
  await createNotification({
    user_id: registration.user_id,
    title: `Registration ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your registration for the game has been ${status}.`,
    type: "REGISTRATION_UPDATE",
    payload: { registration_id: registrationId, status }
  });

  // Log admin action
  if (adminInfo) {
    await logAdminAction({
      admin_id: adminInfo.id,
      admin_name: adminInfo.name,
      action: `REGISTRATION_${status.toUpperCase()}`,
      resource_type: "REGISTRATION",
      resource_id: registrationId,
      details: `Admin ${adminInfo.name} ${status} registration for user ${registration.user_id}`
    });
  }
};
