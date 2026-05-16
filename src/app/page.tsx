"use client";

import { useEffect } from "react";
import { Header } from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { GlassCard } from "@/components/ui/GlassCard";
import { StockTable } from "@/components/StockTable";
import { OIAnalyzer } from "@/components/OIAnalyzer";
import { useMarketStore } from "@/store/useStore";
import { TrendingUp, TrendingDown, Rocket, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { gainers, losers, oiUnderlyings, oiContracts, fetchData, isLoading, error } = useMarketStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
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
      </div>

      <footer className="container mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-foreground/40 text-xs font-medium uppercase tracking-[0.2em]">
          Institutional Grade Momentum Analysis • NSE Pulse v1.0
        </p>
        <p className="text-foreground/30 text-[10px] font-bold mt-2 tracking-wider">
          Powered by DN
        </p>
      </footer>
    </main>
  );
}
