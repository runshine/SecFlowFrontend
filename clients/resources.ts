import { API_BASE, handleResponse, getHeaders } from './base';
import { ProjectResource, ProjectTask, ProjectPVC } from '../types/types';

export const resourcesApi = {
  // Health Check
  getHealth: async (): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE}/api/resource/health`, { headers: getHeaders() });
    return handleResponse(response);
  },

  // Resources
  list: async (projectId: string, type?: string): Promise<ProjectResource[]> => {
    const params = new URLSearchParams({ project_id: projectId });
    if (type) params.append('resource_type', type);
    
    // 使用模板字符串拼接，避免 new URL 在 base 为空时报错
    const url = `${API_BASE}/api/resource/resources?${params.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.resources || [];
  },

  upload: async (formData: FormData): Promise<{ task_id: string; resource_uuid: string; message: string }> => {
    const headers = getHeaders();
    const uploadHeaders: any = { ...headers };
    delete uploadHeaders['Content-Type']; 

    const response = await fetch(`${API_BASE}/api/resource/resources/upload`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });
    return handleResponse(response);
  },

  getById: async (id: number): Promise<ProjectResource> => {
    const response = await fetch(`${API_BASE}/api/resource/resources/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE}/api/resource/resources/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  downloadFile: (uuid: string) => {
    return `${API_BASE}/api/resource/resources/${uuid}/file?token=${localStorage.getItem('secflow_token')}`;
  },

  createOutputPvc: async (payload: { name: string; description?: string; project_id: string; pvc_size?: number }): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getOutputPvcDetail: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  deleteOutputPvc: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTasks: async (projectId: string, params: { task_type?: string; status?: string } = {}): Promise<ProjectTask[]> => {
    const queryParams = new URLSearchParams({ project_id: projectId });
    if (params.task_type) queryParams.append('task_type', params.task_type);
    if (params.status) queryParams.append('status', params.status);
    
    const url = `${API_BASE}/api/resource/tasks?${queryParams.toString()}`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.tasks || [];
  },

  getTaskDetail: async (taskId: string): Promise<ProjectTask> => {
    const response = await fetch(`${API_BASE}/api/resource/tasks/${taskId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getTaskLogs: async (taskId: string): Promise<{ task_id: string; logs: string[] }> => {
    const response = await fetch(`${API_BASE}/api/resource/tasks/${taskId}/logs`, { headers: getHeaders() });
    return handleResponse(response);
  },

  deleteTask: async (taskId: string) => {
    const response = await fetch(`${API_BASE}/api/resource/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPVCs: async (projectId: string): Promise<{ pvcs: ProjectPVC[]; total: number }> => {
    const response = await fetch(`${API_BASE}/api/resource/pvcs?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};