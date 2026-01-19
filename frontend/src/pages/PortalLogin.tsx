import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { portalConfigs, type PortalKey } from "@/lib/portals";
import { apiJson } from "@/lib/api";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toAbsoluteAssetUrl } from "@/lib/urls";

export default function PortalLogin({ portalOverride }: { portalOverride?: PortalKey } = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const portal = portalOverride ?? ((params.portal as PortalKey | undefined) ?? "donor");

  const portalConfig = useMemo(() => {
    return portalConfigs[portal] ?? portalConfigs.donor;
  }, [portal]);

  const appSettingsQuery = useAppSettings();
  const appName = appSettingsQuery.data?.name?.trim() ? appSettingsQuery.data.name : "Impact Flow";
  const appLogoPath = appSettingsQuery.data?.logoPath?.trim() ? appSettingsQuery.data.logoPath : undefined;

  const theme = useMemo(() => {
    switch (portalConfig.key) {
      case "admin":
        return {
          bg: "from-blue-600/25 via-indigo-500/15 to-cyan-400/20",
          blobA: "bg-blue-500/25",
          blobB: "bg-indigo-500/20",
          blobC: "bg-cyan-400/20",
          halo: "bg-blue-500/20",
        };
      case "field":
        return {
          bg: "from-orange-500/25 via-rose-500/15 to-amber-400/20",
          blobA: "bg-orange-500/25",
          blobB: "bg-rose-500/18",
          blobC: "bg-amber-400/20",
          halo: "bg-orange-500/20",
        };
      case "receiver":
        return {
          bg: "from-emerald-500/25 via-teal-500/15 to-lime-400/20",
          blobA: "bg-emerald-500/25",
          blobB: "bg-teal-500/18",
          blobC: "bg-lime-400/18",
          halo: "bg-emerald-500/20",
        };
      case "donor":
      default:
        return {
          bg: "from-violet-600/25 via-fuchsia-500/15 to-sky-400/20",
          blobA: "bg-violet-500/25",
          blobB: "bg-fuchsia-500/18",
          blobC: "bg-sky-400/18",
          halo: "bg-violet-500/20",
        };
    }
  }, [portalConfig.key]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError(null);
    setSubmitting(false);
  }, [portalConfig.key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError(portalConfig.key === "admin" ? "Please enter both username and password." : "Please enter both email and password.");
      return;
    }

    setSubmitting(true);

    const loginCall =
      portalConfig.key === "admin"
        ? apiJson<{ token: string; user: { role: PortalKey; username: string } }>("/api/portal/login", {
            portalKey: portalConfig.key,
            username: trimmedUsername,
            password,
          }).then((res) => ({ token: res.token, role: res.user.role, username: res.user.username }))
        : apiJson<{ token: string; user: { id: string; email: string; role: PortalKey; name?: string } }>(
            "/api/auth/login",
            {
              email: trimmedUsername,
              password,
            },
          ).then((res) => ({ token: res.token, role: res.user.role, username: res.user.email }));

    loginCall
      .then((res) => {
        sessionStorage.setItem("impactflow.token", res.token);
        sessionStorage.setItem("impactflow.role", res.role);
        sessionStorage.setItem("impactflow.username", res.username);

        const maybeFrom = (location.state as { from?: string } | null)?.from;
        navigate(maybeFrom ?? portalConfig.homePath);
      })
      .catch((err: any) => {
        setError(err?.message ?? "Invalid credentials. Please try again.");
        setSubmitting(false);
      });
  };

  const LogoIcon = portalConfig.Icon;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted p-4">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br bg-[length:200%_200%] animate-gradient",
          theme.bg,
        )}
      />
      <div className={cn("pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full blur-3xl", theme.blobA)} />
      <div className={cn("pointer-events-none absolute -bottom-28 left-1/4 -z-10 h-80 w-80 rounded-full blur-3xl", theme.blobB)} />
      <div className={cn("pointer-events-none absolute -right-24 top-1/4 -z-10 h-72 w-72 rounded-full blur-3xl", theme.blobC)} />

      <div className="relative w-full max-w-5xl">
        <div className="mb-7 flex flex-col items-center justify-center text-center">
          {appLogoPath ? (
            <div className="mb-3 rounded-2xl border border-white/25 bg-white/10 p-3 shadow-[var(--shadow-card)] backdrop-blur-md">
              <img src={toAbsoluteAssetUrl(appLogoPath)} alt={`${appName} logo`} className="h-12 w-12 object-contain" />
            </div>
          ) : null}
          <div className="text-2xl font-bold tracking-tight sm:text-3xl">{appName}</div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <Card className={cn("overflow-hidden border-white/30 bg-white/65 shadow-[var(--shadow-card)] backdrop-blur-md", portalConfig.accentBorderClass)}>
              <div className={cn("h-1 w-full", portalConfig.accentBgClass)} />
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border bg-card/80 backdrop-blur",
                      portalConfig.accentBorderClass,
                    )}
                  >
                    <LogoIcon className={cn("h-5 w-5", portalConfig.accentTextClass)} />
                  </div>
                  <div>
                    <CardTitle>{portalConfig.name}</CardTitle>
                    <CardDescription>{portalConfig.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 overflow-hidden rounded-lg border bg-muted/30 lg:hidden">
                  <img
                    src={portalConfig.logoSrc}
                    alt={`${portalConfig.name} logo`}
                    className="h-32 w-full object-cover transition-transform duration-500 will-change-transform hover:scale-[1.02]"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{portalConfig.key === "admin" ? "Username" : "Email"}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={portalConfig.key === "admin" ? "Enter your username" : "Enter your email"}
                      autoComplete={portalConfig.key === "admin" ? "username" : "email"}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={submitting}
                        className="pr-10"
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
                  <Button type="submit" className="w-full" variant={portalConfig.buttonVariant} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  {portalConfig.key === "donor" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => navigate("/donor/register")}
                      disabled={submitting}
                    >
                      Create Donor Account
                    </Button>
                  )}

                  {portalConfig.key === "field" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => navigate("/field/register")}
                      disabled={submitting}
                    >
                      Create Field Worker Account
                    </Button>
                  )}

                  {portalConfig.key === "receiver" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => navigate("/receiver/register")}
                      disabled={submitting}
                    >
                      Create Receiver Account
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="order-1 hidden lg:block">
            <div className="relative mx-auto max-w-md">
              <div className={cn("absolute -inset-10 rounded-full blur-3xl", theme.halo)} />
              <div className="relative rounded-3xl border border-white/25 bg-white/10 p-6 shadow-[var(--shadow-card)] backdrop-blur-md">
                <img
                  src={portalConfig.logoSrc}
                  alt={`${portalConfig.name} illustration`}
                  className="mx-auto w-full max-w-sm select-none drop-shadow-xl will-change-transform animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
