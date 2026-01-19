import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";

type UserRole = "admin" | "donor" | "field" | "receiver";

type UnreadCountResponse = { unreadCount: number };

export function useUnreadNotificationsCount(currentRole: UserRole) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    };
    window.addEventListener("impactflow.notifications.updated", handler);
    return () => window.removeEventListener("impactflow.notifications.updated", handler);
  }, [queryClient]);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count", currentRole],
    queryFn: async () => {
      return apiRequest<UnreadCountResponse>("/api/notifications/unread-count");
    },
    retry: false,
  });

  return {
    unreadCount: unreadQuery.data?.unreadCount ?? 0,
    isLoading: unreadQuery.isLoading,
  };
}
