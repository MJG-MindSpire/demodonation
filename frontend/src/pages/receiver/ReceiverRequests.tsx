import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiForm, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";

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
  verificationMediaPaths?: string[];
  createdAt: string;
  receiverDetails?: ReceiverDetails;
};

const categories: { value: ProjectCategory; label: string }[] = [
  { value: "medical", label: "Medical" },
  { value: "education", label: "Education" },
  { value: "food", label: "Food" },
  { value: "construction", label: "Construction" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

export default function ReceiverRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const projectsQuery = useQuery({
    queryKey: ["projects", "mine"],
    queryFn: async () => {
      const res = await apiRequest<{ projects: Project[] }>("/api/projects/mine");
      return res.projects;
    },
  });

  const summary = useMemo(() => {
    const list = projectsQuery.data ?? [];
    const pending = list.filter((p) => p.status === "pending").length;
    const approved = list.filter((p) => p.status === "approved").length;
    const rejected = list.filter((p) => p.status === "rejected").length;
    return { pending, approved, rejected, total: list.length };
  }, [projectsQuery.data]);

  const [fullName, setFullName] = useState("");
  const [fatherOrOrgName, setFatherOrOrgName] = useState("");
  const [cnicOrIdNumber, setCnicOrIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [city, setCity] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [category, setCategory] = useState<ProjectCategory>("medical");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requiredAmount, setRequiredAmount] = useState("");
  const [usageBreakdown, setUsageBreakdown] = useState("");
  const [durationText, setDurationText] = useState("");
  const [timelineStart, setTimelineStart] = useState("");
  const [timelineEnd, setTimelineEnd] = useState("");
  const [description, setDescription] = useState("");

  const [enableBank, setEnableBank] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIban, setBankIban] = useState("");

  const [enableJazzcash, setEnableJazzcash] = useState(false);
  const [jazzcashAccountName, setJazzcashAccountName] = useState("");
  const [jazzcashMobileNumber, setJazzcashMobileNumber] = useState("");

  const [enableEasypaisa, setEnableEasypaisa] = useState(false);
  const [easypaisaAccountName, setEasypaisaAccountName] = useState("");
  const [easypaisaMobileNumber, setEasypaisaMobileNumber] = useState("");

  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (verificationFiles.length === 0) throw new Error("Verification images are required");

      const bankComplete = !enableBank || (bankName.trim() && bankAccountHolderName.trim() && bankAccountNumber.trim());
      const jazzcashComplete = !enableJazzcash || (jazzcashAccountName.trim() && jazzcashMobileNumber.trim());
      const easypaisaComplete = !enableEasypaisa || (easypaisaAccountName.trim() && easypaisaMobileNumber.trim());

      if (!enableBank && !enableJazzcash && !enableEasypaisa) {
        throw new Error("Select at least one payment method");
      }
      if (!bankComplete) throw new Error("Bank details are incomplete");
      if (!jazzcashComplete) throw new Error("JazzCash details are incomplete");
      if (!easypaisaComplete) throw new Error("EasyPaisa details are incomplete");

      const form = new FormData();

      form.append("fullName", fullName.trim());
      form.append("fatherOrOrgName", fatherOrOrgName.trim());
      if (cnicOrIdNumber.trim()) form.append("cnicOrIdNumber", cnicOrIdNumber.trim());
      form.append("phone", phone.trim());
      if (alternatePhone.trim()) form.append("alternatePhone", alternatePhone.trim());
      form.append("city", city.trim());
      form.append("fullAddress", fullAddress.trim());

      form.append("category", category);
      form.append("title", title.trim());
      form.append("purpose", purpose.trim());
      form.append("requiredAmount", requiredAmount.trim());
      form.append("usageBreakdown", usageBreakdown.trim());
      if (durationText.trim()) form.append("durationText", durationText.trim());
      if (timelineStart) form.append("timelineStart", timelineStart);
      if (timelineEnd) form.append("timelineEnd", timelineEnd);
      form.append("description", description.trim());

      form.append("enableBank", String(enableBank));
      form.append("bankName", bankName.trim());
      form.append("bankAccountHolderName", bankAccountHolderName.trim());
      form.append("bankAccountNumber", bankAccountNumber.trim());
      form.append("bankIban", bankIban.trim());

      form.append("enableJazzcash", String(enableJazzcash));
      form.append("jazzcashAccountName", jazzcashAccountName.trim());
      form.append("jazzcashMobileNumber", jazzcashMobileNumber.trim());

      form.append("enableEasypaisa", String(enableEasypaisa));
      form.append("easypaisaAccountName", easypaisaAccountName.trim());
      form.append("easypaisaMobileNumber", easypaisaMobileNumber.trim());

      for (const f of verificationFiles) form.append("verificationFiles", f);

      return apiForm<{ project: Project }>("/api/projects", form);
    },
    onSuccess: async () => {
      setFullName("");
      setFatherOrOrgName("");
      setCnicOrIdNumber("");
      setPhone("");
      setAlternatePhone("");
      setCity("");
      setFullAddress("");

      setCategory("medical");
      setTitle("");
      setPurpose("");
      setRequiredAmount("");
      setUsageBreakdown("");
      setDurationText("");
      setTimelineStart("");
      setTimelineEnd("");
      setDescription("");

      setEnableBank(false);
      setBankName("");
      setBankAccountHolderName("");
      setBankAccountNumber("");
      setBankIban("");

      setEnableJazzcash(false);
      setJazzcashAccountName("");
      setJazzcashMobileNumber("");

      setEnableEasypaisa(false);
      setEasypaisaAccountName("");
      setEasypaisaMobileNumber("");

      setVerificationFiles([]);

      await queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
      toast({ title: "Submitted", description: "Your request has been submitted for admin approval." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to submit request", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/15 to-secondary/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Receiver Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Receiver Portal</h1>
            <p className="text-muted-foreground">Submit a verified donation request and track approval status</p>
          </div>

          <img
            src={heroIllustration}
            alt="Receiver"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold">{summary.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Submit Donation Request</CardTitle>
          <CardDescription>Upload verification proof (mandatory) and submit for admin approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Father Name / Organization Name</Label>
              <Input value={fatherOrOrgName} onChange={(e) => setFatherOrOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNIC / ID (optional)</Label>
              <Input value={cnicOrIdNumber} onChange={(e) => setCnicOrIdNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alternate Phone (optional)</Label>
              <Input value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Full Address</Label>
              <Input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} />
            </div>
          </div>

          <Card className="border-white/20 bg-white/50 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">Payment Methods for Donors</CardTitle>
              <CardDescription>Select at least one method and fill its details. Only filled methods will appear on the donor portal for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-lg border bg-white/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">Bank name, account holder, account number (IBAN optional)</p>
                  </div>
                  <Switch checked={enableBank} onCheckedChange={setEnableBank} />
                </div>
                {enableBank ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input value={bankAccountHolderName} onChange={(e) => setBankAccountHolderName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>IBAN (optional)</Label>
                      <Input value={bankIban} onChange={(e) => setBankIban(e.target.value)} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-lg border bg-white/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">JazzCash</p>
                    <p className="text-xs text-muted-foreground">Account name and mobile number</p>
                  </div>
                  <Switch checked={enableJazzcash} onCheckedChange={setEnableJazzcash} />
                </div>
                {enableJazzcash ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>JazzCash Account Name</Label>
                      <Input value={jazzcashAccountName} onChange={(e) => setJazzcashAccountName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>JazzCash Mobile Number</Label>
                      <Input value={jazzcashMobileNumber} onChange={(e) => setJazzcashMobileNumber(e.target.value)} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-lg border bg-white/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">EasyPaisa</p>
                    <p className="text-xs text-muted-foreground">Account name and mobile number</p>
                  </div>
                  <Switch checked={enableEasypaisa} onCheckedChange={setEnableEasypaisa} />
                </div>
                {enableEasypaisa ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>EasyPaisa Account Name</Label>
                      <Input value={easypaisaAccountName} onChange={(e) => setEasypaisaAccountName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>EasyPaisa Mobile Number</Label>
                      <Input value={easypaisaMobileNumber} onChange={(e) => setEasypaisaMobileNumber(e.target.value)} />
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Donation Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Amount Required</Label>
              <Input value={requiredAmount} onChange={(e) => setRequiredAmount(e.target.value)} placeholder="e.g. 50000" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Request Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Medical Treatment" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Exact Purpose</Label>
              <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Clear explanation" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Expected Usage Breakdown</Label>
              <Textarea value={usageBreakdown} onChange={(e) => setUsageBreakdown(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Project Duration / Timeline (text)</Label>
              <Input value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder="e.g. 3 months" />
            </div>
            <div className="space-y-2">
              <Label>Timeline Start (optional)</Label>
              <Input type="date" value={timelineStart} onChange={(e) => setTimelineStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Timeline End (optional)</Label>
              <Input type="date" value={timelineEnd} onChange={(e) => setTimelineEnd(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description / Situation Details</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Verification & Proof (multiple images required)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setVerificationFiles(Array.from(e.target.files ?? []))}
            />
          </div>

          <Button onClick={() => createRequestMutation.mutate()} disabled={createRequestMutation.isPending}>
            Submit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
