import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Scale, FileText, Ban, HelpCircle, HardDrive } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions - NSE Pulse",
  description: "Review the Terms and Conditions of NSE Pulse governing the usage of our real-time NSE momentum and OI analytics dashboard.",
  keywords: ["Terms & Conditions", "NSE Pulse", "user agreement", "legal terms", "website usage rules", "data terms"],
};

export default function TermsAndConditions() {
  const lastUpdated = "May 21, 2026";

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Top Banner Advertisement */}
      <div className="container mx-auto px-6 pt-6">
        <AdBanner format="horizontal" slot="1133557799" label="Advertisement" />
      </div>

      <div className="container mx-auto px-6 py-12 flex-grow max-w-4xl">
        {/* Header Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-500/10 items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
            <Scale className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Terms & Conditions
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Last Updated: {lastUpdated} • Usage Agreement
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-8 md:p-10 space-y-8 shadow-sm">
          {/* Section 1: Agreement to Terms */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <FileText className="h-4.5 w-4.5 text-blue-500" />
              1. Acceptance of Terms
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Welcome to <strong>NSE Pulse</strong>. These Terms and Conditions govern your access to and use of our website and its services, including our real-time stock momentum visualizations, Open Interest (OI) analysis tables, and educational reports. 
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              By accessing or using NSE Pulse, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </div>

          {/* Section 2: License & Permitted Use */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <HardDrive className="h-4.5 w-4.5 text-blue-500" />
              2. Use License
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permission is granted to temporarily access the dashboard materials on NSE Pulse for personal, non-commercial, and informational viewing only. Under this license, you may not:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
              <li>Modify, copy, or distribute the analytical data screens or source code.</li>
              <li>Use the materials for any commercial purpose or public display (commercial or non-commercial).</li>
              <li>Attempt to decompile or reverse engineer any software component contained on the website.</li>
              <li>Remove any copyright or other proprietary notations from the materials.</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </div>

          {/* Inline Ad Unit - Mid Page */}
          <div className="py-4">
            <AdBanner format="rectangle" slot="2244668800" label="Sponsored Link" />
          </div>

          {/* Section 3: Prohibited Activities */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Ban className="h-4.5 w-4.5 text-rose-500" />
              3. Prohibited Activities & Anti-Scraping
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You agree not to engage in any activity that interferes with or disrupts the operation of NSE Pulse. Specifically, you are prohibited from:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
              <li>Using automated systems (including crawlers, scrapers, bots, or extraction scripts) to scrape data, prices, or OI metrics from this website without explicit written permission.</li>
              <li>Attempting to bypass security systems, rate limits, or network bandwidth protections.</li>
              <li>Conducting denial-of-service (DDoS) attacks or introducing malicious viruses, worms, or trojans.</li>
              <li>Framing or embedding NSE Pulse within other platforms to spoof, copy, or redistribute its service.</li>
            </ul>
          </div>

          {/* Section 4: Accuracy of Materials */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <HelpCircle className="h-4.5 w-4.5 text-blue-500" />
              4. Accuracy of Materials & Service Modifications
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The materials appearing on NSE Pulse could include technical, typographical, or photographic errors. NSE Pulse does not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on our website at any time without notice. However, we do not make any commitment to update the materials.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or terminate the operation of this platform or any individual feature without prior notice.
            </p>
          </div>

          {/* Section 5: Governing Law */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Scale className="h-4.5 w-4.5 text-blue-500" />
              5. Governing Law
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These Terms and Conditions are governed by and construed in accordance with the laws of India. Any dispute, claim, or controversy arising out of or relating to these terms or your usage of NSE Pulse shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Ad Unit */}
      <div className="container mx-auto px-6 pb-6">
        <AdBanner format="horizontal" slot="3355779911" label="Advertisement" />
      </div>

      <Footer />
    </main>
  );
}
