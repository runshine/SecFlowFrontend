
import { API_BASE, handleResponse, getHeaders } from './base';
import { ProjectResource, ProjectTask, ProjectPVC } from '../types/types';

export const resourcesApi = {
  // Original legacy method (compatible)
  list: async (projectId: string, resourceType: string) => {
    const response = await fetch(
      `${API_BASE}/api/resource/list?project_id=${projectId}&resource_type=${resourceType}`, 
      { headers: getHeaders() }
    );
    return handleResponse(response);
  },

  // Resource Management Service specialized endpoints
  listProjectResources: async (projectId: string): Promise<ProjectResource[]> => {
    const response = await fetch(`${API_BASE}/api/resource/resources?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  listProjectTasks: async (projectId: string): Promise<ProjectTask[]> => {
    const response = await fetch(`${API_BASE}/api/resource/tasks?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getTaskLogs: async (taskId: string): Promise<{ logs: string }> => {
    const response = await fetch(`${API_BASE}/api/resource/tasks/${taskId}/logs`, { headers: getHeaders() });
    return handleResponse(response);
  },

  listProjectPVCs: async (projectId: string): Promise<{ pvcs: ProjectPVC[]; total: number }> => {
    const response = await fetch(`${API_BASE}/api/resource/pvcs?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};
