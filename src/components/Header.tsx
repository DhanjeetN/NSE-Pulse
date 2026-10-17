"use client";

import { useMarketStore } from "@/store/useStore";
import { Activity, Clock, RefreshCw, Power, Zap, Sun, Moon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useLiveViewers } from "@/hooks/useLiveViewers";

const nseTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const nseClockFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function formatNseTime(date: Date) {
  return nseClockFormatter.format(date);
}

export function Header() {
  const { lastUpdated, autoRefresh, toggleAutoRefresh, fetchData, isLoading } = useMarketStore();
  const [now, setNow] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(15);
  const { theme, setTheme } = useTheme();
  const { viewersCount, isLive } = useLiveViewers();

  const isMarketOpen = useMemo(() => {
    if (!now) return false;
    const parts = Object.fromEntries(
      nseTimeFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
    );
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    const hours = Number(parts.hour);
    const minutes = Number(parts.minute);
    const timeNum = hours * 100 + minutes;

    return day >= 1 && day <= 5 && timeNum >= 915 && timeNum <= 1530;
  }, [now]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoRefresh || !isMarketOpen) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchData, isMarketOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 rotate-3">
            <Zap className="h-6 w-6 text-white fill-current" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-foreground">NSE <span className="text-blue-500">PULSE</span></h1>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                isMarketOpen ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {now ? (isMarketOpen ? "Market Open" : "Market Closed") : "Checking Market"}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 bg-muted px-6 py-2 rounded-2xl border border-border">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">NSE Time</span>
            <div className="flex items-center gap-2 text-sm font-mono font-bold text-foreground">
              <Clock className="h-3 w-3 text-blue-500" />
              {now ? formatNseTime(now) : "--:--:--"}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Last Updated</span>
            <div className="flex items-center gap-2 text-sm font-mono font-bold text-foreground">
              <Activity className="h-3 w-3 text-emerald-500" />
              {lastUpdated ? formatNseTime(lastUpdated) : "--:--:--"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border font-medium text-xs shadow-sm",
              isLive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-muted border-border text-muted-foreground"
            )}
            title={
              isLive
                ? "Users active on the site in the last 60 seconds (from D1)"
                : "Connecting to live viewer service…"
            }
          >
            <span className="relative flex h-2 w-2">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isLive ? "bg-emerald-500" : "bg-muted-foreground/50"
                )}
              />
            </span>
            <span className="font-mono font-bold flex items-center gap-1">
              <span>{isLive ? viewersCount : "---"}</span>
              <span>Online</span>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border border-border">
            <button
              onClick={toggleAutoRefresh}
              disabled={!isMarketOpen}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                autoRefresh ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:text-foreground",
                !isMarketOpen && "opacity-50 cursor-not-allowed hover:text-muted-foreground"
              )}
              title={!isMarketOpen ? "Auto-refresh is disabled because the market is closed" : undefined}
            >
              <Power className="h-3 w-3" />
              {autoRefresh && isMarketOpen ? `Auto: ${countdown}s` : "Auto Off"}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-all"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => fetchData()}
              disabled={isLoading}
              className={cn(
                "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-all disabled:opacity-50",
                isLoading && "animate-spin"
              )}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
