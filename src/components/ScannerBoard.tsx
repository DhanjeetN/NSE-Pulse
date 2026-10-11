import { ArrowUpRight, ArrowDownRight, ShieldCheck, Gauge, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMarketStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

type SignalDirection = "bullish" | "bearish" | "neutral";

type SignalCard = {
  title: string;
  sentiment: SignalDirection;
  confidence: number;
  tag: string;
  description: string;
  accent: "emerald" | "rose" | "blue" | "amber";
  icon: LucideIcon;
};

const tabConfig = {
  bullish: { label: "Bullish", tone: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  bearish: { label: "Bearish", tone: "bg-rose-500/10 text-rose-500 border border-rose-500/20" },
  neutral: { label: "Neutral", tone: "bg-amber-500/10 text-amber-500 border border-amber-500/20" },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ScannerBoard() {
  const { gainers, losers, oiUnderlyings } = useMarketStore();
  const [activeTab, setActiveTab] = useState<SignalDirection>("bullish");

  const signals = useMemo<Record<SignalDirection, SignalCard[]>>(() => {
    const bullishFromGainers = gainers.slice(0, 3).map((stock, index) => ({
      title: stock.symbol,
      sentiment: "bullish" as const,
      confidence: clamp(Math.round(68 + stock.perChange * 1.8 + index * 2), 70, 96),
      tag: index === 0 ? "Trend + Volume" : index === 1 ? "Breakout" : "Momentum",
      description: `${stock.symbol} is gaining ${stock.perChange.toFixed(2)}% with strong trading volume and market breadth support.`,
      accent: "emerald" as const,
      icon: ArrowUpRight,
    }));

    const bullishFromOI = oiUnderlyings.slice(0, 2).filter((item) => (item.avgInOI ?? 0) > 0).map((item) => ({
      title: item.symbol,
      sentiment: "bullish" as const,
      confidence: clamp(Math.round(64 + (item.avgInOI ?? 0) * 2), 65, 92),
      tag: "OI build-up",
      description: `${item.symbol} shows positive OI build-up and rising price action, suggesting sustained buying interest.`,
      accent: "blue" as const,
      icon: Gauge,
    }));

    const bearishFromLosers = losers.slice(0, 3).map((stock, index) => ({
      title: stock.symbol,
      sentiment: "bearish" as const,
      confidence: clamp(Math.round(66 + Math.abs(stock.perChange) * 1.5 + index * 2), 70, 95),
      tag: index === 0 ? "Weak structure" : index === 1 ? "Breakdown" : "Risk off",
      description: `${stock.symbol} is down ${Math.abs(stock.perChange).toFixed(2)}% with fading momentum and weak participation.`,
      accent: "rose" as const,
      icon: ArrowDownRight,
    }));

    const bearishFromOI = oiUnderlyings.slice(0, 2).filter((item) => (item.avgInOI ?? 0) < 0).map((item) => ({
      title: item.symbol,
      sentiment: "bearish" as const,
      confidence: clamp(Math.round(62 + Math.abs(item.avgInOI ?? 0) * 2), 65, 90),
      tag: "OI fade",
      description: `${item.symbol} is seeing negative OI pressure while price slips, suggesting distribution or selling pressure.`,
      accent: "rose" as const,
      icon: ArrowDownRight,
    }));

    const neutralSignals: SignalCard[] = [
      {
        title: "Index breadth",
        sentiment: "neutral",
        confidence: 58,
        tag: "Market filter",
        description: "Mixed participation and uncertain trend structure reduce conviction for aggressive setups.",
        accent: "amber",
        icon: ShieldCheck,
      },
      {
        title: "Watchlist scan",
        sentiment: "neutral",
        confidence: 61,
        tag: "False-breakout risk",
        description: "Price is near support or resistance, so waiting for confirmation is safer than forcing entries.",
        accent: "blue",
        icon: Gauge,
      },
    ];

    return {
      bullish: [...bullishFromGainers, ...bullishFromOI].slice(0, 4),
      bearish: [...bearishFromLosers, ...bearishFromOI].slice(0, 4),
      neutral: neutralSignals,
    };
  }, [gainers, losers, oiUnderlyings]);

  const visibleSignals = signals[activeTab];

  const predictionInsights = useMemo(() => {
    const bestBullish = [...gainers].sort((a, b) => b.perChange - a.perChange)[0];
    const bestBearish = [...losers].sort((a, b) => a.perChange - b.perChange)[0];
    const strongestOI = [...oiUnderlyings].sort((a, b) => (b.avgInOI ?? 0) - (a.avgInOI ?? 0))[0];

    const bullishProbability = bestBullish ? clamp(Math.round(62 + bestBullish.perChange * 1.4), 60, 92) : 0;
    const bearishProbability = bestBearish ? clamp(Math.round(60 + Math.abs(bestBearish.perChange) * 1.3), 60, 91) : 0;
    const oiProbability = strongestOI ? clamp(Math.round(58 + Math.abs(strongestOI.avgInOI ?? 0) * 2.2), 55, 90) : 0;

    return [
      {
        direction: "Bullish",
        title: bestBullish?.symbol ?? "Market breadth",
        probability: bullishProbability || Math.max(50, oiProbability),
        action: bestBullish ? "Buy / Add on dips" : "Watchlist",
        reason: bestBullish
          ? `${bestBullish.symbol} leads the move with ${bestBullish.perChange.toFixed(2)}% momentum and broad participation.`
          : "Market breadth is mixed, so bullish conviction should wait for stronger confirmation.",
        risk: "Trend support remains intact with participation from the strongest movers.",
      },
      {
        direction: "Bearish",
        title: bestBearish?.symbol ?? "Risk-off mode",
        probability: bearishProbability || Math.max(50, oiProbability),
        action: bestBearish ? "Reduce risk / Sell on rallies" : "Neutral",
        reason: bestBearish
          ? `${bestBearish.symbol} is under pressure with ${Math.abs(bestBearish.perChange).toFixed(2)}% downside and weak structure.`
          : "Downside pressure is limited, so the market remains range-bound rather than decisively bearish.",
        risk: "Breakdown risk rises if momentum falls below recent support zones.",
      },
      {
        direction: "Neutral",
        title: strongestOI?.symbol ?? "Index filter",
        probability: oiProbability || 52,
        action: "Wait for confirmation",
        reason: strongestOI
          ? `${strongestOI.symbol} is showing OI conviction at ${((strongestOI.avgInOI ?? 0)).toFixed(2)}%, which keeps the market in a confirmation phase.`
          : "The market is balanced; false-breakout risk remains elevated without a clear trend.",
        risk: "Only take fresh positions when index breadth and volume confirm the setup.",
      },
    ];
  }, [gainers, losers, oiUnderlyings]);

  return (
    <GlassCard
      title="Scanner Board"
      badge={<span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Live</span>}
      rightElement={<span className="text-[10px] font-medium text-muted-foreground">Bullish / Bearish / Neutral</span>}
      className="mb-8"
    >
      <div className="p-4 md:p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(tabConfig) as SignalDirection[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition-all",
                tabConfig[tab].tone,
                activeTab === tab && "ring-1 ring-offset-0 ring-current scale-[1.02]"
              )}
            >
              {tabConfig[tab].label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleSignals.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              No {activeTab} setups detected right now. Try refreshing the market data.
            </div>
          ) : (
            visibleSignals.map(({ title, sentiment, confidence, tag, description, accent, icon: Icon }) => {
              const accentClasses = {
                emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
                rose: "border-rose-500/20 bg-rose-500/5 text-rose-500",
                blue: "border-blue-500/20 bg-blue-500/5 text-blue-500",
                amber: "border-amber-500/20 bg-amber-500/5 text-amber-500",
              }[accent];

              return (
                <div key={`${activeTab}-${title}`} className="rounded-2xl border border-border/70 bg-background/50 p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl border", accentClasses)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{tag}</span>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]", accentClasses)}>
                      {sentiment}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Confidence</span>
                      <span>{confidence}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          sentiment === "bullish" ? "bg-emerald-500" : sentiment === "bearish" ? "bg-rose-500" : "bg-amber-500"
                        )}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {predictionInsights.map((insight) => (
            <div key={insight.direction} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                  insight.direction === "Bullish"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : insight.direction === "Bearish"
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                )}>
                  {insight.direction}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{insight.probability}%</span>
              </div>

              <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{insight.reason}</p>

              <div className="mt-3 space-y-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Action</span>
                  <span className={cn(
                    "font-bold",
                    insight.direction === "Bullish" ? "text-emerald-500" : insight.direction === "Bearish" ? "text-rose-500" : "text-amber-500"
                  )}>{insight.action}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Risk</span>
                  <span className="text-foreground/80">{insight.risk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
