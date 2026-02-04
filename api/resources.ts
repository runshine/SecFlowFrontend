
import { API_BASE, handleResponse, getHeaders } from './base';
import { ProjectResource, ProjectTask, ProjectPVC } from '../types/types';

export const resourcesApi = {
  // Resources
  list: async (projectId: string, type?: string): Promise<ProjectResource[]> => {
    const url = new URL(`${API_BASE}/api/resource/resources`);
    url.searchParams.append('project_id', projectId);
    if (type) url.searchParams.append('resource_type', type);
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const data = await handleResponse(res);
    return data.resources || [];
  },

  upload: async (formData: FormData): Promise<{ task_id: string; resource_uuid: string; message: string }> => {
    const headers = getHeaders();
    const uploadHeaders: any = { ...headers };
    delete uploadHeaders['Content-Type']; // Let the browser set the boundary

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

  // Tasks
  getTasks: async (projectId: string, params: { task_type?: string; status?: string } = {}): Promise<ProjectTask[]> => {
    const url = new URL(`${API_BASE}/api/resource/tasks`);
    url.searchParams.append('project_id', projectId);
    if (params.task_type) url.searchParams.append('task_type', params.task_type);
    if (params.status) url.searchParams.append('status', params.status);
    const res = await fetch(url.toString(), { headers: getHeaders() });
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

  // PVCs
  getPVCs: async (projectId: string): Promise<{ pvcs: ProjectPVC[]; total: number }> => {
    const response = await fetch(`${API_BASE}/api/resource/pvcs?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};
