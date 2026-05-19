"use client";

import { StockData } from "@/lib/nse-api";
import { cn, formatNumber, formatCompactNumber } from "@/lib/utils";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, ExternalLink, Search, RefreshCw, Calendar, CircleDollarSign, Flame, Info, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMarketStore } from "@/store/useStore";

// Advanced signal and probability scoring engine
function calculateSignalAndProbability(stock: StockData, type: "gainer" | "loser", callPutBias: string | null) {
  const ltp = stock.ltp;
  const high = stock.high_price;
  const low = stock.low_price;
  const yHigh = stock.yearHigh;
  const yLow = stock.yearLow;
  const change = stock.perChange;
  const vol = stock.trade_quantity;

  let signal = "Consolidating";
  let signalType: "bullish" | "bearish" | "neutral" = "neutral";
  
  const range = high - low;
  const positionInRange = range > 0 ? (ltp - low) / range : 0.5;
  
  const isNearHigh = positionInRange >= 0.90;
  const isNearLow = positionInRange <= 0.10;
  const isVolSurge = vol > 150000;

  if (yHigh && ltp >= yHigh * 0.985) {
    signal = "52W High Breakout";
    signalType = "bullish";
  } else if (yLow && ltp <= yLow * 1.015) {
    signal = "52W Low Breakdown";
    signalType = "bearish";
  } else if (isNearHigh && change > 1.5) {
    signal = isVolSurge ? "Volume Breakout" : "Bullish Breakout";
    signalType = "bullish";
  } else if (isNearLow && change < -1.5) {
    signal = isVolSurge ? "Volume Breakdown" : "Bearish Breakdown";
    signalType = "bearish";
  } else if (isNearHigh) {
    signal = "Near Resistance";
    signalType = "neutral";
  } else if (isNearLow) {
    signal = "Near Support";
    signalType = "neutral";
  } else if (change > 0.5) {
    signal = "Bullish Bias";
    signalType = "bullish";
  } else if (change < -0.5) {
    signal = "Bearish Bias";
    signalType = "bearish";
  }

  let score = 50;
  
  const changeFactor = Math.min(Math.abs(change) * 4, 20);
  if (change > 0) {
    score += changeFactor;
  } else {
    score -= changeFactor;
  }

  const rangeWeight = (positionInRange - 0.5) * 15;
  score += rangeWeight;

  if (yHigh && yLow) {
    const yRange = yHigh - yLow;
    const positionInYRange = yRange > 0 ? (ltp - yLow) / yRange : 0.5;
    const yRangeWeight = (positionInYRange - 0.5) * 10;
    score += yRangeWeight;
  }

  if (callPutBias === "CALL SIDE") {
    score += 8;
  } else if (callPutBias === "PUT SIDE") {
    score -= 8;
  }

  if (isVolSurge) {
    const deviation = score - 50;
    score += deviation * 0.15;
  }

  score = Math.max(5, Math.min(score, 95));

  let action: "BUY" | "SELL" | "HOLD" = "HOLD";
  let probability = 50;

  if (score > 55) {
    action = "BUY";
    probability = Math.round(score);
  } else if (score < 45) {
    action = "SELL";
    probability = Math.round(100 - score);
  } else {
    action = "HOLD";
    probability = 50;
  }

  return { signal, signalType, action, probability };
}

interface StockTableProps {
  data: StockData[];
  type: "gainer" | "loser";
  isLoading?: boolean;
}

export function StockTable({ data, type, isLoading }: StockTableProps) {
  const { corporateActions, financialEvents, oiContracts } = useMarketStore();
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
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Analysis & Sentiment</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Signal & Conviction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {filteredData.map((stock) => {
                const isMomentum = type === "gainer" ? stock.perChange > 2 : stock.perChange < -2;
                const trendColor = stock.perChange >= 0 ? "text-emerald-400" : "text-rose-400";
                
                // Analysis Logic
                const action = corporateActions.find(a => a.symbol === stock.symbol);
                const event = financialEvents.find(e => e.symbol === stock.symbol);
                
                // Sentiment Logic
                const isBullishAction = action?.subject.toLowerCase().match(/dividend|split|bonus|buy back/);
                
                // Better Result Logic
                const todayStr = format(new Date(), "dd-MMM-yyyy");
                const isResultToday = event?.date === todayStr;
                const isUpcomingResult = event && !isResultToday;
                
                const resultStatus = isResultToday ? (stock.perChange > 1 ? "GOOD" : stock.perChange < -1 ? "BAD" : "NEUTRAL") : null;
                
                // Compact date formatting
                const compactDate = event ? event.date.split('-').slice(0, 2).join(' ') : null;
                const upcomingResultText = isUpcomingResult ? `RES: ${compactDate}` : null;
                
                // OI Bias Logic
                const contract = oiContracts.find(c => c.symbol === stock.symbol);
                const callPutBias = contract ? (contract.pChange && contract.pChange > 0 ? "CALL SIDE" : "PUT SIDE") : null;
                const isHighVolume = stock.perChange > 1.5 && stock.trade_quantity > 100000;

                // Calculate breakout signal and probability metrics
                const signalData = calculateSignalAndProbability(stock, type, callPutBias);
                
                return (
                  <motion.tr
                    key={stock.symbol}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors cursor-pointer",
                      isMomentum && (type === "gainer" ? "bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]" : "bg-rose-500/5 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]")
                    )}
                    onClick={() => openChart(stock.symbol)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-blue-400 flex items-center gap-2">
                          {stock.symbol}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        {isMomentum && (
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit mt-1",
                            type === "gainer" ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-rose-500/20 text-rose-400 animate-pulse"
                          )}>
                            {type === "gainer" ? "🔥 Momentum" : "⚠ Strong Selling"}
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
                        {isHighVolume && (
                          <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1">
                            <Flame className="h-2 w-2" /> HIGH VOL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {resultStatus && (
                          <span 
                            onClick={(e) => openResults(e, stock.symbol)}
                            className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer hover:brightness-110",
                              resultStatus === "GOOD" ? "bg-emerald-500/20 text-emerald-400" : 
                              resultStatus === "BAD" ? "bg-rose-500/20 text-rose-400" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {resultStatus} RESULT
                          </span>
                        )}
                        {upcomingResultText && (
                          <span 
                            onClick={(e) => openResults(e, stock.symbol)}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 flex items-center gap-1 cursor-pointer hover:bg-blue-500/20 transition-colors"
                          >
                            <Calendar className="h-2 w-2" /> {upcomingResultText}
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
                        {callPutBias && (
                          <span className={cn(
                            "text-[8px] font-bold tracking-tighter",
                            callPutBias === "CALL SIDE" ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {callPutBias} BIAS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-xs">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase border shadow-sm whitespace-nowrap",
                          signalData.signalType === "bullish" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                          signalData.signalType === "bearish" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                          "bg-muted border-border text-muted-foreground"
                        )}>
                          {signalData.signal}
                        </span>
                        <span className={cn(
                          "font-black text-[11px] flex items-center gap-1.5 whitespace-nowrap",
                          signalData.action === "BUY" ? "text-emerald-400" :
                          signalData.action === "SELL" ? "text-rose-400" :
                          "text-muted-foreground/60"
                        )}>
                          {signalData.action === "BUY" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />}
                          {signalData.action === "SELL" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />}
                          {signalData.action} {signalData.action !== "HOLD" ? `(${signalData.probability}%)` : ""}
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
