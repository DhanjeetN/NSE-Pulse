"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Waves } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import type { OISpurtData } from "@/lib/nse-api";
import { fetchOISpurtsContracts, fetchOISpurtsUnderlyings } from "@/lib/nse-api";
import { cn } from "@/lib/utils";

interface OISnapshotBatch {
  capturedAt: number;
  tradeDate: string;
  underlyings: OISpurtData[];
  contracts: OISpurtData[];
  underlyingsFetched: boolean;
  contractsFetched: boolean;
}

interface OIFlowStudioProps {
  underlyings: OISpurtData[];
  contracts: OISpurtData[];
  updatedAt: Date | null;
}

function getNseDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

function isNseMarketOpen(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(values.weekday)
    && minutes >= 9 * 60 + 15
    && minutes < 15 * 60 + 30;
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }) + " IST";
}

function formatDate(tradeDate: string) {
  return new Date(`${tradeDate}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatExact(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}m ${String(totalSeconds % 60).padStart(2, "0")}s`;
}

function getOptionSide(optionType?: string) {
  const normalized = optionType?.toUpperCase();
  if (normalized === "CALL" || normalized === "CE") return "CE";
  if (normalized === "PUT" || normalized === "PE") return "PE";
  return null;
}

function getContractKey(contract: OISpurtData) {
  return [
    contract.symbol,
    contract.expiryDate ?? "",
    contract.strikePrice ?? "",
    getOptionSide(contract.optionType) ?? "",
  ].join("|");
}

function getContractFlow(previous: OISnapshotBatch | null, current: OISnapshotBatch | null, symbol: string) {
  if (!previous || !current || !previous.contractsFetched || !current.contractsFetched) return null;
  const previousByKey = new Map(
    previous.contracts
      .filter((contract) => contract.symbol === symbol && getOptionSide(contract.optionType))
      .map((contract) => [getContractKey(contract), contract]),
  );
  const matching = current.contracts.filter((contract) => (
    contract.symbol === symbol
    && getOptionSide(contract.optionType)
    && previousByKey.has(getContractKey(contract))
  ));
  if (!matching.length) return null;

  return matching.reduce((flow, contract) => {
    const old = previousByKey.get(getContractKey(contract));
    const delta = old ? contract.latestOI - old.latestOI : 0;
    if (delta > 0) flow.added += delta;
    if (delta < 0) flow.reduced -= delta;
    return flow;
  }, { added: 0, reduced: 0, matchedCount: matching.length, source: "Matched NSE strike sample" });
}

function getLatestNonZeroContractFlow(history: OISnapshotBatch[], symbol: string) {
  for (let index = history.length - 1; index > 0; index -= 1) {
    const flow = getContractFlow(history[index - 1], history[index], symbol);
    if (flow && (flow.added > 0 || flow.reduced > 0)) {
      return { ...flow, capturedAt: history[index].capturedAt };
    }
  }
  return null;
}

function getContractReferenceFlow(contracts: OISpurtData[], symbol: string) {
  const uniqueContracts = new Map<string, OISpurtData>();
  for (const contract of contracts) {
    if (contract.symbol !== symbol || !getOptionSide(contract.optionType)) continue;
    const key = [
      contract.symbol,
      contract.expiryDate ?? "",
      contract.strikePrice ?? "",
      getOptionSide(contract.optionType) ?? "",
    ].join("|");
    uniqueContracts.set(key, contract);
  }

  const rows = Array.from(uniqueContracts.values())
    .filter((contract) => Number.isFinite(contract.changeInOI));
  if (!rows.length) return null;
  const flow = rows.reduce((totals, contract) => {
    if (contract.changeInOI > 0) totals.added += contract.changeInOI;
    if (contract.changeInOI < 0) totals.reduced -= contract.changeInOI;
    return totals;
  }, { added: 0, reduced: 0 });
  return {
    ...flow,
    source: "NSE spurt sample · reference change",
    capturedAt: undefined,
  };
}

function AnimatedOIValue({ value, className }: { value: number | null; className: string }) {
  const spring = useSpring(value ?? 0, { stiffness: 45, damping: 18, mass: 0.8 });
  const display = useTransform(spring, (current) => formatExact(Math.round(current)));

  useEffect(() => {
    spring.set(value ?? 0);
  }, [spring, value]);

  return (
    <motion.p className={className}>
      {value == null ? "—" : <motion.span>{display}</motion.span>}
    </motion.p>
  );
}

function getStoredHistory(storageKey: string, tradeDate: string): OISnapshotBatch[] {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((snapshot): snapshot is OISnapshotBatch => (
    snapshot !== null
    && typeof snapshot === "object"
    && snapshot.tradeDate === tradeDate
    && Number.isFinite(snapshot.capturedAt)
    && Array.isArray(snapshot.underlyings)
    && Array.isArray(snapshot.contracts)
    && typeof snapshot.underlyingsFetched === "boolean"
    && typeof snapshot.contractsFetched === "boolean"
  )).sort((left, right) => left.capturedAt - right.capturedAt);
}

function getLatestStoredSession(tradeDate: string): OISnapshotBatch[] {
  const prefix = "nse-pulse-oi-history-";
  const savedSnapshots: OISnapshotBatch[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const savedDate = key.slice(prefix.length);
    if (savedDate > tradeDate) continue;
    savedSnapshots.push(...getStoredHistory(key, savedDate).filter((snapshot) => snapshot.underlyingsFetched));
  }
  const latestDate = savedSnapshots.reduce(
    (latest, snapshot) => snapshot.tradeDate > latest ? snapshot.tradeDate : latest,
    "",
  );
  return savedSnapshots
    .filter((snapshot) => snapshot.tradeDate === latestDate)
    .sort((left, right) => left.capturedAt - right.capturedAt);
}

function OIFlowAnimation({
  symbol,
  added,
  reduced,
  replaySlowly,
  animationKey,
  status,
  source,
}: {
  symbol: string;
  added: number | null;
  reduced: number | null;
  replaySlowly: boolean;
  animationKey: string;
  status: string;
  source: string;
}) {
  const hasAdded = added != null && added > 0;
  const hasReduced = reduced != null && reduced > 0;

  return (
    <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-5 md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.07),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-28 max-w-3xl items-center justify-between gap-4">
        <div className="z-10 flex w-24 flex-col items-center gap-2 text-center">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border",
            hasAdded ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-500",
          )}>
            <Waves className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">OI added</span>
        </div>

        <div className="absolute inset-x-14 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-emerald-300/20 via-sky-300/50 to-rose-300/20 md:inset-x-24" />
        {hasAdded && [0, 1, 2].map((particle) => (
          <motion.span
            key={`added-${animationKey}-${particle}`}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 z-[1] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px] shadow-emerald-300/80"
            initial={{ x: -100, opacity: 0, scale: 0.5 }}
            animate={{
              x: [-100, -30, 35],
              opacity: [0, 1, 0],
              scale: [0.6, 1.15, 0.65],
            }}
            transition={{
              duration: replaySlowly ? 9 : 5,
              delay: particle * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {hasReduced && [0, 1, 2].map((particle) => (
          <motion.span
            key={`reduced-${animationKey}-${particle}`}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 z-[1] h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_18px] shadow-rose-300/80"
            initial={{ x: 135, opacity: 0, scale: 0.5 }}
            animate={{ x: [135, 65, 0], opacity: [0, 1, 0], scale: [0.6, 1.15, 0.65] }}
            transition={{
              duration: replaySlowly ? 9 : 5,
              delay: particle * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="z-10 flex h-16 w-24 items-center justify-center rounded-2xl border border-white/20 bg-slate-900 px-3 text-center shadow-[0_0_28px_rgba(99,102,241,0.18)] md:h-20 md:w-32">
          <span className="max-w-full truncate text-sm font-black tracking-wide text-white">{symbol || "—"}</span>
        </div>

        <div className="z-10 flex w-24 flex-col items-center gap-2 text-center">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border",
            hasReduced ? "border-rose-300/40 bg-rose-300/10 text-rose-200" : "border-white/10 bg-white/[0.03] text-slate-500",
          )}>
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">OI reduced</span>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 text-center">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">OI added</p>
          <AnimatedOIValue
            value={added}
            className={cn("font-mono text-xl font-black", hasAdded ? "text-emerald-300" : "text-slate-500")}
          />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-500">OI reduced</p>
          <AnimatedOIValue
            value={reduced}
            className={cn("font-mono text-xl font-black", hasReduced ? "text-rose-300" : "text-slate-500")}
          />
        </div>
      </div>
      <p className="relative mt-2 text-center text-[10px] text-slate-400">
        {status}
        {" · "}{source}
        {replaySlowly ? " · slow replay" : ""}
      </p>
    </div>
  );
}

function OIHistoryChart({ points }: { points: { capturedAt: number; oi: number }[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-slate-500">
        OI history graph appears after two saved captures.
      </div>
    );
  }

  const width = 640;
  const height = 150;
  const inset = 12;
  const values = points.map((point) => point.oi);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const range = high - low || Math.max(Math.abs(high) * 0.002, 1);
  const coordinates = points.map((point, index) => ({
    x: inset + (index / (points.length - 1)) * (width - inset * 2),
    y: height - inset - ((point.oi - low) / range) * (height - inset * 2),
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const fill = `${inset},${height - inset} ${line} ${width - inset},${height - inset}`;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>Saved OI snapshots</span>
        <span>{points.length} readings</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label="Underlying open interest history">
        <defs>
          <linearGradient id="oi-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fill} fill="url(#oi-area-gradient)" />
        <polyline points={line} fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {coordinates.slice(-1).map((point) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="#a5f3fc" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
        <span>{formatExact(low)}</span>
        <span>{formatExact(high)}</span>
      </div>
    </div>
  );
}

function getMarketStructure(oiDelta: number | null, priceDelta: number | null) {
  if (oiDelta == null || priceDelta == null) return "Collecting market structure";
  if (priceDelta > 0 && oiDelta > 0) return "Price and OI rising";
  if (priceDelta < 0 && oiDelta > 0) return "Price falling · OI rising";
  if (priceDelta > 0 && oiDelta < 0) return "Price rising · OI falling";
  if (priceDelta < 0 && oiDelta < 0) return "Price and OI falling";
  return "Price or OI unchanged";
}

export function OIFlowStudio({ underlyings, contracts, updatedAt }: OIFlowStudioProps) {
  const fallbackCapture: OISnapshotBatch | null = underlyings.length && updatedAt
    ? {
      capturedAt: updatedAt.getTime(),
      tradeDate: getNseDate(updatedAt),
      underlyings,
      contracts,
      underlyingsFetched: true,
      contractsFetched: true,
    }
    : null;
  const [history, setHistory] = useState<OISnapshotBatch[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const isRefreshingRef = useRef(false);
  const historyRef = useRef<OISnapshotBatch[]>([]);
  const tradeDate = getNseDate(now);
  const marketOpen = isNseMarketOpen(now);
  const storageKey = `nse-pulse-oi-history-${tradeDate}`;

  const activeHistory = history.filter((snapshot) => snapshot.underlyingsFetched);
  const lastSavedCapture = activeHistory.at(-1) ?? null;
  const currentCapture = !marketOpen && fallbackCapture
      && fallbackCapture.capturedAt > (lastSavedCapture?.capturedAt ?? 0)
    ? fallbackCapture
    : lastSavedCapture ?? (!marketOpen ? fallbackCapture : null);
  const previousCapture = activeHistory.length > 1 ? activeHistory.at(-2) ?? null : null;
  const snapshots = currentCapture?.underlyings ?? underlyings;
  const contractRows = currentCapture?.contracts ?? contracts;
  const symbols = Array.from(new Set(snapshots.map((item) => item.symbol).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
  const activeSymbol = symbols.includes(selectedSymbol)
    ? selectedSymbol
    : symbols.includes("NIFTY") ? "NIFTY" : symbols[0] ?? "";
  const selectedSnapshot = snapshots.find((item) => item.symbol === activeSymbol);
  const previousSnapshot = previousCapture?.underlyings.find((item) => item.symbol === activeSymbol);
  const currentOI = selectedSnapshot?.latestOI ?? null;
  const previousOI = previousSnapshot?.latestOI ?? null;
  const sampleDelta = previousCapture && previousOI != null && currentOI != null
    ? currentOI - previousOI
    : null;
  const currentPrice = selectedSnapshot?.underlyingValue ?? null;
  const previousPrice = previousSnapshot?.underlyingValue ?? null;
  const priceDelta = currentPrice != null && previousPrice != null ? currentPrice - previousPrice : null;
  const comparisonWait = activeHistory[0]
    ? Math.max(0, activeHistory[0].capturedAt + 60_000 - now.getTime())
    : null;
  const currentContractFlow = getContractFlow(previousCapture, currentCapture, activeSymbol);
  const contractReferenceFlow = getContractReferenceFlow(
    currentCapture?.contracts ?? contracts,
    activeSymbol,
  );
  const underlyingReferenceDelta = selectedSnapshot?.changeInOI;
  const underlyingReferenceFlow = typeof underlyingReferenceDelta === "number"
    && Number.isFinite(underlyingReferenceDelta)
    ? {
      added: Math.max(underlyingReferenceDelta, 0),
      reduced: Math.max(-underlyingReferenceDelta, 0),
      source: "NSE underlying reference change",
      capturedAt: currentCapture?.capturedAt,
    }
    : null;
  const currentUnderlyingFlow = sampleDelta == null
    ? null
    : {
      added: Math.max(sampleDelta, 0),
      reduced: Math.max(-sampleDelta, 0),
      matchedCount: 0,
      source: "Underlying net OI",
      capturedAt: currentCapture?.capturedAt,
    };
  const intervalFlow = currentContractFlow?.added || currentContractFlow?.reduced
    ? { ...currentContractFlow, capturedAt: currentCapture?.capturedAt }
    : currentUnderlyingFlow;
  const lastSavedContractFlow = getLatestNonZeroContractFlow(activeHistory, activeSymbol);
  const lastSavedUnderlyingFlow = activeHistory.slice(1).reduce<{
    added: number;
    reduced: number;
    capturedAt: number;
    matchedCount: number;
    source: string;
  } | null>((latest, capture, index) => {
    const previous = activeHistory[index];
    const current = capture.underlyings.find((item) => item.symbol === activeSymbol);
    const old = previous.underlyings.find((item) => item.symbol === activeSymbol);
    if (!current || !old) return latest;
    const delta = current.latestOI - old.latestOI;
    return delta === 0 ? latest : {
      added: Math.max(delta, 0),
      reduced: Math.max(-delta, 0),
      capturedAt: capture.capturedAt,
      matchedCount: 0,
      source: "Underlying net OI",
    };
  }, null);
  const lastSavedFlow = lastSavedContractFlow ?? lastSavedUnderlyingFlow;
  const contractReferenceActive = contractReferenceFlow != null
    && (contractReferenceFlow.added > 0 || contractReferenceFlow.reduced > 0);
  const underlyingReferenceActive = underlyingReferenceFlow != null
    && (underlyingReferenceFlow.added > 0 || underlyingReferenceFlow.reduced > 0);
  const providerReferenceFlow = contractReferenceActive
    ? contractReferenceFlow
    : underlyingReferenceActive ? underlyingReferenceFlow : null;
  const measuredFlow = providerReferenceFlow ?? intervalFlow;
  const replaySavedFlow = !marketOpen
    && measuredFlow?.added === 0
    && measuredFlow?.reduced === 0
    ? lastSavedFlow ?? contractReferenceFlow
    : null;
  const visibleFlow = replaySavedFlow ?? measuredFlow;
  const flowStatus = !visibleFlow
    ? activeHistory.length > 1
      ? "No comparable OI readings; directional flow is idle"
      : "Collecting baseline..."
    : visibleFlow.added > 0 || visibleFlow.reduced > 0
      ? replaySavedFlow
        ? `Last measured flow · ${formatTime(replaySavedFlow.capturedAt)}`
        : providerReferenceFlow
          ? "NSE-reported OI change"
          : "Measured snapshot change"
      : "No OI change detected between these captures; directional flow is idle";
  const flowSource = visibleFlow?.source ?? "No comparable measurement";
  const selectedContracts = contractRows.filter((item) => item.symbol === activeSymbol && getOptionSide(item.optionType));
  const support = currentPrice == null ? null : selectedContracts
    .filter((item) => getOptionSide(item.optionType) === "PE"
      && typeof item.strikePrice === "number"
      && item.strikePrice <= currentPrice)
    .sort((left, right) => right.latestOI - left.latestOI)[0]?.strikePrice ?? null;
  const resistance = currentPrice == null ? null : selectedContracts
    .filter((item) => getOptionSide(item.optionType) === "CE"
      && typeof item.strikePrice === "number"
      && item.strikePrice >= currentPrice)
    .sort((left, right) => right.latestOI - left.latestOI)[0]?.strikePrice ?? null;
  const graphPoints = activeHistory.slice(-24).flatMap((snapshot) => {
    const underlying = snapshot.underlyings.find((item) => item.symbol === activeSymbol);
    return underlying ? [{ capturedAt: snapshot.capturedAt, oi: underlying.latestOI }] : [];
  });
  const closedSessionDate = !marketOpen ? activeHistory.at(-1)?.tradeDate ?? null : null;

  const refreshSnapshot = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      const [underlyingResult, contractResult] = await Promise.allSettled([
        fetchOISpurtsUnderlyings(),
        fetchOISpurtsContracts(),
      ]);
      if (underlyingResult.status === "rejected" && contractResult.status === "rejected") {
        throw new Error("NSE OI snapshot feeds could not be refreshed.");
      }
      const capturedAt = Date.now();
      const capturedDate = getNseDate(new Date(capturedAt));
      const previous = historyRef.current.filter((snapshot) => snapshot.tradeDate === capturedDate).at(-1);
      const capture: OISnapshotBatch = {
        capturedAt,
        tradeDate: capturedDate,
        underlyings: underlyingResult.status === "fulfilled"
          ? underlyingResult.value
          : previous?.underlyings ?? [],
        contracts: contractResult.status === "fulfilled"
          ? contractResult.value
          : previous?.contracts ?? [],
        underlyingsFetched: underlyingResult.status === "fulfilled",
        contractsFetched: contractResult.status === "fulfilled",
      };
      const nextHistory = [
        ...historyRef.current.filter((snapshot) => snapshot.tradeDate === capturedDate),
        capture,
      ].slice(-45);
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      setNow(new Date(capturedAt));
      setRefreshError(
        underlyingResult.status === "rejected" || contractResult.status === "rejected"
          ? "One NSE OI feed failed; showing its last successful data."
          : null,
      );
      try {
        window.localStorage.setItem(`nse-pulse-oi-history-${capturedDate}`, JSON.stringify(nextHistory));
      } catch (error: unknown) {
        setRefreshError(error instanceof Error
          ? `Snapshot received but could not be saved: ${error.message}`
          : "Snapshot received but could not be saved.");
      }
    } catch (error: unknown) {
      setRefreshError(error instanceof Error ? error.message : "Unable to refresh NSE OI snapshots.");
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const restored = marketOpen
          ? getStoredHistory(storageKey, tradeDate)
          : getLatestStoredSession(tradeDate);
        historyRef.current = restored;
        setHistory(restored);
      } catch (error: unknown) {
        setRefreshError(error instanceof Error ? `Could not restore saved OI history: ${error.message}` : "Could not restore saved OI history.");
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, [marketOpen, storageKey, tradeDate]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!marketOpen) return;
    const initialFetch = window.setTimeout(() => void refreshSnapshot(), 0);
    const timer = window.setInterval(() => void refreshSnapshot(), 60_000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(timer);
    };
  }, [marketOpen, refreshSnapshot]);

  const hasSavedHistory = activeHistory.length > 0;
  const replaySlowly = !marketOpen && hasSavedHistory;
  const marketStatus = marketOpen
    ? "Market open · sampling once per minute"
    : closedSessionDate
      ? `Market closed · last saved session ${formatDate(closedSessionDate)}`
      : "Market closed · showing latest NSE snapshot";

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(ellipse_at_50%_0%,rgba(30,64,175,0.2),transparent_55%),linear-gradient(145deg,#07111f,#0b1020_55%,#111026)] p-5 shadow-2xl md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-300">
            <Waves className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">NSE · sampled open interest</span>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">OI Flow</h2>
          <p className="mt-1 text-xs text-slate-400">{marketStatus}</p>
        </div>

        <label className="flex min-w-52 flex-col gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Stock or index
          <select
            value={activeSymbol}
            onChange={(event) => setSelectedSymbol(event.target.value)}
            disabled={!symbols.length}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-cyan-400 disabled:opacity-50"
          >
            {symbols.length
              ? symbols.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)
              : <option value="">Waiting for OI data</option>}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 py-3 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-2">
          <Activity className={cn("h-3.5 w-3.5", isRefreshing ? "animate-pulse text-cyan-300" : "text-slate-500")} />
          {isRefreshing ? "Updating NSE snapshot…" : "Latest reading"} · {formatTime(currentCapture?.capturedAt)}
        </span>
      </div>

      {refreshError && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/80">
          {refreshError}
        </p>
      )}

      {selectedSnapshot ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Spot price", value: currentPrice == null ? "—" : formatExact(currentPrice) },
              { label: "Current OI", value: currentOI == null ? "—" : formatExact(currentOI) },
              { label: "Support · OI sample", value: support == null ? "—" : formatExact(support) },
              { label: "Resistance · OI sample", value: resistance == null ? "—" : formatExact(resistance) },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                <p className="mt-2 font-mono text-lg font-bold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          <OIFlowAnimation
            symbol={activeSymbol}
            added={visibleFlow?.added ?? null}
            reduced={visibleFlow?.reduced ?? null}
            replaySlowly={replaySlowly}
            animationKey={`${activeSymbol}-${visibleFlow?.capturedAt ?? currentCapture?.capturedAt ?? 0}-${flowSource}`}
            status={flowStatus}
            source={flowSource}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <OIHistoryChart points={graphPoints} />
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Market structure</p>
              <p className="mt-2 text-sm font-semibold text-white">{getMarketStructure(sampleDelta, priceDelta)}</p>
              {sampleDelta == null && (
                <p className="mt-1 text-xs text-slate-400">
                  {marketOpen
                    ? comparisonWait == null
                      ? "First comparison available after the first successful capture."
                      : `First comparison available in ${formatCountdown(comparisonWait)}`
                    : "No saved comparison is available on this device yet."}
                </p>
              )}
              <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-amber-100/80">
                This dashboard does not say buy or avoid. OI is not buyer-versus-seller flow; confirm price, volume, events, and risk independently.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          {isRefreshing ? "Loading NSE OI…" : "No NSE OI snapshot is available."}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
        Flow and graph show sampled NSE OI snapshots, not order-by-order activity. After market close, saved captures are replayed slowly; history exists only if this tab collected it on this device. Support/resistance are estimates from the partial OI-spurt sample.
      </p>
    </section>
  );
}
