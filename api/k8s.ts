
import { API_BASE, handleResponse, getHeaders } from './base';

export const k8sApi = {
  // --- Pod Operations ---
  getPods: async (projectId: string, labelSelector?: string): Promise<{ items: any[]; total: number }> => {
    const params = new URLSearchParams({ project_id: projectId });
    if (labelSelector) params.append('label_selector', labelSelector);
    const response = await fetch(`${API_BASE}/api/k8s/pods?${params}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPod: async (projectId: string, podName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/pods/${podName}?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPodLogs: async (projectId: string, podName: string, params: { container?: string; tail_lines?: number; previous?: boolean } = {}): Promise<{ logs: string }> => {
    const query = new URLSearchParams({ project_id: projectId, ...params as any }).toString();
    const response = await fetch(`${API_BASE}/api/k8s/pods/${podName}/logs?${query}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPodEvents: async (projectId: string, podName: string): Promise<{ pod_name: string; events: any[] }> => {
    const response = await fetch(`${API_BASE}/api/k8s/pods/${podName}/events?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPodStatus: async (projectId: string, podName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/pods/${podName}/status?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getPodMetrics: async (projectId: string, podName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/pods/${podName}/metrics?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  // --- Terminal Operations ---
  createTerminalConnection: (projectId: string, podName: string, container?: string, command: string = '/bin/sh'): WebSocket => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_BASE.replace(/^https?:\/\//, '').replace(/^http?:\/\//, '');
    const token = localStorage.getItem('secflow_token');
    let wsUrl = `${wsProtocol}//${wsHost}/api/k8s/ws/pods/${podName}/exec?project_id=${projectId}&command=${encodeURIComponent(command)}`;
    if (container) {
      wsUrl += `&container=${encodeURIComponent(container)}`;
    }
    if (token) {
      wsUrl += `&token=${encodeURIComponent(token)}`;
    }
    return new WebSocket(wsUrl);
  },

  // --- Deployment Operations ---
  getDeployment: async (projectId: string, deploymentName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/deployments/${deploymentName}?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  restartDeployment: async (projectId: string, deploymentName: string): Promise<{ message: string; data: any }> => {
    const response = await fetch(`${API_BASE}/api/k8s/deployments/${deploymentName}/restart?project_id=${projectId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // --- Job Operations ---
  getJob: async (projectId: string, jobName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/jobs/${jobName}?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  recreateJob: async (projectId: string, jobName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/jobs/${jobName}/recreate?project_id=${projectId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // --- Service Operations ---
  getService: async (projectId: string, serviceName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/services/${serviceName}?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  getServiceAccess: async (projectId: string, serviceName: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/api/k8s/services/${serviceName}/access?project_id=${projectId}`, { headers: getHeaders() });
    return handleResponse(response);
  },

  proxyServiceUrl: (projectId: string, serviceName: string, port: number, path: string = '/'): string => {
    return `${API_BASE}/api/k8s/services/${serviceName}/proxy/${port}${path}?project_id=${projectId}`;
  }
};
