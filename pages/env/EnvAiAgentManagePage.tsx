import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Play, Plus, Power, RefreshCw, Save, Settings2, Trash2 } from 'lucide-react';

import { api } from '../../api/api';
import { AiHelperService, ProjectAiAgentItem } from '../../types/types';
import { useUiFeedback } from '../../components/UiFeedback';
import { EmptyState, HealthBadge, JsonBlock, prettyJson, uniqueValues, useAiHelpers, useProjectAiAgents } from './ai-agent/shared';

const defaultCreateForm = {
  agent_id: '',
  backend_type: 'claude',
  command: '',
  args: '[]',
  env: '{}',
  enabled: true,
  description: '',
};

export const EnvAiAgentManagePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { notify, feedbackNodes } = useUiFeedback();
  const { helpers, reload: reloadHelpers } = useAiHelpers(projectId, notify);
  const { loading, agents, reload } = useProjectAiAgents(projectId, notify);
  const [search, setSearch] = useState('');
  const [nodeFilter, setNodeFilter] = useState('');
  const [backendFilter, setBackendFilter] = useState('');
  const [installedFilter, setInstalledFilter] = useState('');
  const [runningFilter, setRunningFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<ProjectAiAgentItem | null>(null);
  const [selectedHelper, setSelectedHelper] = useState<AiHelperService | null>(null);
  const [busyAction, setBusyAction] = useState('');
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [createHelperKey, setCreateHelperKey] = useState('');
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [editForm, setEditForm] = useState({
    command: '',
    args: '[]',
    enabled: true,
    description: '',
  });
  const [editingEnvText, setEditingEnvText] = useState('{}');

  const nodeOptions = useMemo(() => uniqueValues(agents.map((item) => item.agent_hostname || '').filter(Boolean)), [agents]);
  const backendOptions = useMemo(() => uniqueValues(agents.map((item) => item.backend_type || '').filter(Boolean)), [agents]);
  const helperOptions = useMemo(() => helpers.map((item) => ({
    key: `${item.agent_key}::${item.service_name}`,
    label: `${item.agent_hostname || item.agent_key} · ${item.service_name}`,
    agent_key: item.agent_key,
    service_name: item.service_name,
  })), [helpers]);

  const filteredAgents = useMemo(() => agents.filter((item) => {
    const keyword = search.trim().toLowerCase();
    const byKeyword = !keyword || [item.agent_hostname, item.service_name, item.agent_id, item.backend_type].join(' ').toLowerCase().includes(keyword);
    const byNode = !nodeFilter || item.agent_hostname === nodeFilter;
    const byBackend = !backendFilter || item.backend_type === backendFilter;
    const byInstalled = !installedFilter || String(Boolean(item.installed)) === installedFilter;
    const byRunning = !runningFilter || String(Boolean(item.running)) === runningFilter;
    const byActive = !activeFilter || String(Boolean(item.active)) === activeFilter;
    return byKeyword && byNode && byBackend && byInstalled && byRunning && byActive;
  }), [agents, search, nodeFilter, backendFilter, installedFilter, runningFilter, activeFilter]);

  useEffect(() => {
    if (!selectedKey && filteredAgents.length > 0) {
      setSelectedKey(`${filteredAgents[0].agent_key}::${filteredAgents[0].service_name}::${filteredAgents[0].agent_id}`);
    }
  }, [filteredAgents, selectedKey]);

  useEffect(() => {
    if (!createHelperKey && helperOptions.length > 0) {
      setCreateHelperKey(helperOptions[0].key);
    }
  }, [helperOptions, createHelperKey]);

  useEffect(() => {
    if (!selectedKey) {
      setSelectedAgent(null);
      setSelectedHelper(null);
      return;
    }
    const [agentKey = '', serviceName = '', agentId = ''] = selectedKey.split('::');
    const nextAgent = agents.find((item) => item.agent_key === agentKey && item.service_name === serviceName && item.agent_id === agentId) || null;
    setSelectedAgent(nextAgent);
    if (nextAgent) {
      setEditForm({
        command: nextAgent.command || '',
        args: prettyJson(nextAgent.args || []),
        enabled: !!nextAgent.enabled,
        description: nextAgent.description || '',
      });
      setEditingEnvText(prettyJson(nextAgent.env || {}));
      void loadHelper(nextAgent.agent_key, nextAgent.service_name, nextAgent.agent_id);
    }
  }, [selectedKey, agents]);

  const loadHelper = async (agentKey: string, serviceName: string, focusAgentId?: string) => {
    try {
      const detail = await api.environment.getAiHelperDetail(projectId, agentKey, serviceName);
      setSelectedHelper(detail);
      const focused = (detail.agents || []).find((item) => item.agent_id === focusAgentId);
      if (focused) {
        setEditingEnvText(prettyJson(focused.env || {}));
      }
    } catch (error: any) {
      notify(`加载 Agent 所属 helper 详情失败: ${error?.message || error}`, 'error');
    }
  };

  const refreshAll = async () => {
    await Promise.all([reloadHelpers(false), reload(false)]);
    if (selectedAgent) {
      await loadHelper(selectedAgent.agent_key, selectedAgent.service_name, selectedAgent.agent_id);
    }
  };

  const runAgentAction = async (action: 'activate' | 'start' | 'stop' | 'delete', agent: ProjectAiAgentItem) => {
    setBusyAction(`${action}:${agent.agent_id}`);
    try {
      if (action === 'delete') {
        await api.environment.deleteAiHelperAgent(projectId, agent.agent_key, agent.service_name, agent.agent_id);
      } else {
        await api.environment.runAiHelperAgentAction(projectId, agent.agent_key, agent.service_name, agent.agent_id, action);
      }
      notify(`AI Agent ${action === 'delete' ? '已删除' : '操作成功'}`, 'success');
      await refreshAll();
    } catch (error: any) {
      notify(`AI Agent 操作失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const saveAgent = async () => {
    if (!selectedAgent) return;
    setBusyAction(`update:${selectedAgent.agent_id}`);
    try {
      await api.environment.updateAiHelperAgent(projectId, selectedAgent.agent_key, selectedAgent.service_name, selectedAgent.agent_id, {
        backend_type: selectedAgent.backend_type,
        command: editForm.command,
        args: JSON.parse(editForm.args || '[]'),
        enabled: !!editForm.enabled,
        description: editForm.description,
      });
      notify('AI Agent 已更新', 'success');
      await refreshAll();
    } catch (error: any) {
      notify(`更新 AI Agent 失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const saveEnv = async () => {
    if (!selectedAgent) return;
    setBusyAction(`env:${selectedAgent.agent_id}`);
    try {
      await api.environment.replaceAiHelperAgentEnv(projectId, selectedAgent.agent_key, selectedAgent.service_name, selectedAgent.agent_id, JSON.parse(editingEnvText || '{}'));
      notify('环境变量已保存', 'success');
      await refreshAll();
    } catch (error: any) {
      notify(`保存环境变量失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const createAgent = async () => {
    const helper = helperOptions.find((item) => item.key === createHelperKey);
    if (!helper) {
      notify('请先选择一个 helper 服务', 'error');
      return;
    }
    setBusyAction('create-agent');
    try {
      await api.environment.createAiHelperAgent(projectId, helper.agent_key, helper.service_name, {
        agent_id: createForm.agent_id,
        backend_type: createForm.backend_type,
        command: createForm.command || createForm.backend_type,
        args: JSON.parse(createForm.args || '[]'),
        env: JSON.parse(createForm.env || '{}'),
        enabled: !!createForm.enabled,
        description: createForm.description,
      });
      notify('AI Agent 已创建', 'success');
      setCreateForm(defaultCreateForm);
      setShowCreateAgent(false);
      await refreshAll();
    } catch (error: any) {
      notify(`创建 AI Agent 失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      {feedbackNodes}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Agent 管理</h1>
          <p className="mt-1 text-sm text-slate-500">从项目级 AI Agent 列表切入，完成创建、编辑、删除、启动、停止、激活与环境变量明文管理。</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateAgent((v) => !v)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">新增 AI Agent</button>
          <button onClick={() => void refreshAll()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><RefreshCw size={16} />刷新</button>
        </div>
      </div>

      {showCreateAgent ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-900">新增 AI Agent</div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select value={createHelperKey} onChange={(e) => setCreateHelperKey(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm xl:col-span-3">
              {helperOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <input value={createForm.agent_id} onChange={(e) => setCreateForm((prev) => ({ ...prev, agent_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="agent_id" />
            <select value={createForm.backend_type} onChange={(e) => setCreateForm((prev) => ({ ...prev, backend_type: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="claude">claude</option>
              <option value="codex">codex</option>
              <option value="opencode">opencode</option>
              <option value="claude-a2a">claude-a2a</option>
            </select>
            <input value={createForm.command} onChange={(e) => setCreateForm((prev) => ({ ...prev, command: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="command，留空默认 backend_type" />
            <input value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" placeholder="description" />
            <textarea value={createForm.args} onChange={(e) => setCreateForm((prev) => ({ ...prev, args: e.target.value }))} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono md:col-span-1 xl:col-span-1" placeholder='args JSON，例如 ["serve"]' />
            <textarea value={createForm.env} onChange={(e) => setCreateForm((prev) => ({ ...prev, env: e.target.value }))} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono md:col-span-1 xl:col-span-2" placeholder='env JSON，例如 {"OPENAI_API_KEY":"..."}' />
            <label className="flex items-center gap-2 text-sm text-slate-700 xl:col-span-3"><input type="checkbox" checked={createForm.enabled} onChange={(e) => setCreateForm((prev) => ({ ...prev, enabled: e.target.checked }))} />默认启用</label>
            <button onClick={() => void createAgent()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white xl:col-span-3">
              {busyAction === 'create-agent' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}创建 AI Agent
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-1">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="搜索节点、helper、agent_id、backend" />
            <select value={nodeFilter} onChange={(e) => setNodeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">全部节点</option>{nodeOptions.map((node) => <option key={node} value={node}>{node}</option>)}</select>
            <select value={backendFilter} onChange={(e) => setBackendFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">全部后端</option>{backendOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <select value={installedFilter} onChange={(e) => setInstalledFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Installed 全部</option><option value="true">已安装</option><option value="false">未安装</option></select>
            <select value={runningFilter} onChange={(e) => setRunningFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Running 全部</option><option value="true">运行中</option><option value="false">已停止</option></select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Active 全部</option><option value="true">已激活</option><option value="false">未激活</option></select>
          </div>
          <div className="mt-4 space-y-2 max-h-[920px] overflow-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" />加载中...</div>
            ) : filteredAgents.length === 0 ? (
              <EmptyState text="当前筛选条件下没有 AI Agent。" />
            ) : filteredAgents.map((agent) => {
              const key = `${agent.agent_key}::${agent.service_name}::${agent.agent_id}`;
              const selected = key === selectedKey;
              return (
                <button key={key} onClick={() => setSelectedKey(key)} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{agent.agent_id}</div>
                      <div className="mt-1 text-xs text-slate-500">{agent.agent_hostname} · {agent.service_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{agent.backend_type}</div>
                    </div>
                    <HealthBadge status={agent.health_status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.16em]">
                    <span className={agent.installed ? 'text-green-600' : 'text-slate-400'}>{agent.installed ? 'INSTALLED' : 'MISSING'}</span>
                    <span className={agent.running ? 'text-emerald-600' : 'text-slate-400'}>{agent.running ? 'RUNNING' : 'STOPPED'}</span>
                    <span className={agent.active ? 'text-blue-600' : 'text-slate-400'}>{agent.active ? 'ACTIVE' : 'INACTIVE'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedAgent ? (
            <EmptyState text="请先从左侧选择一个 AI Agent。" />
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">AI Agent</div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{selectedAgent.agent_id}</h2>
                  <div className="mt-2 text-sm text-slate-600">{selectedAgent.agent_hostname} · {selectedAgent.service_name}</div>
                  <div className="mt-1 text-xs text-slate-500">{selectedAgent.backend_type} · {selectedAgent.command || '-'}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void runAgentAction('activate', selectedAgent)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><Play size={14} />激活</button>
                  <button onClick={() => void runAgentAction('start', selectedAgent)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><Play size={14} />启动</button>
                  <button onClick={() => void runAgentAction('stop', selectedAgent)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><Power size={14} />停止</button>
                  <button onClick={() => void runAgentAction('delete', selectedAgent)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"><Trash2 size={14} />删除</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-bold text-slate-900">基础配置</div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input value={editForm.command} onChange={(e) => setEditForm((prev) => ({ ...prev, command: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="command" />
                      <textarea value={editForm.args} onChange={(e) => setEditForm((prev) => ({ ...prev, args: e.target.value }))} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono md:col-span-2" placeholder='args JSON' />
                      <input value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="description" />
                      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2"><input type="checkbox" checked={editForm.enabled} onChange={(e) => setEditForm((prev) => ({ ...prev, enabled: e.target.checked }))} />启用</label>
                      <button onClick={() => void saveAgent()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">{busyAction === `update:${selectedAgent.agent_id}` ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}保存配置</button>
                    </div>
                  </div>
                  <JsonBlock title="能力与健康" value={{ health: selectedAgent.health || {}, capabilities: selectedAgent.capabilities || {} }} />
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900">环境变量</div>
                      <button onClick={() => void saveEnv()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{busyAction === `env:${selectedAgent.agent_id}` ? <Loader2 size={15} className="animate-spin" /> : <Settings2 size={15} />}保存环境变量</button>
                    </div>
                    <textarea value={editingEnvText} onChange={(e) => setEditingEnvText(e.target.value)} rows={16} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" />
                  </div>
                  <JsonBlock title="所属 Helper 信息" value={{
                    agent_key: selectedAgent.agent_key,
                    service_name: selectedAgent.service_name,
                    agent_hostname: selectedAgent.agent_hostname,
                    agent_ip: selectedAgent.agent_ip,
                    helper_tags: selectedAgent.helper_tags,
                    helper_health_status: selectedAgent.health_status,
                    image: selectedAgent.image,
                  }} />
                </div>
              </div>

              {selectedHelper ? <JsonBlock title="当前 Helper 详情摘要" value={{
                service_name: selectedHelper.service_name,
                active_agent_id: selectedHelper.active_agent_id,
                ai_agent_count: selectedHelper.ai_agent_count,
                tags: selectedHelper.tags,
                health: selectedHelper.health,
              }} /> : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
