"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// LocalStorage key for anonymous visitor ID
const VISITOR_ID_KEY = "nse_pulse_visitor_id";

// Helper to generate a simple unique visitor ID if crypto.randomUUID isn't available
function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "visitor_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
}

export function useLiveViewers() {
  // Start with 1 since the current user themselves is always active
  const [viewersCount, setViewersCount] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;
    let heartbeatInterval: NodeJS.Timeout | undefined = undefined;
    let simulationInterval: NodeJS.Timeout | undefined = undefined;
    let usingSimulation = !isSupabaseConfigured;

    const startSimulation = () => {
      if (simulationInterval) clearInterval(simulationInterval);
      
      const startCount = Math.floor(Math.random() * (15 - 8 + 1)) + 8; // 8 to 15
      setViewersCount(startCount);

      simulationInterval = setInterval(() => {
        if (!isMounted) return;
        setViewersCount((prev) => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
          const next = prev + change;
          return Math.max(3, Math.min(next, 25));
        });
      }, 5000);
    };

    // 1. Initialize Visitor ID from localStorage (client-side only)
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    // Fallback simulation if Supabase is not configured
    if (usingSimulation) {
      console.warn(
        "⚠️ Supabase is not fully configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable the live viewer counter. Falling back to simulated count."
      );
      startSimulation();
      return () => {
        isMounted = false;
        clearInterval(simulationInterval);
      };
    }

    // Real active viewer tracking via Supabase
    const updateHeartbeatAndGetCount = async (vid: string) => {
      try {
        const nowStr = new Date().toISOString();

        // A. Upsert visitor heartbeat (Insert or Update if ID exists)
        const { error: upsertError } = await supabase
          .from("active_users")
          .upsert({ id: vid, last_seen_at: nowStr });

        if (upsertError) {
          // If the table doesn't exist, we fall back to simulation gracefully to prevent console spamming
          const isTableMissing = 
            upsertError.code === "PGRST205" || 
            upsertError.message?.toLowerCase().includes("active_users") ||
            upsertError.message?.toLowerCase().includes("relation") ||
            ((upsertError as unknown) as { status?: number }).status === 404;

          if (isTableMissing) {
            console.warn(
              "⚠️ Supabase table 'active_users' was not found in the database.\n" +
              "Please execute the SQL commands inside 'supabase_schema.sql' in your Supabase SQL Editor to create this table.\n" +
              "Falling back to a simulated live viewer count to keep the application running smoothly."
            );
            usingSimulation = true;
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            startSimulation();
            return;
          }

          console.error("Error upserting heartbeat:", upsertError);
          return;
        }

        // B. Try fetching count via database RPC function (accurate & immune to client-side clock skew)
        // Note: RPC function also handles the self-cleaning (deletes rows older than 5 minutes)
        let finalCount = 1;
        let rpcSuccess = false;

        try {
          const { data: rpcCount, error: rpcError } = await supabase.rpc("get_active_users_count");
          if (!rpcError && rpcCount !== null) {
            finalCount = rpcCount;
            rpcSuccess = true;
          }
        } catch (rpcErr) {
          // RPC might not exist yet if database script hasn't run
          rpcSuccess = false;
        }

        // C. Fallback: If RPC is not available, execute client-side cleanup and select query
        if (!rpcSuccess) {
          // 1. Client-side self-cleanup
          const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();
          await supabase
            .from("active_users")
            .delete()
            .lt("last_seen_at", fiveMinutesAgo);

          // 2. Client-side fetch
          const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
          const { count, error: countError } = await supabase
            .from("active_users")
            .select("*", { count: "exact", head: true })
            .gt("last_seen_at", sixtySecondsAgo);

          if (countError) {
            console.error("Error fetching live count (fallback):", countError);
          } else if (count !== null) {
            finalCount = count;
          }
        }

        if (isMounted) {
          setViewersCount(finalCount || 1); // Minimum of 1 (self)
        }
      } catch (err) {
        console.error("Unexpected error in live viewer tracking:", err);
      }
    };

    // Run first heartbeat check immediately
    updateHeartbeatAndGetCount(id);

    // Heartbeat every 30 seconds
    heartbeatInterval = setInterval(() => {
      if (id && !usingSimulation) {
        updateHeartbeatAndGetCount(id);
      }
    }, 30000);

    return () => {
      isMounted = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, []);

  return {
    viewersCount,
    isConfigured: isSupabaseConfigured,
  };
}
