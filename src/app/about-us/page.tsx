import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Users, Target, Activity, Flame, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - NSE Pulse",
  description: "Learn more about NSE Pulse, our mission, our tools, and how we provide institutional-grade stock market analytics for retail traders using public NSE data.",
  keywords: ["About Us", "NSE Pulse", "stock market analytics", "OI analysis tool", "intraday momentum tool", "about the team"],
};

export default function AboutUs() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Top Banner Advertisement */}
      <div className="container mx-auto px-6 pt-6">
        <AdBanner format="horizontal" slot="1144770022" label="Advertisement" />
      </div>

      <div className="container mx-auto px-6 py-12 flex-grow max-w-4xl">
        {/* Header Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-500/10 items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
            <Users className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            About NSE Pulse
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Demystifying Market Momentum & Open Interest
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          {/* Main Card */}
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-8 md:p-10 space-y-6 shadow-sm">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" /> Our Mission
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                At <strong>NSE Pulse</strong>, our mission is to level the playing field for retail traders in the Indian stock market. Institutional trading desks use complex, highly expensive software systems to track live order flows, Open Interest (OI) spurts, and momentum build-ups. Retail traders are often left with delayed charts or slow, cluttered interfaces.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We designed NSE Pulse to be a lightweight, ultra-fast, and premium analytical dashboard. We transform raw, publicly available National Stock Exchange (NSE) market data into actionable visual components, helping retail traders monitor momentum and option contract behavior efficiently.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500 animate-pulse" /> What We Provide
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                NSE Pulse features three key core components that help analyze market trends dynamically:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="p-4 rounded-xl border border-border bg-background/50">
                  <h3 className="text-xs font-bold text-foreground mb-1">Top Gainers & Losers</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Real-time rankings of equity leaders and laggards, displaying percentage change and live prices to capture instant momentum.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background/50">
                  <h3 className="text-xs font-bold text-foreground mb-1">OI Spurts Analyzer</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Tracks Open Interest contracts (Underlyings and Options) to detect where fresh capital is building up (long, short, or covering).
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-background/50">
                  <h3 className="text-xs font-bold text-foreground mb-1">Live Viewer Pulse</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    An anonymous live connection counter that allows traders to see how many fellow participants are monitoring the metrics with them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inline Ad Unit - Mid Page */}
          <div className="py-2">
            <AdBanner format="horizontal" slot="2255880033" label="Sponsored Announcement" />
          </div>

          {/* Additional Details Section */}
          <div className="w-full">
            {/* SEBI Compliance Card */}
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2 text-rose-500">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-500 animate-pulse" /> Educational Initiative
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We believe financial literacy is key. Trading financial instruments is highly technical and risk-prone. 
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                NSE Pulse does not claim to make traders profitable, nor does it provide recommendations. We present mathematical calculations of publicly published prices and open interest in a clean visual layout. We encourage all users to understand derivatives mechanics and consult certified financial advisors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ad Unit */}
      <div className="container mx-auto px-6 pb-6">
        <AdBanner format="horizontal" slot="3366991144" label="Advertisement" />
      </div>

      <Footer />
    </main>
  );
}
