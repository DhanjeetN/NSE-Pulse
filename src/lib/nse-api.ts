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
  data.data.forEach((group: any) => {
    const key = Object.keys(group)[0];
    if (Array.isArray(group[key])) {
      allContracts.push(...group[key]);
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
