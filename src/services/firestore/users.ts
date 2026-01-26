import { collection, getDocs, orderBy, query, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { AdminPermissions } from "@/types/tournament";

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
  permissions?: AdminPermissions;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRole extends User {
  roles: string[];
  permissions?: AdminPermissions;
}

const usersCollection = collection(db, "profiles");
const rolesCollection = collection(db, "user_roles");

export const fetchUsers = async () => {
  const usersQuery = query(usersCollection, orderBy("created_at", "desc"));
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<User, "id">) }));
};

export const fetchUserRoleData = async (userId: string): Promise<Partial<UserRole> | null> => {
  try {
    const roleDoc = await getDoc(doc(rolesCollection, userId));
    if (roleDoc.exists()) {
      return roleDoc.data() as UserRole;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user role data:", error);
    return null;
  }
};

export const fetchUsersWithRoles = async (): Promise<UserWithRole[]> => {
  try {
    const users = await fetchUsers();
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roleData = await fetchUserRoleData(user.id);
        return {
          ...user,
          roles: roleData?.roles || [],
          permissions: roleData?.permissions
        };
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

export const updateAdminPermissions = async (userId: string, permissions: AdminPermissions): Promise<void> => {
  try {
    await setDoc(
      doc(rolesCollection, userId),
      {
        permissions,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating admin permissions:", error);
    throw error;
  }
};
