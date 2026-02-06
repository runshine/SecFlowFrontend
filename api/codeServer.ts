
import { API_BASE, handleResponse, getHeaders } from './base';

export const codeServerApi = {
  // Instances
  list: async (projectId: string): Promise<{ total: number; items: any[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/code-servers`, { headers: getHeaders() })),
  
  getDetail: async (projectId: string, name: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/code-servers/${name}`, { headers: getHeaders() })),
  
  getStatus: async (projectId: string, name: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/code-servers/${name}/status`, { headers: getHeaders() })),
  
  create: async (projectId: string, payload: any): Promise<{ task_id: string; task_type: string }> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/code-servers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })),
  
  delete: async (projectId: string, name: string, deleteOutput = false): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/code-servers`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ name, delete_output_pvcs: deleteOutput })
    })),
  
  restart: async (projectId: string, name: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/code-servers/restart`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    })),

  // Tasks
  getTasks: async (projectId: string): Promise<{ total: number; items: any[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/tasks`, { headers: getHeaders() })),
  
  getTaskDetail: async (projectId: string, taskId: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/app/code-server/projects/${projectId}/tasks/${taskId}`, { headers: getHeaders() })),
};
