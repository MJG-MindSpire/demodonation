import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlobalHomeButton } from "@/components/layout/GlobalHomeButton";
import { useAppSettings } from "@/hooks/useAppSettings";
import { LicenseGate } from "@/components/license/LicenseGate";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PortalLogin from "./pages/PortalLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDonors from "./pages/admin/AdminDonors";
import AdminFieldWorkers from "./pages/admin/AdminFieldWorkers";
import AdminReceivers from "./pages/admin/AdminReceivers";
import DonorDashboard from "./pages/donor/DonorDashboard";
import DonorTracking from "./pages/donor/DonorTracking";
import DonorReceipts from "./pages/donor/DonorReceipts";
import DonorProfile from "./pages/donor/DonorProfile";
import DonorRegister from "./pages/donor/DonorRegister";
import FieldDashboard from "./pages/field/FieldDashboard";
import FieldUpload from "./pages/field/FieldUpload";
import FieldRegister from "./pages/field/FieldRegister";
import ReceiverDashboard from "./pages/receiver/ReceiverDashboard";
import ReceiverDonationConfirmations from "./pages/receiver/ReceiverDonationConfirmations";
import ReceiverMyRequests from "./pages/receiver/ReceiverMyRequests";
import ReceiverRegister from "./pages/receiver/ReceiverRegister";
import Notifications from "./pages/shared/Notifications";
import PublicProjects from "./pages/PublicProjects";
import PublicProjectDetail from "./pages/PublicProjectDetail";

const queryClient = new QueryClient();

const DEFAULT_APP_TITLE = "Impact Flow";

function TitleSync() {
  const { data: appSettings } = useAppSettings();

  useEffect(() => {
    const cached = localStorage.getItem("impactflow.appName");
    document.title = cached || DEFAULT_APP_TITLE;
  }, []);

  useEffect(() => {
    const name = appSettings?.name?.trim();
    if (!name) return;
    document.title = name;
    localStorage.setItem("impactflow.appName", name);
  }, [appSettings?.name]);

  return null;
}

type UserRole = "admin" | "donor" | "field" | "receiver";

function ProtectedRoute({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const location = useLocation();
  const sessionRole = sessionStorage.getItem("impactflow.role") as UserRole | null;
  if (sessionRole !== role) {
    return <Navigate to={`/${role}/login`} replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function LoginOnlyHomeButton() {
  const location = useLocation();
  const showHomeButton = location.pathname.endsWith("/login");

  if (!showHomeButton) return null;
  return <GlobalHomeButton />;
}

const App = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const RouterComponent = (typeof window !== "undefined" && window.location.protocol === "file:") ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TitleSync />
        <LicenseGate>
          <RouterComponent>
            <LoginOnlyHomeButton />
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Alias: allow visiting /portals to land on home portals section (works in HashRouter too) */}
              <Route path="/portals" element={<Navigate to="/" replace state={{ scrollTo: "portals" }} />} />

              {/* Login Routes */}
              <Route path="/admin/login" element={<PortalLogin portalOverride="admin" />} />
              <Route path="/donor/login" element={<PortalLogin portalOverride="donor" />} />
              <Route path="/donor/register" element={<DonorRegister />} />
              <Route path="/field/login" element={<PortalLogin portalOverride="field" />} />
              <Route path="/field/register" element={<FieldRegister />} />
              <Route path="/receiver/login" element={<PortalLogin portalOverride="receiver" />} />
              <Route path="/receiver/register" element={<ReceiverRegister />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminApprovals /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/campaigns" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminCampaigns /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/donors" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminDonors /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/field-workers" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminFieldWorkers /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/receivers" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminReceivers /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><AdminSettings /></DashboardLayout></ProtectedRoute>} />

              {/* Donor Routes */}
              <Route path="/donor" element={<ProtectedRoute role="donor"><DashboardLayout currentRole="donor" onRoleChange={setCurrentRole}><DonorDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/donor/tracking" element={<ProtectedRoute role="donor"><DashboardLayout currentRole="donor" onRoleChange={setCurrentRole}><DonorTracking /></DashboardLayout></ProtectedRoute>} />
              <Route path="/donor/profile" element={<ProtectedRoute role="donor"><DashboardLayout currentRole="donor" onRoleChange={setCurrentRole}><DonorProfile /></DashboardLayout></ProtectedRoute>} />
              <Route path="/donor/receipts" element={<ProtectedRoute role="donor"><DashboardLayout currentRole="donor" onRoleChange={setCurrentRole}><DonorReceipts /></DashboardLayout></ProtectedRoute>} />

              {/* Field Worker Routes */}
              <Route path="/field" element={<ProtectedRoute role="field"><DashboardLayout currentRole="field" onRoleChange={setCurrentRole}><FieldDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/field/upload" element={<ProtectedRoute role="field"><DashboardLayout currentRole="field" onRoleChange={setCurrentRole}><FieldUpload /></DashboardLayout></ProtectedRoute>} />

              {/* Receiver Routes */}
              <Route path="/receiver" element={<ProtectedRoute role="receiver"><DashboardLayout currentRole="receiver" onRoleChange={setCurrentRole}><ReceiverDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/receiver/donations" element={<ProtectedRoute role="receiver"><DashboardLayout currentRole="receiver" onRoleChange={setCurrentRole}><ReceiverDonationConfirmations /></DashboardLayout></ProtectedRoute>} />
              <Route path="/receiver/requests" element={<ProtectedRoute role="receiver"><DashboardLayout currentRole="receiver" onRoleChange={setCurrentRole}><ReceiverMyRequests /></DashboardLayout></ProtectedRoute>} />
              <Route path="/receiver/notifications" element={<ProtectedRoute role="receiver"><DashboardLayout currentRole="receiver" onRoleChange={setCurrentRole}><Notifications /></DashboardLayout></ProtectedRoute>} />
              <Route path="/donor/notifications" element={<ProtectedRoute role="donor"><DashboardLayout currentRole="donor" onRoleChange={setCurrentRole}><Notifications /></DashboardLayout></ProtectedRoute>} />
              <Route path="/field/notifications" element={<ProtectedRoute role="field"><DashboardLayout currentRole="field" onRoleChange={setCurrentRole}><Notifications /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><DashboardLayout currentRole="admin" onRoleChange={setCurrentRole}><Notifications /></DashboardLayout></ProtectedRoute>} />

              {/* Shared Routes */}
              <Route path="/projects" element={<PublicProjects />} />
              <Route path="/projects/:id" element={<PublicProjectDetail />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouterComponent>
        </LicenseGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
