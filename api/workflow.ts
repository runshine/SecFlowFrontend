
import { API_BASE, handleResponse, getHeaders } from './base';
import { AppTemplate, JobTemplate, WorkflowTemplate, WorkflowInstance, WorkflowStatus } from '../types/types';

export const workflowApi = {
  /**
   * 健康检查
   */
  getHealth: async (): Promise<{ status: string; service: string }> => {
    const response = await fetch(`${API_BASE}/api/workflow/health`, { headers: getHeaders() });
    return handleResponse(response);
  },

  // --- App Templates ---
  listAppTemplates: async (params: { scope?: string; project_id?: string } = {}): Promise<{ items: AppTemplate[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/workflow/app-templates?${query}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getAppTemplate: async (id: string): Promise<AppTemplate> => {
    const response = await fetch(`${API_BASE}/api/workflow/app-templates/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createAppTemplate: async (payload: any): Promise<AppTemplate> => {
    const response = await fetch(`${API_BASE}/api/workflow/app-templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  deleteAppTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/workflow/app-templates/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // --- Job Templates ---
  listJobTemplates: async (params: { scope?: string; project_id?: string } = {}): Promise<{ items: JobTemplate[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/workflow/job-templates?${query}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getJobTemplate: async (id: string): Promise<JobTemplate> => {
    const response = await fetch(`${API_BASE}/api/workflow/job-templates/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  createJobTemplate: async (payload: any): Promise<JobTemplate> => {
    const response = await fetch(`${API_BASE}/api/workflow/job-templates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  deleteJobTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/workflow/job-templates/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // --- Workflow Templates ---
  listWorkflowTemplates: async (params: { scope?: string; project_id?: string } = {}): Promise<{ items: WorkflowTemplate[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/workflow/workflow-templates?${query}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getWorkflowTemplate: async (id: string): Promise<WorkflowTemplate> => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-templates/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  deleteWorkflowTemplate: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-templates/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // --- Workflow Instances ---
  listInstances: async (params: { project_id?: string; status?: string } = {}): Promise<{ items: WorkflowInstance[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances?${query}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getInstance: async (id: string): Promise<WorkflowInstance> => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances/${id}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  startInstance: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances/${id}/start`, { method: 'POST', headers: getHeaders() });
    return handleResponse(response);
  },
  stopInstance: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances/${id}/stop`, { method: 'POST', headers: getHeaders() });
    return handleResponse(response);
  },
  deleteInstance: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },
  getInstanceStatus: async (id: string): Promise<{ instance_id: string; status: WorkflowStatus; nodes: any[] }> => {
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances/${id}/status`, { headers: getHeaders() });
    return handleResponse(response);
  },
  getNodeLogs: async (instanceId: string, nodeId: string, params: { tail_lines?: number; container?: string } = {}): Promise<{ logs: string }> => {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE}/api/workflow/workflow-instances/${instanceId}/nodes/${nodeId}/logs?${query}`, { headers: getHeaders() });
    return handleResponse(response);
  }
};
