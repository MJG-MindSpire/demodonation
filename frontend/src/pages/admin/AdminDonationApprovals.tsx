import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { toAbsoluteAssetUrl } from "@/lib/urls";

type DonationMethod = string;

type Donation = {
  _id: string;
  amount: number;
  method: DonationMethod;
  paymentStatus: "initiated" | "paid" | "failed";
  verificationStatus: "pending" | "approved" | "flagged";
  receiverStatus?: "pending" | "approved" | "rejected";
  proofPaths?: string[];
  receiptNo?: string;
  createdAt: string;
  adminRemark?: string;
  projectId?: string;
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

export default function AdminDonationApprovals() {
  const pendingQuery = useQuery({
    queryKey: ["admin", "donations", "pending"],
    queryFn: async () => {
      const res = await apiRequest<{ donations: Donation[] }>("/api/admin/donations?receiverStatus=pending");
      return res.donations;
    },
    refetchInterval: 5000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedDonation = useMemo(() => {
    const list = pendingQuery.data ?? [];
    if (selectedId) return list.find((d) => d._id === selectedId) ?? null;
    return list[0] ?? null;
  }, [pendingQuery.data, selectedId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Pending Donations</h2>
        <p className="text-muted-foreground">Monitor donations (receiver confirmation flow)</p>
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
                <p className="text-sm text-destructive">Failed to load donations.</p>
              ) : (pendingQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending donations.</p>
              ) : (
                (pendingQuery.data ?? []).map((d) => (
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
                      </div>
                      <Badge variant="warning" className="h-5">{(d.receiverStatus ?? "pending").toUpperCase()}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{d.method.toUpperCase()}</span>
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
              <CardDescription>Review proof and decide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDonation ? (
                <p className="text-sm text-muted-foreground">Select a donation from the queue.</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Receipt</div>
                      <div className="text-sm font-medium">{selectedDonation.receiptNo ?? selectedDonation._id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="text-sm font-medium">PKR {selectedDonation.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Method</div>
                      <div className="text-sm">{selectedDonation.method.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Payment Status</div>
                      <div className="text-sm">{selectedDonation.paymentStatus}</div>
                    </div>
                  </div>

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

                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
