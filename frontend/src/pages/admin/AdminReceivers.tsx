import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiJson, apiRequest } from "@/lib/api";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import adminIllustration from "@/assets/admin-illustration.png";
import { Search, X } from "lucide-react";

type ReceiverRow = {
  id: string;
  email: string;
  role: "receiver";
  name?: string;
  fatherName?: string;
  phone?: string;
  address?: string;
  cnic?: string;
  photoPath?: string;
  registrationStatus?: string;
  isActive?: boolean;
  createdAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function statusLabel(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (!s) return "Unknown";
  if (s === "pending") return "Pending";
  if (s === "verified") return "Verified";
  return status ?? "Unknown";
}

function statusVariant(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return "secondary" as const;
  if (s === "verified") return "accent" as const;
  return "outline" as const;
}

export default function AdminReceivers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const receiversQuery = useQuery({
    queryKey: ["admin", "receivers"],
    queryFn: async () => {
      const res = await apiRequest<{ users: ReceiverRow[] }>("/api/admin/receivers");
      return res.users;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<{ user: ReceiverRow }>(`/api/admin/receivers/${id}/verify`, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "receivers"] });
      toast({ title: "Verified", description: "Receiver has been verified." });
      if (openId === id) setOpenId(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to verify", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiJson<{ user: ReceiverRow }>(`/api/admin/receivers/${id}/status`, { isActive }, { method: "PATCH" });
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "receivers"] });
      toast({ title: "Updated", description: "Account status updated." });
      if (openId === vars.id) setOpenId(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to update", variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    const list = receiversQuery.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      return (
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q) ||
        (u.cnic ?? "").toLowerCase().includes(q)
      );
    });
  }, [receiversQuery.data, filter]);

  const totalCount = receiversQuery.data?.length ?? 0;

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
              <span className="h-2 w-2 rounded-full bg-success" />
              Receivers ({totalCount})
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Receivers</h1>
            <p className="text-muted-foreground">Review registered receivers and verify accounts</p>
          </div>

          <img
            src={adminIllustration}
            alt="Receivers"
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
                placeholder="Search receivers..."
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
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of {totalCount}
            </div>
          </div>
        </CardContent>
      </Card>

      {receiversQuery.isLoading && (
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading receivers...</p>
          </CardContent>
        </Card>
      )}

      {receiversQuery.isError && (
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load receivers.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((u) => (
          <Card
            key={u.id}
            className="group relative overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div aria-hidden className="pointer-events-none absolute -inset-x-24 -top-24 h-48 rotate-12 bg-white/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {u.photoPath ? (
                    <img
                      src={toAbsoluteAssetUrl(u.photoPath)}
                      alt={u.name ?? u.email}
                      className="h-12 w-12 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full border bg-white/60" />
                  )}
                  <div>
                    <CardTitle className="text-base">{u.name ?? u.email}</CardTitle>
                    <CardDescription>{u.email}</CardDescription>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge variant={u.isActive === false ? "destructive" : "secondary"}>{u.isActive === false ? "Disabled" : "Active"}</Badge>
                  <Badge variant={statusVariant(u.registrationStatus)}>{statusLabel(u.registrationStatus)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <span className="text-muted-foreground">Joined:</span> {formatDate(u.createdAt)}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Phone:</span> {u.phone ?? "-"}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">CNIC:</span> {u.cnic ?? "-"}
                </div>
              </div>

              <Dialog
                open={openId === u.id}
                onOpenChange={(open) => {
                  setOpenId(open ? u.id : null);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-transparent bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm hover:from-primary/90 hover:to-secondary/90"
                    onClick={() => setOpenId(u.id)}
                  >
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Receiver Details</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-2 text-sm">
                    {u.photoPath ? (
                      <img
                        src={toAbsoluteAssetUrl(u.photoPath)}
                        alt={u.name ?? u.email}
                        className="h-20 w-20 rounded-full border object-cover"
                      />
                    ) : null}
                    <div>
                      <span className="text-muted-foreground">Name:</span> {u.name ?? "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Father's Name:</span> {u.fatherName ?? "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {u.email ?? "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {u.phone ?? "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span> {u.address ?? "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">CNIC:</span> {u.cnic ?? "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registration Status:</span> {statusLabel(u.registrationStatus)}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="secondary"
                      disabled={verifyMutation.isPending || (u.registrationStatus ?? "").toLowerCase() === "verified"}
                      className="bg-gradient-to-r from-secondary to-primary text-secondary-foreground shadow-sm hover:from-secondary/90 hover:to-primary/90"
                      onClick={() => void verifyMutation.mutateAsync(u.id)}
                    >
                      Verify
                    </Button>
                    <Button
                      variant={u.isActive === false ? "default" : "destructive"}
                      disabled={statusMutation.isPending}
                      className={
                        u.isActive === false
                          ? "bg-gradient-to-r from-success to-secondary text-success-foreground shadow-sm hover:from-success/90 hover:to-secondary/90"
                          : "bg-gradient-to-r from-destructive to-accent text-destructive-foreground shadow-sm hover:from-destructive/90 hover:to-accent/90"
                      }
                      onClick={() => void statusMutation.mutateAsync({ id: u.id, isActive: u.isActive === false })}
                    >
                      {u.isActive === false ? "Enable" : "Disable"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {!receiversQuery.isLoading && !receiversQuery.isError && filtered.length === 0 && (
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No receivers found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
