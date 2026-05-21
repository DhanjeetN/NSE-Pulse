import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Shield, Lock, Eye, FileText, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - NSE Pulse",
  description: "Read the Privacy Policy of NSE Pulse to learn how we manage data collection, cookies, and Google AdSense integration on our real-time momentum dashboard.",
  keywords: ["Privacy Policy", "NSE Pulse", "data privacy", "cookies", "AdSense privacy", "market dashboard"],
};

export default function PrivacyPolicy() {
  const lastUpdated = "May 21, 2026";

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Top Banner Advertisement */}
      <div className="container mx-auto px-6 pt-6">
        <AdBanner format="horizontal" slot="9988776655" label="Advertisement" />
      </div>

      <div className="container mx-auto px-6 py-12 flex-grow max-w-4xl">
        {/* Header Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="inline-flex h-12 w-12 rounded-xl bg-blue-500/10 items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
            <Shield className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Last Updated: {lastUpdated} • NSE Pulse Compliance
          </p>
        </div>

        {/* Content Card */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-8 md:p-10 space-y-8 shadow-sm">
          {/* Section 1: Introduction */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Globe className="h-4.5 w-4.5 text-blue-500" />
              1. Introduction & Consent
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              At <strong>NSE Pulse</strong>, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by NSE Pulse and how we use it.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us. By using our website, you hereby consent to our Privacy Policy and agree to its terms.
            </p>
          </div>

          {/* Section 2: Log Files */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <FileText className="h-4.5 w-4.5 text-blue-500" />
              2. Log Files
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              NSE Pulse follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
            </p>
          </div>

          {/* Inline Ad Unit - Mid Page */}
          <div className="py-4">
            <AdBanner format="rectangle" slot="8877665544" label="Sponsored Link" />
          </div>

          {/* Section 3: Cookies and Web Beacons */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Eye className="h-4.5 w-4.5 text-blue-500" />
              3. Cookies and Web Beacons
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Like any other website, NSE Pulse uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Specifically, we store local settings such as dark/light mode preferences and an anonymous visitor identifier in your browser's local storage to enable the live viewer counter. No personally identifiable financial info or trading details are ever recorded or collected.
            </p>
          </div>

          {/* Section 4: Google DoubleClick DART Cookie */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Lock className="h-4.5 w-4.5 text-blue-500" />
              4. Google DoubleClick DART Cookie & AdSense
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL &ndash;{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                https://policies.google.com/technologies/ads
              </a>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Some of our advertisers on our site may use cookies and web beacons. Our advertising partners include <strong>Google AdSense</strong>. Each of our advertising partners has their own Privacy Policy for their policies on user data.
            </p>
          </div>

          {/* Section 5: Third-Party Privacy Policies */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Shield className="h-4.5 w-4.5 text-blue-500" />
              5. Third-Party Privacy Policies
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              NSE Pulse's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.
            </p>
          </div>

          {/* Section 6: CCPA & GDPR */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Shield className="h-4.5 w-4.5 text-blue-500" />
              6. GDPR & CCPA Data Protection Rights
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We want to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
              <li><strong>The right to access:</strong> You have the right to request copies of your personal data. (Note: We do not store any personal data).</li>
              <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
              <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
              <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data.</li>
              <li><strong>The right to object to processing:</strong> You have the right to object to our processing of your personal data.</li>
            </ul>
          </div>

          {/* Section 7: Children's Information */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              <Shield className="h-4.5 w-4.5 text-blue-500" />
              7. Children's Information
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              NSE Pulse does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Ad Unit */}
      <div className="container mx-auto px-6 pb-6">
        <AdBanner format="horizontal" slot="7766554433" label="Advertisement" />
      </div>

      <Footer />
    </main>
  );
}
