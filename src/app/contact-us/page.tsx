import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { ContactForm } from "@/components/ContactForm";
import { Mail, Clock, ShieldCheck, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us - NSE Pulse",
  description: "Get in touch with the NSE Pulse support team for feedback, advertising opportunities, bug reporting, or general inquiries.",
  keywords: ["Contact Us", "NSE Pulse", "support email", "feedback form", "advertise with us", "customer service"],
};

export default function ContactUs() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Top Banner Advertisement */}
      <div className="container mx-auto px-6 pt-6">
        <AdBanner format="horizontal" slot="1155881144" label="Advertisement" />
      </div>

      <div className="container mx-auto px-6 py-12 flex-grow max-w-5xl">
        {/* Header Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-500/10 items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
            <Mail className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Contact Us
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Have Feedback or Inquiries? We'd Love to Hear From You.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Info Side */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
                <HelpCircle className="h-4.5 w-4.5 text-blue-500" /> Support Channels
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Email Support</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">support@nsepulse.com</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">For partnerships, feedback, or API integrations.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Response Window</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">24 - 48 Hours</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">We respond to email queries Monday through Friday.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 text-rose-500 border-b border-border/60 pb-2">
                <ShieldCheck className="h-4.5 w-4.5 text-rose-500" /> Compliance Advisory
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Please note that <strong>NSE Pulse is strictly an educational tool</strong>. We:
              </p>
              <ul className="list-disc pl-5 text-[10px] text-muted-foreground space-y-1.5">
                <li>Do <strong>NOT</strong> run any Telegram groups, WhatsApp channels, or premium tip groups.</li>
                <li>Do <strong>NOT</strong> offer paid stock recommendations, advisory calls, or wealth management packages.</li>
                <li>Will never ask for money or account details to provide trading signals.</li>
              </ul>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                Beware of imposters using the NSE Pulse name. Report any suspicious groups using our email.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card/60 backdrop-blur-md p-8 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-6">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>

      {/* Bottom Ad Unit */}
      <div className="container mx-auto px-6 pb-6">
        <AdBanner format="horizontal" slot="3377112255" label="Advertisement" />
      </div>

      <Footer />
    </main>
  );
}
