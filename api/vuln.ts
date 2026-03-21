import { API_BASE, handleResponse, getHeaders } from './base';

export const vulnApi = {
  getHealth: async (): Promise<{ status: string; service: string }> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/health`, { headers: getHeaders() })),

  listServices: async (): Promise<{ items: any[]; total: number }> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/services`, { headers: getHeaders() })),

  registerService: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/services/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  createCase: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  listCases: async (params: { project_id?: string; current_stage?: string } = {}): Promise<{ items: any[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    return handleResponse(await fetch(`${API_BASE}/api/vuln/cases?${query}`, { headers: getHeaders() }));
  },

  getCaseDetail: async (caseId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}`, { headers: getHeaders() })),

  getCaseTimeline: async (caseId: string): Promise<{ items: any[]; total: number }> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/timeline`, { headers: getHeaders() })),

  triggerMockAction: async (caseId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/actions/mock-dispatch/${caseId}`, {
      method: 'POST',
      headers: getHeaders()
    })),
};
