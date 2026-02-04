
import { API_BASE, handleResponse, getHeaders } from './base';
import { UserInfo } from '../types/types';

export const authApi = {
  login: async (credentials: any) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },
  validateToken: async (): Promise<UserInfo> => {
    const response = await fetch(`${API_BASE}/api/auth/validate-human-token`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  }
};
