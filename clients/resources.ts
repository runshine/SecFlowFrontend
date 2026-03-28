import { API_BASE, handleResponse, getHeaders } from './base';
import {
  ProjectResource,
  ProjectTask,
  ProjectPVC,
  OutputPvcDetail,
  PvcBrowserChildrenResponse,
  PvcBrowserFileResponse,
  PvcBrowserRootResponse,
} from '../types/types';

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

  getOutputPvcDetail: async (id: number): Promise<OutputPvcDetail> => {
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
  },

  getPvcBrowserRoot: async (resourceId: number): Promise<PvcBrowserRootResponse> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${resourceId}/browser/root`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPvcBrowserTree: async (resourceId: number): Promise<PvcBrowserRootResponse> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${resourceId}/browser/tree`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPvcBrowserChildren: async (resourceId: number, path = '/'): Promise<PvcBrowserChildrenResponse> => {
    const response = await fetch(
      `${API_BASE}/api/resource/output-pvc/${resourceId}/browser/children?path=${encodeURIComponent(path)}`,
      { headers: getHeaders() }
    );
    return handleResponse(response);
  },

  getPvcBrowserFile: async (resourceId: number, path: string, maxBytes = 1048576): Promise<PvcBrowserFileResponse> => {
    const response = await fetch(
      `${API_BASE}/api/resource/output-pvc/${resourceId}/browser/file?path=${encodeURIComponent(path)}&max_bytes=${maxBytes}`,
      { headers: getHeaders() }
    );
    return handleResponse(response);
  },

  fetchPvcBrowserPreviewBlob: async (resourceId: number, path: string): Promise<Blob> => {
    const response = await fetch(
      `${API_BASE}/api/resource/output-pvc/${resourceId}/browser/download?path=${encodeURIComponent(path)}`,
      { headers: getHeaders() }
    );
    if (!response.ok) {
      await handleResponse(response);
    }
    return response.blob();
  },

  fetchPvcBrowserDownloadBlob: async (resourceId: number, path: string): Promise<Blob> => {
    const response = await fetch(
      `${API_BASE}/api/resource/output-pvc/${resourceId}/browser/download?path=${encodeURIComponent(path)}`,
      { headers: getHeaders() }
    );
    if (!response.ok) {
      await handleResponse(response);
    }
    return response.blob();
  },

  uploadPvcBrowserFile: async (resourceId: number, path: string, file: File): Promise<{ message: string; path: string; size: number }> => {
    const formData = new FormData();
    formData.append('path', path);
    formData.append('file', file);
    const headers = getHeaders();
    const uploadHeaders: Record<string, string> = { ...headers };
    delete uploadHeaders['Content-Type'];
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${resourceId}/browser/upload`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });
    return handleResponse(response);
  },

  createPvcBrowserDirectory: async (resourceId: number, path: string, name: string): Promise<{ message: string; path: string }> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${resourceId}/browser/directories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ path, name }),
    });
    return handleResponse(response);
  },

  renamePvcBrowserNode: async (resourceId: number, path: string, targetName: string): Promise<{ message: string; path: string }> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${resourceId}/browser/rename`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ path, target_name: targetName }),
    });
    return handleResponse(response);
  },

  movePvcBrowserNode: async (resourceId: number, path: string, targetPath: string): Promise<{ message: string; path: string }> => {
    const response = await fetch(`${API_BASE}/api/resource/output-pvc/${resourceId}/browser/move`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ path, target_path: targetPath }),
    });
    return handleResponse(response);
  },

  deletePvcBrowserNode: async (resourceId: number, path: string): Promise<{ message: string; path: string }> => {
    const response = await fetch(
      `${API_BASE}/api/resource/output-pvc/${resourceId}/browser/node?path=${encodeURIComponent(path)}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },
};
