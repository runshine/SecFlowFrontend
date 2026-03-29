import { API_BASE, getHeaders, handleResponse } from './base';

export type AggregatedServiceHealth = 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'stale';

export interface MenuServiceHealthItem {
  service_id: string;
  service_name: string;
  api_prefix?: string | null;
  menu_item_id?: string | null;
  menu_path?: string | null;
  health: AggregatedServiceHealth;
  latency_ms?: number | null;
  last_check_at?: number | null;
  error?: string | null;
  registered?: boolean;
  replicas?: number | null;
  ready_replicas?: number | null;
  available_replicas?: number | null;
  deployment_name?: string | null;
  runtime_status?: string | null;
}

export interface MenuServiceHealthSummary {
  generated_at: number;
  totals: Record<AggregatedServiceHealth, number>;
  services: Record<string, MenuServiceHealthItem>;
}

export const menuApi = {
  getHealth: async (): Promise<{ status: string; service: string }> => {
    const response = await fetch(`${API_BASE}/api/menu/health`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getServiceHealthSummary: async (): Promise<MenuServiceHealthSummary> => {
    const response = await fetch(`${API_BASE}/api/menu/services/health/summary`, {
      headers: getHeaders(),
    });
    const payload = await handleResponse(response);
    return payload.data;
  },
};
