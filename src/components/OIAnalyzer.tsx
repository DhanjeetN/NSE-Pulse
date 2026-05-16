"use client";

import { OISpurtData } from "@/lib/nse-api";
import { cn, formatNumber, formatCompactNumber } from "@/lib/utils";
import { Zap, Rocket, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OIAnalyzerProps {
  underlyings: OISpurtData[];
  contracts: OISpurtData[];
  isLoading?: boolean;
}

export function OIAnalyzer({ underlyings, contracts, isLoading }: OIAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<"underlyings" | "contracts">("underlyings");
  const [searchTerm, setSearchTerm] = useState("");

  const data = activeTab === "underlyings" ? underlyings : contracts;
  const filteredData = data.filter(item => {
    const search = searchTerm.toLowerCase();
    const symbolMatch = item?.symbol?.toString().toLowerCase().includes(search) || false;
    const underlyingMatch = item?.underlying?.toString().toLowerCase().includes(search) || false;
    return symbolMatch || underlyingMatch;
  });

  const getMomentumSignal = (oiChange: number, priceChange: number) => {
    if (oiChange > 0 && priceChange > 0) return { label: "Long Build-Up", color: "text-emerald-400", bg: "bg-emerald-400/10", type: "bullish" };
    if (oiChange > 0 && priceChange < 0) return { label: "Short Build-Up", color: "text-rose-400", bg: "bg-rose-400/10", type: "bearish" };
    if (oiChange < 0 && priceChange > 0) return { label: "Short Covering", color: "text-sky-400", bg: "bg-sky-400/10", type: "bullish" };
    if (oiChange < 0 && priceChange < 0) return { label: "Long Unwinding", color: "text-orange-400", bg: "bg-orange-400/10", type: "bearish" };
    return { label: "Neutral", color: "text-white/40", bg: "bg-white/5", type: "neutral" };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-4 border-b border-border">
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("underlyings")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "underlyings" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Underlyings
          </button>
          <button
            onClick={() => setActiveTab("contracts")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeTab === "contracts" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Contracts
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search..."
            className="bg-muted/50 border border-border rounded-lg py-1.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6 py-3 bg-muted/30 flex items-center gap-4 text-[11px] text-muted-foreground border-b border-border">
        <div className="flex items-center gap-1"><Info className="h-3 w-3" /> <span className="uppercase tracking-wider">Logic:</span></div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> OI ↑ Price ↑ = Long Build-Up</span>
          <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-rose-400" /> OI ↑ Price ↓ = Short Build-Up</span>
          <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-sky-400" /> OI ↓ Price ↑ = Short Covering</span>
        </div>
      </div>

      <div className="overflow-auto custom-scrollbar flex-1 max-h-[600px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-card">
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Symbol / Contract</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">OI Change %</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Price Chg %</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">LTP</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Signal</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {filteredData.map((item, idx) => {
                const oiChange = item.pChangeInOI ?? item.avgInOI ?? 0;
                const priceChange = item.pChange ?? 0;
                const signal = getMomentumSignal(oiChange, priceChange);
                const isSpurt = oiChange > 7;
                
                return (
                  <motion.tr
                    key={`${item.symbol}-${idx}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors",
                      isSpurt && "bg-amber-500/5 shadow-[inset_0_0_30px_rgba(245,158,11,0.03)]"
                    )}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground tracking-tight">
                          {item.symbol} {item.optionType ? `${item.strikePrice} ${item.optionType}` : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase mt-1">
                          {item.expiryDate || "Underlying"}
                        </span>
                        {isSpurt && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="flex items-center gap-1 bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border border-amber-500/20 shadow-lg shadow-amber-500/10">
                              <Rocket className="h-2.5 w-2.5" /> OI SPURT
                            </span>
                            {signal.type === "bullish" && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase">Smart Money In</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-6 py-5 text-right font-mono text-base font-bold", oiChange > 0 ? "text-amber-500" : "text-muted-foreground")}>
                      {oiChange >= 0 ? "+" : ""}{oiChange?.toFixed(2) ?? "0.00"}%
                    </td>
                    <td className={cn("px-6 py-5 text-right font-mono font-semibold", priceChange > 0 ? "text-emerald-500" : priceChange < 0 ? "text-rose-500" : "text-muted-foreground")}>
                      {item.pChange !== undefined ? `${priceChange >= 0 ? "+" : ""}${priceChange?.toFixed(2)}%` : "-"}
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-foreground">
                      {formatNumber(item.ltp ?? item.underlyingValue ?? 0)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        signal.bg, signal.color
                      )}>
                        {signal.type === "bullish" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {signal.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-sm text-muted-foreground">
                      {formatCompactNumber(item.volume)}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
