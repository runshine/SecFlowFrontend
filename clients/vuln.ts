import { API_BASE, handleResponse, getHeaders } from './base';

export const vulnApi = {
  getHealth: async (): Promise<{ status: string; service: string }> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/health`, { headers: getHeaders() })),

  getOverview: async (projectId?: string): Promise<any> => {
    const query = new URLSearchParams(projectId ? { project_id: projectId } : {}).toString();
    return handleResponse(await fetch(`${API_BASE}/api/vuln/cases/ops/dashboard/overview?${query}`, { headers: getHeaders() }));
  },

  listServices: async (): Promise<{ items: any[]; total: number }> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/services`, { headers: getHeaders() })),

  heartbeatService: async (serviceId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/services/heartbeat/${serviceId}`, {
      method: 'POST',
      headers: getHeaders()
    })),

  unregisterService: async (serviceId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/services/unregister/${serviceId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })),

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

  getRecommendedActions: async (caseId: string): Promise<{ items: any[]; total: number }> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/recommended-actions`, { headers: getHeaders() })),

  listActionQueue: async (params: { project_id?: string; execution_status?: string } = {}): Promise<{ items: any[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    return handleResponse(await fetch(`${API_BASE}/api/vuln/actions/ops/queue?${query}`, { headers: getHeaders() }));
  },

  listManualTasks: async (params: { project_id?: string; status?: string } = {}): Promise<{ items: any[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    return handleResponse(await fetch(`${API_BASE}/api/vuln/cases/ops/manual-tasks?${query}`, { headers: getHeaders() }));
  },

  createManualTask: async (caseId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/manual-tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  updateManualTaskStatus: async (caseId: string, taskId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/manual-tasks/${taskId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  transitionStage: async (caseId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/stage-transition`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  submitDecision: async (caseId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/decisions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  dispatchActions: async (caseId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/actions/dispatch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  autoOrchestrate: async (caseId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/cases/${caseId}/orchestrate/auto`, {
      method: 'POST',
      headers: getHeaders()
    })),

  submitActionCallback: async (actionId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/actions/${actionId}/callback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  controlAction: async (actionId: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/actions/${actionId}/control`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  triggerMockAction: async (caseId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/vuln/actions/mock-dispatch/${caseId}`, {
      method: 'POST',
      headers: getHeaders()
    })),
};
