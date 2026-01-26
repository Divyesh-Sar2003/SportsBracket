import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    limit,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { AuditLog } from "@/types/tournament";

const auditCollection = collection(db, "audit_logs");

export interface CreateAuditLogPayload {
    admin_id: string;
    admin_name: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
}

export const logAdminAction = async (payload: CreateAuditLogPayload) => {
    try {
        await addDoc(auditCollection, {
            ...payload,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
    }
};

export const fetchAuditLogs = async (maxLogs = 100) => {
    const auditQuery = query(
        auditCollection,
        orderBy("created_at", "desc"),
        limit(maxLogs)
    );
    const snapshot = await getDocs(auditQuery);
    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
    })) as any[];
};
