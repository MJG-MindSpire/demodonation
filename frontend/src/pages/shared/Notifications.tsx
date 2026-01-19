import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

type UserRole = "admin" | "donor" | "field" | "receiver";

type MeUser = {
  id: string;
  role: UserRole;
  email: string;
  name?: string;
};

type NotificationCategory = "approvals" | "funds" | "tasks" | "impact" | "reminder";
type NotificationColor = "success" | "primary" | "secondary" | "accent" | "warning";

type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  icon: any;
  color: NotificationColor;
  readAt?: string | null;
};

function timeAgo(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const ts = Number.isNaN(d.getTime()) ? Date.now() : d.getTime();
  const diffMs = Date.now() - ts;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

type ApiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  data?: any;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiRequest<{ user: MeUser }>("/api/auth/me");
      return res.user;
    },
  });
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const uid = meQuery.data?.id;
    if (!uid) return;
    setDismissedIds(new Set(safeReadJson<string[]>(`impactflow.notifications.${uid}.dismissed`, [])));
  }, [meQuery.data?.id]);

  useEffect(() => {
    const uid = meQuery.data?.id;
    if (!uid) return;
    safeWriteJson(`impactflow.notifications.${uid}.dismissed`, Array.from(dismissedIds));
  }, [meQuery.data?.id, dismissedIds]);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "mine"],
    queryFn: async () => {
      const res = await apiRequest<{ notifications: ApiNotification[] }>("/api/notifications/mine?limit=100");
      return res.notifications;
    },
    enabled: Boolean(meQuery.data?.id),
  });

  const notifications = useMemo((): NotificationItem[] => {
    const raw = notificationsQuery.data ?? [];

    return raw.map((n) => {
      const type = (n.type ?? "").toLowerCase();

      const category: NotificationCategory =
        type.startsWith("donation.")
          ? type === "donation.approved"
            ? "funds"
            : "approvals"
          : type.startsWith("project.")
            ? "approvals"
            : type.startsWith("progress.")
              ? "approvals"
              : "approvals";

      const icon =
        type === "donation.approved"
          ? DollarSign
          : type.endsWith("approved")
            ? CheckCircle2
            : type.endsWith("rejected")
              ? AlertCircle
              : Clock;

      const color: NotificationColor =
        type.endsWith("approved") ? "success" : type.endsWith("rejected") ? "warning" : "secondary";

      return {
        id: n.id,
        category,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        icon,
        color,
        readAt: n.readAt,
      };
    });
  }, [notificationsQuery.data]);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedIds.has(n.id)),
    [dismissedIds, notifications],
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.readAt).length,
    [visibleNotifications],
  );

  const markRead = async (id: string) => {
    queryClient.setQueryData<ApiNotification[]>(["notifications", "mine"], (prev) => {
      if (!prev) return prev;
      const nowIso = new Date().toISOString();
      return prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: nowIso } : n));
    });

    window.dispatchEvent(new Event("impactflow.notifications.updated"));
    queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });

    try {
      await apiRequest<{ updated: number }>("/api/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({ ids: [id] }),
        headers: { "Content-Type": "application/json" },
      });
      await queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    }
  };

  const dismiss = async (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    await markRead(id);
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      success: "bg-success/20 text-success",
      primary: "bg-primary/20 text-primary",
      secondary: "bg-secondary/20 text-secondary",
      accent: "bg-accent/20 text-accent",
      warning: "bg-warning/20 text-warning",
    };
    return colors[color] || colors.primary;
  };

  const NotificationBubble = ({
    notification,
    isRead,
    showDismiss,
  }: {
    notification: NotificationItem;
    isRead: boolean;
    showDismiss: boolean;
  }) => {
    const Icon = notification.icon;
    return (
      <div
        key={notification.id}
        className={
          "flex items-start gap-3 rounded-2xl border bg-white/60 p-4 shadow-[var(--shadow-card)] backdrop-blur-md " +
          (!isRead ? "border-primary/30" : "border-white/30")
        }
      >
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getColorClass(notification.color)}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-medium">{notification.title}</div>
            {!isRead ? <div className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
          </div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{notification.message}</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(notification.createdAt)}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => void markRead(notification.id)}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
          {showDismiss ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => void dismiss(notification.id)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All
            {unreadCount > 0 && (
              <Badge variant="accent" className="ml-2 h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-3">
          {visibleNotifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {meQuery.isLoading || notificationsQuery.isLoading ? "Loading..." : "No notifications"}
            </p>
          ) : (
            visibleNotifications.map((notification) => {
              const isRead = Boolean(notification.readAt);
              return <NotificationBubble notification={notification} isRead={isRead} showDismiss />;
            })
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6 space-y-3">
          {visibleNotifications.filter((n) => !n.readAt).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No unread notifications</p>
          ) : (
            visibleNotifications
              .filter((n) => !n.readAt)
              .map((notification) => {
                return <NotificationBubble notification={notification} isRead={false} showDismiss={false} />;
              })
          )}
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          {visibleNotifications.filter((n) => n.category === "approvals").length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approval notifications</p>
          ) : (
            <div className="space-y-3">
              {visibleNotifications
                .filter((n) => n.category === "approvals")
                .map((notification) => {
                  const isRead = Boolean(notification.readAt);
                  return <NotificationBubble notification={notification} isRead={isRead} showDismiss />;
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="funds" className="mt-6">
          {visibleNotifications.filter((n) => n.category === "funds").length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fund notifications</p>
          ) : (
            <div className="space-y-3">
              {visibleNotifications
                .filter((n) => n.category === "funds")
                .map((notification) => {
                  const isRead = Boolean(notification.readAt);
                  return <NotificationBubble notification={notification} isRead={isRead} showDismiss />;
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
