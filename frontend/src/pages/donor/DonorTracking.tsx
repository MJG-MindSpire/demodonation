import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { apiRequest } from "@/lib/api";
import donorIllustration from "@/assets/donor-illustration.png";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import {
  Gift,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Camera,
} from "lucide-react";

type DonationMethod = "cash" | "payoneer" | "paypal";
type DonationVerificationStatus = "pending" | "approved" | "flagged";
type DonationPaymentStatus = "initiated" | "paid";
type DonationReceiverStatus = "pending" | "approved" | "rejected";

type AnyDonationMethod = string;

type Donation = {
  _id: string;
  amount: number;
  method: AnyDonationMethod;
  paymentStatus: DonationPaymentStatus;
  verificationStatus: DonationVerificationStatus;
  receiverStatus?: DonationReceiverStatus;
  proofPaths?: string[];
  receiptNo?: string;
  createdAt: string;
  projectId:
    | string
    | {
        _id: string;
        title: string;
        status: string;
        requiredAmount: number;
        collectedAmount: number;
        progressPercent?: number;
      };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function donationProjectTitle(p: Donation["projectId"]) {
  return typeof p === "string" ? p : p?.title ?? "";
}

function buildTimeline(d: Donation): TimelineItem[] {
  const items: TimelineItem[] = [];
  const proofCount = d.proofPaths?.length ?? 0;
  const hasProof = proofCount > 0;
  const isOffline = d.method !== "paypal";
  items.push({
    id: "created",
    title: "Donation Created",
    description: `Donation to ${donationProjectTitle(d.projectId)}`,
    date: formatDate(d.createdAt),
    status: "completed",
  });

  items.push({
    id: "proof",
    title: "Proof Uploaded",
    description: hasProof ? `Uploaded ${proofCount} file(s)` : "Awaiting proof",
    date: hasProof ? "Uploaded" : "Pending",
    status: hasProof ? "completed" : "current",
  });

  items.push({
    id: "payment",
    title: "Payment Status",
    description:
      d.paymentStatus === "paid"
        ? "Payment confirmed"
        : isOffline
          ? hasProof
            ? "Proof submitted"
            : "Awaiting payment proof"
          : "Pending payment",
    date:
      d.paymentStatus === "paid"
        ? "Paid"
        : isOffline
          ? hasProof
            ? "Submitted"
            : "Pending"
          : "Pending",
    status:
      d.paymentStatus === "paid" ? "completed" : isOffline ? (hasProof ? "completed" : "current") : "pending",
  });

  items.push({
    id: "verification",
    title: "Receiver Confirmation",
    description:
      d.receiverStatus === "approved"
        ? "Donation approved"
        : d.receiverStatus === "rejected"
          ? "Donation rejected"
          : "Awaiting receiver confirmation",
    date: d.receiverStatus === "approved" ? "Approved" : d.receiverStatus === "rejected" ? "Rejected" : "Pending",
    status: d.receiverStatus === "approved" ? "completed" : d.receiverStatus === "rejected" ? "pending" : "current",
  });

  return items;
}

export default function DonorTracking() {
  const donationsQuery = useQuery({
    queryKey: ["donations", "mine"],
    queryFn: async () => {
      const res = await apiRequest<{ donations: Donation[] }>("/api/donations/mine");
      return res.donations;
    },
  });

  const donations = donationsQuery.data ?? [];
  const timelineById = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const d of donations) map.set(d._id, buildTimeline(d));
    return map;
  }, [donations]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-secondary/15 via-primary/15 to-accent/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Donation Tracking
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Track Your Donations</h1>
            <p className="text-muted-foreground">Follow every step of your contribution's journey</p>
          </div>

          <img
            src={donorIllustration}
            alt="Tracking"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      <div className="space-y-6">
        {donationsQuery.isLoading ? (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : donationsQuery.isError ? (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-destructive">Failed to load donations.</p>
            </CardContent>
          </Card>
        ) : donations.length === 0 ? (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No donations yet.</p>
            </CardContent>
          </Card>
        ) : (
          donations.map((donation) => (
            <Card key={donation._id} className="overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{donationProjectTitle(donation.projectId)}</CardTitle>
                      <CardDescription>{formatDate(donation.createdAt)}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">PKR {donation.amount.toLocaleString()}</span>
                    <Badge
                      variant={
                        donation.receiverStatus === "approved"
                          ? "success"
                          : donation.receiverStatus === "rejected"
                            ? "destructive"
                            : "info"
                      }
                      className="px-3 py-1"
                    >
                      {donation.receiverStatus !== "approved" ? (
                        <>
                          <Truck className="mr-1 h-3 w-3" />
                          In Review
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
                {/* Timeline */}
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Journey Timeline
                  </h4>
                  <Timeline items={timelineById.get(donation._id) ?? []} />
                </div>

                {/* Proof & Verification */}
                <div className="space-y-6">
                  {/* Proof Images */}
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Camera className="h-4 w-4" />
                      Field Proof
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(donation.proofPaths ?? []).map((img, i) => (
                        <div key={i} className="group relative aspect-video overflow-hidden rounded-lg bg-muted">
                          <img
                            src={toAbsoluteAssetUrl(img)}
                            alt={`Proof ${i + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute bottom-1 right-1">
                            <Badge
                              variant={donation.receiverStatus === "approved" ? "success" : donation.receiverStatus === "rejected" ? "destructive" : "warning"}
                              className="h-5 px-1.5 text-[10px]"
                            >
                              <Shield className="mr-0.5 h-2.5 w-2.5" />
                              {donation.receiverStatus === "approved" ? "Approved" : donation.receiverStatus === "rejected" ? "Rejected" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {(donation.proofPaths ?? []).length === 0 ? (
                        <div className="col-span-3 rounded-lg border bg-muted/30 p-3">
                          <p className="text-sm text-muted-foreground">No proof uploaded.</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Verification Card */}
                  <div className="rounded-lg border bg-success/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-success">
                      <Shield className="h-4 w-4" />
                      Verified & Transparent
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      All fund usage is verified by our field team with GPS-tagged photos and timestamps.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Location Verified
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Timestamped
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
