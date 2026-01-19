import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import adminIllustration from "@/assets/admin-illustration.png";
import { Search, X } from "lucide-react";

type DonorRow = {
  id: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  cnic?: string;
  photoPath?: string;
  isActive?: boolean;
  createdAt?: string;
  donationCount: number;
  totalAmount: number;
};

function formatCurrency(amount: number) {
  return `PKR ${Number(amount ?? 0).toLocaleString()}`;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function AdminDonors() {
  const donorsQuery = useQuery({
    queryKey: ["admin", "donors"],
    queryFn: async () => {
      const res = await apiRequest<{ donors: DonorRow[] }>("/api/admin/donors");
      return res.donors;
    },
  });

  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const list = donorsQuery.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => {
      return (
        (d.name ?? "").toLowerCase().includes(q) ||
        (d.email ?? "").toLowerCase().includes(q) ||
        (d.phone ?? "").toLowerCase().includes(q) ||
        (d.cnic ?? "").toLowerCase().includes(q)
      );
    });
  }, [donorsQuery.data, filter]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-white/50 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 bg-[length:200%_200%] animate-gradient"
        />
        <div aria-hidden className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-info" />
              Donor Insights
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Donors</h1>
            <p className="text-muted-foreground">Search donors and verify their saved profile details</p>
          </div>

          <img
            src={adminIllustration}
            alt="Donors"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      <Card className="relative overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 bg-[length:200%_200%] animate-gradient"
        />
        <CardHeader className="relative">
          <CardTitle>Search</CardTitle>
          <CardDescription>Filter by name, email, phone or CNIC</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search donors..."
                className="bg-white/70 pl-9 shadow-sm backdrop-blur"
              />
              {filter ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted/40"
                  onClick={() => setFilter("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of {(donorsQuery.data ?? []).length}
            </div>
          </div>
        </CardContent>
      </Card>

      {donorsQuery.isLoading && (
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading donors...</p>
          </CardContent>
        </Card>
      )}

      {donorsQuery.isError && (
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load donors.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((d) => (
          <Card
            key={d.id}
            className="group relative overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div aria-hidden className="pointer-events-none absolute -inset-x-24 -top-24 h-48 rotate-12 bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{d.name ?? d.email}</CardTitle>
                  <CardDescription>{d.email}</CardDescription>
                </div>
                <Badge variant={d.isActive === false ? "destructive" : "secondary"}>{d.isActive === false ? "Disabled" : "Active"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Donations:</span> {d.donationCount}
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span> {formatCurrency(d.totalAmount)}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Joined:</span> {formatDate(d.createdAt)}
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-transparent bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm hover:from-primary/90 hover:to-secondary/90"
                  >
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Donor Details</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {d.photoPath ? (
                      <img src={toAbsoluteAssetUrl(d.photoPath)} alt="Donor" className="h-36 w-36 rounded-lg border object-cover" />
                    ) : (
                      <div className="h-36 w-36 rounded-lg border bg-muted" />
                    )}

                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span> {d.name ?? "-"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span> {d.email ?? "-"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {d.phone ?? "-"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">City:</span> {d.city ?? "-"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address:</span> {d.address ?? "-"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">CNIC:</span> {d.cnic ?? "-"}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {!donorsQuery.isLoading && !donorsQuery.isError && filtered.length === 0 && (
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No donors found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
