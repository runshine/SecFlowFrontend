
import { API_BASE, handleResponse, getHeaders } from './base';

export const resourcesApi = {
  list: async (projectId: string, resourceType: string) => {
    const response = await fetch(
      `${API_BASE}/api/resource/list?project_id=${projectId}&resource_type=${resourceType}`, 
      { headers: getHeaders() }
    );
    return handleResponse(response);
  }
};
