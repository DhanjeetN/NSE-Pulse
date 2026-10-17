"use client";

import { useMemo, useState } from "react";
import { Activity, Info, Waves } from "lucide-react";
import { motion } from "framer-motion";
import type { OISpurtData } from "@/lib/nse-api";
import { formatCompactNumber } from "@/lib/utils";

interface OIFlowStudioProps {
  underlyings: OISpurtData[];
  contracts: OISpurtData[];
  updatedAt: Date | null;
}

function getOptionSide(optionType?: string) {
  const normalized = optionType?.toUpperCase();
  if (normalized === "CALL" || normalized === "CE") return "call";
  if (normalized === "PUT" || normalized === "PE") return "put";
  return null;
}

function formatSignedValue(value: number) {
  return `${value > 0 ? "+" : ""}${formatCompactNumber(value)}`;
}

function OIFlowLane({
  label,
  color,
  contracts,
  change,
  mirror = false,
}: {
  label: string;
  color: "cyan" | "violet";
  contracts: OISpurtData[];
  change: number;
  mirror?: boolean;
}) {
  const isIncrease = change > 0;
  const colorClass = color === "cyan" ? "text-cyan-300" : "text-violet-300";
  const dotClass = color === "cyan" ? "bg-cyan-300 shadow-cyan-300/70" : "bg-violet-300 shadow-violet-300/70";
  const lineClass = color === "cyan" ? "from-cyan-400/0 via-cyan-300/70 to-cyan-400/0" : "from-violet-400/0 via-violet-300/70 to-violet-400/0";

  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${colorClass}`}>{label} side</p>
          <p className="mt-2 font-mono text-2xl font-black text-white">{formatSignedValue(change)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Net OI change · matched contracts</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
          {isIncrease ? "OI added" : change < 0 ? "OI reduced" : "No net change"}
        </span>
      </div>

      <div className="relative mt-6 flex h-12 items-center">
        <div className={`h-px w-full bg-gradient-to-r ${lineClass}`} />
        {change !== 0 && (
          <>
            {[0, 1, 2].map((particle) => {
              const outsideOffset = mirror ? 150 : -150;
              return (
                <motion.span
                  key={particle}
                  aria-hidden="true"
                  className={`absolute left-1/2 h-2 w-2 rounded-full shadow-[0_0_18px] ${dotClass}`}
                  animate={{
                    x: isIncrease ? [0, outsideOffset] : [outsideOffset, 0],
                    opacity: [0.15, 1, 0.15],
                    scale: [0.7, 1.25, 0.7],
                  }}
                  transition={{
                    duration: 2.8,
                    delay: particle * 0.55,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </>
        )}
        <div className={`absolute left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border ${color === "cyan" ? "border-cyan-300/60 bg-cyan-300/15" : "border-violet-300/60 bg-violet-300/15"} shadow-[0_0_24px_rgba(139,92,246,0.22)]`} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-slate-400">
        <span>Reported OI: {formatCompactNumber(contracts.reduce((sum, item) => sum + item.latestOI, 0))}</span>
        <span>NSE option sample</span>
      </div>
    </div>
  );
}

export function OIFlowStudio({ underlyings, contracts, updatedAt }: OIFlowStudioProps) {
  const symbols = useMemo(
    () => Array.from(new Set([
      ...underlyings.map((item) => item.symbol),
      ...contracts.map((item) => item.symbol),
    ].filter(Boolean))).sort((left, right) => left.localeCompare(right)),
    [contracts, underlyings],
  );
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const activeSymbol = symbols.includes(selectedSymbol)
    ? selectedSymbol
    : symbols.includes("NIFTY")
      ? "NIFTY"
      : symbols[0] ?? "";
  const selectedUnderlying = underlyings.find((item) => item.symbol === activeSymbol);
  const selectedContracts = contracts.filter((item) => item.symbol === activeSymbol);
  const callContracts = selectedContracts.filter((item) => getOptionSide(item.optionType) === "call");
  const putContracts = selectedContracts.filter((item) => getOptionSide(item.optionType) === "put");
  const callChange = callContracts.reduce((sum, item) => sum + item.changeInOI, 0);
  const putChange = putContracts.reduce((sum, item) => sum + item.changeInOI, 0);

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-[radial-gradient(ellipse_at_50%_0%,rgba(30,64,175,0.24),transparent_55%),linear-gradient(145deg,#07111f,#0b1020_55%,#111026)] p-5 shadow-2xl md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-300">
            <Waves className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em]">NSE derivatives feed</span>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">Open Interest Flow</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Animated view of reported call- and put-side OI changes. Flow is descriptive positioning data, not an AI forecast or trade signal.
          </p>
        </div>

        <label className="flex min-w-56 flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Choose symbol
          <select
            value={activeSymbol}
            onChange={(event) => setSelectedSymbol(event.target.value)}
            disabled={!symbols.length}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-cyan-400 disabled:opacity-50"
          >
            {symbols.length ? symbols.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>) : <option value="">No OI symbols</option>}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/10 py-3 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-cyan-300" /> NSE OI spurt snapshot</span>
        <span>{updatedAt ? `App fetched ${updatedAt.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : "Waiting for NSE OI data"}</span>
        {selectedUnderlying && (
          <span>
            Underlying OI change {selectedUnderlying.avgInOI != null ? `${selectedUnderlying.avgInOI > 0 ? "+" : ""}${selectedUnderlying.avgInOI.toFixed(2)}%` : "unavailable"}
          </span>
        )}
      </div>

      {symbols.length ? (
        <>
          <div className="relative mt-6 grid gap-4 md:grid-cols-[1fr_116px_1fr] md:items-center">
            <div className="pointer-events-none absolute inset-x-[12%] top-1/2 hidden h-48 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl md:block" />
            <OIFlowLane label="Call" color="cyan" contracts={callContracts} change={callChange} />
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center [perspective:700px]">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 rounded-[28px] border border-cyan-300/40 bg-gradient-to-br from-cyan-300/20 via-blue-500/10 to-violet-400/20 shadow-[0_0_45px_rgba(34,211,238,0.18)]"
                animate={{ rotateX: [0, 12, 0], rotateY: [0, -15, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/80 text-center shadow-xl">
                <span className="max-w-14 truncate px-1 text-[10px] font-black tracking-wide text-white">{activeSymbol}</span>
              </div>
            </div>
            <OIFlowLane label="Put" color="violet" contracts={putContracts} change={putChange} mirror />
          </div>

          {!selectedContracts.length && (
            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/80">
              No option-contract rows are currently supplied for {activeSymbol}. The underlying OI snapshot above is shown only when the feed provides it.
            </div>
          )}
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          {underlyings.length || contracts.length ? "No symbols available in the OI feed." : "NSE has not returned OI data yet."}
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Contract totals cover only rows returned by the NSE OI-spurt endpoint, not the full option chain. Positive values indicate reported OI additions; negative values indicate reductions. No directional market interpretation is applied.
      </p>
    </section>
  );
}
