import React, { createContext, useContext, useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit,
    Timestamp
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof window !== "undefined" ? Notification.permission : "default"
    );
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const requestPermission = async () => {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
    };

    useEffect(() => {
        if (!user) return;

        // Listen to notifications collection for the current user
        const q = query(
            collection(db, "notifications"),
            where("user_id", "==", user.uid),
            orderBy("created_at", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (isFirstLoad) {
                setIsFirstLoad(false);
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();

                    // Show in-app toast
                    toast.success(data.title, {
                        description: data.message,
                    });

                    // Show native browser notification if permission granted
                    if (Notification.permission === "granted") {
                        const notification = new Notification(data.title, {
                            body: data.message,
                            icon: "/pwa-192x192.png",
                            badge: "/favicon.ico",
                            tag: change.doc.id,
                        });

                        notification.onclick = () => {
                            window.focus();
                            notification.close();
                        };
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user, isFirstLoad]);

    return (
        <NotificationContext.Provider value={{ permission, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};
