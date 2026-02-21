import { create } from 'zustand';
import { api, CapsuleSummary } from '../api/client';

interface ReviewStore {
  pendingAssets: CapsuleSummary[];
  loading: boolean;
  error: string | null;

  fetchPending: () => Promise<void>;
  approve: (assetId: string) => Promise<void>;
  reject: (assetId: string, reason: string) => Promise<void>;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  pendingAssets: [],
  loading: false,
  error: null,

  fetchPending: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this might be a specific endpoint or fetch with include_candidate=true
      // and status='candidate' filter. Here we reuse fetchAssets.
      const response = await api.fetchAssets({
        project: '',
        namespace: '',
        query: {},
        limit: 100,
        include_candidate: true,
      });
      
      // Filter candidates on client side for now if backend doesn't support specific status query yet
      set({ 
        pendingAssets: response.assets, // Should filter by status in real scenario
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch pending assets', loading: false });
    }
  },

  approve: async (assetId) => {
    try {
      await api.applyDecision({
        asset_id: assetId,
        decision: 'accept',
        reviewer_id: 'console-admin',
      });
      // Remove from list
      set((state) => ({
        pendingAssets: state.pendingAssets.filter(a => a.asset_id !== assetId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to approve asset' });
    }
  },

  reject: async (assetId, reason) => {
    try {
      await api.applyDecision({
        asset_id: assetId,
        decision: 'reject',
        reason,
        reviewer_id: 'console-admin',
      });
      // Remove from list
      set((state) => ({
        pendingAssets: state.pendingAssets.filter(a => a.asset_id !== assetId),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to reject asset' });
    }
  },
}));
