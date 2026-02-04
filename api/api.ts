
import { SecurityProject, UserInfo, Agent, EnvTemplate, AsyncTask, StaticPackage, PackageStats } from '../types/types';

const API_BASE = 'https://secflow.819819.xyz';

const getHeaders = () => {
  const token = localStorage.getItem('secflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `API Error (${response.status})`);
  }
  return response.json();
};

export const api = {
  auth: {
    login: async (credentials: any) => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return handleResponse(response);
    },
    validateToken: async (): Promise<UserInfo> => {
      const response = await fetch(`${API_BASE}/api/auth/validate-human-token`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },
  projects: {
    list: async (): Promise<{ projects: SecurityProject[] }> => {
      const response = await fetch(`${API_BASE}/api/project`, { headers: getHeaders() });
      return handleResponse(response);
    },
    create: async (project: { name: string; description?: string }) => {
      const response = await fetch(`${API_BASE}/api/project`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(project),
      });
      return handleResponse(response);
    },
    getNamespace: async (projectId: string) => handleResponse(await fetch(`${API_BASE}/api/project/${projectId}/namespace`, { headers: getHeaders() })),
    getResources: async (projectId: string) => handleResponse(await fetch(`${API_BASE}/api/project/${projectId}/resources`, { headers: getHeaders() })),
    getPodLogs: async (projectId: string, podName: string) => handleResponse(await fetch(`${API_BASE}/api/project/${projectId}/pods/${podName}/logs`, { headers: getHeaders() }))
  },
  resources: {
    list: async (projectId: string, resourceType: string) => handleResponse(await fetch(`${API_BASE}/api/resource/list?project_id=${projectId}&resource_type=${resourceType}`, { headers: getHeaders() }))
  },
  staticPackages: {
    list: async () => handleResponse(await fetch(`${API_BASE}/api/packages`, { headers: getHeaders() })),
    getStats: async () => handleResponse(await fetch(`${API_BASE}/api/packages/statistics`, { headers: getHeaders() })),
    check: async (id: string) => handleResponse(await fetch(`${API_BASE}/api/packages/${id}/check`, { headers: getHeaders() })),
    checkAll: async () => handleResponse(await fetch(`${API_BASE}/api/packages/check-all`, { method: 'POST', headers: getHeaders() })),
    delete: async (id: string) => handleResponse(await fetch(`${API_BASE}/api/packages/${id}`, { method: 'DELETE', headers: getHeaders() })),
    getDownloadUrl: (id: string) => `${API_BASE}/api/packages/${id}/download?token=${localStorage.getItem('secflow_token')}`
  },
  environment: {
    getAgents: async () => handleResponse(await fetch(`${API_BASE}/api/agents`, { headers: getHeaders() })),
    getTemplates: async () => handleResponse(await fetch(`${API_BASE}/api/templates`, { headers: getHeaders() })),
    getTasks: async () => handleResponse(await fetch(`${API_BASE}/api/tasks`, { headers: getHeaders() }))
  }
};
