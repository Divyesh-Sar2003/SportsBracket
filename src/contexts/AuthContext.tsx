import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
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
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkAdminRole(currentUser.uid);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // useEffect(() => {
  //   if (!loading && user) {
  //     if (isAdmin) {
  //       navigate("/admin");
  //     } else {
  //       navigate("/dashboard");
  //     }
  //   }
  // }, [user, isAdmin, loading, navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const roleDoc = await getDoc(doc(db, "user_roles", userId));
      const roleData = roleDoc.exists() ? roleDoc.data() : null;
      const roles = (roleData?.roles as string[] | undefined) ?? [];
      setIsAdmin(roles.includes("admin"));
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
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

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        // For new users, we'll return the user data and let the component handle the next steps
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
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signInWithGoogle, signUpWithGoogle, signOut }}>
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