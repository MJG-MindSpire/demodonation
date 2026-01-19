import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiJson, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { toAbsoluteAssetUrl } from "@/lib/urls";

type ProgressUpdate = {
  _id: string;
  projectId: string;
  fieldWorkerId: string;
  stepTitle: string;
  workStatus: string;
  percentComplete: number;
  amountUsed: number;
  notes?: string;
  mediaPaths?: string[];
  approvalStatus: "pending" | "approved" | "rejected";
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

export default function AdminProgressApprovals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pendingQuery = useQuery({
    queryKey: ["admin", "progress-updates", "pending"],
    queryFn: async () => {
      const res = await apiRequest<{ updates: ProgressUpdate[] }>("/api/admin/progress-updates?approvalStatus=pending");
      return res.updates;
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remark, setRemark] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  const selectedUpdate = useMemo(() => {
    const list = pendingQuery.data ?? [];
    if (selectedId) return list.find((u) => u._id === selectedId) ?? null;
    return list[0] ?? null;
  }, [pendingQuery.data, selectedId]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUpdate) throw new Error("No update selected");
      return apiJson<{ update: ProgressUpdate }>(`/api/admin/progress-updates/${selectedUpdate._id}/approve`, { remark });
    },
    onSuccess: async () => {
      setRemark("");
      setDecision(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "progress-updates", "pending"] });
      toast({ title: "Approved", description: "Progress update approved and applied to project stats." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUpdate) throw new Error("No update selected");
      return apiJson<{ update: ProgressUpdate }>(`/api/admin/progress-updates/${selectedUpdate._id}/reject`, { remark });
    },
    onSuccess: async () => {
      setRemark("");
      setDecision(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "progress-updates", "pending"] });
      toast({ title: "Rejected", description: "Progress update rejected." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to reject", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Pending Progress Updates</h2>
        <p className="text-muted-foreground">Review field uploads and approve/reject</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">Queue</CardTitle>
              <CardDescription>{(pendingQuery.data ?? []).length} pending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : pendingQuery.isError ? (
                <p className="text-sm text-destructive">Failed to load updates.</p>
              ) : (pendingQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending updates.</p>
              ) : (
                (pendingQuery.data ?? []).map((u) => (
                  <button
                    key={u._id}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      (selectedUpdate?._id ?? "") === u._id ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedId(u._id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{u.stepTitle}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</p>
                      </div>
                      <Badge variant="warning" className="h-5">Pending</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{u.workStatus.toUpperCase()}</span>
                      <span>Media: {u.mediaPaths?.length ?? 0}</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">Update Details</CardTitle>
              <CardDescription>Review proof and decide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedUpdate ? (
                <p className="text-sm text-muted-foreground">Select an update from the queue.</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Step</div>
                      <div className="text-sm font-medium">{selectedUpdate.stepTitle}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="text-sm">{selectedUpdate.workStatus}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Percent Complete</div>
                      <div className="text-sm font-medium">{selectedUpdate.percentComplete}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Amount Used</div>
                      <div className="text-sm font-medium">PKR {selectedUpdate.amountUsed.toLocaleString()}</div>
                    </div>
                  </div>

                  {selectedUpdate.notes ? (
                    <div>
                      <div className="text-xs text-muted-foreground">Notes</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedUpdate.notes}</div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {(selectedUpdate.mediaPaths ?? []).map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(toAbsoluteAssetUrl(p), "_blank", "noopener,noreferrer")}
                      >
                        <Eye className="h-4 w-4" />
                        View Media
                      </Button>
                    ))}
                    {(selectedUpdate.mediaPaths ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No media uploaded.</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="accent" className="gap-2" onClick={() => setDecision("approve")}>
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => setDecision("reject")}>
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

      <Dialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open) setDecision(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === "approve" ? "Approve Progress Update" : "Reject Progress Update"}</DialogTitle>
            <DialogDescription>Add an optional remark.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Remark (optional)" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              variant={decision === "approve" ? "accent" : "destructive"}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              onClick={() => {
                if (decision === "approve") approveMutation.mutate();
                if (decision === "reject") rejectMutation.mutate();
              }}
            >
              {decision === "approve"
                ? approveMutation.isPending
                  ? "Approving..."
                  : "Approve"
                : rejectMutation.isPending
                  ? "Rejecting..."
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
