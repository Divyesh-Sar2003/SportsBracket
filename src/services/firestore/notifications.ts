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

export interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  payload?: Record<string, unknown>;
}

const notificationsCollection = collection(db, "notifications");

export const fetchNotifications = async (userId: string) => {
  const notificationsQuery = query(
    notificationsCollection,
    where("user_id", "==", userId),
    orderBy("created_at", "desc")
  );
  const snapshot = await getDocs(notificationsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const createNotification = async (notification: NotificationPayload) => {
  await addDoc(notificationsCollection, {
    ...notification,
    is_read: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, "notifications", notificationId), {
    is_read: true,
    updated_at: serverTimestamp(),
  });
};

