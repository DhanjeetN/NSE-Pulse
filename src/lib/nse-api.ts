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

export const fetchGainers = async (): Promise<StockData[]> => {
  const res = await fetch("/api/nse/live-analysis-variations?index=gainers");
  if (!res.ok) throw new Error("Failed to fetch gainers");
  const data = await res.json();
  return data?.FOSec?.data || data?.NIFTY?.data || [];
};

export const fetchLosers = async (): Promise<StockData[]> => {
  const res = await fetch("/api/nse/live-analysis-variations?index=loosers");
  if (!res.ok) throw new Error("Failed to fetch losers");
  const data = await res.json();
  return data?.FOSec?.data || data?.NIFTY?.data || [];
};

export const fetchOISpurtsUnderlyings = async (): Promise<OISpurtData[]> => {
  const res = await fetch("/api/nse/live-analysis-oi-spurts-underlyings");
  if (!res.ok) throw new Error("Failed to fetch OI spurts underlyings");
  const data = await res.json();
  return data.data || [];
};

export const fetchOISpurtsContracts = async (): Promise<OISpurtData[]> => {
  const res = await fetch("/api/nse/live-analysis-oi-spurts-contracts");
  if (!res.ok) throw new Error("Failed to fetch OI spurts contracts");
  const data = await res.json();
  
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
  if (!res.ok) throw new Error("Failed to fetch corporate actions");
  const data = await res.json();
  return data || [];
};

export const fetchFinancialEvents = async (): Promise<FinancialEvent[]> => {
  const res = await fetch("/api/nse/event-calendar");
  if (!res.ok) throw new Error("Failed to fetch financial events");
  const data = await res.json();
  return data || [];
};
