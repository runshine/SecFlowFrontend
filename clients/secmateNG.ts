import { API_BASE, getHeaders, handleResponse } from './base';

const getWsBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${API_BASE.replace(/^https?:\/\//, '')}`;
};

export const secmateNGApi = {
  getHealth: async (): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE}/api/app/secmate-ng/health`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getDefaultEnvConfig: async (): Promise<{
    common_env: Record<string, string>;
    default_secmate_env: Record<string, string>;
    merged_default_env: Record<string, string>;
  }> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/config/default-env`, { headers: getHeaders() })),

  list: async (projectId: string): Promise<{ total: number; items: any[] }> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances`, { headers: getHeaders() })),

  getDetail: async (projectId: string, name: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances/${name}`, { headers: getHeaders() })),

  getStatus: async (projectId: string, name: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances/${name}/status`, { headers: getHeaders() })),

  getLogs: async (projectId: string, name: string, tailLines = 200): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances/${name}/logs?tail_lines=${tailLines}`, { headers: getHeaders() })),

  create: async (projectId: string, payload: any): Promise<{ task_id: string; task_type: string }> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),

  delete: async (projectId: string, name: string, deleteOutput = false): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ name, delete_output_pvcs: deleteOutput })
    })),

  restart: async (projectId: string, name: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/secmate-instances/restart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    })),

  getTasks: async (projectId: string): Promise<{ total: number; items: any[] }> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/tasks`, { headers: getHeaders() })),

  getTaskDetail: async (projectId: string, taskId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/tasks/${taskId}`, { headers: getHeaders() })),

  deleteTask: async (projectId: string, taskId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/app/secmate-ng/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })),

  createTerminalConnection: (projectId: string, name: string): WebSocket => {
    const token = localStorage.getItem('secflow_token');
    let wsUrl = `${getWsBase()}/api/app/secmate-ng/ws/projects/${projectId}/secmate-instances/${encodeURIComponent(name)}/exec`;
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }
    return new WebSocket(wsUrl);
  }
};
