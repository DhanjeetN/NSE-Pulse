"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { OIFlowStudio } from "@/components/OIFlowStudio";
import { GlassCard } from "@/components/ui/GlassCard";
import { StockTable } from "@/components/StockTable";
import { ScannerBoard } from "@/components/ScannerBoard";
import { useMarketStore } from "@/store/useStore";
import { TrendingUp, TrendingDown, AlertCircle, Activity, Waves } from "lucide-react";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";


export default function Dashboard() {
  const { gainers, losers, oiUnderlyings, oiContracts, fetchData, isLoading, error, lastUpdated } = useMarketStore();
  const [activeTab, setActiveTab] = useState<"market" | "oi-flow">("market");

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
        <nav aria-label="Dashboard views" className="mb-6 flex w-fit gap-1 rounded-xl border border-border/80 bg-card/70 p-1 shadow-lg shadow-black/5 backdrop-blur-xl">
          <button
            type="button"
            aria-current={activeTab === "market" ? "page" : undefined}
            onClick={() => setActiveTab("market")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors",
              activeTab === "market" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/25" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Activity className="h-4 w-4" />
            Market
          </button>
          <button
            type="button"
            aria-current={activeTab === "oi-flow" ? "page" : undefined}
            onClick={() => setActiveTab("oi-flow")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors",
              activeTab === "oi-flow" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/25" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Waves className="h-4 w-4" />
            OI Flow
          </button>
        </nav>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Error: {error}. Please check if the market is open or try manual refresh.</p>
          </div>
        )}

        {activeTab === "market" ? (
          <>
            <SummaryCards />
            <ScannerBoard />

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
          </>
        ) : (
          <OIFlowStudio
            underlyings={oiUnderlyings}
            contracts={oiContracts}
            updatedAt={lastUpdated}
          />
        )}

        {/* Mid Page Ad Unit - In-Feed Banner */}
        {/* <div className="mb-8">
          <AdBanner format="horizontal" slot="0987654321" label="Advertisement - In-Feed Responsive" />
        </div> */}

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
