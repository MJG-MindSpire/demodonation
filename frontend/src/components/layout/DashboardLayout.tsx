import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "donor" | "field" | "receiver";

interface DashboardLayoutProps {
  children: ReactNode;
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export function DashboardLayout({ children, currentRole, onRoleChange }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        currentRole === "admin" || currentRole === "donor" || currentRole === "field" || currentRole === "receiver"
          ? "relative overflow-hidden"
          : "",
      )}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          currentRole={currentRole}
          onRoleChange={onRoleChange}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        sidebarCollapsed ? "md:ml-16" : "md:ml-64", // Account for sidebar
        "pb-20 md:pb-0" // Account for mobile nav
      )}>
        {currentRole === "admin" ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 -z-10",
              "bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10",
              "bg-[length:200%_200%] animate-gradient",
            )}
          />
        ) : null}

        {currentRole === "donor" ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 -z-10",
              "bg-gradient-to-br from-secondary/10 via-primary/10 to-accent/10",
              "bg-[length:200%_200%] animate-gradient",
            )}
          />
        ) : null}

        {currentRole === "field" ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 -z-10",
              "bg-gradient-to-br from-accent/10 via-secondary/10 to-primary/10",
              "bg-[length:200%_200%] animate-gradient",
            )}
          />
        ) : null}

        {currentRole === "receiver" ? (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 -z-10",
              "bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10",
              "bg-[length:200%_200%] animate-gradient",
            )}
          />
        ) : null}

        {currentRole === "admin" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 left-10 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        ) : null}
        {currentRole === "admin" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 right-10 bottom-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        ) : null}

        {currentRole === "donor" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 left-10 top-10 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
        ) : null}
        {currentRole === "donor" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 right-10 bottom-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        ) : null}

        {currentRole === "field" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 left-10 top-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        ) : null}
        {currentRole === "field" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 right-10 bottom-10 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
        ) : null}

        {currentRole === "receiver" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 left-10 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        ) : null}
        {currentRole === "receiver" ? (
          <div aria-hidden className="pointer-events-none absolute -z-10 right-10 bottom-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        ) : null}

        <div className="relative p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav currentRole={currentRole} />
    </div>
  );
}
