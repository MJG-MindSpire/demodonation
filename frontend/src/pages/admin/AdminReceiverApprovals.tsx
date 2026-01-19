import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiJson, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, Clock, FileText, Image, XCircle } from "lucide-react";
import { toAbsoluteAssetUrl } from "@/lib/urls";

type ProjectStatus = "pending" | "approved" | "rejected" | "completed";
type ProjectCategory = "education" | "medical" | "food" | "construction" | "emergency" | "other";

type ReceiverDetails = {
  fullName?: string;
  fatherOrOrgName?: string;
  cnicOrIdNumber?: string;
  phone?: string;
  alternatePhone?: string;
  city?: string;
  fullAddress?: string;
};

type Project = {
  _id: string;
  title: string;
  purpose: string;
  description: string;
  category: ProjectCategory;
  requiredAmount: number;
  status: ProjectStatus;
  adminRemark?: string;
  usageBreakdown?: string;
  durationText?: string;
  timelineStart?: string;
  timelineEnd?: string;
  verificationMediaPaths?: string[];
  createdAt: string;
  receiverDetails?: ReceiverDetails;
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

export default function AdminReceiverApprovals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pendingQuery = useQuery({
    queryKey: ["admin", "projects", "pending"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/admin/projects?status=pending");
      return res.projects;
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remark, setRemark] = useState("");

  const selectedProject = useMemo(() => {
    const list = pendingQuery.data ?? [];
    if (selectedId) return list.find((p) => p._id === selectedId) ?? null;
    return list[0] ?? null;
  }, [pendingQuery.data, selectedId]);

  useEffect(() => {
    if (selectedProject && selectedProject._id !== selectedId) {
      setSelectedId(selectedProject._id);
    }
  }, [selectedId, selectedProject?._id]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) throw new Error("No request selected");
      return apiJson<{ project: Project }>(`/api/admin/projects/${selectedProject._id}/approve`, { remark });
    },
    onSuccess: async () => {
      setRemark("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "projects", "pending"] });
      toast({ title: "Approved", description: "Receiver request approved and published." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) throw new Error("No request selected");
      return apiJson<{ project: Project }>(`/api/admin/projects/${selectedProject._id}/reject`, { remark });
    },
    onSuccess: async () => {
      setRemark("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "projects", "pending"] });
      toast({ title: "Rejected", description: "Receiver request rejected." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to reject", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pending Receiver Requests</h1>
        <p className="text-muted-foreground">Review receiver submissions and approve/reject before donations are allowed</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {pendingQuery.isLoading && (
            <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          )}

          {pendingQuery.isError && (
            <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">Failed to load pending requests.</p>
              </CardContent>
            </Card>
          )}

          {(pendingQuery.data ?? []).map((p) => (
            <Card
              key={p._id}
              className={`cursor-pointer border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] ${
                selectedProject?._id === p._id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedId(p._id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-medium leading-tight">{p.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>{p.category.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Proof: {p.verificationMediaPaths?.length ?? 0}</div>
                  </div>
                  <Badge variant="warning" className="shrink-0">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">PKR {p.requiredAmount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(p.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {!pendingQuery.isLoading && !pendingQuery.isError && (pendingQuery.data ?? []).length === 0 && (
            <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-3 border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardHeader>
            <CardTitle>{selectedProject?.title ?? "Select a request"}</CardTitle>
            <CardDescription className="mt-1">
              {selectedProject ? (
                <span className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Submitted on {formatDateTime(selectedProject.createdAt)}
                </span>
              ) : (
                ""
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!selectedProject ? (
              <p className="text-sm text-muted-foreground">Select a pending request from the left.</p>
            ) : (
              <>
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Full Name</div>
                      <div>{selectedProject.receiverDetails?.fullName ?? ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Father/Org</div>
                      <div>{selectedProject.receiverDetails?.fatherOrOrgName ?? ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">CNIC/ID</div>
                      <div>{selectedProject.receiverDetails?.cnicOrIdNumber ?? ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div>{selectedProject.receiverDetails?.phone ?? ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Alt Phone</div>
                      <div>{selectedProject.receiverDetails?.alternatePhone ?? ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">City</div>
                      <div>{selectedProject.receiverDetails?.city ?? ""}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground">Address</div>
                      <div>{selectedProject.receiverDetails?.fullAddress ?? ""}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div>
                    <div className="text-sm font-medium">Exact Purpose</div>
                    <p className="text-sm text-muted-foreground">{selectedProject.purpose}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Situation / Description</div>
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Usage Breakdown</div>
                    <p className="text-sm text-muted-foreground">{selectedProject.usageBreakdown ?? ""}</p>
                  </div>
                  {selectedProject.durationText ? (
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <p className="text-sm text-muted-foreground">{selectedProject.durationText}</p>
                    </div>
                  ) : null}
                </div>

                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Image className="h-4 w-4" />
                    Verification Proof
                  </h4>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {(selectedProject.verificationMediaPaths ?? []).map((img, i) => (
                      <button
                        key={img}
                        type="button"
                        className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
                        onClick={() => window.open(toAbsoluteAssetUrl(img), "_blank", "noopener,noreferrer")}
                        aria-label={`Open proof ${i + 1}`}
                      >
                        <img src={toAbsoluteAssetUrl(img)} alt={`Proof ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium">Admin Remarks</h4>
                  <Textarea
                    placeholder="Add remarks/notes (optional)"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="success"
                    className="flex-1 gap-2"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => rejectMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
