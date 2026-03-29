import React, { useEffect, useMemo, useState } from 'react';
import { Bot, BookOpenText, Braces, CheckCircle2, Eye, EyeOff, LayoutPanelTop, Loader2, MessageSquare, Plus, RefreshCw, Save, ShieldAlert, Sparkles, Trash2, Wifi, X } from 'lucide-react';
import { api } from '../clients/api';
import { showConfirm } from '../components/DialogService';
import { LlmProviderDetail, LlmProviderSummary, LlmProviderTestResult, LlmProviderUpsertRequest } from '../types/types';

interface ConfigCenterLlmPageProps {
  onOpenChat: () => void;
}

const normalizeEnvBindings = (envBindings: Record<string, any> | undefined) => {
  return { ...(envBindings || {}) };
};

const normalizeDraft = (draft: Partial<LlmProviderUpsertRequest> | null | undefined): LlmProviderUpsertRequest => ({
  provider_key: String(draft?.provider_key || ''),
  display_name: String(draft?.display_name || ''),
  provider_type: String(draft?.provider_type || 'openai-compatible'),
  enabled: typeof draft?.enabled === 'boolean' ? draft.enabled : true,
  is_default: typeof draft?.is_default === 'boolean' ? draft.is_default : false,
  api_base: String(draft?.api_base || ''),
  model: String(draft?.model || ''),
  api_key: String(draft?.api_key || ''),
  organization: draft?.organization ? String(draft.organization) : '',
  api_version: draft?.api_version ? String(draft.api_version) : '',
  timeout_seconds: typeof draft?.timeout_seconds === 'number' && Number.isFinite(draft.timeout_seconds) ? draft.timeout_seconds : 60,
  max_tokens: typeof draft?.max_tokens === 'number' && Number.isFinite(draft.max_tokens) ? draft.max_tokens : null,
  temperature: typeof draft?.temperature === 'number' && Number.isFinite(draft.temperature) ? draft.temperature : null,
  env_bindings: normalizeEnvBindings(draft?.env_bindings as Record<string, any> | undefined),
  extra_config: draft?.extra_config && typeof draft.extra_config === 'object' && !Array.isArray(draft.extra_config) ? draft.extra_config : {},
  description: draft?.description ? String(draft.description) : '',
});

const stringifyDraft = (draft: LlmProviderUpsertRequest) => JSON.stringify({
  ...draft,
  env_bindings: normalizeEnvBindings(draft.env_bindings),
}, null, 2);

const createEmptyForm = (): LlmProviderUpsertRequest => ({
  provider_key: '',
  display_name: '',
  provider_type: 'openai-compatible',
  enabled: true,
  is_default: false,
  api_base: '',
  model: '',
  api_key: '',
  organization: '',
  api_version: '',
  timeout_seconds: 60,
  max_tokens: null,
  temperature: null,
  env_bindings: {},
  extra_config: {},
  description: '',
});

const providerTypeOptions = [
  'openai-compatible',
  'azure-openai',
  'anthropic',
  'deepseek',
  'qwen',
  'ollama',
  'moonshot',
  'custom',
];

