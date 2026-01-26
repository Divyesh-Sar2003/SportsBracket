import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/client";
import { AdminPermissions } from "@/types/tournament";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPlayer: boolean;
  permissions: AdminPermissions | null;
  signUp: (email: string, password: string, metadata: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any; user?: User; isNewUser?: boolean }>;
  signUpWithGoogle: (metadata: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkAdminRole(currentUser.uid);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsPlayer(false);
        setPermissions(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const roleDoc = await getDoc(doc(db, "user_roles", userId));
      const roleData = roleDoc.exists() ? roleDoc.data() : null;
      const roles = (roleData?.roles as string[] | undefined) ?? [];
      const hasAdmin = roles.includes("admin") || roles.includes("super_admin");
      const hasSuperAdmin = roles.includes("super_admin");

      setIsAdmin(hasAdmin);
      setIsSuperAdmin(hasSuperAdmin);
      setIsPlayer(!hasAdmin);

      if (hasSuperAdmin) {
        // Super Admin has all permissions
        setPermissions({
          registrations: true,
          participants: true,
          tournaments: true,
          games: true,
          teams: true,
          schedule: true,
          matches: true,
          leaderboard: true,
          audit: true
        });
      } else if (hasAdmin) {
        // Regular admin permissions from firestore
        const rawPermissions = roleData?.permissions as Partial<AdminPermissions> | undefined;
        setPermissions({
          registrations: rawPermissions?.registrations ?? true,
          participants: rawPermissions?.participants ?? true,
          tournaments: rawPermissions?.tournaments ?? true,
          games: rawPermissions?.games ?? true,
          teams: rawPermissions?.teams ?? true,
          schedule: rawPermissions?.schedule ?? true,
          matches: rawPermissions?.matches ?? true,
          leaderboard: rawPermissions?.leaderboard ?? true,
          audit: rawPermissions?.audit ?? true
        });
      } else {
        setPermissions(null);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsPlayer(false);
      setPermissions(null);
    }
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      await setDoc(
        doc(db, "profiles", firebaseUser.uid),
        {
          name: metadata?.name || "",
          email,
          phone: metadata?.phone || "",
          department: metadata?.department || "",
          gender: metadata?.gender || "",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "user_roles", firebaseUser.uid),
        {
          roles: ["player"],
          updated_at: serverTimestamp(),
          created_at: serverTimestamp(),
        },
        { merge: true }
      );

      await sendEmailVerification(firebaseUser);
      await firebaseSignOut(auth);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        throw new Error("Please verify your email address before logging in.");
      }

      navigate("/");
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user profile exists
      const profileDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));
      const isNewUser = !profileDoc.exists();

      if (isNewUser) {
        // Create basic profile for new users
        await setDoc(
          doc(db, "profiles", firebaseUser.uid),
          {
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          },
          { merge: true }
        );

        // Set user role as player
        await setDoc(
          doc(db, "user_roles", firebaseUser.uid),
          {
            roles: ["player"],
            updated_at: serverTimestamp(),
            created_at: serverTimestamp(),
          },
          { merge: true }
        );

        return { error: null, user: firebaseUser, isNewUser: true };
      } else {
        // For existing users, return without navigating (navigation handled by useEffect)
        return { error: null, user: firebaseUser, isNewUser: false };
      }
    } catch (error: any) {
      return { error };
    }
  };

  const signUpWithGoogle = async (metadata: any) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      await setDoc(
        doc(db, "profiles", currentUser.uid),
        {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          phone: metadata?.phone || "",
          department: metadata?.department || "",
          gender: metadata?.gender || "",
          password: metadata?.password || "", // Store password for future login
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "user_roles", currentUser.uid),
        {
          roles: ["player"],
          updated_at: serverTimestamp(),
          created_at: serverTimestamp(),
        },
        { merge: true }
      );

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, isPlayer, permissions, signUp, signIn, signInWithGoogle, signUpWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};