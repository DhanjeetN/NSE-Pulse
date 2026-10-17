import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartResult {
  meta?: {
    symbol?: string;
    regularMarketTime?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
  error?: { description?: string } | null;
}

const SYMBOL_PATTERN = /^(?:\^NSEI|[A-Z0-9&.-]+\.NS)$/;
const MAX_SYMBOLS = 20;
const MAX_CONCURRENT_REQUESTS = 5;

function normalizeSymbol(symbol: string) {
  return symbol === "^NSEI" ? "^NSEI" : symbol.endsWith(".NS") ? symbol : `${symbol}.NS`;
}

async function fetchChart(symbol: string): Promise<{ candles: Candle[]; quoteTime: number | null }> {
  const yahooSymbol = normalizeSymbol(symbol);
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`,
  );
  url.searchParams.set("range", "5d");
  url.searchParams.set("interval", "5m");
  url.searchParams.set("includePrePost", "false");

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Yahoo chart request returned HTTP ${response.status}.`);
  }

  const payload = await response.json() as { chart?: { result?: ChartResult[]; error?: { description?: string } } };
  const result = payload.chart?.result?.[0];
  if (!response.ok || payload.chart?.error || result?.error) {
    throw new Error(payload.chart?.error?.description ?? result?.error?.description ?? "Yahoo returned no chart data.");
  }

  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp ?? [];
  if (!quote || !timestamps.length) {
    throw new Error("Yahoo returned no intraday candles.");
  }

  const candles = timestamps.flatMap((timestamp, index) => {
    const open = quote.open?.[index];
    const high = quote.high?.[index];
    const low = quote.low?.[index];
    const close = quote.close?.[index];
    const volume = quote.volume?.[index];
    if ([open, high, low, close].some((value) => value == null || !Number.isFinite(value))) return [];

    return [{
      timestamp,
      open: open as number,
      high: high as number,
      low: low as number,
      close: close as number,
      volume: Number.isFinite(volume) ? volume as number : 0,
    }];
  });

  return {
    candles,
    quoteTime: Number.isFinite(result?.meta?.regularMarketTime)
      ? result?.meta?.regularMarketTime ?? null
      : null,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = Array.from(new Set(symbolsParam.split(",").map((symbol) => symbol.trim()).filter(Boolean)));
  if (!symbols.length || symbols.length > MAX_SYMBOLS || symbols.some((symbol) => !SYMBOL_PATTERN.test(symbol))) {
    return NextResponse.json(
      { error: `Provide between 1 and ${MAX_SYMBOLS} valid NSE symbols.` },
      { status: 400 },
    );
  }

  const results = await mapWithConcurrency(symbols, MAX_CONCURRENT_REQUESTS, async (symbol) => {
    try {
      return {
        symbol,
        status: "fulfilled" as const,
        ...(await fetchChart(symbol)),
      };
    } catch (error) {
      return {
        symbol,
        status: "rejected" as const,
        error: error instanceof Error ? error.message : "Failed to fetch Yahoo chart data.",
      };
    }
  });

  return NextResponse.json(
    {
      source: "Yahoo Finance chart API (unofficial; availability and latency are not guaranteed)",
      interval: "5m",
      fetchedAt: new Date().toISOString(),
      results,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
