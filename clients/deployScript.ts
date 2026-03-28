
import { API_BASE, handleResponse, getHeaders } from './base';
import { DeployScriptListResponse } from '../types/types';

export const deployScriptApi = {
  getHealth: async () => 
    handleResponse(await fetch(`${API_BASE}/api/deploy-script/health`, { headers: getHeaders() })),
  
  getReady: async () => 
    handleResponse(await fetch(`${API_BASE}/api/deploy-script/ready`, { headers: getHeaders() })),

  listFiles: async (path: string = ''): Promise<DeployScriptListResponse> => {
    // 处理路径前缀，确保以 / 开头且不重复
    const safePath = path.startsWith('/') ? path : `/${path}`;
    const url = `${API_BASE}/api/deploy-script/files${safePath}`;
    return handleResponse(await fetch(url, { headers: getHeaders() }));
  },

  getContent: async (path: string): Promise<string> => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(`${API_BASE}/api/deploy-script/files${safePath}/content`, { headers: getHeaders() });
    if (!response.ok) throw new Error("无法读取文件内容");
    return response.text();
  },

  downloadUrl: (path: string) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}/api/deploy-script/file${safePath}/download`;
  },

  uploadFile: async (path: string, file: File) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = getHeaders();
    const uploadHeaders: any = { ...headers };
    delete uploadHeaders['Content-Type'];

    return handleResponse(await fetch(`${API_BASE}/api/deploy-script/file${safePath}`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    }));
  },

  batchUpload: async (path: string, files: File[]) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const headers = getHeaders();
    const uploadHeaders: any = { ...headers };
    delete uploadHeaders['Content-Type'];

    return handleResponse(await fetch(`${API_BASE}/api/deploy-script/files${safePath}/batch`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    }));
  },

  editFile: async (path: string, content: string) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return handleResponse(await fetch(`${API_BASE}/api/deploy-script/file${safePath}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    }));
  },

  deletePath: async (path: string) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return handleResponse(await fetch(`${API_BASE}/api/deploy-script/file${safePath}`, {
      method: 'DELETE',
      headers: getHeaders()
    }));
  },

  createDirectory: async (path: string) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return handleResponse(await fetch(`${API_BASE}/api/deploy-script/directory${safePath}`, {
      method: 'POST',
      headers: getHeaders()
    }));
  },

  rename: async (path: string, newName: string) => {
    const safePath = path.startsWith('/') ? path : `/${path}`;
    return handleResponse(await fetch(`${API_BASE}/api/deploy-script/file${safePath}/rename`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ new_name: newName })
    }));
  }
};
