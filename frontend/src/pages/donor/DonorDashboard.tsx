import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Heart,
  TrendingUp,
  Users,
  Sparkles,
  Gift,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import donorIllustration from "@/assets/donor-illustration.png";
import { apiForm, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

type DonationMethod = string;

type Donation = {
  _id: string;
  amount: number;
  method: DonationMethod;
  paymentStatus: "initiated" | "paid";
  verificationStatus: "pending" | "approved" | "flagged";
  receiverStatus?: "pending" | "approved" | "rejected";
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
        spentAmount?: number;
        progressPercent?: number;
        usageBreakdown?: string;
      };
};

type Project = {
  _id: string;
  title: string;
  purpose: string;
  category: string;
  requiredAmount: number;
  collectedAmount?: number;
  spentAmount?: number;
  progressPercent?: number;
  usageBreakdown?: string;
  paymentAccounts?: {
    bank?: {
      bankName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      iban?: string;
    };
    jazzcash?: {
      accountName?: string;
      mobileNumber?: string;
    };
    easypaisa?: {
      accountName?: string;
      mobileNumber?: string;
    };
  };
};

function formatCurrency(amount: number) {
  return `PKR ${Number(amount ?? 0).toLocaleString()}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function projectTitle(p: Donation["projectId"]) {
  if (!p) return "";
  return typeof p === "string" ? p : p.title;
}

function projectProgressPercent(p: Donation["projectId"]) {
  if (!p || typeof p === "string") return undefined;
  return typeof p.progressPercent === "number" ? p.progressPercent : undefined;
}

function latestProjectDetails(p: Donation["projectId"]) {
  if (!p || typeof p === "string") return null;
  return {
    requiredAmount: Number(p.requiredAmount ?? 0),
    collectedAmount: Number(p.collectedAmount ?? 0),
    spentAmount: Number((p as any).spentAmount ?? 0),
    usageBreakdown: typeof (p as any).usageBreakdown === "string" ? (p as any).usageBreakdown : "",
  };
}

export default function DonorDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const donationsQuery = useQuery({
    queryKey: ["donations", "mine"],
    queryFn: async () => {
      const res = await apiRequest<{ donations: Donation[] }>("/api/donations/mine");
      return res.donations;
    },
  });

  const projectsQuery = useQuery({
    queryKey: ["public", "projects"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/public/projects");
      return res.projects;
    },
  });

  const summary = useMemo(() => {
    const donations = donationsQuery.data ?? [];
    const totalDonated = donations.reduce((acc, d) => acc + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    const supportedProjects = new Set(
      donations
        .map((d) => (typeof d.projectId === "string" ? d.projectId : d.projectId?._id))
        .filter(Boolean) as string[],
    );
    const verified = donations.filter((d) => d.verificationStatus === "approved").reduce((acc, d) => acc + d.amount, 0);
    const utilizationPct = totalDonated > 0 ? Math.round((verified / totalDonated) * 100) : 0;
    return {
      totalDonated,
      verified,
      utilizationPct,
      supportedProjects: supportedProjects.size,
      donationsCount: donations.length,
    };
  }, [donationsQuery.data]);

  const latestDonation = (donationsQuery.data ?? [])[0];
  const latestProject = latestDonation ? (typeof latestDonation.projectId === "string" ? null : latestDonation.projectId) : null;
  const latestProgress = latestDonation ? projectProgressPercent(latestDonation.projectId) : undefined;
  const latestDetails = latestDonation ? latestProjectDetails(latestDonation.projectId) : null;
  const latestRemaining = latestDetails ? Math.max(latestDetails.collectedAmount - latestDetails.spentAmount, 0) : 0;
  const impactItems: TimelineItem[] = useMemo(() => {
    if (!latestDonation) return [];
    const proofCount = latestDonation.proofPaths?.length ?? 0;
    const hasProof = proofCount > 0;
    const isOffline = latestDonation.method !== "paypal";
    const items: TimelineItem[] = [];
    items.push({
      id: "created",
      title: "Donation Created",
      description: `Donation for ${projectTitle(latestDonation.projectId)}`,
      date: formatDate(latestDonation.createdAt),
      status: "completed",
    });

    items.push({
      id: "payment",
      title: "Payment Status",
      description:
        latestDonation.paymentStatus === "paid"
          ? "Payment captured"
          : isOffline
            ? hasProof
              ? `Proof submitted (${proofCount} file(s))`
              : "Awaiting payment proof"
            : "Awaiting payment",
      date:
        latestDonation.paymentStatus === "paid"
          ? "Paid"
          : isOffline
            ? hasProof
              ? "Submitted"
              : "Pending"
            : "Pending",
      status:
        latestDonation.paymentStatus === "paid"
          ? "completed"
          : isOffline
            ? hasProof
              ? "completed"
              : "current"
            : "current",
    });

    items.push({
      id: "verification",
      title: "Receiver Confirmation",
      description:
        latestDonation.receiverStatus === "approved"
          ? "Donation approved"
          : latestDonation.receiverStatus === "rejected"
            ? "Donation rejected"
            : "Awaiting receiver confirmation",
      date: latestDonation.receiverStatus === "approved" ? "Approved" : latestDonation.receiverStatus === "rejected" ? "Rejected" : "Pending",
      status: latestDonation.receiverStatus === "approved" ? "completed" : latestDonation.receiverStatus === "rejected" ? "pending" : "pending",
    });

    return items;
  }, [latestDonation]);

  const [donateProjectId, setDonateProjectId] = useState<string>("");
  const [donateAmount, setDonateAmount] = useState<string>("");
  const [donateMethod, setDonateMethod] = useState<DonationMethod>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [donorAccountName, setDonorAccountName] = useState<string>("");
  const [donorAccountNumberOrMobile, setDonorAccountNumberOrMobile] = useState<string>("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);

  const selectedProject = useMemo(() => {
    const list = projectsQuery.data ?? [];
    return donateProjectId ? list.find((p) => p._id === donateProjectId) ?? null : null;
  }, [donateProjectId, projectsQuery.data]);

  const allowedMethods = useMemo(() => {
    const pa = selectedProject?.paymentAccounts;
    const list: DonationMethod[] = [];
    if (pa?.bank?.bankName && pa?.bank?.accountHolderName && pa?.bank?.accountNumber) list.push("bank");
    if (pa?.jazzcash?.accountName && pa?.jazzcash?.mobileNumber) list.push("jazzcash");
    if (pa?.easypaisa?.accountName && pa?.easypaisa?.mobileNumber) list.push("easypaisa");
    return list;
  }, [selectedProject]);

  useEffect(() => {
    if (!donateProjectId) {
      setDonateMethod("");
      return;
    }
    if (allowedMethods.length === 0) {
      setDonateMethod("");
      return;
    }
    if (!allowedMethods.includes(donateMethod)) {
      setDonateMethod(allowedMethods[0]);
    }
  }, [allowedMethods, donateMethod, donateProjectId]);

  const createDonationMutation = useMutation({
    mutationFn: async () => {
      if (!donateProjectId) throw new Error("Select a project");
      const amount = Number(donateAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount");
      if (!donateMethod) throw new Error("Select a payment method");
      if (!allowedMethods.includes(donateMethod)) throw new Error("Selected payment method is not available for this project");
      if (!transactionId.trim()) throw new Error("Transaction / Reference ID is required");
      if (!donorAccountName.trim()) throw new Error("Donor account name is required");
      if (!donorAccountNumberOrMobile.trim()) throw new Error("Donor account number / mobile is required");
      if (proofFiles.length === 0) throw new Error("Upload proof image(s) or receipt screenshot");

      const form = new FormData();
      form.append("method", donateMethod);
      form.append("paidAmount", String(amount));
      form.append("transactionId", transactionId.trim());
      form.append("donorAccountName", donorAccountName.trim());
      form.append("donorAccountNumberOrMobile", donorAccountNumberOrMobile.trim());
      for (const f of proofFiles) form.append("proof", f);

      return apiForm<{ donation: { _id: string } }>(`/api/donations/projects/${donateProjectId}/submit-offline`, form);
    },
    onSuccess: async () => {
      setDonateProjectId("");
      setDonateAmount("");
      setDonateMethod("");
      setTransactionId("");
      setDonorAccountName("");
      setDonorAccountNumberOrMobile("");
      setProofFiles([]);
      await queryClient.invalidateQueries({ queryKey: ["donations", "mine"] });
      toast({ title: "Donation submitted", description: "Your donation is pending receiver confirmation." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to donate", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header with Illustration */}
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
              Donor Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your Impact Dashboard</h1>
            <p className="text-muted-foreground">See how your generosity is changing lives</p>
          </div>
          <img
            src={donorIllustration}
            alt="Donor Impact"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Donated"
          value={`PKR ${summary.totalDonated.toLocaleString()}`}
          subtitle={`${summary.donationsCount} donations`}
          icon={Gift}
          variant="primary"
        />
        <KPICard
          title="Funds Utilized"
          value={`PKR ${summary.verified.toLocaleString()}`}
          subtitle={`${summary.utilizationPct}% verified`}
          icon={TrendingUp}
          variant="secondary"
          trend={{ value: summary.utilizationPct, label: "verified", positive: true }}
        />
        <KPICard
          title="Projects Supported"
          value={String(summary.supportedProjects)}
          subtitle="Unique projects"
          icon={Sparkles}
          variant="default"
        />
        <KPICard
          title="Last Project Progress"
          value={
            latestDonation && typeof projectProgressPercent(latestDonation.projectId) === "number"
              ? `${projectProgressPercent(latestDonation.projectId)}%`
              : "-"
          }
          subtitle={latestDonation ? projectTitle(latestDonation.projectId) : "No donations yet"}
          icon={Users}
          variant="accent"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Impact Timeline */}
        <Card className="lg:col-span-2 border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-primary" />
              Your Money in Action
            </CardTitle>
            <CardDescription>Track your latest donation</CardDescription>
          </CardHeader>
          <CardContent>
            {donationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : impactItems.length > 0 ? (
              <>
                <Timeline items={impactItems} />

                {latestProject && latestDetails ? (
                  <div className="mt-6 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">Project Usage Snapshot</div>
                        <div className="text-xs text-muted-foreground">{latestProject.title}</div>
                      </div>
                      <Badge variant={latestProgress && latestProgress >= 100 ? "success" : "secondary"} className="shrink-0">
                        {typeof latestProgress === "number" ? `${latestProgress}%` : "-"}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Required</span>
                        <span className="font-medium">{formatCurrency(latestDetails.requiredAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Collected</span>
                        <span className="font-medium">{formatCurrency(latestDetails.collectedAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Spent (Verified)</span>
                        <span className="font-medium">{formatCurrency(latestDetails.spentAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">{formatCurrency(latestRemaining)}</span>
                      </div>
                    </div>

                    <Progress
                      value={latestDetails.requiredAmount > 0 ? (latestDetails.spentAmount / latestDetails.requiredAmount) * 100 : 0}
                      className="h-2"
                    />

                    {latestDetails.usageBreakdown ? (
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap">{latestDetails.usageBreakdown}</div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No donations yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Donate to Approved Projects */}
        <Card className="lg:col-span-3 border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Donate to Approved Projects</CardTitle>
              <CardDescription>Select a project, choose an available payment method, and submit payment details with proof.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/projects")}>
              Browse <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={donateProjectId} onValueChange={setDonateProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={projectsQuery.isLoading ? "Loading..." : "Select a project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(projectsQuery.data ?? []).map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (PKR)</Label>
                <Input value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} placeholder="e.g. 5000" />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                {!selectedProject ? (
                  <p className="text-sm text-muted-foreground">Select a project to see available payment methods.</p>
                ) : allowedMethods.length === 0 ? (
                  <p className="text-sm text-destructive">This project has no payment methods configured.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allowedMethods.map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant={donateMethod === m ? "accent" : "outline"}
                        onClick={() => setDonateMethod(m)}
                      >
                        {m === "bank" ? "Bank Transfer" : m === "jazzcash" ? "JazzCash" : "EasyPaisa"}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProject && donateMethod ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Receiver Payment Details</Label>
                  <div className="rounded-lg border bg-white/60 p-4 text-sm">
                    {donateMethod === "bank" ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Bank Name</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.bank?.bankName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Account Holder</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.bank?.accountHolderName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Account Number</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.bank?.accountNumber}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">IBAN</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.bank?.iban || "-"}</div>
                        </div>
                      </div>
                    ) : donateMethod === "jazzcash" ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Account Name</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.jazzcash?.accountName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Mobile Number</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.jazzcash?.mobileNumber}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Account Name</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.easypaisa?.accountName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Mobile Number</div>
                          <div className="font-medium">{selectedProject.paymentAccounts?.easypaisa?.mobileNumber}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {selectedProject && donateMethod ? (
                <>
                  <div className="space-y-2">
                    <Label>Transaction / Reference ID</Label>
                    <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. TXN123456" />
                  </div>
                  <div className="space-y-2">
                    <Label>Donor Account Name</Label>
                    <Input value={donorAccountName} onChange={(e) => setDonorAccountName(e.target.value)} placeholder="e.g. Ali Ahmed" />
                  </div>
                  <div className="space-y-2">
                    <Label>{donateMethod === "bank" ? "Donor Account Number" : "Donor Mobile Number"}</Label>
                    <Input
                      value={donorAccountNumberOrMobile}
                      onChange={(e) => setDonorAccountNumberOrMobile(e.target.value)}
                      placeholder={donateMethod === "bank" ? "e.g. 1234567890" : "e.g. 03xxxxxxxxx"}
                    />
                  </div>
                </>
              ) : null}

              <div className="space-y-2">
                <Label>Proof (images)</Label>
                <Input type="file" multiple accept="image/*" onChange={(e) => setProofFiles(Array.from(e.target.files ?? []))} />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => createDonationMutation.mutate()}
                disabled={createDonationMutation.isPending || !donateProjectId || !donateAmount || !donateMethod}
                className="w-full border-transparent bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm hover:from-primary/90 hover:to-secondary/90"
              >
                <Gift className="mr-2 h-4 w-4" />
                Submit Donation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Impact Section */}
      <Card className="overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-bold">You're Making a Difference!</h3>
          <p className="mb-4 max-w-md text-muted-foreground">
            Every donation is tracked and verified. Thank you for supporting transparent, accountable giving.
          </p>
          <Button variant="accent" size="lg" className="gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Gift className="h-5 w-5" />
            Donate Again
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
