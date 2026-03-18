import { API_BASE, handleResponse, getHeaders } from './base';
import { Agent, AgentStats, EnvTemplate, AsyncTask, TaskLog, AgentService, Workspace, DaemonServicesResponse, DaemonServiceLogs, AgentTtydConnectionInfo, AgentIngressRouteInfo } from '../types/types';

const normalizeTask = (raw: any): AsyncTask => ({
  id: raw?.id || raw?.task_id || '',
  type: raw?.type || raw?.task_type || '',
  status: raw?.status || 'pending',
  service_name: raw?.service_name || '',
  progress: typeof raw?.progress === 'number' ? raw.progress : Number(raw?.progress || 0),
  create_time: raw?.create_time || raw?.created_at || '',
  agent_key: raw?.agent_key || '',
});

const normalizeTaskLog = (raw: any): TaskLog => ({
  timestamp: raw?.timestamp || '',
  level: raw?.level || 'INFO',
  message: raw?.message || '',
});

export const environmentApi = {
  // Global Health Check
  getHealth: async (): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE}/api/agent/health`, { headers: getHeaders() });
    return handleResponse(response);
  },

  // System Config
  getExternalIps: async (): Promise<{ external_agent_ips: string[]; count: number }> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/system/external-agent-ips`, { headers: getHeaders() })),

  // Workspaces
  getWorkspaces: async (): Promise<{ workspaces: Workspace[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/workspace`, { headers: getHeaders() })),

  // Agents
  getAgents: async (projectId: string, params: { page?: number; per_page?: number; workspace_id?: string } = {}): Promise<{ agents: Agent[]; total: number }> => {
    const query = new URLSearchParams({ ...params as any, project_id: projectId }).toString();
    return handleResponse(await fetch(`${API_BASE}/api/agent/agents?${query}`, { headers: getHeaders() }));
  },
  getAgentStats: async (projectId: string): Promise<AgentStats> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/stats?project_id=${projectId}`, { headers: getHeaders() })),
  getAgentDetail: async (key: string, projectId: string): Promise<Agent> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/${key}?project_id=${projectId}`, { headers: getHeaders() })),
  cleanupAgents: async (projectId: string, dryRun = false): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/cleanup`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ project_id: projectId, dry_run: dryRun }) 
    })),
  refreshAgents: async () => 
    handleResponse(await fetch(`${API_BASE}/api/agent/agents/refresh`, { method: 'POST', headers: getHeaders() })),

  // Templates (Global, no project_id)
  getTemplates: async (page = 1, perPage = 20): Promise<{ templates: EnvTemplate[]; total: number }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates?page=${page}&per_page=${perPage}`, { headers: getHeaders() })),
  getTemplateDetail: async (name: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}`, { headers: getHeaders() })),
  getTemplateFiles: async (name: string, path = ''): Promise<{ files: any[] }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}/files?path=${path}`, { headers: getHeaders() })),
  
  getTemplateFileContent: async (templateName: string, filePath: string): Promise<{ content: string }> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${templateName}/files/content?path=${encodeURIComponent(filePath)}`, { headers: getHeaders() })),
  
  updateTemplateFileContent: async (templateName: string, filePath: string, content: string): Promise<any> => 
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${templateName}/files/content`, { 
      method: 'PUT', 
      headers: getHeaders(), 
      body: JSON.stringify({ path: filePath, content }) 
    })),

  deleteTemplateFile: async (templateName: string, filePath: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${templateName}/files`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ path: filePath })
    })),

  deleteTemplateDirectory: async (templateName: string, dirPath: string, force = false): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${templateName}/directories`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ path: dirPath, force })
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

  getParsedCompose: async (name: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}/parsed`, { headers: getHeaders() })),

  triggerParse: async (name: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/templates/${name}/parse`, {
      method: 'POST',
      headers: getHeaders()
    })),

  // Tasks
  getTasks: async (projectId: string, params: { type?: string; status?: string; agent_key?: string } = {}): Promise<{ task: AsyncTask[]; total: number }> => {
    const query = new URLSearchParams({ ...params as any, project_id: projectId }).toString();
    const raw = await handleResponse(await fetch(`${API_BASE}/api/agent/task?${query}`, { headers: getHeaders() }));
    const list = (raw?.task || raw?.tasks || raw?.secflow_agent_tasks || []).map((item: any) => normalizeTask(item));
    return {
      ...raw,
      task: list,
      tasks: list,
      total: raw?.total || list.length,
    };
  },
  getTaskDetail: async (id: string, projectId: string): Promise<AsyncTask> => 
    normalizeTask(await handleResponse(await fetch(`${API_BASE}/api/agent/task/${id}?project_id=${projectId}`, { headers: getHeaders() }))),
  getTaskLogs: async (id: string, projectId: string, page = 1): Promise<{ log: TaskLog[]; total: number }> => 
    (async () => {
      const raw = await handleResponse(await fetch(`${API_BASE}/api/agent/task/${id}/logs?page=${page}&project_id=${projectId}`, { headers: getHeaders() }));
      const list = (raw?.log || raw?.logs || []).map((item: any) => normalizeTaskLog(item));
      return {
        ...raw,
        log: list,
        logs: list,
        total: raw?.total || list.length,
      };
    })(),
  deploy: async (data: { service_name: string; agent_key: string; template_name: string; project_id: string; extra_params?: any }) => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/deploy`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    })),
  deployBatch: async (data: { project_id: string; deployments: Array<{ service_name: string; agent_key: string; template_name: string; extra_params?: any }> }) =>
    handleResponse(await fetch(`${API_BASE}/api/agent/task/deploy/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })),
  undeploy: async (data: { service_name: string; agent_key: string; project_id: string }) => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/undeploy`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    })),
  deleteTask: async (id: string, projectId: string) => 
    handleResponse(await fetch(`${API_BASE}/api/agent/task/${id}?project_id=${projectId}`, { 
      method: 'DELETE', 
      headers: getHeaders() 
    })),

  getGlobalServices: async (
    projectId: string,
    params: { page?: number; per_page?: number; status?: string; q?: string; agent_key?: string; include_stale?: boolean } = {}
  ): Promise<{ items: AgentService[]; total: number; page: number; per_page: number; project_id: string }> => {
    const query = new URLSearchParams({
      ...params as any,
      project_id: projectId,
      include_stale: params.include_stale ? 'true' : 'false'
    }).toString();
    return handleResponse(await fetch(`${API_BASE}/api/agent/services/global?${query}`, { headers: getHeaders() }));
  },

  syncGlobalServices: async (data?: { project_id?: string; agent_key?: string; stale_only?: boolean }): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/services/global/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined
    })),

  getGlobalServiceSyncHistory: async (params: { project_id?: string; page?: number; per_page?: number } = {}): Promise<any> => {
    const query = new URLSearchParams({ ...params as any }).toString();
    return handleResponse(await fetch(`${API_BASE}/api/agent/services/global/sync/history${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    }));
  },

  // Proxies
  getAgentServices: async (key: string): Promise<{ services: AgentService[] }> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/services`, { headers: getHeaders() })),
  getAgentHealth: async (key: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/health`, { headers: getHeaders() })),
  getDaemonAgentInfo: async (key: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-agent-info`, { headers: getHeaders() })),
  getDaemonAgentHealth: async (key: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-agent-health`, { headers: getHeaders() })),
  getAgentTtydConnection: async (key: string): Promise<AgentTtydConnectionInfo> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/ttyd/connection`, { headers: getHeaders() })),
  listAgentIngressRoutes: async (key: string, projectId: string): Promise<{ total: number; items: AgentIngressRouteInfo[] }> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/ingress-routes?project_id=${projectId}`, { headers: getHeaders() })),
  createAgentIngressRoute: async (
    key: string,
    data: {
      project_id: string;
      target_port: number;
      host?: string;
      host_prefix?: string;
      path?: string;
      websocket_enabled?: boolean;
      tls_enabled?: boolean;
      force_recreate?: boolean;
      metadata?: Record<string, any>;
    }
  ): Promise<AgentIngressRouteInfo> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/ingress-routes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })),
  deleteAgentIngressRoute: async (key: string, routeId: string, projectId: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/ingress-routes/${routeId}?project_id=${projectId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })),

  // Daemon Services (守护进程服务)
  getDaemonServices: async (key: string): Promise<DaemonServicesResponse> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-services`, { headers: getHeaders() })),

  startDaemonService: async (key: string, serviceName: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-services/${serviceName}/start`, {
      method: 'POST',
      headers: getHeaders()
    })),

  stopDaemonService: async (key: string, serviceName: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-services/${serviceName}/stop`, {
      method: 'POST',
      headers: getHeaders()
    })),

  restartDaemonService: async (key: string, serviceName: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-services/${serviceName}/restart`, {
      method: 'POST',
      headers: getHeaders()
    })),

  getDaemonServiceLogs: async (key: string, serviceName: string, type = 'stdout', lines = 100): Promise<DaemonServiceLogs> =>
    handleResponse(await fetch(`${API_BASE}/api/agent/agent/${key}/daemon-services/${serviceName}/logs?type=${type}&lines=${lines}`, {
      headers: getHeaders()
    })),
};
