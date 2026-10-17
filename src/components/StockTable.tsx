"use client";

import { StockData } from "@/lib/nse-api";
import { cn, formatNumber, formatCompactNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, ExternalLink, Search, Calendar, CircleDollarSign } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarketStore } from "@/store/useStore";

interface StockTableProps {
  data: StockData[];
  type: "gainer" | "loser";
  isLoading?: boolean;
}

export function StockTable({ data, type, isLoading }: StockTableProps) {
  const { corporateActions, financialEvents } = useMarketStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof StockData>("perChange");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(type === "gainer" ? "desc" : "asc");

  const filteredData = data
    .filter(stock => stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortBy] as number;
      const valB = b[sortBy] as number;
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

  const handleSort = (column: keyof StockData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const openChart = (symbol: string) => {
    window.open(`https://www.tradingview.com/chart/?symbol=NSE:${symbol}`, "_blank");
  };

  const openResults = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    window.open(`https://www.nseindia.com/companies-listing/corporate-filings-financial-results?symbol=${symbol}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search symbol..."
            className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto custom-scrollbar flex-1 max-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-card">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort("symbol")}>Symbol</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("ltp")}>LTP & Range</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("perChange")}>% Chg</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("trade_quantity")}>Volume</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Events & Actions</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Daily price structure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {filteredData.map((stock) => {
                const isLargeDailyMove = Math.abs(stock.perChange) > 2;
                const trendColor = stock.perChange >= 0 ? "text-emerald-400" : "text-rose-400";
                const action = corporateActions.find(a => a.symbol === stock.symbol);
                const event = financialEvents.find(e => e.symbol === stock.symbol);
                const compactDate = event ? event.date.split('-').slice(0, 2).join(' ') : null;
                const dailyStructure = stock.perChange > 0
                  ? "Higher on session"
                  : stock.perChange < 0 ? "Lower on session" : "Little net change";
                
                return (
                  <motion.tr
                    key={stock.symbol}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors cursor-pointer",
                      isLargeDailyMove && (stock.perChange > 0 ? "bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]" : "bg-rose-500/5 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]")
                    )}
                    onClick={() => openChart(stock.symbol)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-blue-400 flex items-center gap-2">
                          {stock.symbol}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        {isLargeDailyMove && (
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit mt-1",
                            stock.perChange > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {stock.perChange > 0 ? "Large daily rise" : "Large daily fall"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm text-foreground">
                      <div className="flex flex-col items-end">
                        <span className="font-bold">{formatNumber(stock.ltp)}</span>
                        <span className="text-[10px] text-muted-foreground/60 font-medium whitespace-nowrap mt-0.5">
                          H: {formatNumber(stock.high_price)} / L: {formatNumber(stock.low_price)}
                        </span>
                      </div>
                    </td>
                    <td className={cn("px-4 py-4 text-right font-bold text-sm", trendColor)}>
                      <div className="flex items-center justify-end gap-1">
                        {stock.perChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {stock.perChange >= 0 ? "+" : ""}{stock.perChange?.toFixed(2) ?? "0.00"}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                      <div className="flex flex-col items-end">
                        <span>{formatCompactNumber(stock.trade_quantity)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {event && (
                          <span 
                            onClick={(e) => openResults(e, stock.symbol)}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 flex items-center gap-1 cursor-pointer hover:bg-blue-500/20 transition-colors"
                          >
                            <Calendar className="h-2 w-2" /> EVENT: {compactDate}
                          </span>
                        )}
                        {action && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                              <CircleDollarSign className="h-2.5 w-2.5" /> {action.subject}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono">Ex: {action.exDate}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-xs">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={cn(
                          "rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap",
                          stock.perChange > 0 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                          stock.perChange < 0 ? "border-rose-500/20 bg-rose-500/10 text-rose-400" :
                          "border-border bg-muted text-muted-foreground"
                        )}>
                          {dailyStructure}
                        </span>
                        <span className="max-w-52 text-[9px] text-muted-foreground">
                          Based on daily change only; not a trade signal.
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredData.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/20">
            <Search className="h-10 w-10 mb-4 opacity-10" />
            <p>No stocks found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
