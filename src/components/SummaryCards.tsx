"use client";

import { useMarketStore } from "@/store/useStore";
import { Target, BarChart3, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buildMarketPulse } from "@/lib/marketSignals";

export function SummaryCards() {
  const { gainers, losers, oiUnderlyings } = useMarketStore();
  const pulse = buildMarketPulse(gainers, losers, oiUnderlyings);

  const stats = [
    {
      label: "Strongest Gainer",
      value: pulse.strongestGainer?.symbol || "-",
      subValue: pulse.strongestGainer?.perChange != null ? `${pulse.strongestGainer.perChange.toFixed(2)}%` : "",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      label: "Highest OI Spurt",
      value: pulse.strongestOI?.symbol || "-",
      subValue: pulse.strongestOI != null ? `${((pulse.strongestOI.avgInOI ?? pulse.strongestOI.pChangeInOI ?? 0)).toFixed(2)}%` : "",
      icon: BarChart3,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      label: "Mover Snapshot",
      value: pulse.regime,
      subValue: "Based on current mover and OI snapshots",
      icon: Activity,
      color: pulse.regime.includes("Bullish") ? "text-emerald-400" : pulse.regime.includes("Bearish") ? "text-rose-400" : "text-amber-400",
      bg: pulse.regime.includes("Bullish") ? "bg-emerald-500/10" : pulse.regime.includes("Bearish") ? "bg-rose-500/10" : "bg-amber-500/10",
      border: pulse.regime.includes("Bullish") ? "border-emerald-500/20" : pulse.regime.includes("Bearish") ? "border-rose-500/20" : "border-amber-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          className={cn(
            "p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:scale-[1.02] transition-all",
            stat.border
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <stat.icon className="h-16 w-16" />
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bg)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-card-foreground">{stat.value}</span>
            {stat.subValue && (
              <span className={cn("text-[10px] font-bold uppercase tracking-[0.12em]", stat.color)}>{stat.subValue}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
