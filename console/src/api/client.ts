import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * A2A Message Envelope according to SDD v0.1
 */
export interface A2AEnvelope<T = any> {
  protocol: 'evomap-a2a';
  protocol_version: '1.0';
  message_type: string;
  message_id: string;
  sender_id: string;
  timestamp_ms: number;
  payload: T;
}

/**
 * Common payload types extracted from backend protocol definitions
 */
export interface EnvFingerprint {
  os?: string;
  arch?: string;
  runtime?: string;
  version?: string;
  [key: string]: any;
}

export interface HelloPayload {
  capabilities: string[];
  gene_count?: number;
  capsule_count?: number;
  env_fingerprint?: EnvFingerprint;
}

export interface HelloResponse {
  node_id: string;
  status: 'registered' | 'updated';
  claim_code?: string;
}

export interface FetchPayload {
  project: string;
  namespace: string;
  query: {
    signals?: string[];
    tags?: string[];
    env_fingerprint?: EnvFingerprint;
    risk_level_max?: 'low' | 'medium' | 'high';
  };
  limit: number;
  include_candidate: boolean;
}

export interface CapsuleSummary {
  asset_id: string;
  gene_id: string;
  summary: string;
  confidence: number;
  success_rate: number;
  env_fingerprint?: EnvFingerprint;
}

export interface FetchResponse {
  assets: CapsuleSummary[];
  explain?: string;
}

export interface DecisionPayload {
  asset_id: string;
  decision: 'accept' | 'reject' | 'quarantine';
  reason?: string;
  reviewer_id: string;
}

export interface DecisionResponse {
  status: 'applied';
  asset_status: 'promoted' | 'rejected' | 'quarantined';
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('evomap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('evomap_token');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

/**
 * Wraps payload into A2A envelope and sends to backend
 */
export const sendA2AMessage = async <T, R>(
  type: string,
  payload: T,
  senderId: string = 'console-web'
): Promise<R> => {
  const envelope: A2AEnvelope<T> = {
    protocol: 'evomap-a2a',
    protocol_version: '1.0',
    message_type: type,
    message_id: uuidv4(),
    sender_id: senderId,
    timestamp_ms: Date.now(),
    payload,
  };

  const response = await apiClient.post(`/a2a`, envelope);
  return response.data;
};

/**
 * Specialized API calls for the Console
 */
export const api = {
  // Asset Management
  fetchAssets: (params: FetchPayload) => 
    sendA2AMessage<FetchPayload, FetchResponse>('fetch', params),
  
  // Review Actions
  applyDecision: (params: DecisionPayload) =>
    sendA2AMessage<DecisionPayload, DecisionResponse>('decision', params),
    
  // Node Management
  registerNode: (params: HelloPayload) =>
    sendA2AMessage<HelloPayload, HelloResponse>('hello', params),

  // Generic request
  request: <T = any>(config: any) => apiClient.request<T>(config),
};

export default apiClient;
