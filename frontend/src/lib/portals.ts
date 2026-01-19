import { Camera, Heart, Shield, Users } from "lucide-react";
import adminIllustration from "@/assets/admin-illustration.png";
import donorIllustration from "@/assets/donor-illustration.png";
import fieldIllustration from "@/assets/field-illustration.png";
import heroIllustration from "@/assets/hero-illustration.png";
import type { ButtonProps } from "@/components/ui/button";

export type PortalKey = "admin" | "donor" | "field" | "receiver";

type Credential = {
  username: string;
  password: string;
};

export type PortalConfig = {
  key: PortalKey;
  name: string;
  description: string;
  Icon: typeof Shield;
  logoSrc: string;
  loginPath: string;
  homePath: string;
  buttonVariant: NonNullable<ButtonProps["variant"]>;
  accentTextClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  cardGlowClass: string;
  validCredentials: Credential[];
};

export const portalConfigs: Record<PortalKey, PortalConfig> = {
  admin: {
    key: "admin",
    name: "Admin Portal",
    description: "Operations, approvals, campaigns, and governance.",
    Icon: Shield,
    logoSrc: adminIllustration,
    loginPath: "/admin/login",
    homePath: "/admin",
    buttonVariant: "default",
    accentTextClass: "text-primary",
    accentBgClass: "bg-primary/10",
    accentBorderClass: "border-primary/30",
    cardGlowClass: "group-hover:shadow-[0_0_0_6px_rgba(59,130,246,0.10)]",
    validCredentials: [{ username: "admin", password: "admin" }],
  },
  donor: {
    key: "donor",
    name: "Donor Portal",
    description: "Donations, receipts, and real-time impact tracking.",
    Icon: Heart,
    logoSrc: donorIllustration,
    loginPath: "/donor/login",
    homePath: "/donor",
    buttonVariant: "secondary",
    accentTextClass: "text-secondary",
    accentBgClass: "bg-secondary/10",
    accentBorderClass: "border-secondary/30",
    cardGlowClass: "group-hover:shadow-[0_0_0_6px_rgba(99,102,241,0.10)]",
    validCredentials: [{ username: "donor", password: "donor" }],
  },
  field: {
    key: "field",
    name: "Field Worker Portal",
    description: "Tasks, evidence uploads, and progress reporting.",
    Icon: Camera,
    logoSrc: fieldIllustration,
    loginPath: "/field/login",
    homePath: "/field",
    buttonVariant: "accent",
    accentTextClass: "text-accent",
    accentBgClass: "bg-accent/10",
    accentBorderClass: "border-accent/30",
    cardGlowClass: "group-hover:shadow-[0_0_0_6px_rgba(249,115,22,0.10)]",
    validCredentials: [{ username: "field", password: "field" }],
  },
  receiver: {
    key: "receiver",
    name: "Receiver Portal",
    description: "Allocations, disbursements, and beneficiary updates.",
    Icon: Users,
    logoSrc: heroIllustration,
    loginPath: "/receiver/login",
    homePath: "/receiver",
    buttonVariant: "success",
    accentTextClass: "text-success",
    accentBgClass: "bg-success/10",
    accentBorderClass: "border-success/30",
    cardGlowClass: "group-hover:shadow-[0_0_0_6px_rgba(34,197,94,0.10)]",
    validCredentials: [{ username: "receiver", password: "receiver" }],
  },
};

export const portals: PortalConfig[] = [
  portalConfigs.admin,
  portalConfigs.donor,
  portalConfigs.field,
  portalConfigs.receiver,
];
