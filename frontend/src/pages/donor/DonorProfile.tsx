import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiForm, apiRequest } from "@/lib/api";
import { toAbsoluteAssetUrl } from "@/lib/urls";
import { useToast } from "@/components/ui/use-toast";
import donorIllustration from "@/assets/donor-illustration.png";

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

export default function DonorProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiRequest<{ user: MeUser }>("/api/auth/me");
      return res.user;
    },
  });

  const initial = useMemo(() => {
    return {
      name: meQuery.data?.name ?? "",
      phone: meQuery.data?.phone ?? "",
      city: meQuery.data?.city ?? "",
      address: meQuery.data?.address ?? "",
      cnic: meQuery.data?.cnic ?? "",
    };
  }, [meQuery.data?.address, meQuery.data?.city, meQuery.data?.cnic, meQuery.data?.name, meQuery.data?.phone]);

  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [city, setCity] = useState(initial.city);
  const [address, setAddress] = useState(initial.address);
  const [cnic, setCnic] = useState(initial.cnic);
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    setName(initial.name);
    setPhone(initial.phone);
    setCity(initial.city);
    setAddress(initial.address);
    setCnic(initial.cnic);
  }, [initial.name, initial.phone, initial.city, initial.address, initial.cnic]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      if (name.trim()) form.append("name", name.trim());
      if (phone.trim()) form.append("phone", phone.trim());
      if (city.trim()) form.append("city", city.trim());
      if (address.trim()) form.append("address", address.trim());
      if (cnic.trim()) form.append("cnic", cnic.trim());
      if (photo) form.append("photo", photo);
      return apiForm<{ user: MeUser }>("/api/auth/me/profile", form, { method: "PUT" });
    },
    onSuccess: async () => {
      setPhoto(null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast({ title: "Saved", description: "Profile updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to save profile", variant: "destructive" });
    },
  });

  const profile = meQuery.data;

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
              Donor Profile
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Profile</h1>
            <p className="text-muted-foreground">Save your details so receipts and admin verification are complete.</p>
          </div>

          <img
            src={donorIllustration}
            alt="Donor"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>These details will appear on your receipt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>CNIC</Label>
                <Input value={cnic} onChange={(e) => setCnic(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || meQuery.isLoading}>
              Save
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md">
          <CardHeader>
            <CardTitle>Saved Card</CardTitle>
            <CardDescription>Preview of what admin and receipts will show.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.photoPath ? (
              <img
                src={toAbsoluteAssetUrl(profile.photoPath)}
                alt="Donor"
                className="h-32 w-32 rounded-lg border object-cover"
              />
            ) : (
              <div className="h-32 w-32 rounded-lg border bg-muted" />
            )}

            <div className="grid gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {profile?.name ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span> {profile?.email ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span> {profile?.phone ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">City:</span> {profile?.city ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span> {profile?.address ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">CNIC:</span> {profile?.cnic ?? "-"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
