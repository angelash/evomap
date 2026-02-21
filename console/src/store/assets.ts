import { create } from 'zustand';
import { api, CapsuleSummary } from '../api/client';

interface AssetStore {
  assets: CapsuleSummary[];
  loading: boolean;
  error: string | null;
  total: number;
  
  // Filters
  filters: {
    project: string;
    namespace: string;
    includeCandidate: boolean;
  };

  setFilters: (filters: Partial<AssetStore['filters']>) => void;
  fetchAssets: () => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  loading: false,
  error: null,
  total: 0,
  
  filters: {
    project: '',
    namespace: '',
    includeCandidate: true,
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  fetchAssets: async () => {
    const { filters } = get();
    set({ loading: true, error: null });
    
    try {
      const response = await api.fetchAssets({
        project: filters.project,
        namespace: filters.namespace,
        query: {},
        limit: 50,
        include_candidate: filters.includeCandidate,
      });
      
      set({ 
        assets: response.assets, 
        loading: false,
        total: response.assets.length 
      });
    } catch (err: any) {
      set({ 
        error: err.message || 'Failed to fetch assets', 
        loading: false 
      });
    }
  },
}));
