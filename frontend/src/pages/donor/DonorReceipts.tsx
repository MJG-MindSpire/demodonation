import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle2,
  Shield,
  Printer,
} from "lucide-react";
import donorIllustration from "@/assets/donor-illustration.png";

type DonationMethod = string;
type PaymentStatus = "initiated" | "paid" | "failed";
type VerificationStatus = "pending" | "approved" | "flagged";
type ReceiverStatus = "pending" | "approved" | "rejected";

type DonationReceipt = {
  _id: string;
  receiptNo: string;
  amount: number;
  method: DonationMethod;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  receiverStatus?: ReceiverStatus;
  proofPaths: string[];
  createdAt: string;
  projectId?: {
    _id: string;
    title?: string;
  } | null;
};

type MeUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  cnic?: string;
  photoPath?: string;
};

function toAbsoluteUrl(input?: string) {
  return toAbsoluteAssetUrl(input);
}

function formatCurrency(amount: number) {
  return `PKR ${Number(amount ?? 0).toLocaleString()}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function statusBadgeVariant(status: VerificationStatus) {
  if (status === "approved") return "success";
  if (status === "flagged") return "destructive";
  return "warning";
}

function statusBadgeLabel(status: VerificationStatus) {
  if (status === "approved") return "Verified";
  if (status === "flagged") return "Flagged";
  return "Pending";
}

function receiptEffectiveStatus(donation: DonationReceipt): VerificationStatus {
  if (donation.receiverStatus === "approved") return "approved";
  if (donation.receiverStatus === "rejected") return "flagged";
  return donation.verificationStatus;
}

function buildReceiptHtml(params: {
  donation: DonationReceipt;
  settings?: { name: string; address?: string; phone?: string; logoPath?: string };
  user?: MeUser;
}) {
  const { donation, settings, user } = params;
  const title = settings?.name ?? "DonateFlow";
  const receiptNo = donation.receiptNo ?? donation._id;
  const date = formatDate(donation.createdAt);
  const donorName = user?.name ?? sessionStorage.getItem("impactflow.username") ?? "-";
  const donorEmail = user?.email ?? sessionStorage.getItem("impactflow.username") ?? "-";
  const donorPhone = user?.phone?.trim?.() ? user.phone.trim() : "-";
  const donorCity = user?.city?.trim?.() ? user.city.trim() : "-";
  const donorAddress = user?.address?.trim?.() ? user.address.trim() : "-";
  const donorCnic = user?.cnic?.trim?.() ? user.cnic.trim() : "-";
  const projectTitle = donation.projectId?.title ?? "(project)";
  const method = donation.method?.toUpperCase?.() ?? "-";
  const amount = formatCurrency(donation.amount);
  const effectiveStatus = receiptEffectiveStatus(donation);

  const logoHtml = settings?.logoPath
    ? `<img src="${toAbsoluteUrl(settings.logoPath)}" alt="Logo" style="height:48px; width:auto; object-fit:contain;" />`
    : `<div style="font-weight:800; font-size:24px; letter-spacing:0.5px;">${title}</div>`;

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Donation Receipt ${receiptNo}</title>
      <style>
        @page { size: A4; margin: 16mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #111827; }
        .wrap { position: relative; }
        .watermark {
          position: fixed;
          left: 50%;
          top: 55%;
          transform: translate(-50%, -50%) rotate(-20deg);
          font-size: 72px;
          font-weight: 800;
          color: rgba(17, 24, 39, 0.06);
          letter-spacing: 6px;
          white-space: nowrap;
          z-index: 0;
          pointer-events: none;
        }
        .card { position: relative; z-index: 1; border: 1px solid #d1d5db; padding: 14px; }
        .header { display:flex; align-items:flex-start; justify-content:space-between; gap: 12px; }
        .title { text-align:center; font-weight:700; font-size: 18px; margin: 6px 0 0 0; }
        .meta { font-size: 12px; }
        .meta b { display:inline-block; min-width: 90px; }
        .para { margin: 10px 0; font-size: 12px; line-height: 1.5; }
        .section-title { font-weight: 700; font-size: 12px; text-align:center; color:#1f2937; margin: 14px 0 6px; text-decoration: underline; }
        table { width:100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #111827; padding: 6px 8px; vertical-align: top; }
        th { background: #f3f4f6; text-align:left; }
        .footer { margin-top: 14px; font-size: 11px; display:flex; align-items:flex-end; justify-content:space-between; gap: 10px; }
        .stamp { border: 1px dashed #9ca3af; width: 160px; height: 80px; display:flex; align-items:center; justify-content:center; font-size: 11px; color:#6b7280; }
        .muted { color:#6b7280; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="watermark">${title.toUpperCase()}</div>

        <div class="card">
          <div class="header">
            <div>${logoHtml}</div>
            <div class="meta">
              <div><b>Receipt No:</b> ${receiptNo}</div>
              <div><b>Date:</b> ${date}</div>
            </div>
          </div>

          <div class="title">Donation Receipt</div>
          <div class="para">
            We sincerely thank <b>${donorName}</b> for supporting our work. Your contribution will help bring relief and impact to those in need.
          </div>

          <div class="section-title">Sponsor Details</div>
          <table>
            <tr>
              <th style="width:25%">Full Name</th><td>${donorName}</td>
              <th style="width:25%">Email</th><td>${donorEmail}</td>
            </tr>
            <tr>
              <th>Contact No</th><td>${donorPhone}</td>
              <th>City</th><td>${donorCity}</td>
            </tr>
            <tr>
              <th>Country</th><td>Pakistan</td>
              <th>Address</th><td>${donorAddress}</td>
            </tr>
            <tr>
              <th>CNIC</th><td>${donorCnic}</td>
              <th> </th><td> </td>
            </tr>
          </table>

          <div class="section-title">Project Details</div>
          <table>
            <tr>
              <th style="width:25%">Project</th><td colspan="3">${projectTitle}</td>
            </tr>
          </table>

          <div class="section-title">Payment Details</div>
          <table>
            <tr>
              <th style="width:25%">Donation Amount (PKR)</th><td>${amount}</td>
              <th style="width:25%">Mode of Payment</th><td>${method}</td>
            </tr>
            <tr>
              <th>Transaction/Reference No</th><td>-</td>
              <th>Status</th><td>${effectiveStatus.toUpperCase()}</td>
            </tr>
            <tr>
              <th>Date of Payment</th><td colspan="3">${date}</td>
            </tr>
          </table>

          <div class="para muted">
            Donations show as PENDING until the receiver confirms them. Keep this receipt for your records.
          </div>

          <div class="footer">
            <div>
              <div><b>${title}</b></div>
              <div class="muted">${settings?.address ?? ""}</div>
              <div class="muted">${settings?.phone ? `Phone: ${settings.phone}` : ""}</div>
            </div>
            <div>
              <div class="muted" style="margin-bottom:6px;">Signature/Stamp</div>
              <div class="stamp">OFFICIAL STAMP</div>
            </div>
          </div>
        </div>
      </div>
      <script>
        window.onload = () => {
          window.focus();
          window.print();
        };
      </script>
    </body>
  </html>`;
}

