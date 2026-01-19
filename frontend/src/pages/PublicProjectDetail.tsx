import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toAbsoluteAssetUrl } from "@/lib/urls";

type Project = {
  _id: string;
  title: string;
  purpose: string;
  description: string;
  category: string;
  requiredAmount: number;
  collectedAmount?: number;
  progressPercent?: number;
  usageBreakdown?: string;
  durationText?: string;
  timelineStart?: string;
  timelineEnd?: string;
  receiverDetails?: { city?: string };
};

type ProgressUpdate = {
  _id: string;
  stepTitle: string;
  workStatus: string;
  percentComplete: number;
  amountUsed: number;
  notes?: string;
  mediaPaths?: string[];
  createdAt: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isVideoPath(path: string) {
  const lower = path.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg") || lower.endsWith(".mov");
}

export default function PublicProjectDetail() {
  const { id } = useParams();

  const projectQuery = useQuery({
    queryKey: ["public", "projects", id],
    queryFn: async () => {
      const res = await apiRequest<{ project: Project; updates: ProgressUpdate[] }>(`/api/public/projects/${id}`);
      return res;
    },
    enabled: Boolean(id),
  });

  const project = projectQuery.data?.project;
  const updates = projectQuery.data?.updates ?? [];

  const collected = project?.collectedAmount ?? 0;
  const pct = project && project.requiredAmount > 0 ? (collected / project.requiredAmount) * 100 : 0;

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Project Details</h1>
          <p className="text-muted-foreground">Verified information and progress updates</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/projects">Back</Link>
        </Button>
      </div>

      {projectQuery.isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : projectQuery.isError || !project ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Project not found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{project.title}</CardTitle>
                  <CardDescription className="mt-1">{project.purpose}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Approved</Badge>
                  <Badge variant="secondary">{String(project.category).toUpperCase()}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">City</div>
                  <div className="text-sm">{project.receiverDetails?.city ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm">{project.durationText ?? "-"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Raised</span>
                  <span className="font-medium">PKR {collected.toLocaleString()} / {project.requiredAmount.toLocaleString()}</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>

              <div>
                <div className="text-sm font-medium">Description</div>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
              </div>

              {project.usageBreakdown ? (
                <div>
                  <div className="text-sm font-medium">Usage Breakdown</div>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{project.usageBreakdown}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verified Progress Updates</CardTitle>
              <CardDescription>Only admin-approved field submissions appear here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {updates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No verified updates yet.</p>
              ) : (
                updates.map((u) => (
                  <div key={u._id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{u.stepTitle}</p>
                          <Badge variant="secondary" className="h-5">{String(u.workStatus).toUpperCase()}</Badge>
                          <Badge variant="info" className="h-5">{u.percentComplete}%</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Amount used:</span> <span className="font-medium">PKR {u.amountUsed.toLocaleString()}</span>
                      </div>
                    </div>

                    {u.notes ? (
                      <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{u.notes}</p>
                    ) : null}

                    {(u.mediaPaths ?? []).length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                        {(u.mediaPaths ?? []).map((m) => (
                          <button
                            key={m}
                            type="button"
                            className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
                            onClick={() => window.open(toAbsoluteAssetUrl(m), "_blank", "noopener,noreferrer")}
                            aria-label="Open media"
                          >
                            {isVideoPath(m) ? (
                              <video src={toAbsoluteAssetUrl(m)} className="h-full w-full object-cover" muted />
                            ) : (
                              <img src={toAbsoluteAssetUrl(m)} alt="Progress media" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
