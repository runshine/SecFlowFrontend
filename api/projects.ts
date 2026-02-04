
import { API_BASE, handleResponse, getHeaders } from './base';
import { SecurityProject } from '../types/types';

export const projectsApi = {
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
  }
};
