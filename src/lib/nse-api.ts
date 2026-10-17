export interface StockData {
  symbol: string;
  identifier: string;
  open_price: number;
  high_price: number;
  low_price: number;
  ltp: number;
  prev_price: number;
  net_price: number;
  perChange: number;
  trade_quantity: number;
  turnover: number;
  lastUpdateTime: string;
  yearHigh: number;
  yearLow: number;
  perChange30d: number;
  perChange365d: number;
}

export interface CorporateAction {
  symbol: string;
  subject: string;
  exDate: string;
  recDate: string;
}

export interface FinancialEvent {
  symbol: string;
  company: string;
  purpose: string;
  bm_desc: string;
  date: string;
}

export interface OISpurtData {
  symbol: string;
  underlying?: string;
  expiryDate?: string;
  optionType?: string;
  strikePrice?: number;
  latestOI: number;
  prevOI: number;
  changeInOI: number;
  pChangeInOI?: number; // Contracts only
  avgInOI?: number; // Underlyings only (acts as % change in OI)
  volume: number;
  ltp?: number; // Contracts only
  underlyingValue?: number; // Both
  prevClose?: number; // Contracts only
  pChange?: number; // Contracts only
}

export interface IndexSnapshot {
  name: string;
  symbol: string;
  currentPrice: number;
  percentChange: number;
  change: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  lastUpdated: string;
}

export interface IntradayCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IntradayChart {
  candles: IntradayCandle[];
  quoteTime: number | null;
  fetchedAt: string;
}

async function parseNseResponse(res: Response, label: string) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(`Failed to fetch ${label}: ${detail}`);
  }
  return data;
}

async function fetchNseJson(url: string, label: string) {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  return parseNseResponse(res, label);
}

function getRows(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data)) return data;
  const candidates = [
    (data.FOSec as Record<string, unknown> | undefined)?.data,
    (data.NIFTY as Record<string, unknown> | undefined)?.data,
    (data.NIFTY50 as Record<string, unknown> | undefined)?.data,
    data.data,
  ];
  return (candidates.find(Array.isArray) as unknown[] | undefined) ?? [];
}

function normalizeStock(value: unknown): StockData | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const symbol = String(row.symbol ?? row.identifier ?? "").trim();
  if (!symbol) return null;

  const number = (...keys: string[]) => {
    for (const key of keys) {
      const parsed = Number(row[key]);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  };

  return {
    symbol,
    identifier: String(row.identifier ?? symbol),
    open_price: number("open_price", "openPrice", "open"),
    high_price: number("high_price", "dayHigh", "high"),
    low_price: number("low_price", "dayLow", "low"),
    ltp: number("ltp", "lastPrice", "lastprice", "last", "currentPrice"),
    prev_price: number("prev_price", "previousClose", "prevClose", "close"),
    net_price: number("net_price", "change", "netPrice", "netChange"),
    perChange: number("perChange", "pChange", "percentChange", "changePercent"),
    trade_quantity: number("trade_quantity", "totalTradedVolume", "totalTradedQty", "volume"),
    turnover: number("turnover", "totalTradedValue"),
    lastUpdateTime: String(row.lastUpdateTime ?? row.lastUpdated ?? row.timestamp ?? row.time ?? ""),
    yearHigh: number("yearHigh", "yearlyHigh"),
    yearLow: number("yearLow", "yearlyLow"),
    perChange30d: number("perChange30d", "perChange30D"),
    perChange365d: number("perChange365d", "perChange365D"),
  };
}

