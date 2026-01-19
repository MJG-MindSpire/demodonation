import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import adminIllustration from "@/assets/admin-illustration.png";

type Project = {
  _id: string;
  title: string;
  purpose: string;
  description: string;
  requiredAmount: number;
  collectedAmount: number;
  spentAmount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  timelineStart?: string;
  timelineEnd?: string;
  createdAt: string;
  assignedFieldWorkerIds?: string[];
};

type FieldWorkerUser = {
  id: string;
  email: string;
  role: "field";
  name?: string;
  isActive?: boolean;
};

function formatShortDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export default function AdminCampaigns() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/admin/projects");
      return res.projects;
    },
  });

  const fieldWorkersQuery = useQuery({
    queryKey: ["field-workers"],
    queryFn: async () => {
      const res = await apiRequest<{ users: FieldWorkerUser[] }>("/api/admin/field-workers");
      return res.users;
    },
  });

  const projects = projectsQuery.data ?? [];
  const totalRequired = projects.reduce((sum, p) => sum + (p.requiredAmount ?? 0), 0);
  const totalCollected = projects.reduce((sum, p) => sum + (p.collectedAmount ?? 0), 0);
  const projectCount = projects.length;

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    if (!normalizedSearch) return projects;
    return projects.filter((p) => {
      const haystack = [p.title, p.purpose, p.description, p.status].join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [projects, normalizedSearch]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProject, setAssignProject] = useState<Project | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  const selectedWorker = useMemo(() => {
    return (fieldWorkersQuery.data ?? []).find((u) => u.id === selectedWorkerId) ?? null;
  }, [fieldWorkersQuery.data, selectedWorkerId]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignProject) throw new Error("Select a project");
      if (!selectedWorkerId) throw new Error("Select a field worker");

      const existing = (assignProject.assignedFieldWorkerIds ?? []).map(String);
      const nextIds = Array.from(new Set([...existing, selectedWorkerId]));

      return apiJson<{ project: Project }>(`/api/admin/projects/${assignProject._id}/assign-field`, {
        fieldWorkerIds: nextIds,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      toast({
        title: "Assigned",
        description: selectedWorker ? `${selectedWorker.name ?? selectedWorker.email} assigned to project.` : "Assigned to project.",
      });
      setAssignOpen(false);
      setAssignProject(null);
      setSelectedWorkerId("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to assign", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
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
              <span className="h-2 w-2 rounded-full bg-primary" />
              Campaign Ops
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Campaign Management</h1>
            <p className="text-muted-foreground">Manage funds, assignments, and campaign progress</p>
          </div>

          <img
            src={adminIllustration}
            alt="Campaigns"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden border-primary/20 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div aria-hidden className="pointer-events-none absolute -inset-x-24 -top-20 h-40 rotate-12 bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <CardContent className="relative flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">PKR {totalRequired.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Required</p>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border-secondary/20 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div aria-hidden className="pointer-events-none absolute -inset-x-24 -top-20 h-40 rotate-12 bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <CardContent className="relative flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">PKR {totalCollected.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border-success/20 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div aria-hidden className="pointer-events-none absolute -inset-x-24 -top-20 h-40 rotate-12 bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <CardContent className="relative flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 bg-[length:200%_200%] animate-gradient"
        />
        <CardHeader className="relative">
          <CardTitle className="text-base">Search Campaigns</CardTitle>
          <CardDescription>Search by title, purpose, description, or status</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="bg-white/70 pl-9 shadow-sm backdrop-blur"
              />
              {search ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted/40"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredProjects.length}</span> of {projects.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {projectsQuery.isLoading ? (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : projectsQuery.isError ? (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-destructive">Failed to load campaigns.</p>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No projects found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => {
            const spent = project.spentAmount ?? 0;
            const required = project.requiredAmount ?? 0;
            const remaining = Math.max(0, required - spent);
            const utilization = required > 0 ? Math.min(100, Math.round((spent / required) * 100)) : 0;
            const badgeVariant = project.status === "completed" ? "success" : project.status === "approved" ? "info" : project.status === "rejected" ? "destructive" : "warning";
            const start = project.timelineStart ? formatShortDate(project.timelineStart) : formatShortDate(project.createdAt);
            const end = project.timelineEnd ? formatShortDate(project.timelineEnd) : "-";
            const assignedCount = (project.assignedFieldWorkerIds ?? []).length;

            return (
              <Card
                key={project._id}
                className="group relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div aria-hidden className="pointer-events-none absolute -inset-x-24 -top-24 h-48 rotate-12 bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription className="mt-1">{project.purpose}</CardDescription>
                    </div>
                    <Badge variant={badgeVariant as any}>{project.status}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="relative space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span className="font-medium">{utilization}%</span>
                    </div>
                    <Progress value={utilization} className="h-2" />

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                        <p className="text-lg font-bold text-primary">PKR {required.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Allocated</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-secondary/12 via-secondary/6 to-transparent p-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                        <p className="text-lg font-bold text-secondary">PKR {spent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Spent</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-muted via-muted/60 to-transparent p-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                        <p className="text-lg font-bold">PKR {remaining.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        PKR {project.collectedAmount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {start} - {end}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssignProject(project);
                          setAssignOpen(true);
                        }}
                      >
                        Assign Field ({assignedCount})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) {
            setAssignProject(null);
            setSelectedWorkerId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Field Worker</DialogTitle>
            <DialogDescription>
              Assign a field worker to this project so it appears in the Field Portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Project</Label>
            <div className="text-sm font-medium">{assignProject?.title ?? "-"}</div>
          </div>

          <div className="space-y-2">
            <Label>Field Worker</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger>
                <SelectValue placeholder={fieldWorkersQuery.isLoading ? "Loading..." : "Select a field worker"} />
              </SelectTrigger>
              <SelectContent>
                {(fieldWorkersQuery.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {(u.name ?? u.email) + (u.name ? ` (${u.email})` : "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={!assignProject || !selectedWorkerId || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
