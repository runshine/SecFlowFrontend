
import { API_BASE, handleResponse, getHeaders } from './base';
import { ProjectResource, ProjectTask, ProjectPVC } from '../types/types';

export const resourcesApi = {
  // Resources
  list: async (projectId: string, type?: string): Promise<ProjectResource[]> => {
    const url = new URL(`${API_BASE}/api/resource/resources`);
    url.searchParams.append('project_id', projectId);
    if (type) url.searchParams.append('resource_type', type);
    return handleResponse(await fetch(url.toString(), { headers: getHeaders() }));
  },

  create: async (data: { 
    project_id: string; 
    resource_type: string; 
    url: string; 
    target_path: string; 
    extract?: boolean;
    extract_path?: string;
  }): Promise<{ task_id: string; resource_id: number }> => {
    const response = await fetch(`${API_BASE}/api/resource/resources`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
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

  extract: async (id: number, extractPath: string) => {
    const response = await fetch(`${API_BASE}/api/resource/resources/${id}/extract?extract_path=${encodeURIComponent(extractPath)}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  cleanup: async (id: number) => {
    const response = await fetch(`${API_BASE}/api/resource/resources/${id}/cleanup`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Tasks
  getTasks: async (projectId: string, params: { task_type?: string; status?: string } = {}): Promise<ProjectTask[]> => {
    const url = new URL(`${API_BASE}/api/resource/tasks`);
    url.searchParams.append('project_id', projectId);
    if (params.task_type) url.searchParams.append('task_type', params.task_type);
    if (params.status) url.searchParams.append('status', params.status);
    return handleResponse(await fetch(url.toString(), { headers: getHeaders() }));
  },

  getTaskLogs: async (taskId: string): Promise<{ logs: string }> => {
    const response = await fetch(`${API_BASE}/api/resource/tasks/${taskId}/logs`, { headers: getHeaders() });
    return handleResponse(response);
  },

  // PVCs
  getPVCs: async (projectId: string): Promise<{ pvcs: ProjectPVC[]; total: number }> => {
    const response = await fetch(`${API_BASE}/api/resource/pvcs?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};
