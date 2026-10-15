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
  high: number;
  low: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  lastUpdated: string;
}

async function parseNseResponse(res: Response, label: string) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new Error(`Failed to fetch ${label}: ${detail}`);
  }
  return data;
}

export const fetchGainers = async (): Promise<StockData[]> => {
  const res = await fetch("/api/nse/live-analysis-variations?index=gainers");
  const data = await parseNseResponse(res, "gainers");
  return data?.FOSec?.data || data?.NIFTY?.data || [];
};

export const fetchLosers = async (): Promise<StockData[]> => {
  const res = await fetch("/api/nse/live-analysis-variations?index=loosers");
  const data = await parseNseResponse(res, "losers");
  return data?.FOSec?.data || data?.NIFTY?.data || [];
};

export const fetchMarketIndices = async (): Promise<IndexSnapshot[]> => {
  const endpoints = [
    { name: "NIFTY 50", symbol: "NIFTY 50", url: "/api/nse/equity-stockIndices?index=NIFTY%2050" },
    { name: "NIFTY BANK", symbol: "NIFTY BANK", url: "/api/nse/equity-stockIndices?index=NIFTY%20BANK" },
    { name: "NIFTY IT", symbol: "NIFTY IT", url: "/api/nse/equity-stockIndices?index=NIFTY%20IT" },
  ];

  const results = await Promise.allSettled(
    endpoints.map(async ({ name, url }) => {
      const res = await fetch(url);
      const data = await parseNseResponse(res, `${name} index`);
      const payload = Array.isArray(data?.data) ? data.data : Array.isArray(data?.indices) ? data.indices : [];
      const item = payload[0] ?? {};

      const currentPrice = Number(item.lastPrice ?? item.lastprice ?? item.last ?? item.LTP ?? item.ltP ?? item.currentPrice ?? 0);
      const percentChange = Number(item.pChange ?? item.perChange ?? item.percentChange ?? item.changePercent ?? 0);
      const change = Number(item.change ?? item.netPrice ?? item.netChange ?? 0);
      const high = Number(item.dayHigh ?? item.high ?? item.highPrice ?? 0);
      const low = Number(item.dayLow ?? item.low ?? item.lowPrice ?? 0);
      const previousClose = Number(item.previousClose ?? item.prevClose ?? item.close ?? 0);
      const dayHigh = Number(item.dayHigh ?? item.high ?? item.highPrice ?? 0);
      const dayLow = Number(item.dayLow ?? item.low ?? item.lowPrice ?? 0);
      const lastUpdated = String(item.lastUpdated || item.updated || item.time || "");
      const symbol = String(item.symbol ?? item.index ?? item.name ?? name);
      const label = String(item.index ?? item.name ?? name);

      return {
        name: label,
        symbol,
        currentPrice,
        percentChange,
        change,
        high,
        low,
        previousClose,
        dayHigh,
        dayLow,
        lastUpdated,
      } satisfies IndexSnapshot;
    })
  );

  return results.flatMap((result) => (result.status === "fulfilled" && Number.isFinite(result.value.currentPrice) && result.value.currentPrice > 0 ? [result.value] : []));
};

export const fetchOISpurtsUnderlyings = async (): Promise<OISpurtData[]> => {
  const res = await fetch("/api/nse/live-analysis-oi-spurts-underlyings");
  const data = await parseNseResponse(res, "OI spurts underlyings");
  return data.data || [];
};

export const fetchOISpurtsContracts = async (): Promise<OISpurtData[]> => {
  const res = await fetch("/api/nse/live-analysis-oi-spurts-contracts");
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
  const res = await fetch("/api/nse/corporates-corporateActions?index=equities");
  const data = await parseNseResponse(res, "corporate actions");
  return data || [];
};

export const fetchFinancialEvents = async (): Promise<FinancialEvent[]> => {
  const res = await fetch("/api/nse/event-calendar");
  const data = await parseNseResponse(res, "financial events");
  return data || [];
};
