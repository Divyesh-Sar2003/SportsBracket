import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  gender?: string;
  created_at?: string;
  updated_at?: string;
}

const usersCollection = collection(db, "profiles");

export const fetchUsers = async () => {
  const usersQuery = query(usersCollection, orderBy("created_at", "desc"));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<User, "id">) }));
};