function openReceiptPrint(params: {
  donation: DonationReceipt;
  settings?: { name: string; address?: string; phone?: string; logoPath?: string };
  user?: MeUser;
}) {
  const html = buildReceiptHtml(params);

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    return;
  }

  // Cleanup blob URL later; let the new window load it first.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}

export default function DonorReceipts() {
  const { data: appSettings } = useAppSettings();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiRequest<{ user: MeUser }>("/api/auth/me");
      return res.user;
    },
  });

  const donationsQuery = useQuery({
    queryKey: ["donations", "mine"],
    queryFn: async () => {
      const res = await apiRequest<{ donations: DonationReceipt[] }>("/api/donations/mine");
      return res.donations;
    },
  });

  const totals = useMemo(() => {
    const list = donationsQuery.data ?? [];
    const year = new Date().getFullYear();
    const inYear = list.filter((d) => new Date(d.createdAt).getFullYear() === year);
    const total = inYear.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    return { year, total };
  }, [donationsQuery.data]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-secondary/15 via-primary/15 to-accent/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              Receipts
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Donation Receipts</h1>
            <p className="text-muted-foreground">Download invoices and tax-deductible receipts</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              disabled={(donationsQuery.data ?? []).length === 0}
              onClick={() => {
                const first = (donationsQuery.data ?? [])[0] ?? null;
                if (!first) return;
                openReceiptPrint({ donation: first, settings: appSettings, user: meQuery.data });
              }}
            >
              <Download className="h-4 w-4" />
              Download (PDF)
            </Button>

            <img
              src={donorIllustration}
              alt="Receipts"
              className="hidden h-20 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
            />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <DollarSign className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Donations ({totals.year})</p>
              <p className="text-3xl font-bold">{formatCurrency(totals.total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="px-3 py-1.5">
              <Shield className="mr-1 h-3 w-3" />
              Tax Deductible
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Receipts List */}
      <div className="space-y-4">
        {donationsQuery.isLoading && (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Loading receipts...</p>
            </CardContent>
          </Card>
        )}

        {donationsQuery.isError && (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-destructive">Failed to load receipts.</p>
            </CardContent>
          </Card>
        )}

        {(donationsQuery.data ?? []).map((donation) => (
          <Card key={donation._id} className="overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all hover:shadow-[var(--shadow-elevated)]">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{donation.receiptNo}</h3>
                    <Badge variant={statusBadgeVariant(receiptEffectiveStatus(donation))} className="h-5">
                      {receiptEffectiveStatus(donation) === "approved" && (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      )}
                      {statusBadgeLabel(receiptEffectiveStatus(donation))}
                    </Badge>
                    <Badge variant="secondary" className="h-5">
                      {donation.method.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{donation.projectId?.title ?? "(project)"}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(donation.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Proof: {donation.proofPaths?.length ? donation.proofPaths.length : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <span className="text-xl font-bold text-primary">{formatCurrency(donation.amount)}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      openReceiptPrint({ donation, settings: appSettings, user: meQuery.data });
                    }}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      openReceiptPrint({ donation, settings: appSettings, user: meQuery.data });
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {donation.proofPaths?.length ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(toAbsoluteAssetUrl(donation.proofPaths[0]), "_blank", "noopener,noreferrer")}
                    >
                      View Proof
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!donationsQuery.isLoading && !donationsQuery.isError && (donationsQuery.data ?? []).length === 0 && (
          <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No donations found yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trust Footer */}
      <Card className="border-primary/20 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <CardContent className="flex items-center gap-4 p-6">
          <Shield className="h-10 w-10 text-primary" />
          <div>
            <h4 className="font-medium">Verified & Secure Receipts</h4>
            <p className="text-sm text-muted-foreground">
              Pending receipts show as "Pending" until the receiver confirms the donation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
