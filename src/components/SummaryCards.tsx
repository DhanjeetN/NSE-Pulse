"use client";

import { useMarketStore } from "@/store/useStore";
import { TrendingUp, TrendingDown, Zap, Target, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SummaryCards() {
  const { gainers, losers, oiUnderlyings } = useMarketStore();

  const totalBullish = gainers.filter(s => s.perChange > 0).length + oiUnderlyings.filter(s => s.avgInOI !== undefined && s.avgInOI > 0).length;
  const totalBearish = losers.filter(s => s.perChange < 0).length + oiUnderlyings.filter(s => s.avgInOI !== undefined && s.avgInOI < 0).length;
  
  const strongestGainer = [...gainers].sort((a, b) => b.perChange - a.perChange)[0];
  const strongestLoser = [...losers].sort((a, b) => a.perChange - b.perChange)[0];
  const highestOI = [...oiUnderlyings].sort((a, b) => (b.pChangeInOI ?? b.avgInOI ?? 0) - (a.pChangeInOI ?? a.avgInOI ?? 0))[0];

  const stats = [
    {
      label: "Bullish Stocks",
      value: totalBullish,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      label: "Bearish Stocks",
      value: totalBearish,
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    },
    {
      label: "Strongest Gainer",
      value: strongestGainer?.symbol || "-",
      subValue: strongestGainer?.perChange != null ? `+${strongestGainer.perChange.toFixed(2)}%` : "",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      label: "Highest OI Spurt",
      value: highestOI?.symbol || "-",
      subValue: highestOI != null ? `+${(highestOI.pChangeInOI ?? highestOI.avgInOI ?? 0).toFixed(2)}%` : "",
      icon: BarChart3,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
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
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-card-foreground">{stat.value}</span>
            {stat.subValue && (
              <span className={cn("text-xs font-bold", stat.color)}>{stat.subValue}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
