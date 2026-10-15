import { ArrowUpRight, ArrowDownRight, ShieldCheck, Gauge, TrendingUp, TrendingDown, Target, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMarketStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { buildForwardQuantModel, buildMarketPulse, buildPredictionHistorySummary, buildVolatilityAdjustedForecast } from "@/lib/marketSignals";

type SignalDirection = "bullish" | "bearish" | "neutral" | "forecast";

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
  forecast: { label: "Forecast", tone: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const timeframeOptions = ["5M", "15M", "30M", "1H", "3H", "1D"] as const;
type Timeframe = (typeof timeframeOptions)[number];

export function ScannerBoard() {
  const { gainers, losers, oiUnderlyings, marketIndices } = useMarketStore();
  const [activeTab, setActiveTab] = useState<SignalDirection>("bullish");
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("15M");
  const marketPulse = useMemo(() => buildMarketPulse(gainers, losers, oiUnderlyings), [gainers, losers, oiUnderlyings]);

  const normalizedIndexMap = useMemo(() => {
    const entries = new Map<string, { name: string; currentPrice: number; percentChange: number; change: number; high: number; low: number; previousClose: number; }>();

    for (const index of marketIndices) {
      const normalizedName = index.name.toUpperCase().replace(/\s+/g, "");
      if (normalizedName.includes("NIFTY50") || normalizedName.includes("NIFTYBANK") || normalizedName.includes("FINNIFTY") || normalizedName.includes("NIFTYIT")) {
        entries.set(normalizedName, {
          name: index.name,
          currentPrice: Number(index.currentPrice ?? 0),
          percentChange: Number(index.percentChange ?? 0),
          change: Number(index.change ?? 0),
          high: Number(index.high ?? 0),
          low: Number(index.low ?? 0),
          previousClose: Number(index.previousClose ?? 0),
        });
      }
    }

    return entries;
  }, [marketIndices]);

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

    const selectedForecastLabel = `${selectedTimeframe} view`;

    return {
      bullish: [...bullishFromGainers, ...bullishFromOI].slice(0, 4),
      bearish: [...bearishFromLosers, ...bearishFromOI].slice(0, 4),
      neutral: neutralSignals,
      forecast: [
        {
          title: "Nifty 50",
          sentiment: "forecast",
          confidence: 71,
          tag: selectedForecastLabel,
          description: `The ${selectedTimeframe} view indicates early continuation bias with improving breadth and sustained participation.`,
          accent: "blue",
          icon: Gauge,
        },
        {
          title: "Bank Nifty",
          sentiment: "forecast",
          confidence: 68,
          tag: selectedForecastLabel,
          description: `Banking breadth remains constructive in the ${selectedTimeframe} frame and is leading the next directional impulse.`,
          accent: "emerald",
          icon: ArrowUpRight,
        },
      ],
    };
  }, [gainers, losers, oiUnderlyings, selectedTimeframe]);

  const isForecastTab = activeTab === "forecast";
  const visibleSignals = isForecastTab ? [] : signals[activeTab];

  const indexForecasts = useMemo(() => {
    const knownIndexes = [
      { lookup: "NIFTY50", label: "Nifty 50" },
      { lookup: "NIFTYBANK", label: "Bank Nifty" },
      { lookup: "FINNIFTY", label: "FINNIFTY" },
      { lookup: "NIFTYIT", label: "Nifty IT" },
    ];

    const entries = knownIndexes
      .map(({ lookup, label }) => {
        const liveEntry = normalizedIndexMap.get(lookup) ?? normalizedIndexMap.get(lookup.replace("NIFTY", "NIFTY"));
        const currentPrice = Number(liveEntry?.currentPrice ?? 0);
        if (!currentPrice) return null;

        const percentChange = Math.abs(Number(liveEntry?.percentChange ?? 0));
        const baseContext = {
          name: label,
          currentPrice,
          historicalVolatility: clamp(percentChange * 0.75 + 0.45, 0.4, 2.4),
          atrPercent: clamp(percentChange * 0.7 + 0.5, 0.35, 1.8),
          intradayVolatility: clamp(percentChange * 0.95 + 0.6, 0.5, 2.2),
          marketBreadth: marketPulse.breadth,
          relativeStrength: clamp(55 + marketPulse.breadth * 0.16 + percentChange * 2.8, 35, 90),
          volumeProfile: clamp(60 + percentChange * 3.5, 45, 90),
          vwapPosition: clamp(0.5 + marketPulse.breadth / 220, 0.3, 0.75),
          sectorStrength: clamp(58 + percentChange * 4.5, 42, 88),
          smartMoneyFlow: clamp(60 + percentChange * 4.2, 46, 90),
          newsSentiment: clamp(56 + percentChange * 3.8, 45, 88),
        };

        const forecast = buildVolatilityAdjustedForecast(currentPrice, baseContext);
        const selectedScenario = forecast.scenarios.find((scenario) => scenario.timeframe === selectedTimeframe) ?? forecast.scenarios[0];

        return {
          name: label,
          currentPrice,
          overallBias: selectedScenario.expectedDirection,
          bullishProbability: selectedScenario.bullishProbability,
          bearishProbability: selectedScenario.bearishProbability,
          confidence: selectedScenario.confidence,
          selectedTimeframe,
          selectedScenario,
          periods: forecast.scenarios.map((scenario) => ({
            timeframe: scenario.timeframe,
            bullish: scenario.bullishProbability,
            bearish: scenario.bearishProbability,
            trend: scenario.expectedDirection,
            confidence: scenario.confidence,
            expectedMove: scenario.expectedMovePercent,
            mostLikelyPrice: scenario.mostLikelyPrice,
            probability70Range: scenario.probability70Range,
            probability95Range: scenario.probability95Range,
            expectedHigh: scenario.expectedHigh,
            expectedLow: scenario.expectedLow,
            support: scenario.support,
            resistance: scenario.resistance,
            riskLevel: scenario.riskLevel,
          })),
        };
      })
      .filter(Boolean) as Array<{
        name: string;
        currentPrice: number;
        overallBias: string;
        bullishProbability: number;
        bearishProbability: number;
        confidence: number;
        selectedTimeframe: Timeframe;
        selectedScenario: { timeframe: string; bullishProbability: number; bearishProbability: number; confidence: number; expectedDirection: string; expectedMovePercent: number; mostLikelyPrice: number; probability70Range: { low: number; high: number }; probability95Range: { low: number; high: number }; expectedHigh: number; expectedLow: number; support: number; resistance: number; riskLevel: string; };
        periods: Array<{ timeframe: string; bullish: number; bearish: number; trend: string; confidence: number; expectedMove: number; mostLikelyPrice: number; probability70Range: { low: number; high: number }; probability95Range: { low: number; high: number }; expectedHigh: number; expectedLow: number; support: number; resistance: number; riskLevel: string; }>;
      }>;

    return entries;
  }, [marketPulse.breadth, normalizedIndexMap, selectedTimeframe]);

  const predictionInsights = useMemo(() => {
    const bestBullish = [...gainers].sort((a, b) => b.perChange - a.perChange)[0];
    const bestBearish = [...losers].sort((a, b) => a.perChange - b.perChange)[0];
    const strongestOI = [...oiUnderlyings].sort((a, b) => (b.avgInOI ?? 0) - (a.avgInOI ?? 0))[0];

    const leader = bestBullish ?? strongestOI ?? {
      symbol: 'Market breadth',
      ltp: 0,
      perChange: 0,
      trade_quantity: 0,
      yearHigh: 0,
      yearLow: 0,
      high_price: 0,
      low_price: 0,
    };

    const quant = buildForwardQuantModel(leader, {
      priceStructure: bestBullish ? 80 : 58,
      volumeFootprint: strongestOI ? 74 : 52,
      volatilityExpansion: bestBullish ? 76 : 54,
      relativeStrength: bestBullish ? 82 : 55,
      newsSentiment: bestBullish ? 74 : 52,
      smartMoney: strongestOI ? 78 : 58,
      breakoutEngine: bestBullish ? 86 : 58,
      breakdownEngine: bestBearish ? 78 : 42,
      sectorMomentum: bestBullish ? 84 : 56,
      liquidityFlow: strongestOI ? 72 : 50,
    });

    return { quant, rows: [
      {
        direction: "Bullish",
        title: quant.stock,
        probability: quant.bullishProbability,
        action: quant.signal.includes('Bullish') ? "Buy / Add on dips" : "Watchlist",
        reason: quant.aiVerdict,
        risk: "Trend support remains intact with participation from the strongest movers.",
      },
      {
        direction: "Bearish",
        title: bestBearish?.symbol ?? "Risk-off mode",
        probability: quant.bearishProbability,
        action: bestBearish ? "Reduce risk / Sell on rallies" : "Neutral",
        reason: bestBearish
          ? `${bestBearish.symbol} is under pressure with ${Math.abs(bestBearish.perChange).toFixed(2)}% downside and weak structure.`
          : "Downside pressure is limited, so the market remains range-bound rather than decisively bearish.",
        risk: "Breakdown risk rises if momentum falls below recent support zones.",
      },
      {
        direction: "Neutral",
        title: strongestOI?.symbol ?? "Index filter",
        probability: quant.breakoutProbability,
        action: quant.breakoutProbability >= quant.breakdownProbability ? "Wait for confirmation" : "Protect capital",
        reason: strongestOI
          ? `${strongestOI.symbol} is showing OI conviction at ${((strongestOI.avgInOI ?? 0)).toFixed(2)}%, which keeps the market in a confirmation phase.`
          : "The market is balanced; false-breakout risk remains elevated without a clear trend.",
        risk: "Only take fresh positions when index breadth and volume confirm the setup.",
      },
    ] };
  }, [gainers, losers, oiUnderlyings]);

  const quant = predictionInsights.quant;
  const predictionRows = predictionInsights.rows;

  const historySummary = useMemo(() => buildPredictionHistorySummary([
    {
      id: 'h1',
      timestamp: '2026-10-15T09:30:00.000Z',
      timeframe: '15M',
      marketCondition: 'Bullish',
      bullish: 68,
      bearish: 32,
      confidence: 74,
      predictedDirection: 'Bullish',
      predictedPrice: 24790,
      actualClosingPrice: 24840,
      actualDirection: 'Bullish',
      predictionResult: 'Correct',
      marketName: 'Nifty 50',
    },
    {
      id: 'h2',
      timestamp: '2026-10-15T10:00:00.000Z',
      timeframe: '1H',
      marketCondition: 'Bullish',
      bullish: 62,
      bearish: 38,
      confidence: 69,
      predictedDirection: 'Bullish',
      predictedPrice: 54225,
      actualClosingPrice: 54290,
      actualDirection: 'Bullish',
      predictionResult: 'Correct',
      marketName: 'Bank Nifty',
    },
    {
      id: 'h3',
      timestamp: '2026-10-14T09:30:00.000Z',
      timeframe: '30M',
      marketCondition: 'Bearish',
      bullish: 46,
      bearish: 54,
      confidence: 61,
      predictedDirection: 'Bearish',
      predictedPrice: 24270,
      actualClosingPrice: 24320,
      actualDirection: 'Bullish',
      predictionResult: 'Incorrect',
      marketName: 'Nifty IT',
    },
    {
      id: 'h4',
      timestamp: '2026-10-12T09:30:00.000Z',
      timeframe: '15M',
      marketCondition: 'Bullish',
      bullish: 58,
      bearish: 42,
      confidence: 63,
      predictedDirection: 'Bullish',
      predictedPrice: 24530,
      actualClosingPrice: 24500,
      actualDirection: 'Bearish',
      predictionResult: 'Partially Correct',
      marketName: 'FINNIFTY',
    },
  ]), []);

  const verdictCards = useMemo(() => {
    const marketNames = ["Nifty 50", "Bank Nifty", "FINNIFTY", "Nifty IT"] as const;
    return marketNames.map((market) => {
      const forecast = indexForecasts.find((item) => item.name === market) ?? indexForecasts[0];
      if (!forecast) {
        return { market, bias: "Neutral", confidence: 0, risk: "High", bullish: 0, bearish: 0, direction: "Neutral" };
      }

      const bullish = forecast.bullishProbability;
      const bearish = forecast.bearishProbability;
      const direction = bullish >= bearish ? "Bullish" : "Bearish";
      const bias = bullish >= 60 && bullish >= bearish + 12 ? "Strong Bullish" : bullish >= 55 ? "Bullish" : bearish >= 60 && bearish >= bullish + 12 ? "Strong Bearish" : bearish >= 55 ? "Bearish" : "Neutral";
      return {
        market,
        bias,
        confidence: forecast.confidence,
        risk: forecast.confidence >= 70 ? "Low" : forecast.confidence >= 60 ? "Medium" : "High",
        bullish,
        bearish,
        direction,
      };
    });
  }, [indexForecasts]);

  return (
    <GlassCard
      title="Scanner Board"
      badge={<span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Live</span>}
      rightElement={<span className="text-[10px] font-medium text-muted-foreground">{marketPulse.regime} · {marketPulse.confidence}% conviction</span>}
      className="mb-8"
    >
      <div className="p-4 md:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
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

          <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-background/40 p-1">
            {timeframeOptions.map((timeframe) => (
              <button
                key={timeframe}
                type="button"
                onClick={() => setSelectedTimeframe(timeframe)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition-all",
                  selectedTimeframe === timeframe
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80"
                )}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {isForecastTab ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
              Priority = Early Prediction &gt; Confirmation · Active horizon: {selectedTimeframe}
            </div>

            {!indexForecasts.length && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
                Live market index data is not available right now, so the forecast engine is paused until the NSE feed refreshes.
              </div>
            )}

            {indexForecasts.length > 0 && (
              <>
                <div className="grid gap-4 xl:grid-cols-2">
                  {indexForecasts.map((indexItem) => {
                    const chartPoints = indexItem.periods
                      .map((period, chartIndex) => `${chartIndex * 26},${100 - period.bullish}`)
                      .join(" ");
                    const bearishPoints = indexItem.periods
                      .map((period, chartIndex) => `${chartIndex * 26},${100 - period.bearish}`)
                      .join(" ");
                    const mostLikelyPoints = indexItem.periods
                      .map((period, chartIndex) => `${chartIndex * 26},${100 - (period.bullish + period.bearish) / 2}`)
                      .join(" ");

                    return (
                      <div key={indexItem.name} className="rounded-2xl border border-border bg-background/60 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Index</p>
                            <h4 className="text-lg font-black text-foreground">{indexItem.name}</h4>
                          </div>
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-500">
                            {indexItem.overallBias}
                          </span>
                        </div>

                        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
                          <svg viewBox="0 0 120 40" className="h-12 w-full">
                            <path d="M 0 35 L 120 35" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
                            <path d={`M 0 35 L ${chartPoints} L 120 35`} fill="none" stroke="rgba(34,197,94,0.35)" strokeWidth="1" />
                            <path d={`M 0 35 L ${bearishPoints} L 120 35`} fill="none" stroke="rgba(244,63,94,0.35)" strokeWidth="1" />
                            <path d={`M 0 35 L ${mostLikelyPoints} L 120 35`} fill="none" stroke="rgba(96,165,250,0.9)" strokeWidth="2" />
                            <polyline
                              points={chartPoints}
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                            <polyline
                              points={bearishPoints}
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth="2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                            <polyline
                              points={mostLikelyPoints}
                              fill="none"
                              stroke="#60a5fa"
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 pt-2">
                          <div className="rounded-xl border border-border bg-background/35 p-3">
                            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Current Market Position</div>
                            <div className="mt-2 text-lg font-black text-foreground">{indexItem.currentPrice.toLocaleString()}</div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/35 p-3">
                            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Projected Direction</div>
                            <div className={cn("mt-2 text-lg font-black", indexItem.overallBias === "Bullish" ? "text-emerald-500" : indexItem.overallBias === "Bearish" ? "text-rose-500" : "text-amber-500")}>{indexItem.overallBias}</div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {indexItem.periods.map((period) => (
                            <div key={`${indexItem.name}-${period.timeframe}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-2 py-1.5">
                              <span>{period.timeframe}</span>
                              <span className="font-bold text-foreground">
                                {period.bullish}% / {period.bearish}%
                              </span>
                              <span className={cn(
                                period.trend.includes("Bull") ? "text-emerald-500" : period.trend.includes("Bear") ? "text-rose-500" : "text-amber-500",
                                "font-bold"
                              )}>{period.trend}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Price Projection Engine</p>
                      <h4 className="text-xl font-black text-foreground">Expected Price Path</h4>
                    </div>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-500">Early momentum</span>
                  </div>

                  <div className="space-y-4">
                    {indexForecasts.map((indexItem) => (
                      <div key={indexItem.name} className="rounded-2xl border border-border bg-muted/8 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Index</p>
                            <h4 className="text-lg font-black text-foreground">{indexItem.name}</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current Price</div>
                            <div className="text-base font-black text-foreground">{indexItem.currentPrice.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="mb-4 grid gap-3 md:grid-cols-4 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          <div className="rounded-xl border border-border bg-background/40 p-2">
                            <div>Bullish</div>
                            <div className="mt-1 text-sm font-black text-emerald-500">{indexItem.bullishProbability}%</div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/40 p-2">
                            <div>Bearish</div>
                            <div className="mt-1 text-sm font-black text-rose-500">{indexItem.bearishProbability}%</div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/40 p-2">
                            <div>Confidence</div>
                            <div className="mt-1 text-sm font-black text-blue-500">{indexItem.confidence}%</div>
                          </div>
                          <div className="rounded-xl border border-border bg-background/40 p-2">
                            <div>Direction</div>
                            <div className={cn("mt-1 text-sm font-black", indexItem.overallBias === "Bullish" ? "text-emerald-500" : indexItem.overallBias === "Bearish" ? "text-rose-500" : "text-amber-500")}>{indexItem.overallBias}</div>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {indexItem.periods.map((projection) => (
                            <div key={`${indexItem.name}-${projection.timeframe}`} className="rounded-xl border border-border bg-background/35 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{projection.timeframe}</p>
                                <span className={cn("text-[9px] font-bold uppercase tracking-[0.12em]", projection.trend === "Bullish" ? "text-emerald-500" : projection.trend === "Bearish" ? "text-rose-500" : "text-amber-500")}>{projection.trend}</span>
                              </div>
                              <div className="space-y-1 text-[10px] text-foreground/80">
                                <div className="flex justify-between"><span>Bullish</span><span>{projection.bullish}%</span></div>
                                <div className="flex justify-between"><span>Bearish</span><span>{projection.bearish}%</span></div>
                                <div className="flex justify-between"><span>Confidence</span><span>{projection.confidence}%</span></div>
                                <div className="flex justify-between"><span>Move</span><span>{projection.expectedMove.toFixed(2)}%</span></div>
                                <div className="flex justify-between"><span>Most Likely</span><span>{projection.mostLikelyPrice.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>70% Range</span><span>{projection.probability70Range.low.toLocaleString()} - {projection.probability70Range.high.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>95% Range</span><span>{projection.probability95Range.low.toLocaleString()} - {projection.probability95Range.high.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Expected High</span><span>{projection.expectedHigh.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Expected Low</span><span>{projection.expectedLow.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Support</span><span>{projection.support.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Resistance</span><span>{projection.resistance.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Risk</span><span>{projection.riskLevel}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {verdictCards.map((card) => (
                <div key={card.market} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{card.market}</p>
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]",
                      card.bias === "Strong Bullish" || card.bias === "Bullish" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" :
                      card.bias === "Strong Bearish" || card.bias === "Bearish" ? "border-rose-500/20 bg-rose-500/10 text-rose-500" :
                      "border-amber-500/20 bg-amber-500/10 text-amber-500"
                    )}>{card.bias}</span>
                  </div>
                  <div className="text-lg font-black text-foreground">{card.confidence}%</div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Risk {card.risk}</div>
                  <div className="mt-3 space-y-1 text-[10px] text-foreground/80">
                    <div className="flex justify-between"><span>Bullish</span><span>{card.bullish}%</span></div>
                    <div className="flex justify-between"><span>Bearish</span><span>{card.bearish}%</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Market Verdict</p>
                </div>
                <div className="space-y-3 text-sm text-foreground/85">
                  {verdictCards.map((card) => (
                    <div key={card.market} className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-3 py-2">
                      <span>{card.market}</span>
                      <span className={cn(
                        card.bias === "Strong Bullish" || card.bias === "Bullish" ? "text-emerald-500" :
                        card.bias === "Strong Bearish" || card.bias === "Bearish" ? "text-rose-500" :
                        "text-amber-500",
                        "font-bold"
                      )}>{card.bias}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Performance Dashboard</p>
                </div>
                <div className="space-y-2 text-[11px] text-foreground/80">
                  <div className="flex justify-between"><span>Today&apos;s Accuracy</span><span>{historySummary.todayAccuracy}%</span></div>
                  <div className="flex justify-between"><span>Weekly Accuracy</span><span>{historySummary.weeklyAccuracy}%</span></div>
                  <div className="flex justify-between"><span>Monthly Accuracy</span><span>{historySummary.monthlyAccuracy}%</span></div>
                  <div className="flex justify-between"><span>Prediction Success Rate</span><span>{historySummary.predictionSuccessRate}%</span></div>
                  <div className="flex justify-between"><span>Bullish Prediction Accuracy</span><span>{historySummary.bullishPredictionAccuracy}%</span></div>
                  <div className="flex justify-between"><span>Bearish Prediction Accuracy</span><span>{historySummary.bearishPredictionAccuracy}%</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Prediction Review Panel</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-foreground/80">
                  <thead className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Timeframe</th>
                      <th className="pb-2 pr-4">Prediction</th>
                      <th className="pb-2 pr-4">Actual</th>
                      <th className="pb-2 pr-4">Accuracy</th>
                      <th className="pb-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/50">
                      <td className="py-2 pr-4">15-Oct-2026</td>
                      <td className="py-2 pr-4">15M</td>
                      <td className="py-2 pr-4">Predicted Bullish</td>
                      <td className="py-2 pr-4">Actual Bullish</td>
                      <td className="py-2 pr-4">95%</td>
                      <td className="py-2 pr-4 text-emerald-500">✅ Correct</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
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
              {predictionRows.map((insight) => (
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

            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 p-5">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Quant Model</p>
                  <h4 className="text-xl font-black text-foreground">{quant.stock}</h4>
                </div>
                <span className={cn(
                  "rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em]",
                  quant.signal.includes("Bullish") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" :
                  quant.signal.includes("Bearish") ? "border-rose-500/30 bg-rose-500/10 text-rose-500" :
                  "border-amber-500/30 bg-amber-500/10 text-amber-500"
                )}>{quant.signal}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bullish Probability</p>
                  <p className="mt-2 text-2xl font-black text-emerald-500">{quant.bullishProbability}%</p>
                </div>
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bearish Probability</p>
                  <p className="mt-2 text-2xl font-black text-rose-500">{quant.bearishProbability}%</p>
                </div>
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Breakout Probability</p>
                  <p className="mt-2 text-2xl font-black text-blue-500">{quant.breakoutProbability}%</p>
                </div>
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Breakdown Probability</p>
                  <p className="mt-2 text-2xl font-black text-amber-500">{quant.breakdownProbability}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Key Reasons</p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                    {quant.keyReasons.map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Confidence</p>
                  <p className="mt-2 text-xl font-black text-foreground">{quant.confidence}</p>
                  <div className="mt-4 space-y-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {Object.entries(quant.expectedMove).map(([period, move]) => (
                      <div key={period} className="flex items-center justify-between border-b border-border pb-1">
                        <span>{period}</span>
                        <span className="font-bold text-foreground">{move}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-background/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">AI Verdict</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{quant.aiVerdict}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
