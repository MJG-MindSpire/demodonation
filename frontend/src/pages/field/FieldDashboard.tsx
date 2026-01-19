import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/api";
import {
  ClipboardCheck,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";
import fieldIllustration from "@/assets/field-illustration.png";

type Project = {
  _id: string;
  title: string;
  purpose: string;
  urgencyLevel?: "low" | "medium" | "high";
  progressPercent?: number;
  requiredAmount?: number;
  collectedAmount?: number;
  spentAmount?: number;
  timelineEnd?: string;
  receiverDetails?: { city?: string };
};

type ProgressUpdate = {
  _id: string;
  stepTitle: string;
  workStatus: string;
  percentComplete: number;
  amountUsed: number;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

function formatCurrency(amount: number) {
  return `PKR ${Number(amount ?? 0).toLocaleString()}`;
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function FieldDashboard() {
  const navigate = useNavigate();

  const projectsQuery = useQuery({
    queryKey: ["field", "projects"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/field/projects");
      return res.projects;
    },
  });

  const stats = useMemo(() => {
    const projects = projectsQuery.data ?? [];
    const assigned = projects.length;
    const inProgress = projects.filter((p) => (p.progressPercent ?? 0) > 0 && (p.progressPercent ?? 0) < 100).length;
    const completed = projects.filter((p) => (p.progressPercent ?? 0) >= 100).length;
    const pendingUpload = projects.filter((p) => (p.progressPercent ?? 0) < 100).length;
    return { assigned, inProgress, completed, pendingUpload };
  }, [projectsQuery.data]);

  const progressQueries = useQueries({
    queries: (projectsQuery.data ?? []).map((p) => {
      return {
        queryKey: ["field", "project", p._id, "progress"],
        queryFn: async () => {
          const res = await apiRequest<{ updates: ProgressUpdate[] }>(`/api/field/projects/${p._id}/progress`);
          return res.updates;
        },
        enabled: Boolean(projectsQuery.data),
      };
    }),
  });

  const progressByProjectId = useMemo(() => {
    const map = new Map<string, ProgressUpdate[]>();
    const projects = projectsQuery.data ?? [];
    for (let i = 0; i < projects.length; i++) {
      const pid = projects[i]!._id;
      const q = progressQueries[i];
      if (q && q.data) map.set(pid, q.data);
    }
    return map;
  }, [progressQueries, projectsQuery.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-accent/15 via-secondary/15 to-primary/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Field Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Field Dashboard</h1>
            <p className="text-muted-foreground">Your assigned tasks and upload status</p>
          </div>

          <img
            src={fieldIllustration}
            alt="Field Worker"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Assigned Tasks"
          value={String(stats.assigned)}
          subtitle="This week"
          icon={ClipboardCheck}
          variant="primary"
        />
        <KPICard
          title="In Progress"
          value={String(stats.inProgress)}
          subtitle="Currently working"
          icon={Clock}
          variant="secondary"
        />
        <KPICard
          title="Completed"
          value={String(stats.completed)}
          subtitle="This month"
          icon={CheckCircle2}
          variant="default"
        />
        <KPICard
          title="Pending Upload"
          value={String(stats.pendingUpload)}
          subtitle="Proof required"
          icon={Camera}
          variant="accent"
        />
      </div>

      {/* Quick Upload Button */}
      <Card className="border-accent/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md bg-gradient-to-r from-accent/20 to-accent/10">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/30">
              <Camera className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Quick Upload Proof</h3>
              <p className="text-sm text-muted-foreground">Take photos or videos of your field work</p>
            </div>
          </div>
          <Button variant="accent" size="lg" className="gap-2" onClick={() => navigate("/field/upload")}>
            <Upload className="h-5 w-5" />
            Upload Now
          </Button>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Tasks</CardTitle>
            <CardDescription>Projects assigned to you</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(projectsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects assigned yet.</p>
          ) : projectsQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load tasks.</p>
          ) : (projectsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No assigned projects.</p>
          ) : (
            (projectsQuery.data ?? []).map((project) => {
              const progress = project.progressPercent ?? 0;
              const updates = progressByProjectId.get(project._id) ?? [];
              const latest = updates[0] ?? null;
              const submittedPct = latest ? latest.percentComplete : null;
              const status = progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "pending";
              const priority = project.urgencyLevel ?? "medium";
              const collected = project.collectedAmount ?? 0;
              const spent = project.spentAmount ?? 0;
              const remaining = Math.max(collected - spent, 0);
              return (
                <div
                  key={project._id}
                  className="flex flex-col gap-4 rounded-xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{project.title}</h4>
                      <Badge variant={priority === "high" ? "destructive" : "secondary"} className="h-5 text-xs">
                        {priority}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.receiverDetails?.city ?? "-"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {formatDate(project.timelineEnd)}
                      </span>
                    </div>
                    {status === "in_progress" && (
                      <div className="space-y-1">
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">{progress}% complete</p>
                      </div>
                    )}

                    <div className="grid gap-1 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Approved:</span> {progress}%
                      </div>
                      {latest ? (
                        <div>
                          <span className="font-medium text-foreground">Last submission:</span> {submittedPct}% ({latest.approvalStatus})
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-foreground">Last submission:</span> -
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-foreground">Funds:</span> {formatCurrency(spent)} spent / {formatCurrency(collected)} collected (remaining {formatCurrency(remaining)})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        status === "in_progress" ? "info" : status === "pending" ? "warning" : "success"
                      }
                    >
                      {status === "in_progress" ? (
                        <Clock className="mr-1 h-3 w-3" />
                      ) : status === "pending" ? (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      )}
                      {status.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate(`/field/upload?projectId=${project._id}`)}
                    >
                      <Camera className="h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
