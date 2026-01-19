import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Heart,
  Users,
  ClipboardCheck,
  FolderKanban,
  Camera,
  FileText,
  Bell,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { portalConfigs } from "@/lib/portals";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUnreadNotificationsCount } from "@/hooks/useUnreadNotificationsCount";

type UserRole = "admin" | "donor" | "field" | "receiver";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { title: "Approvals", url: "/admin/approvals", icon: ClipboardCheck, roles: ["admin"] },
  { title: "Campaigns", url: "/admin/campaigns", icon: FolderKanban, roles: ["admin"] },
  { title: "Donors", url: "/admin/donors", icon: Users, roles: ["admin"] },
  { title: "Field Workers", url: "/admin/field-workers", icon: Camera, roles: ["admin"] },
  { title: "Receivers", url: "/admin/receivers", icon: Users, roles: ["admin"] },
  { title: "My Impact", url: "/donor", icon: Heart, roles: ["donor"] },
  { title: "Track Donations", url: "/donor/tracking", icon: Activity, roles: ["donor"] },
  { title: "Profile", url: "/donor/profile", icon: Users, roles: ["donor"] },
  { title: "Receipts", url: "/donor/receipts", icon: FileText, roles: ["donor"] },
  { title: "My Tasks", url: "/field", icon: ClipboardCheck, roles: ["field"] },
  { title: "Upload Proof", url: "/field/upload", icon: Camera, roles: ["field"] },
  { title: "My Allocation", url: "/receiver", icon: Wallet, roles: ["receiver"] },
  { title: "My Requests", url: "/receiver/requests", icon: FileText, roles: ["receiver"] },
  { title: "Confirm Donations", url: "/receiver/donations", icon: ClipboardCheck, roles: ["receiver"] },
];

interface AppSidebarProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AppSidebar({ currentRole, onRoleChange: _onRoleChange, collapsed, onCollapsedChange }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const { unreadCount } = useUnreadNotificationsCount(currentRole);

  const { data: appSettings } = useAppSettings();

  const filteredItems = useMemo(() => navItems.filter((item) => item.roles.includes(currentRole)), [currentRole]);

  const notificationsUrl =
    currentRole === "admin"
      ? "/admin/notifications"
      : currentRole === "donor"
        ? "/donor/notifications"
        : currentRole === "field"
          ? "/field/notifications"
          : "/receiver/notifications";

  const navItemsWithNotifications = useMemo(() => {
    const list = filteredItems.slice();
    list.push({
      title: "Notifications",
      url: notificationsUrl,
      icon: Bell,
      roles: [currentRole],
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    });
    return list;
  }, [filteredItems, notificationsUrl, currentRole, unreadCount]);

  const roleLabels: Record<UserRole, string> = {
    admin: "Administrator",
    donor: "Donor",
    field: "Field Worker",
    receiver: "Receiver",
  };

  const roleIcons: Record<UserRole, typeof Shield> = {
    admin: Shield,
    donor: Heart,
    field: Camera,
    receiver: Users,
  };

  const RoleIcon = roleIcons[currentRole];

  const handleLogout = () => {
    sessionStorage.removeItem("impactflow.token");
    sessionStorage.removeItem("impactflow.role");
    sessionStorage.removeItem("impactflow.username");
    navigate(portalConfigs[currentRole].loginPath);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10"
      />
      {/* Header */}
      <div className="relative flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              {appSettings?.logoPath ? (
                <img
                  src={toAbsoluteAssetUrl(appSettings.logoPath)}
                  alt="App logo"
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <Heart className="h-4 w-4 text-sidebar-primary-foreground" />
              )}
            </div>
            <span className="font-semibold tracking-tight">{appSettings?.name ?? "DonateFlow"}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Role Indicator */}
      {!collapsed && (
        <div className="relative border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/80 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary">
              <RoleIcon className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-sidebar-foreground/70">Logged in as</p>
              <p className="text-sm font-medium">{roleLabels[currentRole]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="impactflow-sidebar-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {navItemsWithNotifications.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="accent" className="h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {currentRole === "admin" && (
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span>Settings</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
