import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import adminIllustration from "@/assets/admin-illustration.png";

import { apiRequest } from "@/lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

type Project = {
  _id: string;
  title: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requiredAmount: number;
  collectedAmount: number;
  spentAmount: number;
  receiverDetails?: { city?: string };
  createdAt: string;
};

type Donation = {
  _id: string;
  amount: number;
  verificationStatus: "pending" | "approved" | "flagged";
  createdAt: string;
};

type ProgressUpdate = {
  _id: string;
  stepTitle: string;
  approvalStatus: "pending" | "approved" | "rejected";
  amountUsed: number;
  createdAt: string;
};

function formatCurrency(amount: number) {
  return `PKR ${Number(amount ?? 0).toLocaleString()}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const projectsQuery = useQuery<Project[]>({
    queryKey: ["admin", "projects", "all"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/admin/projects");
      return res.projects;
    },
    refetchInterval: 10000,
  });

  const pendingProjectsQuery = useQuery<Project[]>({
    queryKey: ["admin", "projects", "pending"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/admin/projects?status=pending");
      return res.projects;
    },
    refetchInterval: 5000,
  });

  const pendingDonationsQuery = useQuery<Donation[]>({
    queryKey: ["admin", "donations", "pending"],
    queryFn: async () => {
      const res = await apiRequest<{ donations: Donation[] }>("/api/admin/donations?receiverStatus=pending");
      return res.donations;
    },
    refetchInterval: 5000,
  });

  const pendingUpdatesQuery = useQuery<ProgressUpdate[]>({
    queryKey: ["admin", "progress-updates", "pending"],
    queryFn: async () => {
      const res = await apiRequest<{ updates: ProgressUpdate[] }>("/api/admin/progress-updates?approvalStatus=pending");
      return res.updates;
    },
    refetchInterval: 5000,
  });

  const summary = useMemo(() => {
    const projects = projectsQuery.data ?? [];
    const approved = projects.filter((p) => p.status === "approved" || p.status === "completed");
    const totalRaised = approved.reduce((sum, p) => sum + (p.collectedAmount ?? 0), 0);
    const totalSpent = approved.reduce((sum, p) => sum + (p.spentAmount ?? 0), 0);
    const activeCampaigns = approved.length;
    const pendingApprovals =
      (pendingProjectsQuery.data ?? []).length +
      (pendingDonationsQuery.data ?? []).length +
      (pendingUpdatesQuery.data ?? []).length;
    const utilizationPct = totalRaised > 0 ? Math.round((totalSpent / totalRaised) * 100) : 0;
    return { totalRaised, totalSpent, utilizationPct, activeCampaigns, pendingApprovals };
  }, [
    pendingDonationsQuery.data,
    pendingProjectsQuery.data,
    pendingUpdatesQuery.data,
    projectsQuery.data,
  ]);

  const raisedSpentSeries = useMemo(() => {
    const projects = (projectsQuery.data ?? []).filter((p) => p.status === "approved" || p.status === "completed");

    const byDay = new Map<string, { day: string; raised: number; spent: number; label: string }>();
    for (const p of projects) {
      const k = dayKey(p.createdAt);
      const existing = byDay.get(k) ?? { day: k, raised: 0, spent: 0, label: formatDate(p.createdAt) };
      existing.raised += Number(p.collectedAmount ?? 0);
      existing.spent += Number(p.spentAmount ?? 0);
      byDay.set(k, existing);
    }

    return Array.from(byDay.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30);
  }, [projectsQuery.data]);

  const approvalBreakdown = useMemo(
    () => [
      { name: "Receiver Requests", value: (pendingProjectsQuery.data ?? []).length },
      { name: "Donations", value: (pendingDonationsQuery.data ?? []).length },
      { name: "Progress Updates", value: (pendingUpdatesQuery.data ?? []).length },
    ],
    [pendingDonationsQuery.data, pendingProjectsQuery.data, pendingUpdatesQuery.data],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              Admin Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor donations, approvals, and campaign performance</p>
          </div>

          <img
            src={adminIllustration}
            alt="Analytics Dashboard"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <Card className="relative overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 bg-[length:200%_200%] animate-gradient"
        />
        <CardHeader className="relative flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Performance</CardTitle>
            <CardDescription>Raised vs utilized funds (auto-updates)</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/admin/campaigns")}>
            View Campaigns <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="relative">
          {raisedSpentSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved projects yet to generate chart data.</p>
          ) : (
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                raised: { label: "Raised", color: "hsl(var(--primary))" },
                spent: { label: "Spent", color: "hsl(var(--accent))" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={raisedSpentSeries} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="raisedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-raised)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-raised)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="spentFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-spent)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--color-spent)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveEnd" minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="raised"
                    stroke="var(--color-raised)"
                    fill="url(#raisedFill)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="var(--color-spent)"
                    fill="url(#spentFill)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Approvals */}
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Approvals Overview</CardTitle>
              <CardDescription>Live pending workload across the system</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/admin/approvals")}>
              Open Approvals <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="h-[220px] w-full"
              config={{
                value: { label: "Pending", color: "hsl(var(--primary))" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalBreakdown} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="pendingBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} height={50} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#pendingBar)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Campaign Progress */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Raised</div>
                  <div className="text-2xl font-bold">{formatCurrency(summary.totalRaised)}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Utilized Funds</div>
                  <div className="text-2xl font-bold">{formatCurrency(summary.totalSpent)}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Utilization</div>
                  <div className="text-2xl font-bold">{summary.utilizationPct}%</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Active Campaigns</div>
                  <div className="text-2xl font-bold">{String(summary.activeCampaigns)}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
