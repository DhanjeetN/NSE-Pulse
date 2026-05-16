import { create } from "zustand";
import { 
  StockData, 
  OISpurtData, 
  fetchGainers, 
  fetchLosers, 
  fetchOISpurtsUnderlyings, 
  fetchOISpurtsContracts,
  fetchCorporateActions,
  fetchFinancialEvents,
  CorporateAction,
  FinancialEvent
} from "@/lib/nse-api";

interface MarketState {
  gainers: StockData[];
  losers: StockData[];
  oiUnderlyings: OISpurtData[];
  oiContracts: OISpurtData[];
  corporateActions: CorporateAction[];
  financialEvents: FinancialEvent[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Actions
  fetchData: () => Promise<void>;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  gainers: [],
  losers: [],
  oiUnderlyings: [],
  oiContracts: [],
  corporateActions: [],
  financialEvents: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  autoRefresh: true,
  refreshInterval: 15,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [gainers, losers, oiUnderlyings, oiContracts, corporateActions, financialEvents] = await Promise.all([
        fetchGainers(),
        fetchLosers(),
        fetchOISpurtsUnderlyings(),
        fetchOISpurtsContracts(),
        fetchCorporateActions(),
        fetchFinancialEvents(),
      ]);

      set({
        gainers,
        losers,
        oiUnderlyings,
        oiContracts,
        corporateActions,
        financialEvents,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.message || "An error occurred while fetching data" 
      });
    }
  },

  toggleAutoRefresh: () => set((state) => ({ autoRefresh: !state.autoRefresh })),
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
}));
