import { create } from "zustand";
import { 
  StockData, 
  OISpurtData, 
  IndexSnapshot,
  fetchGainers, 
  fetchLosers, 
  fetchMarketIndices,
  fetchOISpurtsUnderlyings, 
  fetchOISpurtsContracts,
  fetchCorporateActions,
  fetchFinancialEvents,
  CorporateAction,
  FinancialEvent,
  IntradayChart,
  fetchIntradayCharts,
} from "@/lib/nse-api";

interface MarketState {
  gainers: StockData[];
  losers: StockData[];
  marketIndices: IndexSnapshot[];
  oiUnderlyings: OISpurtData[];
  oiContracts: OISpurtData[];
  corporateActions: CorporateAction[];
  financialEvents: FinancialEvent[];
  intradayCharts: Record<string, IntradayChart>;
  intradayError: string | null;
  intradayUpdatedAt: Date | null;
  isLoading: boolean;
  isIntradayLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Actions
  fetchData: () => Promise<void>;
  fetchIntradayData: (symbols: string[]) => Promise<void>;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
}

let pendingIntradaySymbols: string[] = [];

export const useMarketStore = create<MarketState>((set, get) => ({
  gainers: [],
  losers: [],
  marketIndices: [],
  oiUnderlyings: [],
  oiContracts: [],
  corporateActions: [],
  financialEvents: [],
  intradayCharts: {},
  intradayError: null,
  intradayUpdatedAt: null,
  isLoading: false,
  isIntradayLoading: false,
  error: null,
  lastUpdated: null,
  autoRefresh: true,
  refreshInterval: 15,

  fetchData: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    const [
      gainersResult,
      losersResult,
      indicesResult,
      underlyingsResult,
      contractsResult,
      corporateActionsResult,
      financialEventsResult,
    ] = await Promise.allSettled([
        fetchGainers(),
        fetchLosers(),
        fetchMarketIndices(),
        fetchOISpurtsUnderlyings(),
        fetchOISpurtsContracts(),
        fetchCorporateActions(),
        fetchFinancialEvents(),
    ]);
    const getValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
      result.status === "fulfilled" ? result.value : fallback;
    const errors = [
      gainersResult,
      losersResult,
      indicesResult,
      underlyingsResult,
      contractsResult,
      corporateActionsResult,
      financialEventsResult,
    ].flatMap((result) => result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : String(result.reason)]
      : []);
    const hasSuccessfulFeeds = errors.length < 7;

    set({
      gainers: getValue(gainersResult, []),
      losers: getValue(losersResult, []),
      marketIndices: getValue(indicesResult, []),
      oiUnderlyings: getValue(underlyingsResult, []),
      oiContracts: getValue(contractsResult, []),
      corporateActions: getValue(corporateActionsResult, []),
      financialEvents: getValue(financialEventsResult, []),
      isLoading: false,
      lastUpdated: hasSuccessfulFeeds ? new Date() : get().lastUpdated,
      error: errors.length
        ? `${hasSuccessfulFeeds ? "Some" : "All"} NSE feeds failed: ${errors.join("; ")}`
        : null,
    });
  },

  fetchIntradayData: async (symbols) => {
    if (symbols.length === 0) return;
    if (get().isIntradayLoading) {
      pendingIntradaySymbols = symbols;
      return;
    }
    set({ isIntradayLoading: true, intradayError: null });
    try {
      const { charts, errors } = await fetchIntradayCharts(symbols);
      set((state) => ({
        intradayCharts: { ...state.intradayCharts, ...charts },
        intradayUpdatedAt: Object.keys(charts).length ? new Date() : state.intradayUpdatedAt,
        intradayError: errors.length ? errors.join("; ") : null,
        isIntradayLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch Yahoo intraday charts.";
      set({ intradayError: message, isIntradayLoading: false });
    }
    const queuedSymbols = pendingIntradaySymbols;
    pendingIntradaySymbols = [];
    if (queuedSymbols.length) void get().fetchIntradayData(queuedSymbols);
  },

  toggleAutoRefresh: () => set((state) => ({ autoRefresh: !state.autoRefresh })),
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
}));
