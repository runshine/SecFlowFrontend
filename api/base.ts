export const API_BASE = 'https://secflow.819819.xyz';

export const getHeaders = () => {
  const token = localStorage.getItem('secflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const handleResponse = async (response: Response) => {
  // 处理 401 Token 失效
  if (response.status === 401) {
    const isLoginRequest = response.url.includes('/api/auth/login');
    if (!isLoginRequest) {
      // 清除本地存储
      localStorage.removeItem('secflow_token');
      // 派发全局事件通知 UI 层
      window.dispatchEvent(new Event('secflow-unauthorized'));
      throw new Error('登录会话已过期，请重新登录');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || errorData.error || `API Error (${response.status})`);
  }
  return response.json();
};