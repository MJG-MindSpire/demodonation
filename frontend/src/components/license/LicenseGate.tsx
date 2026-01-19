import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";

type LicenseStatus = {
  activated: boolean;
  activatedAt?: string;
  devBypass?: boolean;
};

type ActivateResult = {
  ok: boolean;
  activated?: boolean;
  devBypass?: boolean;
  message?: string;
};

function hasElectronBridge() {
  return typeof window !== "undefined" && typeof (window as any).impactflow?.license?.getStatus === "function";
}

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [activated, setActivated] = useState(false);
  const [key, setKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldGate = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (!hasElectronBridge()) return false;
    return window.location.protocol === "file:";
  }, []);

  useEffect(() => {
    if (!shouldGate) {
      setChecked(true);
      setActivated(true);
      return;
    }

    (async () => {
      try {
        const status: LicenseStatus = await (window as any).impactflow.license.getStatus();
        setActivated(Boolean(status?.activated));
      } catch {
        setActivated(false);
      } finally {
        setChecked(true);
      }
    })();
  }, [shouldGate]);

  const handleActivate = async () => {
    setError(null);
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter a license key.");
      return;
    }

    setSubmitting(true);
    try {
      const res: ActivateResult = await (window as any).impactflow.license.activate(trimmed);
      if (!res?.ok || !res?.activated) {
        setError(res?.message ?? "Activation failed");
        setSubmitting(false);
        return;
      }

      setActivated(true);
      setSubmitting(false);
    } catch (e: any) {
      setError(e?.message ?? "Activation failed");
      setSubmitting(false);
    }
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-4">
          <Card className="w-full border-white/30 bg-white/60 shadow-[var(--shadow-elevated)] backdrop-blur-md">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Checking license status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activated) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 bg-[length:200%_200%] animate-gradient"
      />
      <div aria-hidden className="pointer-events-none absolute -z-10 left-10 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -z-10 right-10 bottom-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <Card className="w-full max-w-md border-white/30 bg-white/60 shadow-[var(--shadow-elevated)] backdrop-blur-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Activate License</CardTitle>
              <CardDescription>Enter your license key to unlock the software.</CardDescription>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="license">License Key</Label>
            <Input
              id="license"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={submitting}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
            />
          </div>

          <Button className="w-full" onClick={handleActivate} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate"
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Tip: You only need to activate once on this computer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
