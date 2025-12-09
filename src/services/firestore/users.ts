import { collection, getDocs, orderBy, query, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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

export interface UserRole {
  id: string;
  roles: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRole extends User {
  roles: string[];
}

const usersCollection = collection(db, "profiles");
const rolesCollection = collection(db, "user_roles");

export const fetchUsers = async () => {
  const usersQuery = query(usersCollection, orderBy("created_at", "desc"));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<User, "id">) }));
};

export const fetchUserRole = async (userId: string): Promise<string[]> => {
  try {
    const roleDoc = await getDoc(doc(rolesCollection, userId));
    if (roleDoc.exists()) {
      const roleData = roleDoc.data();
      return roleData.roles || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user role:", error);
    return [];
  }
};

export const fetchUsersWithRoles = async (): Promise<UserWithRole[]> => {
  try {
    const users = await fetchUsers();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await fetchUserRole(user.id);
        return { ...user, roles };
      })
    );
    return usersWithRoles;
  } catch (error) {
    console.error("Error fetching users with roles:", error);
    return [];
  }
};

export const updateUserRole = async (userId: string, roles: string[]): Promise<void> => {
  try {
    await setDoc(
      doc(rolesCollection, userId),
      {
        roles,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};
