import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { apiForm, apiJson, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import adminIllustration from "@/assets/admin-illustration.png";

const settingsSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

type AppSettings = {
  name: string;
  address?: string;
  phone?: string;
  logoPath?: string;
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const res = await apiRequest<{ settings: AppSettings }>("/api/settings");
      return res.settings;
    },
  });

  const settingsDraft = useMemo(() => {
    return {
      name: settingsQuery.data?.name ?? "",
      address: settingsQuery.data?.address ?? "",
      phone: settingsQuery.data?.phone ?? "",
    };
  }, [settingsQuery.data?.address, settingsQuery.data?.name, settingsQuery.data?.phone]);

  const [name, setName] = useState(settingsDraft.name);
  const [address, setAddress] = useState(settingsDraft.address);
  const [phone, setPhone] = useState(settingsDraft.phone);

  useEffect(() => {
    setName(settingsDraft.name);
    setAddress(settingsDraft.address);
    setPhone(settingsDraft.phone);
  }, [settingsDraft.address, settingsDraft.name, settingsDraft.phone]);

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const input = settingsSchema.parse({ name, address, phone });
      return apiJson<{ settings: AppSettings }>("/api/settings", input, { method: "PUT" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Saved", description: "Settings updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to save settings", variant: "destructive" });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async () => {
      if (!logoFile) throw new Error("Please select a logo file");
      const form = new FormData();
      form.append("logo", logoFile);
      return apiForm<{ settings: AppSettings }>("/api/settings/logo", form);
    },
    onSuccess: async () => {
      setLogoFile(null);
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Uploaded", description: "Logo updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to upload logo", variant: "destructive" });
    },
  });

  const deleteSettingsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ ok: boolean }>("/api/settings", { method: "DELETE" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Deleted", description: "Settings removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message ?? "Failed to delete settings", variant: "destructive" });
    },
  });

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
              <span className="h-2 w-2 rounded-full bg-warning" />
              Admin Settings
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
            <p className="text-muted-foreground">Manage branding, portal credentials, and staff accounts</p>
          </div>

          <img
            src={adminIllustration}
            alt="Settings"
            className="hidden h-24 w-auto animate-float object-contain opacity-95 drop-shadow-xl lg:block"
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border bg-white/60 p-4 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
        />
        <div aria-hidden className="pointer-events-none absolute -left-20 top-20 h-60 w-60 rounded-full bg-secondary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />

        <Card className="group relative isolate overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-primary/12 before:via-transparent before:to-accent/10 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 after:pointer-events-none after:absolute after:-inset-x-24 after:-top-24 after:-z-10 after:h-48 after:rotate-12 after:bg-white/20 after:blur-2xl after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100">
          <CardHeader>
            <CardTitle>Software Details</CardTitle>
            <CardDescription>Update the name/logo shown on landing page and portal headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Name</Label>
                  <Input id="app-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-phone">Phone</Label>
                  <Input id="app-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="app-address">Address</Label>
                  <Input id="app-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Current logo: {settingsQuery.data?.logoPath ? settingsQuery.data.logoPath : "(none)"}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveSettingsMutation.mutate()}
                    disabled={saveSettingsMutation.isPending}
                    className="border-transparent bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm hover:from-primary/90 hover:to-secondary/90"
                  >
                    Save
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteSettingsMutation.mutate()}
                    disabled={deleteSettingsMutation.isPending}
                    className="bg-gradient-to-r from-destructive to-accent text-destructive-foreground shadow-sm hover:from-destructive/90 hover:to-accent/90"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Upload Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => uploadLogoMutation.mutate()}
                    disabled={uploadLogoMutation.isPending || !logoFile}
                    className="border-transparent bg-gradient-to-r from-secondary to-primary text-secondary-foreground shadow-sm hover:from-secondary/90 hover:to-primary/90"
                  >
                    Upload
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
