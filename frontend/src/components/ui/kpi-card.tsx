import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "accent";
}

const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className, title, value, subtitle, icon: Icon, trend, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-card",
      primary: "bg-primary/10 border-primary/20",
      secondary: "bg-secondary/10 border-secondary/20",
      accent: "bg-accent/10 border-accent/20",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "rounded-lg p-2.5",
              variant === "primary" && "bg-primary/20 text-primary",
              variant === "secondary" && "bg-secondary/20 text-secondary",
              variant === "accent" && "bg-accent/20 text-accent",
              variant === "default" && "bg-muted text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1 text-xs">
            <span className={cn(
              "font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    );
  }
);
KPICard.displayName = "KPICard";

export { KPICard };
