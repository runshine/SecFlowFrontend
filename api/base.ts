
export const API_BASE = 'https://secflow.819819.xyz';

export const getHeaders = () => {
  const token = localStorage.getItem('secflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || errorData.error || `API Error (${response.status})`);
  }
  return response.json();
};
