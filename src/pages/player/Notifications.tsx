import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, markNotificationRead } from "@/services/firestore/notifications";
import { Bell, CheckCircle2, Loader2, Mail, MailOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type?: string;
    is_read: boolean;
    created_at: any;
    updated_at: any;
    payload?: Record<string, unknown>;
}

const Notifications = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const notificationsData = await fetchNotifications(user.uid) as Notification[];
            setNotifications(notificationsData);
        } catch (error) {
            console.error("Error loading notifications:", error);
            toast({
                title: "Error",
                description: "Failed to load notifications",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationRead(notificationId);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
            toast({
                title: "Marked as read",
                description: "Notification marked as read",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to mark notification as read",
                variant: "destructive",
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.is_read);
            await Promise.all(
                unreadNotifications.map(n => markNotificationRead(n.id))
            );
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast({
                title: "All marked as read",
                description: "All notifications marked as read",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to mark all notifications as read",
                variant: "destructive",
            });
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "";

        // Handle Firestore Timestamp
        // Handle Firestore Timestamp
        let date: Date;
        if (timestamp?.toDate) {
            date = timestamp.toDate();
        } else if (timestamp?.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) return "Invalid Date";
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case "registration":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "match":
                return <Bell className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                            : "You're all caught up!"
                        }
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllAsRead}>
                        Mark All as Read
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        All Notifications
                    </CardTitle>
                    <CardDescription>
                        Your recent notifications and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <Alert>
                            <AlertDescription>
                                No notifications yet. You'll receive notifications when your game registrations are approved or when matches are scheduled.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={`${notification.is_read
                                        ? 'opacity-60 hover:opacity-80'
                                        : 'border-primary/50 bg-primary/5'
                                        } transition-opacity`}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                {notification.is_read ? (
                                                    <MailOpen className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    getNotificationIcon(notification.type)
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold">
                                                                {notification.title}
                                                            </p>
                                                            {!notification.is_read && (
                                                                <Badge variant="default" className="h-5 px-1.5 text-xs">
                                                                    New
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {notification.message}
                                                        </p>
                                                    </div>

                                                    {!notification.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                        >
                                                            Mark as read
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>{formatDate(notification.created_at)}</span>
                                                    {notification.type && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {notification.type}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Notifications;
