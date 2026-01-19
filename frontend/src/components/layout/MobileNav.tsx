import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Heart,
  ClipboardCheck,
  Camera,
  Bell,
  Wallet,
  Activity,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationsCount } from "@/hooks/useUnreadNotificationsCount";

type UserRole = "admin" | "donor" | "field" | "receiver";

interface MobileNavProps {
  currentRole: UserRole;
}

const roleNavItems: Record<UserRole, { title: string; url: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Approvals", url: "/admin/approvals", icon: ClipboardCheck },
    { title: "Campaigns", url: "/admin/campaigns", icon: Heart },
    { title: "Alerts", url: "/admin/notifications", icon: Bell },
  ],
  donor: [
    { title: "Impact", url: "/donor", icon: Heart },
    { title: "Track", url: "/donor/tracking", icon: Activity },
    { title: "Receipts", url: "/donor/receipts", icon: FileText },
    { title: "Alerts", url: "/donor/notifications", icon: Bell },
  ],
  field: [
    { title: "Tasks", url: "/field", icon: ClipboardCheck },
    { title: "Upload", url: "/field/upload", icon: Camera },
    { title: "Alerts", url: "/field/notifications", icon: Bell },
  ],
  receiver: [
    { title: "Funds", url: "/receiver", icon: Wallet },
    { title: "Requests", url: "/receiver/requests", icon: FileText },
    { title: "Confirm", url: "/receiver/donations", icon: ClipboardCheck },
    { title: "Alerts", url: "/receiver/notifications", icon: Bell },
  ],
};

export function MobileNav({ currentRole }: MobileNavProps) {
  const location = useLocation();
  const items = roleNavItems[currentRole];

  const { unreadCount } = useUnreadNotificationsCount(currentRole);
  const notificationsUrl =
    currentRole === "admin"
      ? "/admin/notifications"
      : currentRole === "donor"
        ? "/donor/notifications"
        : currentRole === "field"
          ? "/field/notifications"
          : "/receiver/notifications";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-2 py-2 md:hidden">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = location.pathname === item.url;
          const showBadge = item.url === notificationsUrl && unreadCount > 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {showBadge ? (
                  <span className="absolute -right-2 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                  </span>
                ) : null}
              </span>
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
