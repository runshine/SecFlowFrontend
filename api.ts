
import { SecurityProject, UserInfo, Agent, EnvTemplate, AsyncTask, NamespaceStatus, ProjectRole, StaticPackage, PackageFile, PackageStats } from './types';

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
    const errorMessage = errorData.detail || errorData.error || errorData.message || `API Error (${response.status})`;
    throw new Error(errorMessage);
  }
  return response.json();
};

export const api = {
  // 1. Auth Service
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

  // 2. Project Management Service
  projects: {
    list: async (): Promise<{ total: number; projects: SecurityProject[] }> => {
      const response = await fetch(`${API_BASE}/api/project`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string): Promise<SecurityProject> => {
      const response = await fetch(`${API_BASE}/api/project/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (project: { name: string; description?: string; k8s_namespace?: string }) => {
      const response = await fetch(`${API_BASE}/api/project`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(project),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: { name?: string; description?: string; k8s_namespace?: string }) => {
      const response = await fetch(`${API_BASE}/api/project/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/project/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    bindRole: async (projectId: string, data: { user_id: string; role: string }): Promise<ProjectRole> => {
      const response = await fetch(`${API_BASE}/api/project/${projectId}/role`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    unbindRole: async (projectId: string, userId: string) => {
      const response = await fetch(`${API_BASE}/api/project/${projectId}/role?user_id=${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getNamespace: async (projectId: string): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/project/${projectId}/namespace`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getResources: async (projectId: string): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/project/${projectId}/resources`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getPodLogs: async (projectId: string, podName: string, tailLines: number = 100, container?: string): Promise<any> => {
      const params = new URLSearchParams({ tail_lines: tailLines.toString() });
      if (container) params.append('container', container);
      const response = await fetch(`${API_BASE}/api/project/${projectId}/pods/${podName}/logs?${params.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 3. Resource Service
  resources: {
    list: async (projectId: string, resourceType: string) => {
      const response = await fetch(
        `${API_BASE}/api/resource/list?project_id=${projectId}&resource_type=${resourceType}`,
        { headers: getHeaders() }
      );
      return handleResponse(response);
    },
    upload: async (formData: FormData) => {
      const token = localStorage.getItem('secflow_token');
      const response = await fetch(`${API_BASE}/api/resource/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/resource/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  // 4. Static Packages Service
  staticPackages: {
    health: async (): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/packages/health`);
      return handleResponse(response);
    },
    list: async (): Promise<{ packages: StaticPackage[] }> => {
      const response = await fetch(`${API_BASE}/api/packages`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    search: async (params: { name?: string; version?: string; architecture?: string }): Promise<{ packages: StaticPackage[] }> => {
      const query = new URLSearchParams();
      if (params.name) query.append('name', params.name);
      if (params.version) query.append('version', params.version);
      if (params.architecture) query.append('architecture', params.architecture);
      
      const response = await fetch(`${API_BASE}/api/packages/search?${query.toString()}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string): Promise<{ package: StaticPackage; files: PackageFile[]; total_files: number }> => {
      const response = await fetch(`${API_BASE}/api/packages/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    upload: async (formData: FormData): Promise<any> => {
      const token = localStorage.getItem('secflow_token');
      const response = await fetch(`${API_BASE}/api/packages/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      return handleResponse(response);
    },
    check: async (id: string): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/packages/${id}/check`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    checkAll: async (): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/packages/check-all`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    delete: async (id: string): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/packages/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    batchDelete: async (ids: string[]): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/packages/batch-delete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ package_ids: ids })
      });
      return handleResponse(response);
    },
    deleteAll: async (): Promise<any> => {
      const response = await fetch(`${API_BASE}/api/packages/delete-all`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getStats: async (): Promise<{ statistics: PackageStats }> => {
      const response = await fetch(`${API_BASE}/api/packages/statistics`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getArchitectures: async (): Promise<{ architectures: string[] }> => {
      const response = await fetch(`${API_BASE}/api/packages/architectures`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getDownloadUrl: (id: string) => `${API_BASE}/api/packages/${id}/download?token=${localStorage.getItem('secflow_token')}`,
    getFileDownloadUrl: (id: string, path: string) => `${API_BASE}/api/packages/${id}/files/download?path=${encodeURIComponent(path)}&token=${localStorage.getItem('secflow_token')}`
  },

  // 5. Environment & Task Service
  environment: {
    getAgents: async (): Promise<Agent[]> => {
      const response = await fetch(`${API_BASE}/api/agents`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getTemplates: async (): Promise<{ templates: EnvTemplate[] }> => {
      const response = await fetch(`${API_BASE}/api/templates`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getTasks: async (): Promise<AsyncTask[]> => {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deploy: async (data: { agent_key: string; template_name: string; service_name: string }) => {
      const response = await fetch(`${API_BASE}/api/tasks/deploy`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    }
  }
};
