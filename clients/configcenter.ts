import { API_BASE, getHeaders, handleResponse } from './base';

const parseSseChunk = (rawChunk: string): any[] => {
  return rawChunk
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

export const configCenterApi = {
  getHealth: async (): Promise<{ status: string; service: string }> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/health`, { headers: getHeaders() })),

  listLlmProviders: async (): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers`, { headers: getHeaders() })),

  getLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}`, { headers: getHeaders() })),

  createLlmProvider: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  testLlmProvider: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/test`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  listLlmProviderModels: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/models`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ provider_key: providerKey }),
    })),

  chatWithLlmProviders: async (payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  streamChatWithLlmProviders: async (
    payload: any,
    handlers: {
      onEvent: (event: any) => void;
      onDone?: () => void;
    }
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/chat?stream=true`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData?.detail?.message || errorData?.detail || errorData?.message || '发送消息失败');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('浏览器当前不支持流式响应读取');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      parts.forEach((part) => {
        parseSseChunk(part + '\n\n').forEach((event) => handlers.onEvent(event));
      });
    }

    if (buffer.trim()) {
      parseSseChunk(buffer).forEach((event) => handlers.onEvent(event));
    }
    handlers.onDone?.();
  },

  updateLlmProvider: async (providerKey: string, payload: any): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })),

  enableLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}/enable`, {
      method: 'POST',
      headers: getHeaders(),
    })),

  disableLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}/disable`, {
      method: 'POST',
      headers: getHeaders(),
    })),

  setDefaultLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}/set-default`, {
      method: 'POST',
      headers: getHeaders(),
    })),

  deleteLlmProvider: async (providerKey: string): Promise<any> =>
    handleResponse(await fetch(`${API_BASE}/api/configcenter/admin/llm/providers/${encodeURIComponent(providerKey)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })),
};
