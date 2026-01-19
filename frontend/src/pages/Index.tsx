import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Sparkles,
  Eye,
  Gift,
} from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";
import { portals } from "@/lib/portals";
import { useLocation } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toAbsoluteAssetUrl } from "@/lib/urls";

const stats = [
  { label: "Total Donated", value: "PKR 2.5M+", icon: Gift },
  { label: "Lives Impacted", value: "50,000+", icon: Users },
  { label: "Transparency Score", value: "98%", icon: Eye },
  { label: "Active Projects", value: "120+", icon: TrendingUp },
];

const features = [
  {
    icon: Shield,
    title: "100% Transparency",
    description: "Track every dollar from donation to impact with verified proof",
  },
  {
    icon: BarChart3,
    title: "Real-time Tracking",
    description: "Monitor your donations with live updates and GPS-verified reports",
  },
  {
    icon: CheckCircle2,
    title: "Verified Impact",
    description: "All field work is verified with photos, videos, and timestamps",
  },
  {
    icon: Sparkles,
    title: "Direct Connection",
    description: "Connect directly with beneficiaries and see your impact firsthand",
  },
];

export default function Index() {
  const location = useLocation();
  const { data: appSettings } = useAppSettings();
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo === "portals") {
      window.setTimeout(() => {
        document.getElementById("portals")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-2 md:h-16 md:flex-nowrap md:py-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              {appSettings?.logoPath ? (
                <img
                  src={toAbsoluteAssetUrl(appSettings.logoPath)}
                  alt="App logo"
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <Heart className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <span className="max-w-[42vw] truncate text-base font-bold sm:text-xl md:max-w-none">
              {appSettings?.name ?? "DonateFlow"}
            </span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("portals"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Portals</a>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection("impact"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Impact</a>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button variant="ghost" className="h-9 px-2 text-sm md:h-10 md:px-4" asChild>
              <Link to="/donor/login">
                <span className="sm:hidden">Log in</span>
                <span className="hidden sm:inline">Login</span>
              </Link>
            </Button>
            <Button variant="accent" className="h-9 px-3 text-sm md:h-10 md:px-4" asChild>
              <Link to="/donor/login">
                <Gift className="mr-2 h-4 w-4" />
                <span className="sm:hidden">Donate</span>
                <span className="hidden sm:inline">Donate Now</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="container flex flex-col items-center gap-8 py-20 text-center lg:flex-row lg:text-left lg:py-32">
          <div className="flex-1 space-y-6">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Sparkles className="mr-2 h-3 w-3" />
              Trusted by 10,000+ donors worldwide
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Donate with{" "}
              <span className="text-primary">Confidence</span>,{" "}
              <span className="text-secondary">Track</span> with{" "}
              <span className="text-accent">Transparency</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground lg:mx-0">
              The most transparent donation platform. See exactly where your money goes, 
              track real-time impact, and connect directly with the communities you help.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button variant="accent" size="xl" asChild>
                <Link to="/donor/login">
                  Start Donating
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/admin/login">
                  <Eye className="mr-2 h-5 w-5" />
                  Explore Platform
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src={heroIllustration}
              alt="Helping hands illustration"
              className="w-full max-w-md lg:max-w-lg animate-pulse"
              style={{ animationDuration: "3s" }}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold md:text-3xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Complete Transparency at Every Step</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Our platform ensures every donation is tracked, verified, and reported with complete transparency
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="text-center transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="pt-8 pb-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="bg-muted/30 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Role-Based Access</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">Explore the Platform</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Different portals for different roles, all connected for maximum transparency
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {portals.map((portal) => {
              const Icon = portal.Icon;
              return (
                <Link key={portal.key} to={portal.loginPath}>
                  <Card className={`group h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${portal.cardGlowClass}`}>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div className={`inline-flex rounded-xl border p-3 ${portal.accentBgClass} ${portal.accentBorderClass}`}>
                          <Icon className={`h-6 w-6 ${portal.accentTextClass}`} />
                        </div>
                        <span className={`text-xs font-medium ${portal.accentTextClass}`}>Secure</span>
                      </div>

                      <h3 className="mb-2 text-base font-semibold leading-tight">{portal.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{portal.description}</p>

                      <div className="overflow-hidden rounded-lg border bg-muted/20">
                        <img
                          src={portal.logoSrc}
                          alt={`${portal.name} branding`}
                          className="h-24 w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-sm font-medium ${portal.accentTextClass}`}>Open portal</span>
                        <ArrowRight className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 ${portal.accentTextClass}`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="impact" className="py-20">
        <div className="container">
          <Card className="overflow-hidden bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border-0">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">Ready to Make a Difference?</h2>
              <p className="mb-6 max-w-xl text-muted-foreground">
                Join thousands of donors who trust DonateFlow for transparent, impactful giving.
                Every donation is tracked, verified, and reported.
              </p>
              <div className="flex gap-4">
                <Button variant="accent" size="xl" asChild>
                  <Link to="/donor/login">
                    <Gift className="mr-2 h-5 w-5" />
                    Start Donating Today
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                {appSettings?.logoPath ? (
                  <img
                    src={toAbsoluteAssetUrl(appSettings.logoPath)}
                    alt="App logo"
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <Heart className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <span className="font-semibold">{appSettings?.name ?? "DonateFlow"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 {appSettings?.name ?? "DonateFlow"}. Making giving transparent and impactful.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="px-3">
                <Shield className="mr-1 h-3 w-3" />
                Verified Platform
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
