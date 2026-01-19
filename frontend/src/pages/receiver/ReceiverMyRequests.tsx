import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";

type ProjectStatus = "pending" | "approved" | "rejected" | "completed";

type ProjectCategory = "education" | "medical" | "food" | "construction" | "emergency" | "other";

type Project = {
  _id: string;
  title: string;
  purpose: string;
  category: ProjectCategory;
  requiredAmount: number;
  status: ProjectStatus;
  adminRemark?: string;
  verificationMediaPaths?: string[];
  createdAt: string;
};

function statusBadgeVariant(status: ProjectStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "destructive";
  if (status === "completed") return "secondary";
  return "warning";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function ReceiverMyRequests() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const projectsQuery = useQuery({
    queryKey: ["projects", "mine"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/projects/mine");
      return res.projects;
    },
  });

  const filtered = useMemo(() => {
    const list = projectsQuery.data ?? [];
    if (filter === "all") return list;
    return list.filter((p) => p.status === filter);
  }, [filter, projectsQuery.data]);

  const counts = useMemo(() => {
    const list = projectsQuery.data ?? [];
    return {
      all: list.length,
      pending: list.filter((p) => p.status === "pending").length,
      approved: list.filter((p) => p.status === "approved").length,
      rejected: list.filter((p) => p.status === "rejected").length,
    };
  }, [projectsQuery.data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Requests</h2>
        <p className="text-muted-foreground">Pending / Approved / Rejected requests</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={filter === "all" ? "accent" : "outline"} onClick={() => setFilter("all")}>
          All ({counts.all})
        </Button>
        <Button type="button" variant={filter === "pending" ? "accent" : "outline"} onClick={() => setFilter("pending")}>
          Pending ({counts.pending})
        </Button>
        <Button type="button" variant={filter === "approved" ? "accent" : "outline"} onClick={() => setFilter("approved")}>
          Approved ({counts.approved})
        </Button>
        <Button type="button" variant={filter === "rejected" ? "accent" : "outline"} onClick={() => setFilter("rejected")}>
          Rejected ({counts.rejected})
        </Button>
      </div>

      <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Requests</CardTitle>
          <CardDescription>{filtered.length} request(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {projectsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
          {projectsQuery.isError ? <p className="text-sm text-destructive">Failed to load requests.</p> : null}

          {filtered.map((p) => (
            <div key={p._id} className="rounded-lg border border-white/30 bg-white/50 p-4 shadow-sm backdrop-blur-md">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{p.title}</p>
                    <Badge variant={statusBadgeVariant(p.status)} className="h-5">
                      {p.status === "approved" ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : p.status === "rejected" ? (
                        <XCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {p.status}
                    </Badge>
                    <Badge variant="secondary" className="h-5">
                      {p.category.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.purpose}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Submitted {formatDate(p.createdAt)}</span>
                    <span className="px-1">•</span>
                    <FileText className="h-3 w-3" />
                    <span>Proof: {p.verificationMediaPaths?.length ?? 0}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-medium">PKR {p.requiredAmount.toLocaleString()}</span>
                </div>
              </div>

              {p.status === "rejected" && p.adminRemark ? (
                <div className="mt-3 rounded-md border border-white/30 bg-white/50 p-3 text-sm backdrop-blur">
                  <span className="font-medium">Admin remark:</span> {p.adminRemark}
                </div>
              ) : null}
            </div>
          ))}

          {!projectsQuery.isLoading && !projectsQuery.isError && filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests found.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
