"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMarketStore } from "@/store/useStore";
import {
  calculateIntradayIndicators,
  evaluateIndexSnapshotBias,
  evaluateTechnicalSetup,
} from "@/lib/marketSignals";
import { cn, formatCompactNumber, formatNumber } from "@/lib/utils";

function isNseMarketOpen(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const minuteOfDay = Number(values.hour) * 60 + Number(values.minute);
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(values.weekday)
    && minuteOfDay >= 9 * 60 + 15
    && minuteOfDay < 15 * 60 + 30;
}

function formatCandleTime(timestamp?: number) {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }) + " IST";
}

function formatMetric(value: number | null | undefined, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "N/A";
}

function isFreshCandle(timestamp: number | undefined, now: Date | null) {
  if (!timestamp || !now) return false;
  const ageSeconds = now.getTime() / 1000 - timestamp;
  return ageSeconds >= 0 && ageSeconds <= 15 * 60;
}

export function ScannerBoard() {
  const {
    gainers, losers, marketIndices, lastUpdated, isLoading, error, fetchData,
    intradayCharts, intradayError, intradayUpdatedAt, isIntradayLoading, fetchIntradayData,
  } = useMarketStore();
  const [now, setNow] = useState<Date | null>(null);
  const stocks = useMemo(() => Array.from(
    new Map([...gainers, ...losers].map((stock) => [stock.symbol, stock])).values(),
  ).sort((left, right) => Math.abs(right.perChange) - Math.abs(left.perChange)).slice(0, 12), [gainers, losers]);
  const chartSymbols = useMemo(
    () => [...stocks.map(({ symbol }) => symbol.toUpperCase().endsWith(".NS") ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`), "^NSEI"],
    [stocks],
  );
  const chartSymbolKey = chartSymbols.join(",");
  const marketOpen = now ? isNseMarketOpen(now) : false;
  const niftyChart = intradayCharts["^NSEI"];
  const niftyIndicators = calculateIntradayIndicators(niftyChart?.candles ?? []);
  const niftyLastCandle = niftyIndicators.ready ? niftyIndicators.lastCandleTime : undefined;
  const niftyDataFresh = isFreshCandle(niftyLastCandle, now);
  const indexSnapshots = marketIndices.filter((index) => {
    const normalizedName = index.name.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return normalizedName === "NIFTY50" || normalizedName === "NIFTYBANK";
  });
  const nifty50 = indexSnapshots.find((index) => index.name.toUpperCase().replace(/[^A-Z0-9]/g, "") === "NIFTY50");
  const nifty50Bias = nifty50 ? evaluateIndexSnapshotBias({
    currentPrice: nifty50.currentPrice,
    open: nifty50.open,
    high: nifty50.high,
    low: nifty50.low,
    previousClose: nifty50.previousClose,
    percentChange: nifty50.percentChange,
  }) : null;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!chartSymbolKey) return;
    const symbols = chartSymbolKey.split(",");
    void fetchIntradayData(symbols);
    if (!marketOpen) return;
    const timer = window.setInterval(() => void fetchIntradayData(symbols), 60_000);
    return () => window.clearInterval(timer);
  }, [chartSymbolKey, fetchIntradayData, marketOpen]);

  return (
    <GlassCard
      title="Intraday Market Structure"
      badge={
        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-500">
          Descriptive · no trade recommendations
        </span>
      }
      className="mb-8"
    >
      <div className="space-y-5 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>
              {lastUpdated
                ? `NSE feeds refreshed ${lastUpdated.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
                : "Waiting for the first NSE response"}
            </span>
            {isLoading && <span className="text-blue-500">Updating…</span>}
            {intradayUpdatedAt && (
              <span className="text-muted-foreground">
                Yahoo charts fetched {intradayUpdatedAt.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh NSE data
            </button>
            <button
              type="button"
              onClick={() => void fetchIntradayData(chartSymbols)}
              disabled={isIntradayLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isIntradayLoading && "animate-spin")} />
              Refresh 5m charts
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {(intradayError || isIntradayLoading) && (
          <div className={cn(
            "flex items-start gap-2 rounded-xl border p-3 text-xs",
            intradayError ? "border-amber-500/20 bg-amber-500/5 text-amber-600" : "border-blue-500/20 bg-blue-500/5 text-blue-600",
          )}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{intradayError ?? "Loading unofficial Yahoo Finance 5-minute candles. Data can be delayed or unavailable."}</span>
          </div>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              NSE index snapshots · Yahoo 5-minute market structure
            </h3>
            <span className="text-[10px] text-muted-foreground">NSE snapshot · app fetch: {lastUpdated ? lastUpdated.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"} IST</span>
          </div>
          <p className="mb-3 text-[10px] text-muted-foreground">
            Yahoo 5-minute data is unofficial and may be delayed. Technical readings are informational, not confirmed trade signals.
          </p>
          {indexSnapshots.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {indexSnapshots.map((index) => (
                <div key={index.symbol} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{index.name}</h4>
                      <p className="mt-1 font-mono text-xl font-black text-foreground">
                        {formatNumber(index.currentPrice)}
                      </p>
                    </div>
                    <span className={cn(
                      "rounded-lg px-2 py-1 text-xs font-bold",
                      index.percentChange > 0 ? "bg-emerald-500/10 text-emerald-500" :
                      index.percentChange < 0 ? "bg-rose-500/10 text-rose-500" :
                      "bg-muted text-muted-foreground",
                    )}>
                      {index.percentChange > 0 ? "+" : ""}{index.percentChange.toFixed(2)}%
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {index.lastUpdated ? `NSE timestamp: ${index.lastUpdated}` : "Exchange timestamp not provided"}
                  </p>
                  {index.name.toUpperCase().replace(/[^A-Z0-9]/g, "") === "NIFTY50" && nifty50Bias && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={cn(
                          "text-xs font-black",
                          nifty50Bias.bias === "Bullish bias" ? "text-emerald-500" :
                          nifty50Bias.bias === "Bearish bias" ? "text-rose-500" :
                          "text-amber-500",
                        )}>
                          Snapshot bias: {nifty50Bias.bias}
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {nifty50Bias.marketStatus}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        {nifty50Bias.reasons[0]} Informational market structure only.
                      </p>
                      <div className="mt-3 border-t border-border pt-3 text-[10px] text-muted-foreground">
                        <p className="mb-1 font-semibold text-foreground">
                          Yahoo 5m technical read · {niftyChart ? formatCandleTime(niftyLastCandle) : "chart unavailable"}
                        </p>
                        <p>
                          Trend {niftyIndicators.ready ? niftyIndicators.trend : "unavailable"} ·
                          {" "}EMA 9/20/50/200 {formatMetric(niftyIndicators.ema9)}/{formatMetric(niftyIndicators.ema20)}/{formatMetric(niftyIndicators.ema50)}/{formatMetric(niftyIndicators.ema200)} ·
                          {" "}Supertrend {niftyIndicators.supertrendDirection ?? "N/A"} ({formatMetric(niftyIndicators.supertrend)}) ·
                          {" "}RSI {formatMetric(niftyIndicators.rsi)} · ADX {formatMetric(niftyIndicators.adx)}
                        </p>
                        <p className="mt-1">
                          VWAP {formatMetric(niftyIndicators.vwap)} · volume {
                            !niftyIndicators.ready || niftyIndicators.vwap === null
                              ? "unavailable (zero-volume index feed)"
                              : "available"
                          } ·
                          {" "}technical state: {evaluateTechnicalSetup(niftyIndicators, { marketOpen, dataFresh: niftyDataFresh }).setup}
                        </p>
                        {!marketOpen && niftyIndicators.ready && (
                          <p className="mt-1">Market closed means these are the latest available candles from the previous session, not live readings.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
              {isLoading ? "Loading index snapshots from NSE…" : "No index snapshot was returned by NSE."}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              NSE movers · Yahoo 5-minute technical reads
            </h3>
            <span className="text-[10px] text-muted-foreground">{stocks.length} unique symbols</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Symbol</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CMP</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Day change</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Volume</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">5m technical read</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stocks.map((stock) => {
                  const symbol = stock.symbol.toUpperCase().endsWith(".NS") ? stock.symbol.toUpperCase() : `${stock.symbol.toUpperCase()}.NS`;
                  const chart = intradayCharts[symbol];
                  const indicators = calculateIntradayIndicators(chart?.candles ?? []);
                  const lastCandle = indicators.ready ? indicators.lastCandleTime : undefined;
                  const dataFresh = isFreshCandle(lastCandle, now);
                  const technicalSetup = evaluateTechnicalSetup(indicators, { marketOpen, dataFresh });
                  return (
                    <tr key={stock.symbol} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs font-bold text-foreground">{stock.symbol}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{formatNumber(stock.ltp)}</td>
                      <td className={cn(
                        "px-4 py-3 text-right font-mono text-xs font-semibold",
                        stock.perChange > 0 ? "text-emerald-500" : stock.perChange < 0 ? "text-rose-500" : "text-muted-foreground",
                      )}>
                        {stock.perChange > 0 ? "+" : ""}{stock.perChange.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {formatCompactNumber(stock.trade_quantity)}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex flex-col gap-1.5">
                          <span className="w-fit rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-600">
                            {chart ? technicalSetup.setup : intradayError ? "Yahoo chart unavailable" : "Loading Yahoo chart"}
                          </span>
                          {indicators.ready && (
                            <span className="max-w-[420px] text-[10px] leading-relaxed text-muted-foreground">
                              {formatCandleTime(lastCandle)} · EMA 9/20/50/200 {formatMetric(indicators.ema9)}/{formatMetric(indicators.ema20)}/{formatMetric(indicators.ema50)}/{formatMetric(indicators.ema200)} ·
                              {" "}Supertrend {indicators.supertrendDirection ?? "N/A"} ({formatMetric(indicators.supertrend)}) ·
                              {" "}VWAP {formatMetric(indicators.vwap)} · RSI {formatMetric(indicators.rsi)} ·
                              {" "}MACD {indicators.macdBullish === null ? "N/A" : indicators.macdBullish ? "bullish" : "bearish"} ·
                              {" "}ADX {formatMetric(indicators.adx)} · RelVol {formatMetric(indicators.relativeVolume)}x
                            </span>
                          )}
                          {!marketOpen && indicators.ready && (
                            <span className="max-w-[420px] text-[10px] leading-relaxed text-muted-foreground">
                              Market closed: these are the latest available candles from the previous session, not live readings.
                            </span>
                          )}
                          {technicalSetup.reasons[0] && (
                            <span className="max-w-[420px] text-[10px] leading-relaxed text-muted-foreground">
                              {technicalSetup.reasons[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!stocks.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      {isLoading ? "Loading market movers from NSE…" : "NSE returned no market movers. Refresh to retry."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </GlassCard>
  );
}
