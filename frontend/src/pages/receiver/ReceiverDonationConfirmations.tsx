import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiJson, apiRequest } from "@/lib/api";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, CheckCircle2, XCircle } from "lucide-react";

type ReceiverStatus = "pending" | "approved" | "rejected";

type Donation = {
  _id: string;
  amount: number;
  method: string;
  receiverStatus: ReceiverStatus;
  paidAmount?: number;
  donorPaymentDetails?: {
    donorAccountName?: string;
    donorAccountNumberOrMobile?: string;
    transactionId?: string;
  };
  proofPaths?: string[];
  receiptNo?: string;
  createdAt: string;
  receiverRemark?: string;
  projectId?:
    | string
    | {
        _id: string;
        title: string;
        status: string;
        requiredAmount?: number;
        collectedAmount?: number;
      };
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

function statusBadgeVariant(status: ReceiverStatus) {
  if (status === "approved") return "success";
  if (status === "rejected") return "destructive";
  return "warning";
}

function projectTitle(projectId: Donation["projectId"]) {
  if (!projectId) return "-";
  return typeof projectId === "string" ? projectId : projectId.title;
}

function methodLabel(method: string) {
  const m = (method ?? "").toLowerCase();
  if (m === "bank") return "Bank Transfer";
  if (m === "jazzcash") return "JazzCash";
  if (m === "easypaisa") return "EasyPaisa";
  return method;
}

export default function ReceiverDonationConfirmations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [status, setStatus] = useState<ReceiverStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState<string>("");

  const donationsQuery = useQuery({
    queryKey: ["receiver", "donations", status],
    queryFn: async () => {
      const res = await apiRequest<{ donations: Donation[] }>(`/api/receiver/donations?status=${status}`);
      return res.donations;
    },
  });

  const selectedDonation = useMemo(() => {
    const list = donationsQuery.data ?? [];
    if (selectedId) return list.find((d) => d._id === selectedId) ?? null;
    return list[0] ?? null;
  }, [donationsQuery.data, selectedId]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDonation) throw new Error("No donation selected");
      return apiJson<{ donation: Donation }>(`/api/receiver/donations/${selectedDonation._id}/approve`, { remark });
    },
    onSuccess: async () => {
      setRemark("");
      setDecision(null);
      await queryClient.invalidateQueries({ queryKey: ["receiver", "donations"] });
      toast({ title: "Approved", description: "Donation approved and funds added to the project." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDonation) throw new Error("No donation selected");
      return apiJson<{ donation: Donation }>(`/api/receiver/donations/${selectedDonation._id}/reject`, { remark });
    },
    onSuccess: async () => {
      setRemark("");
      setDecision(null);
      await queryClient.invalidateQueries({ queryKey: ["receiver", "donations"] });
      toast({ title: "Rejected", description: "Donation rejected." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to reject", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Donation Confirmations</h2>
        <p className="text-muted-foreground">Review donor payment details and approve or reject donations</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={status === "pending" ? "accent" : "outline"} onClick={() => setStatus("pending")}>
          Pending
        </Button>
        <Button type="button" variant={status === "approved" ? "accent" : "outline"} onClick={() => setStatus("approved")}>
          Approved
        </Button>
        <Button type="button" variant={status === "rejected" ? "accent" : "outline"} onClick={() => setStatus("rejected")}>
          Rejected
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">Queue</CardTitle>
              <CardDescription>{(donationsQuery.data ?? []).length} donation(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {donationsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : donationsQuery.isError ? (
                <p className="text-sm text-destructive">Failed to load donations.</p>
              ) : (donationsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No donations in this status.</p>
              ) : (
                (donationsQuery.data ?? []).map((d) => (
                  <button
                    key={d._id}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      (selectedDonation?._id ?? "") === d._id ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedId(d._id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{d.receiptNo ?? d._id}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Project: {projectTitle(d.projectId)}</p>
                      </div>
                      <Badge variant={statusBadgeVariant(d.receiverStatus)} className="h-5">
                        {d.receiverStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{methodLabel(d.method)}</span>
                      <span>Proof: {d.proofPaths?.length ?? 0}</span>
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
              <CardTitle className="text-base">Donation Details</CardTitle>
              <CardDescription>Verify donor details and proof before confirming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDonation ? (
                <p className="text-sm text-muted-foreground">Select a donation from the queue.</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Project</div>
                      <div className="text-sm font-medium">{projectTitle(selectedDonation.projectId)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Method</div>
                      <div className="text-sm">{methodLabel(selectedDonation.method)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Paid Amount</div>
                      <div className="text-sm font-medium">PKR {Number(selectedDonation.paidAmount ?? selectedDonation.amount).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Transaction / Reference ID</div>
                      <div className="text-sm font-medium">{selectedDonation.donorPaymentDetails?.transactionId ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Donor Account Name</div>
                      <div className="text-sm font-medium">{selectedDonation.donorPaymentDetails?.donorAccountName ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Donor Account / Mobile</div>
                      <div className="text-sm font-medium">{selectedDonation.donorPaymentDetails?.donorAccountNumberOrMobile ?? "-"}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Payment Proof</div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedDonation.proofPaths ?? []).map((p) => (
                        <Button
                          key={p}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(toAbsoluteAssetUrl(p), "_blank", "noopener,noreferrer")}
                        >
                          <Eye className="h-4 w-4" />
                          View Proof
                        </Button>
                      ))}
                      {(selectedDonation.proofPaths ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No proof uploaded.</p>
                      ) : null}
                    </div>
                  </div>

                  {status === "pending" ? (
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
                  ) : selectedDonation.receiverRemark ? (
                    <div className="rounded-lg border bg-white/50 p-3">
                      <div className="text-xs text-muted-foreground">Receiver Remark</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedDonation.receiverRemark}</div>
                    </div>
                  ) : null}
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
            <DialogTitle>{decision === "approve" ? "Approve Donation" : "Reject Donation"}</DialogTitle>
            <DialogDescription>{decision === "approve" ? "Add an optional remark." : "Add an optional reason."}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Remark (optional)</Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Write something..." />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
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
