import { API_BASE, getHeaders, handleResponse } from './base';

export const configCenterApi = {
  getHealth: async (): Promise<{ status: string; service: string }> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/health`, { headers: getHeaders() })),

  listLlmProviders: async (): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers`, { headers: getHeaders() })),

  getLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}`, { headers: getHeaders() })),

  createLlmProvider: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  testLlmProvider: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/test`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  listLlmProviderModels: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/models`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ provider_key: providerKey }),
    })),

  chatWithLlmProviders: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  updateLlmProvider: async (providerKey: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  enableLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}/enable`, {
      method: 'POST',
      headers: getHeaders(),
    })),

  disableLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}/disable`, {
      method: 'POST',
      headers: getHeaders(),
    })),

  setDefaultLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}/set-default`, {
      method: 'POST',
      headers: getHeaders(),
    })),

  deleteLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })),
};