async function fetchMoverList(index: "gainers" | "loosers", label: string): Promise<StockData[]> {
  const res = await fetch(`/api/nse/live-analysis-variations?index=${index}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await parseNseResponse(res, label);
  if (!data || typeof data !== "object") return [];
  return getRows(data as Record<string, unknown>)
    .map(normalizeStock)
    .filter((stock): stock is StockData => stock !== null);
}

export const fetchIntradayCharts = async (symbols: string[]): Promise<{
  charts: Record<string, IntradayChart>;
  errors: string[];
}> => {
  if (!symbols.length) return { charts: {}, errors: [] };
  const params = new URLSearchParams({ symbols: symbols.join(",") });
  const res = await fetch(`/api/market/intraday?${params.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = await parseNseResponse(res, "intraday charts");
  const charts: Record<string, IntradayChart> = {};
  const failures: string[] = [];

  for (const result of data.results ?? []) {
    if (result.status === "fulfilled") {
      charts[result.symbol] = {
        candles: result.candles,
        quoteTime: result.quoteTime,
        fetchedAt: data.fetchedAt,
      };
    } else {
      failures.push(`${result.symbol}: ${result.error}`);
    }
  }

  if (failures.length && Object.keys(charts).length === 0) {
    throw new Error(`No intraday charts could be loaded. ${failures.join("; ")}`);
  }

  return { charts, errors: failures };
};

export const fetchGainers = async (): Promise<StockData[]> => {
  return fetchMoverList("gainers", "gainers");
};

export const fetchLosers = async (): Promise<StockData[]> => {
  return fetchMoverList("loosers", "losers");
};

export const fetchMarketIndices = async (): Promise<IndexSnapshot[]> => {
  const data = await fetchNseJson("/api/nse/allIndices", "market indices");
  const payload = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const watchedIndices = new Set(["NIFTY 50", "NIFTY BANK", "NIFTY IT"]);

  return payload.flatMap((value: unknown) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const name = String(item.index ?? item.name ?? "").trim().toUpperCase();
    if (!watchedIndices.has(name)) return [];

    const number = (...keys: string[]) => {
      for (const key of keys) {
        const parsed = Number(item[key]);
        if (Number.isFinite(parsed)) return parsed;
      }
      return 0;
    };
    const currentPrice = number("last", "lastPrice", "lastprice", "LTP", "currentPrice");
    if (currentPrice <= 0) return [];

    return [{
      name: String(item.index ?? item.name),
      symbol: String(item.symbol ?? item.index ?? item.name),
      currentPrice,
      percentChange: number("percentChange", "pChange", "perChange"),
      change: number("variation", "change", "netChange"),
      open: number("open"),
      high: number("high", "dayHigh"),
      low: number("low", "dayLow"),
      previousClose: number("previousClose", "prevClose"),
      dayHigh: number("high", "dayHigh"),
      dayLow: number("low", "dayLow"),
      lastUpdated: String(item.timestamp ?? item.lastUpdated ?? item.time ?? ""),
    } satisfies IndexSnapshot];
  });
};

export const fetchOISpurtsUnderlyings = async (): Promise<OISpurtData[]> => {
  const res = await fetch("/api/nse/live-analysis-oi-spurts-underlyings", { cache: "no-store" });
  const data = await parseNseResponse(res, "OI spurts underlyings");
  return data.data || [];
};

export const fetchOISpurtsContracts = async (): Promise<OISpurtData[]> => {
  const res = await fetch("/api/nse/live-analysis-oi-spurts-contracts", { cache: "no-store" });
  const data = await parseNseResponse(res, "OI spurts contracts");
  
  if (!data?.data) return [];
  
  const allContracts: OISpurtData[] = [];
  data.data.forEach((group: Record<string, unknown>) => {
    const key = Object.keys(group)[0];
    if (!key) return;

    const value = group[key];
    if (Array.isArray(value)) {
      allContracts.push(...(value as OISpurtData[]));
    }
  });
  
  return allContracts;
};

export const fetchCorporateActions = async (): Promise<CorporateAction[]> => {
  const res = await fetch("/api/nse/corporates-corporateActions?index=equities", { cache: "no-store" });
  const data = await parseNseResponse(res, "corporate actions");
  return data || [];
};

export const fetchFinancialEvents = async (): Promise<FinancialEvent[]> => {
  const res = await fetch("/api/nse/event-calendar", { cache: "no-store" });
  const data = await parseNseResponse(res, "financial events");
  return data || [];
};
