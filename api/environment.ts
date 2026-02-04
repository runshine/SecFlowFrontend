
import { API_BASE, handleResponse, getHeaders } from './base';
import { Agent, AgentStats, EnvTemplate, AsyncTask, TaskLog, AgentService, Workspace } from '../types/types';

export const environmentApi = {
  // Workspaces
  getWorkspaces: async (): Promise<{ workspaces: Workspace[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/workspace`, { headers: getHeaders() })),

  // Agents
  getAgents: async (params: { page?: number; per_page?: number; workspace_id?: string } = {}): Promise<{ agents: Agent[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    return handleResponse(await fetch(`${API_BASE}/api/agent/agents?${query}`, { headers: getHeaders() }));
  },
  getAgentStats: async (): Promise<AgentStats> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/stats`, { headers: getHeaders() })),
  getAgentDetail: async (key: string): Promise<Agent> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/${key}`, { headers: getHeaders() })),
  cleanupAgents: async (dryRun = false): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/cleanup`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ dry_run: dryRun }) 
    })),
  refreshAgents: async () => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/refresh`, { method: 'POST', headers: getHeaders() })),

  // Templates
  getTemplates: async (page = 1): Promise<{ templates: EnvTemplate[]; total: number }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates?page=${page}`, { headers: getHeaders() })),
  getTemplateDetail: async (name: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}`, { headers: getHeaders() })),
  getTemplateFiles: async (name: string, path = ''): Promise<{ files: any[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}/files?path=${path}`, { headers: getHeaders() })),
  
  // Corrected endpoint: /api/agent/templates/<name>/files/content
  getTemplateFileContent: async (templateName: string, filePath: string): Promise<{ content: string }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${templateName}/files/content?path=${encodeURIComponent(filePath)}`, { headers: getHeaders() })),
  
  // Corrected method and endpoint: PUT /api/agent/templates/<name>/files/content
  updateTemplateFileContent: async (templateName: string, filePath: string, content: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${templateName}/files/content`, { 
      method: 'PUT', 
      headers: getHeaders(), 
      body: JSON.stringify({ path: filePath, content }) 
    })),

  deleteTemplate: async (name: string) => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}`, { method: 'DELETE', headers: getHeaders() })),

  batchDeleteTemplates: async (names: string[]) => {
    return Promise.all(names.map(name => environmentApi.deleteTemplate(name)));
  },
  
  uploadTemplate: async (formData: FormData) => {
    const headers = getHeaders();
    const uploadHeaders: any = { ...headers };
    delete uploadHeaders['Content-Type'];

    const response = await fetch(`${API_BASE}/api/agent/templates`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });
    return handleResponse(response);
  },

  // Tasks
  getTasks: async (params: { type?: string; status?: string; agent_key?: string } = {}): Promise<{ task: AsyncTask[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    return handleResponse(await fetch(`${API_BASE}/api/agent/task?${query}`, { headers: getHeaders() }));
  },
  getTaskDetail: async (id: string): Promise<AsyncTask> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/${id}`, { headers: getHeaders() })),
  getTaskLogs: async (id: string, page = 1): Promise<{ log: TaskLog[]; total: number }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/${id}/logs?page=${page}`, { headers: getHeaders() })),
  deploy: async (data: { service_name: string; agent_key: string; template_name: string; extra_params?: any }) => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/deploy`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    })),
  undeploy: async (data: { service_name: string; agent_key: string }) => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/undeploy`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    })),

  // Proxies
  getAgentServices: async (key: string): Promise<{ services: AgentService[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/services`, { headers: getHeaders() })),
  getAgentHealth: async (key: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/health`, { headers: getHeaders() })),
};
