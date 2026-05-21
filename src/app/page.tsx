"use client";

import { useEffect } from "react";
import { Header } from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { GlassCard } from "@/components/ui/GlassCard";
import { StockTable } from "@/components/StockTable";
import { OIAnalyzer } from "@/components/OIAnalyzer";
import { useMarketStore } from "@/store/useStore";
import { TrendingUp, TrendingDown, Rocket, AlertCircle } from "lucide-react";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";


export default function Dashboard() {
  const { gainers, losers, oiUnderlyings, oiContracts, fetchData, isLoading, error } = useMarketStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 flex flex-col">
      <Header />

      {/* Header Ad Unit - Desktop Leaderboard / Mobile Banner */}
      {/* <div className="container mx-auto px-6 pt-6">
        <AdBanner format="horizontal" slot="1234567890" label="Advertisement - Header Leaderboard" />
      </div> */}

      <div className="container mx-auto px-6 py-8 flex-grow">
        <SummaryCards />

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Error: {error}. Please check if the market is open or try manual refresh.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <GlassCard
            title="Top Gainers"
            badge={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            className="h-full"
          >
            <StockTable data={gainers} type="gainer" isLoading={isLoading} />
          </GlassCard>

          <GlassCard
            title="Top Losers"
            badge={<TrendingDown className="h-4 w-4 text-rose-500" />}
            className="h-full"
          >
            <StockTable data={losers} type="loser" isLoading={isLoading} />
          </GlassCard>
        </div>

        {/* Mid Page Ad Unit - In-Feed Banner */}
        {/* <div className="mb-8">
          <AdBanner format="horizontal" slot="0987654321" label="Advertisement - In-Feed Responsive" />
        </div> */}

        <div className="grid grid-cols-1 gap-8">
          <GlassCard
            title="NSE OI Spurts Analyzer"
            badge={<Rocket className="h-4 w-4 text-amber-500" />}
            className="min-h-[600px]"
          >
            <OIAnalyzer
              underlyings={oiUnderlyings}
              contracts={oiContracts}
              isLoading={isLoading}
            />
          </GlassCard>
        </div>

        {/* Disclaimer Section */}
        <div className="mt-12 p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm hover:border-border/60 transition-all duration-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-1.5">
                Disclaimer
              </h4>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Disclaimer: NSE Pulse is an independent platform created for informational and educational purposes only. The data and insights shared here are sourced from publicly available NSE market information. This does not constitute financial advice, investment recommendations, or trading guidance. Users are solely responsible for their own investment decisions. NSE Pulse and its creators are not liable for any financial losses, risks, or damages arising from the use of this platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
