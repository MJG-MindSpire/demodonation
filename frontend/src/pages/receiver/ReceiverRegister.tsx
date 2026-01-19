import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiForm } from "@/lib/api";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";

export default function ReceiverRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (
      !name.trim() ||
      !fatherName.trim() ||
      !cnic.trim() ||
      !address.trim() ||
      !phone.trim() ||
      !trimmedEmail ||
      !password ||
      !photo
    ) {
      setError("Please fill in all fields and select a profile picture.");
      return;
    }

    setSubmitting(true);

    const form = new FormData();
    form.append("role", "receiver");
    form.append("name", name.trim());
    form.append("fatherName", fatherName.trim());
    form.append("cnic", cnic.trim());
    form.append("address", address.trim());
    form.append("phone", phone.trim());
    form.append("email", trimmedEmail);
    form.append("password", password);
    form.append("photo", photo);

    apiForm<{ token: string; user: { id: string; email: string; role: "receiver"; name?: string } }>(
      "/api/auth/register",
      form,
    )
      .then((res) => {
        sessionStorage.setItem("impactflow.token", res.token);
        sessionStorage.setItem("impactflow.role", res.user.role);
        sessionStorage.setItem("impactflow.username", res.user.email);

        const maybeFrom = (location.state as { from?: string } | null)?.from;
        navigate(maybeFrom ?? "/receiver");
      })
      .catch((err: any) => {
        setError(err?.message ?? "Failed to register. Please try again.");
        setSubmitting(false);
      });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 bg-[length:200%_200%] animate-gradient"
      />
      <div aria-hidden className="pointer-events-none absolute -z-10 left-10 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -z-10 right-10 bottom-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="w-full max-w-md">
        <Card className="overflow-hidden border-white/30 bg-white/60 shadow-[var(--shadow-elevated)] backdrop-blur-md">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Receiver Registration</CardTitle>
                <CardDescription>Create your receiver account to submit donation requests.</CardDescription>
              </div>
              <img
                src={heroIllustration}
                alt="Receiver"
                className="hidden h-14 w-auto animate-float object-contain opacity-95 drop-shadow-xl sm:block"
              />
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input id="cnic" value={cnic} onChange={(e) => setCnic(e.target.value)} disabled={submitting} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} disabled={submitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Profile Picture</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  disabled={submitting}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPhoto(file);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    className="pr-10"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={submitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/receiver/login")}
                disabled={submitting}
              >
                Already have an account? Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