export const ConfigCenterLlmPage: React.FC<ConfigCenterLlmPageProps> = ({ onOpenChat }) => {
  const [providers, setProviders] = useState<LlmProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [form, setForm] = useState<LlmProviderUpsertRequest>(createEmptyForm());
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showSecret, setShowSecret] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [jsonDraft, setJsonDraft] = useState<string>(stringifyDraft(createEmptyForm()));
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<LlmProviderTestResult | null>(null);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showBulkEnvImport, setShowBulkEnvImport] = useState(false);
  const [bulkEnvInput, setBulkEnvInput] = useState('');
  const [refreshNotice, setRefreshNotice] = useState('');

  const selectedSummary = useMemo(
    () => providers.find((item) => item.provider_key === selectedKey) || null,
    [providers, selectedKey]
  );

  const syncSystemEnvBindings = (draft: LlmProviderUpsertRequest) => ({
    ...draft,
    env_bindings: normalizeEnvBindings(draft.env_bindings),
  });

  const syncJsonDraft = (draft: LlmProviderUpsertRequest) => {
    setJsonDraft(stringifyDraft(draft));
  };

  const loadProviders = async (keepSelection = true): Promise<boolean> => {
    setError('');
    setRefreshing(true);
    try {
      const response = await api.configCenter.listLlmProviders();
      const items = response.items || [];
      setProviders(items);
      const nextSelected = keepSelection ? selectedKey : '';
      if (items.length === 0) {
        setSelectedKey('');
        setIsCreating(true);
        const emptyForm = createEmptyForm();
        setForm(emptyForm);
        syncJsonDraft(emptyForm);
      } else if (nextSelected && items.some((item: LlmProviderSummary) => item.provider_key === nextSelected)) {
        await handleSelect(nextSelected);
      } else {
        await handleSelect((items.find((item: LlmProviderSummary) => item.is_default) || items[0]).provider_key);
      }
      return true;
    } catch (err: any) {
      setError(err.message || '加载 LLM 配置失败');
      return false;
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProviders(false);
  }, []);

  useEffect(() => {
    if (!refreshNotice) return;
    const timer = window.setTimeout(() => {
      setRefreshNotice('');
      setMessage((current) => (current === refreshNotice ? '' : current));
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [refreshNotice]);

  const applyDetailToForm = (detail: LlmProviderDetail) => {
    const nextForm = normalizeDraft({
      provider_key: detail.provider_key,
      display_name: detail.display_name,
      provider_type: detail.provider_type,
      enabled: detail.enabled,
      is_default: detail.is_default,
      api_base: detail.api_base,
      model: detail.model,
      api_key: detail.api_key,
      organization: detail.organization || '',
      api_version: detail.api_version || '',
      timeout_seconds: detail.timeout_seconds,
      max_tokens: detail.max_tokens ?? null,
      temperature: detail.temperature ?? null,
      env_bindings: normalizeEnvBindings(detail.env_bindings),
      extra_config: detail.extra_config || {},
      description: detail.description || '',
    });
    setForm(nextForm);
    syncJsonDraft(nextForm);
  };

  const handleSelect = async (providerKey: string) => {
    setError('');
    setMessage('');
    setTestResult(null);
    try {
      const detail = await api.configCenter.getLlmProvider(providerKey);
      setSelectedKey(providerKey);
      setIsCreating(false);
      applyDetailToForm(detail);
    } catch (err: any) {
      setError(err.message || '读取 Provider 详情失败');
    }
  };

  const handleCreateNew = () => {
    setSelectedKey('');
    setIsCreating(true);
    setShowSecret(true);
    setEditorMode('visual');
    setMessage('');
    setError('');
    setTestResult(null);
    const emptyForm = createEmptyForm();
    setForm(emptyForm);
    syncJsonDraft(emptyForm);
  };

  const handleRefresh = async () => {
    setMessage('');
    const ok = await loadProviders(true);
    if (!ok) return;
    const notice = `已从服务端刷新 LLM Provider 列表与当前详情（${new Date().toLocaleTimeString('zh-CN', { hour12: false })}）`;
    setRefreshNotice(notice);
    setMessage(notice);
  };

  const handleSwitchMode = (mode: 'visual' | 'json') => {
    if (mode === editorMode) return;
    if (mode === 'json') {
      syncJsonDraft(form);
      setEditorMode('json');
      return;
    }
    try {
      const parsed = normalizeDraft(JSON.parse(jsonDraft || '{}'));
      setForm(parsed);
      syncJsonDraft(parsed);
      setEditorMode('visual');
      setError('');
    } catch (err: any) {
      setError(err.message || 'JSON 解析失败，请先修正格式');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const sourceForm = editorMode === 'json' ? normalizeDraft(JSON.parse(jsonDraft || '{}')) : form;
      const payload = syncSystemEnvBindings(sourceForm);
      setForm(payload);
      syncJsonDraft(payload);
      setTestResult(null);
      if (isCreating) {
        const created = await api.configCenter.createLlmProvider(payload);
        setMessage(`已创建 LLM Provider: ${created.display_name}`);
        await loadProviders(false);
        await handleSelect(created.provider_key);
      } else {
        const updated = await api.configCenter.updateLlmProvider(selectedKey || form.provider_key, payload);
        setMessage(`已更新 LLM Provider: ${updated.display_name}`);
        await loadProviders(false);
        await handleSelect(updated.provider_key);
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setError('');
    setMessage('');
    setTesting(true);
    try {
      const sourceForm = editorMode === 'json' ? normalizeDraft(JSON.parse(jsonDraft || '{}')) : form;
      if (!String(sourceForm.model || '').trim()) {
        setError('测试前请填写模型');
        setTestResult(null);
        return;
      }
      const payload = syncSystemEnvBindings(sourceForm);
      setForm(payload);
      syncJsonDraft(payload);
      const result = await api.configCenter.testLlmProvider(payload);
      setTestResult(result);
      setMessage(result.ok ? '模型可用性测试成功' : '');
      if (!result.ok && result.error_message) {
        setError(result.error_message);
      }
    } catch (err: any) {
      setTestResult(null);
      setError(err.message || '测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKey) return;
    const confirmed = await showConfirm({
      title: '删除 LLM Provider',
      message: `确认删除 LLM Provider "${selectedKey}" 吗？`,
      confirmText: '确认删除',
      cancelText: '取消',
      danger: true,
    });
    if (!confirmed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.configCenter.deleteLlmProvider(selectedKey);
      setMessage(`已删除 LLM Provider: ${selectedKey}`);
      await loadProviders(false);
    } catch (err: any) {
      setError(err.message || '删除失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!selectedKey || !selectedSummary) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (selectedSummary.enabled) {
        await api.configCenter.disableLlmProvider(selectedKey);
        setMessage(`已禁用 LLM Provider: ${selectedKey}`);
      } else {
        await api.configCenter.enableLlmProvider(selectedKey);
        setMessage(`已启用 LLM Provider: ${selectedKey}`);
      }
      await loadProviders(true);
    } catch (err: any) {
      setError(err.message || '切换启用状态失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedKey) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.configCenter.setDefaultLlmProvider(selectedKey);
      setMessage(`已设置默认 LLM Provider: ${selectedKey}`);
      await loadProviders(true);
    } catch (err: any) {
      setError(err.message || '设置默认失败');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkEnvImport = () => {
    const lines = bulkEnvInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError('请先粘贴要导入的环境变量文本');
      return;
    }

    const imported: Record<string, string> = {};
    for (const line of lines) {
      if (line.startsWith('#')) {
        continue;
      }
      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) {
        setError(`环境变量格式不正确: ${line}`);
        return;
      }
      const key = line.slice(0, separatorIndex).trim().toUpperCase();
      const value = line.slice(separatorIndex + 1);
      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
        setError(`环境变量名不合法: ${key}`);
        return;
      }
      imported[key] = value;
    }

    setForm({
      ...form,
      env_bindings: {
        ...form.env_bindings,
        ...imported,
      },
    });
    setMessage(`已批量导入 ${Object.keys(imported).length} 个环境变量`);
    setError('');
    setBulkEnvInput('');
    setShowBulkEnvImport(false);
  };

  const envEntries = Object.entries(form.env_bindings || {});

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            LLM 对接配置
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            在配置中心统一维护全局 LLM 渠道，让其他微服务可以按需拉取当前可用的模型配置。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            刷新
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10"
          >
            <Plus size={16} />
            新建 Provider
          </button>
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm"
          >
            <MessageSquare size={16} />
            在线聊天
          </button>
          <button
            onClick={() => setShowUsageGuide(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm"
          >
            <BookOpenText size={16} />
            使用指引
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-[2rem] border px-5 py-4 text-sm font-bold ${error ? 'border-red-200 bg-red-50 text-red-600' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[360px,minmax(0,1fr)] gap-6">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">已配置渠道</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{providers.length}</span>
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
            ) : providers.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <p className="text-sm font-black text-slate-600">当前还没有任何 LLM Provider</p>
                <p className="mt-2 text-xs text-slate-400">建议先新增一个默认渠道，例如 OpenAI Compatible 或 Azure OpenAI。</p>
              </div>
            ) : providers.map((item) => (
              <button
                key={item.provider_key}
                onClick={() => void handleSelect(item.provider_key)}
                className={`w-full rounded-[2rem] border p-4 text-left transition-all ${selectedKey === item.provider_key && !isCreating ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100/60' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{item.display_name}</span>
                      {item.is_default && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700">默认</span>}
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-500">{item.provider_key}</p>
                  </div>
                  <div className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${item.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {item.enabled ? 'enabled' : 'disabled'}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.provider_type}</span>
                  <span>{item.model}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">编辑区</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {isCreating ? '新建 LLM Provider' : (form.display_name || form.provider_key || 'LLM Provider')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('visual')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black ${editorMode === 'visual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  <LayoutPanelTop size={14} />
                  可视化编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('json')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black ${editorMode === 'json' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  <Braces size={14} />
                  JSON 编辑
                </button>
              </div>
              {!isCreating && (
                <>
                  <button
                    onClick={() => void handleToggleEnabled()}
                    disabled={saving}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
                  >
                    {selectedSummary?.enabled ? '禁用渠道' : '启用渠道'}
                  </button>
                  <button
                    onClick={() => void handleSetDefault()}
                    disabled={saving || !!selectedSummary?.is_default}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 disabled:opacity-50"
                  >
                    设为默认
                  </button>
                  <button
                    onClick={() => void handleDelete()}
                    disabled={saving}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600"
                  >
                    删除
                  </button>
                </>
              )}
              <button
                onClick={() => void handleTest()}
                disabled={saving || testing}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 disabled:opacity-50"
              >
                {testing ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                测试可用性
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                保存配置
              </button>
            </div>
          </div>

          {editorMode === 'json' ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-black text-slate-900">JSON 配置</h3>
                <p className="mt-1 text-xs text-slate-500">这里展示并编辑当前 Provider 的完整配置对象。切回可视化编辑时会自动解析并同步字段。</p>
              </div>
              <textarea
                value={jsonDraft}
                onChange={(event) => setJsonDraft(event.target.value)}
                rows={28}
                spellCheck={false}
                className="w-full rounded-[2rem] border border-slate-200 bg-slate-950 px-5 py-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
          ) : (
          <>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">渠道标识</label>
              <input value={form.provider_key} onChange={(event) => setForm({ ...form, provider_key: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="openai-prod" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">展示名称</label>
              <input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="OpenAI Production" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">渠道类型</label>
              <select value={form.provider_type} onChange={(event) => setForm({ ...form, provider_type: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500">
                {providerTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">模型</label>
              <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="gpt-4.1-mini" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Base</label>
              <input value={form.api_base} onChange={(event) => setForm({ ...form, api_base: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="https://api.openai.com/v1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Key</label>
              <div className="mt-2 flex gap-3">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.api_key}
                  onChange={(event) => setForm({ ...form, api_key: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="sk-..."
                />
                <button type="button" onClick={() => setShowSecret((current) => !current)} className="rounded-2xl border border-slate-200 px-4 text-slate-500">
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization</label>
              <input value={form.organization || ''} onChange={(event) => setForm({ ...form, organization: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="可选" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Version</label>
              <input value={form.api_version || ''} onChange={(event) => setForm({ ...form, api_version: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="可选" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">超时秒数</label>
              <input type="number" value={form.timeout_seconds} onChange={(event) => setForm({ ...form, timeout_seconds: Number(event.target.value) || 60 })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Tokens</label>
              <input type="number" value={form.max_tokens ?? ''} onChange={(event) => setForm({ ...form, max_tokens: event.target.value ? Number(event.target.value) : null })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="可选" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={form.temperature ?? ''} onChange={(event) => setForm({ ...form, temperature: event.target.value ? Number(event.target.value) : null })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="可选" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">描述</label>
              <textarea value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" placeholder="说明该渠道的用途、区域或限流策略" />
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-500" />
                  环境变量绑定
                </h3>
                <p className="mt-1 text-xs text-slate-500">默认环境变量键会保留为空值，只有你手动填写后才会写入具体内容，密钥仍通过独立字段管理。</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({
                  ...form,
                  env_bindings: {
                    ...form.env_bindings,
                    [`CUSTOM_ENV_${envEntries.length + 1}`]: '',
                  },
                })}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"
              >
                添加变量
              </button>
              <button
                type="button"
                onClick={() => setShowBulkEnvImport((current) => !current)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"
              >
                {showBulkEnvImport ? '收起批量导入' : '批量导入'}
              </button>
            </div>

            {showBulkEnvImport && (
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">批量导入</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  支持按行粘贴 `KEY=value` 文本，导入时会覆盖同名变量。示例：
                  <span className="mt-2 block rounded-xl bg-slate-950 px-3 py-3 font-mono text-[11px] leading-5 text-slate-100">
                    {`ANTHROPIC_AUTH_TOKEN=sk-12345678
ANTHROPIC_BASE_URL=http://127.0.0.1:3456
NO_PROXY=127.0.0.1
DISABLE_TELEMETRY=true
DISABLE_COST_WARNINGS=true
API_TIMEOUT_MS=600000`}
                  </span>
                </p>
                <textarea
                  value={bulkEnvInput}
                  onChange={(event) => setBulkEnvInput(event.target.value)}
                  rows={8}
                  spellCheck={false}
                  placeholder="在这里粘贴多行 KEY=value 文本"
                  className="mt-4 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm leading-6 outline-none focus:border-blue-500"
                />
                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkEnvInput('');
                      setShowBulkEnvImport(false);
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkEnvImport}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-500/20"
                  >
                    导入环境变量
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {envEntries.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs font-medium text-slate-500">
                  当前没有环境变量绑定。环境变量绑定是可选项，可按需手动添加。
                </div>
              )}
              {envEntries.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[220px,1fr,44px] gap-3">
                  <input
                    value={key}
                    onChange={(event) => {
                      const nextEntries = Object.entries(form.env_bindings).map(([entryKey, entryValue]) => (
                        entryKey === key ? [event.target.value.toUpperCase(), entryValue] : [entryKey, entryValue]
                      ));
                      setForm({ ...form, env_bindings: Object.fromEntries(nextEntries) });
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={String(value ?? '')}
                    onChange={(event) => setForm({ ...form, env_bindings: { ...form.env_bindings, [key]: event.target.value } })}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...form.env_bindings };
                      delete next[key];
                      setForm({ ...form, env_bindings: next });
                    }}
                    className="rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <CheckCircle2 size={14} className="text-green-500" />
                可选绑定
              </div>
              <p className="mt-3 text-xs text-slate-600">环境变量绑定完全按需填写，不再预置任何默认项。</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <ShieldAlert size={14} className="text-amber-500" />
                返回策略
              </div>
              <p className="mt-3 text-xs text-slate-600">配置中心不做脱敏处理，请求成功时按原样返回保存过的配置内容。</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Bot size={14} className="text-blue-500" />
                服务消费
              </div>
              <p className="mt-3 text-xs text-slate-600">其他微服务通过机机 Token 调用 `/api/configcenter/service/llm/providers` 获取配置。</p>
            </div>
          </div>
          </>
          )}
          {testResult && (
            <div className={`mt-8 rounded-[2rem] border p-6 ${testResult.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">测试结果</p>
                  <h3 className={`mt-2 text-xl font-black ${testResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {testResult.ok ? '模型可用' : '模型不可用'}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">{testResult.provider_type}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">{testResult.latency_ms} ms</span>
                  {testResult.status_code !== null && testResult.status_code !== undefined && (
                    <span className="rounded-full bg-white px-3 py-1 text-slate-600">HTTP {testResult.status_code}</span>
                  )}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">请求目标</p>
                  <p className="mt-2 break-all font-mono text-xs text-slate-700">{testResult.request_target}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {testResult.ok ? '响应片段' : '错误摘要'}
                  </p>
                  <p className={`mt-2 whitespace-pre-wrap break-words text-sm ${testResult.ok ? 'text-slate-700' : 'text-red-700'}`}>
                    {testResult.ok
                      ? (testResult.response_preview || '测试成功，但上游返回内容为空。')
                      : (testResult.error_message || '测试失败，未返回更多错误信息。')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUsageGuide && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-6" onClick={() => setShowUsageGuide(false)}>
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] shadow-[0_30px_120px_rgba(15,23,42,0.32)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-8 py-7">
              <div>
                <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                  Guide
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">如何获取和使用 LLM 对接配置</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  这个弹窗面向需要消费配置中心的开发者、运维或其它微服务维护者，用来快速说明如何读取系统当前支持的 LLM Provider，以及如何拿到某个 Provider 的完整配置。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUsageGuide(false)}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-400 transition-all hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-6 overflow-y-auto px-8 py-7">
              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">1. 管理员在前端维护 Provider</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  在本页面可以新增、编辑、启停、设为默认、测试可用性，并通过“在线聊天”验证模型的真实响应效果。这里保存的是平台级全局配置，适合被多个微服务统一消费。
                </p>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">2. 其它微服务如何读取已启用的配置</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  业务服务应使用机机 Token 调用配置中心服务接口，而不是调用管理员接口。推荐先读取“已启用 Provider 列表”，再按需要读取某个 Provider 的详细配置。
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">列表接口</p>
                    <code className="mt-3 block whitespace-pre-wrap break-all rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{`GET /api/configcenter/service/llm/providers`}
                    </code>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">详情接口</p>
                    <code className="mt-3 block whitespace-pre-wrap break-all rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{`GET /api/configcenter/service/llm/providers/{provider_key}`}
                    </code>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">3. 推荐的消费顺序</h4>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <p>先调用列表接口，确认当前有哪些启用中的 Provider，以及哪一个是默认 Provider。</p>
                  <p>如果你的服务只需要使用默认渠道，就读取 `default_provider_key` 对应的详情。</p>
                  <p>如果你的服务支持多模型切换，可以缓存列表结果，让调用方按 `provider_key` 选择具体模型渠道。</p>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">4. 典型返回内容里有哪些关键字段</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p><span className="font-black text-slate-900">api_base</span>：上游 LLM API 地址</p>
                    <p className="mt-2"><span className="font-black text-slate-900">model</span>：默认模型名，可为空</p>
                    <p className="mt-2"><span className="font-black text-slate-900">api_key</span>：受控返回的访问密钥</p>
                    <p className="mt-2"><span className="font-black text-slate-900">provider_type</span>：渠道协议类型</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p><span className="font-black text-slate-900">timeout_seconds</span>：请求超时建议</p>
                    <p className="mt-2"><span className="font-black text-slate-900">max_tokens / temperature</span>：默认推理参数</p>
                    <p className="mt-2"><span className="font-black text-slate-900">env_bindings</span>：可选环境变量映射</p>
                    <p className="mt-2"><span className="font-black text-slate-900">extra_config</span>：扩展字段</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">5. curl 示例</h4>
                <code className="mt-4 block whitespace-pre-wrap break-all rounded-[1.5rem] bg-slate-950 px-5 py-4 text-xs leading-6 text-slate-100">
{`curl -H "Authorization: Bearer <machine-token>" \\
  https://secflow.sothothv2.com/api/configcenter/service/llm/providers

curl -H "Authorization: Bearer <machine-token>" \\
  https://secflow.sothothv2.com/api/configcenter/service/llm/providers/openai-prod`}
                </code>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">6. 列表接口实际响应 Example</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  下面这个 example 来自当前环境中的真实列表响应，返回了当前已启用的两个 Provider：默认的
                  <span className="mx-1 rounded-full bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">local_litellm</span>
                  和
                  <span className="mx-1 rounded-full bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">local_ccr</span>
                  。
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">请求</p>
                    <code className="mt-3 block whitespace-pre-wrap break-all rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{`GET /api/configcenter/service/llm/providers
Authorization: Bearer <machine-token>`}
                    </code>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">响应</p>
                    <code className="mt-3 block max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{`{
  "total": 2,
  "default_provider_key": "local_litellm",
  "items": [
    {
      "provider_key": "local_litellm",
      "display_name": "LOCAL_LITELLM",
      "provider_type": "openai-compatible",
      "enabled": true,
      "is_default": true,
      "api_base": "http://172.31.29.10",
      "model": "MiniMax/MiniMax-M2.5",
      "api_key": "sk-12345678",
      "organization": null,
      "api_version": null,
      "timeout_seconds": 60,
      "max_tokens": null,
      "temperature": null,
      "env_bindings": {},
      "extra_config": {},
      "description": null
    },
    {
      "provider_key": "local_ccr",
      "display_name": "LOCAL_CCR",
      "provider_type": "anthropic",
      "enabled": true,
      "is_default": false,
      "api_base": "http://172.31.29.10:3456/v1",
      "model": "claude-sonnet-4-6",
      "api_key": "sk-12345678",
      "organization": null,
      "api_version": null,
      "timeout_seconds": 60,
      "max_tokens": null,
      "temperature": null,
      "env_bindings": {
        "NO_PROXY": "172.31.29.10",
        "API_TIMEOUT_MS": "600000",
        "DISABLE_TELEMETRY": "true",
        "ANTHROPIC_BASE_URL": "http://172.31.29.10:3456",
        "ANTHROPIC_AUTH_TOKEN": "sk-12345678",
        "DISABLE_COST_WARNINGS": "true"
      },
      "extra_config": {},
      "description": null
    }
  ]
}`}
                    </code>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-black text-slate-900">7. LOCAL_CCR 实际响应 Example</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  下面这个 example 来自当前环境中的真实 Provider：
                  <span className="mx-1 rounded-full bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">display_name=LOCAL_CCR</span>
                  ，对应的
                  <span className="mx-1 rounded-full bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">provider_key=local_ccr</span>
                  。
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">请求</p>
                    <code className="mt-3 block whitespace-pre-wrap break-all rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{`GET /api/configcenter/service/llm/providers/local_ccr
Authorization: Bearer <machine-token>`}
                    </code>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">响应</p>
                    <code className="mt-3 block max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
{`{
  "provider_key": "local_ccr",
  "display_name": "LOCAL_CCR",
  "provider_type": "anthropic",
  "enabled": true,
  "is_default": false,
  "api_base": "http://172.31.29.10:3456/v1",
  "model": "claude-sonnet-4-6",
  "api_key": "sk-12345678",
  "organization": null,
  "api_version": null,
  "timeout_seconds": 60,
  "max_tokens": null,
  "temperature": null,
  "env_bindings": {
    "NO_PROXY": "172.31.29.10",
    "API_TIMEOUT_MS": "600000",
    "DISABLE_TELEMETRY": "true",
    "ANTHROPIC_BASE_URL": "http://172.31.29.10:3456",
    "ANTHROPIC_AUTH_TOKEN": "sk-12345678",
    "DISABLE_COST_WARNINGS": "true"
  },
  "extra_config": {},
  "description": null,
  "created_at": "2026-03-29T15:04:16",
  "updated_at": "2026-03-29T23:12:12"
}`}
                    </code>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
                <h4 className="text-sm font-black text-amber-800">8. 使用建议</h4>
                <div className="mt-3 space-y-3 text-sm leading-7 text-amber-900">
                  <p>不要把管理员接口暴露给业务服务，业务服务只应走 `/service/llm/providers`。</p>
                  <p>如果服务要长期使用配置，建议本地做短期缓存，并在失败时重新拉取配置。</p>
                  <p>如果需要验证某个 Provider 是否可用，可以在本页面先使用“测试可用性”或“在线聊天”。</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
