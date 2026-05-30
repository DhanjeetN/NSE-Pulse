"use client";

import { useEffect, useState } from "react";

const VISITOR_ID_KEY = "nse_pulse_visitor_id";
const HEARTBEAT_INTERVAL_MS = 30_000;

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "visitor_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
}

export function useLiveViewers() {
  const [viewersCount, setViewersCount] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    const sendHeartbeat = async (visitorId: string) => {
      try {
        const response = await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: visitorId }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof data?.error === "string" ? data.error : `Heartbeat failed (${response.status})`
          );
        }

        if (!isMounted) return;

        const count = Number(data.viewersCount);
        setViewersCount(Number.isFinite(count) ? count : 0);
        setIsLive(true);
      } catch (err) {
        console.warn("Live viewer heartbeat failed:", err);
        if (isMounted) {
          setIsLive(false);
        }
      }
    };

    sendHeartbeat(id);

    heartbeatInterval = setInterval(() => {
      sendHeartbeat(id);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, []);

  return {
    viewersCount,
    isLive,
  };
}
