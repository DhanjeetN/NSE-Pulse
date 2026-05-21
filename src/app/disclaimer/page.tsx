import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { AlertTriangle, Info, ShieldAlert, Award, TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Disclaimer - NSE Pulse",
  description: "Read the financial and legal disclaimers for NSE Pulse. We are not SEBI registered, and our platform is strictly for informational and educational purposes.",
  keywords: ["Disclaimer", "NSE Pulse", "SEBI disclaimer", "financial warning", "educational stock market", "F&O risk"],
};

export default function Disclaimer() {
  const lastUpdated = "May 21, 2026";

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Top Banner Advertisement */}
      <div className="container mx-auto px-6 pt-6">
        <AdBanner format="horizontal" slot="1122334455" label="Advertisement" />
      </div>

      <div className="container mx-auto px-6 py-12 flex-grow max-w-4xl">
        {/* Header Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
          <div className="inline-flex h-12 w-12 rounded-xl bg-rose-500/10 items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Legal & Financial Disclaimer
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Last Updated: {lastUpdated} • SEBI Non-Registration Notice
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-8 md:p-10 space-y-8 shadow-sm">
          {/* Section 1: Non SEBI Registration */}
          <div className="space-y-3 p-5 rounded-xl border border-rose-500/20 bg-rose-500/5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 pb-1 text-rose-500 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              Not SEBI Registered
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong>NSE Pulse</strong> and its creators, operators, and developers are <strong>NOT</strong> registered with the Securities and Exchange Board of India (SEBI) as investment advisors, research analysts, portfolio managers, or brokers. 
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We do not possess licenses to provide financial planning, stock suggestions, recommendations, or customized portfolio management services. All analyses, indicators, scoring, and data displays presented on this platform are for general informational purposes only.
            </p>
          </div>

          {/* Section 2: No Financial Advice */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Info className="h-4.5 w-4.5 text-blue-500" />
              1. Educational & Informational Purpose Only
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All information, content, tools, algorithms, and analytical visualizations on NSE Pulse are designed solely for educational and research purposes. Nothing on this website constitutes, or should be construed as, financial advice, an investment recommendation, an offer or solicitation to buy/sell/hold securities, or a guarantee of any investment returns.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Traders and investors should conduct their own independent research, verify facts, and consult with a qualified, SEBI-registered financial adviser prior to making any actual financial and market investments.
            </p>
          </div>

          {/* Inline Ad Unit - Mid Page */}
          <div className="py-4">
            <AdBanner format="rectangle" slot="2233445566" label="Sponsored Link" />
          </div>

          {/* Section 3: F&O Risk Warning */}
          <div className="space-y-3 p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 pb-1 text-amber-500 dark:text-amber-400">
              <TrendingDown className="h-5 w-5 shrink-0" />
              High Risk F&O Trading Warning
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Derivatives (Futures and Options) trading carries an extremely high level of risk and may not be suitable for all investors. According to a formal study by SEBI:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
              <li><strong>9 out of 10</strong> individual traders in the equity F&O segment incurred net losses.</li>
              <li>On average, loss makers registered net trading losses close to <strong>₹50,000</strong>.</li>
              <li>Loss-making traders paid an additional <strong>28%</strong> of their net losses as transaction costs.</li>
            </ul>
            <p className="text-xs leading-relaxed text-muted-foreground mt-2">
              The metrics displayed on NSE Pulse, including Open Interest (OI) spurts, long build-ups, short coverings, and price-OI trend analysis, are historical and analytical calculations. They do not predict future market directions or guarantee profitable outcomes.
            </p>
          </div>

          {/* Section 4: Data Accuracy */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Award className="h-4.5 w-4.5 text-blue-500" />
              2. Data Accuracy & Sourcing
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              NSE Pulse retrieves raw financial statistics using publicly available data feeds from the National Stock Exchange of India (NSE). While we strive to ensure that the visualization is accurate and updated in real time during market hours, the data is provided "as is" and "as available". 
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We make no representations or warranties, express or implied, regarding the timeliness, completeness, accuracy, reliability, or availability of the stock prices, OI data, and calculations shown. Network delays, source feed interruptions, software glitches, and computing delays can happen. NSE Pulse will not be held responsible for any trading decisions or losses resulting from data errors or outages.
            </p>
          </div>

          {/* Section 5: Limitation of Liability */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <ShieldAlert className="h-4.5 w-4.5 text-blue-500" />
              3. Limitation of Liability
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under no circumstances shall NSE Pulse, its owners, operators, developers, or affiliates be liable to any user or third party for any direct, indirect, incidental, consequential, special, or exemplary damages, including but not limited to loss of profits, loss of trading capital, loss of data, or operational interruptions arising from the use or inability to use this platform.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You assume full responsibility for your actions, trades, and investments. By using NSE Pulse, you agree that you are using this platform at your own sole risk.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Ad Unit */}
      <div className="container mx-auto px-6 pb-6">
        <AdBanner format="horizontal" slot="3344556677" label="Advertisement" />
      </div>

      <Footer />
    </main>
  );
}
