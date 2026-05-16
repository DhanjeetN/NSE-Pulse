import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  badge?: ReactNode;
  rightElement?: ReactNode;
}

export function GlassCard({ children, className, title, badge, rightElement }: GlassCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-border/80",
      className
    )}>
      {/* Decorative gradient */}
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      
      {(title || rightElement) && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-card-foreground">{title}</h3>
            {badge}
          </div>
          {rightElement}
        </div>
      )}
      <div className="relative z-10 p-1">
        {children}
      </div>
    </div>
  );
}
