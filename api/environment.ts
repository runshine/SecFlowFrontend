
import { API_BASE, handleResponse, getHeaders } from './base';

export const environmentApi = {
  getAgents: async () => handleResponse(await fetch(`${API_BASE}/api/agents`, { headers: getHeaders() })),
  getTemplates: async () => handleResponse(await fetch(`${API_BASE}/api/templates`, { headers: getHeaders() })),
  getTasks: async () => handleResponse(await fetch(`${API_BASE}/api/tasks`, { headers: getHeaders() }))
};
