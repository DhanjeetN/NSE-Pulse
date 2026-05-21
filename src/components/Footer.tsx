"use client";

import Link from "next/link";
import { Zap, ShieldCheck, Mail, BookOpen } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-card/40 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
                <Zap className="h-5 w-5 text-white fill-current" />
              </div>
              <span className="text-lg font-black tracking-tighter text-foreground">
                NSE <span className="text-blue-500">PULSE</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Real-time NSE momentum and Open Interest (OI) analytics dashboard. 
              Get institutional-grade market data visualization and intraday trading insights.
            </p>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Education Only
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Sourced from NSE Public Data
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Dashboard Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Momentum Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#top-gainers" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Top Gainers
                </Link>
              </li>
              <li>
                <Link href="/#top-losers" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Top Losers
                </Link>
              </li>
              <li>
                <Link href="/#oi-analyzer" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  OI Spurts Analyzer
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Information & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="text-xs text-muted-foreground hover:text-blue-500 transition-colors font-medium">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Banner */}
        <div className="border-t border-border/40 pt-8 pb-6 text-left">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-[10px] leading-relaxed text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Regulatory & F&O Risk Disclosure:</strong> 
              According to a SEBI study, 9 out of 10 individual traders in the equity Futures & Options (F&O) segment incurred losses. 
              On average, loss makers registered net trading losses close to ₹50,000. 
              Over and above the net trading losses incurred, loss makers expended an additional 28% of net trading losses as transaction costs. 
              Those making net profits incurred between 15% to 50% of their profits as transaction cost.
            </p>
            <p>
              <strong className="text-foreground">SEBI Registration Warning:</strong> 
              NSE Pulse is not a registered investment advisor, research analyst, or portfolio manager with SEBI (Securities and Exchange Board of India). 
              All indicators, momentum scorings, and OI metrics generated by this dashboard are purely for informational and educational purposes. 
              Nothing on this platform should be construed as investment, financial, tax, or legal advice. 
              Trading derivatives involves high risk. Please consult a SEBI-registered financial advisor before placing trades.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-6 text-center sm:text-left gap-4">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Institutional Grade Momentum Analysis • NSE Pulse v1.0
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              Powered by DN
            </span>
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              &copy; {currentYear} NSE Pulse. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
