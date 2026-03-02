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
    const message = errorData.detail || errorData.error || errorData.message || `API Error (${response.status})`;
    const error = new Error(message);
    if (errorData.code) (error as any).code = errorData.code;
    if (errorData.details) (error as any).details = errorData.details;
    throw error;
  }
  return response.json();
};