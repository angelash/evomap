import { create } from 'zustand';
import { api } from '../api/client';

export interface NodeInfo {
  node_id: string;
  role: string;
  status: string;
  capabilities: string[];
  last_seen: string;
  gene_count: number;
  capsule_count: number;
}

interface NodeStore {
  nodes: NodeInfo[];
  loading: boolean;
  error: string | null;

  fetchNodes: () => Promise<void>;
}

export const useNodeStore = create<NodeStore>((set) => ({
  nodes: [],
  loading: false,
  error: null,

  fetchNodes: async () => {
    set({ loading: true, error: null });
    try {
      // For now, we use a generic request as there's no A2A message for "list nodes"
      // Console usually has more permissions/API access.
      const response = await api.request({
        url: '/nodes',
        method: 'GET',
      });
      set({ nodes: response.data, loading: false });
    } catch (err: any) {
      // Fallback for dev/mock if endpoint doesn't exist yet
      if (import.meta.env.DEV) {
         set({
            nodes: [
                {
                    node_id: 'test-node-1',
                    role: 'worker',
                    status: 'active',
                    capabilities: ['publish', 'fetch'],
                    last_seen: new Date().toISOString(),
                    gene_count: 5,
                    capsule_count: 12
                }
            ],
            loading: false
         });
         return;
      }
      set({ error: err.message || 'Failed to fetch nodes', loading: false });
    }
  },
}));
