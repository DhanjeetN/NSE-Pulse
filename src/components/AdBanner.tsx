"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  slot?: string;
  client?: string;
  style?: React.CSSProperties;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  label?: string;
}

export function AdBanner({
  slot,
  client = "ca-pub-placeholder", // Replace with real publisher ID if available
  style,
  format = "auto",
  responsive = true,
  className,
  label = "Sponsored Advertisement",
}: AdBannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Only load if not placeholder
    if (client && client !== "ca-pub-placeholder" && slot) {
      try {
        // Load the AdSense script if it hasn't been loaded yet
        if (!(window as any).adsbygoogle) {
          const script = document.createElement("script");
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
          script.async = true;
          script.crossOrigin = "anonymous";
          document.head.appendChild(script);
        }

        // Push the ad
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setIsLoaded(true);
      } catch (err) {
        console.error("AdSense placement error:", err);
        setAdError(true);
      }
    }
  }, [client, slot]);

  // Determine aspect ratio class based on format
  const getAspectRatioClass = () => {
    switch (format) {
      case "horizontal":
        return "min-h-[90px] md:min-h-[100px] w-full max-h-[120px]";
      case "vertical":
        return "min-h-[600px] w-[160px] md:w-[300px]";
      case "rectangle":
        return "min-h-[250px] w-full max-w-[336px] max-h-[280px] mx-auto";
      default:
        return "min-h-[90px] w-full";
    }
  };

  const showPlaceholder = !slot || client === "ca-pub-placeholder" || adError;

  if (showPlaceholder) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-dashed border-border/60 bg-card/30 backdrop-blur-sm p-4 flex flex-col items-center justify-center transition-all duration-300 hover:border-border/80 group",
          getAspectRatioClass(),
          className
        )}
        style={style}
      >
        {/* Techy background grids and glowing lights */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-500" />
        
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
          {label}
        </span>
        
        <div className="border border-border/40 px-3 py-1.5 rounded-lg bg-background/50 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold font-mono text-foreground/50 tracking-wider">
            ADSENSE UNIT • {format.toUpperCase()}
          </span>
        </div>
        
        <span className="text-[9px] text-muted-foreground/40 mt-1 font-mono">
          {format === "horizontal" ? "Responsive Banner (728x90 / 320x100)" : 
           format === "vertical" ? "Responsive SkyScraper (300x600)" : 
           format === "rectangle" ? "Medium Rectangle (300x250)" : "Responsive Ad Block"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full text-center my-4 overflow-hidden", className)}>
      <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-1.5">
        {label}
      </div>
      <ins
        className="adsbygoogle"
        style={style || { display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
