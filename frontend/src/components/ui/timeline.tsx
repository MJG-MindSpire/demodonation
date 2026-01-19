import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Check, Clock, Circle } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  status: "completed" | "current" | "pending";
  icon?: LucideIcon;
}

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[];
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const StatusIcon = item.status === "completed" ? Check : item.status === "current" ? Clock : Circle;
          
          return (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  item.status === "completed" && "border-success bg-success text-success-foreground",
                  item.status === "current" && "border-accent bg-accent text-accent-foreground animate-pulse",
                  item.status === "pending" && "border-muted bg-card text-muted-foreground"
                )}>
                  {Icon ? <Icon className="h-4 w-4" /> : <StatusIcon className="h-4 w-4" />}
                </div>
                {index < items.length - 1 && (
                  <div className={cn(
                    "w-0.5 flex-1 min-h-[2rem]",
                    item.status === "completed" ? "bg-success" : "bg-border"
                  )} />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "text-sm font-medium",
                    item.status === "pending" ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {item.title}
                  </h4>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
Timeline.displayName = "Timeline";

export { Timeline, type TimelineItem };
