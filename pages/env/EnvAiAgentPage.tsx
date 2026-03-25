import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Brain, Loader2, Play, Power, Plus, RefreshCw, Save, Send, Server, Settings2, Trash2 } from 'lucide-react';

import { api } from '../../api/api';
import { AiAgentItem, AiAgentSession, AiBatchRound, AiBatchSession, AiHelperService } from '../../types/types';
import { useUiFeedback } from '../../components/UiFeedback';

const prettyJson = (value: any) => JSON.stringify(value ?? {}, null, 2);

export const EnvAiAgentPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { notify, feedbackNodes } = useUiFeedback();
  const [loading, setLoading] = useState(true);
  const [helpers, setHelpers] = useState<AiHelperService[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [selectedHelper, setSelectedHelper] = useState<AiHelperService | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<AiAgentSession[]>([]);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [nodeFilter, setNodeFilter] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agentForm, setAgentForm] = useState({
    agent_id: '',
    backend_type: 'claude',
    command: '',
    args: '[]',
    env: '{}',
    enabled: true,
    description: '',
  });
  const [editingEnvAgentId, setEditingEnvAgentId] = useState('');
  const [editingEnvText, setEditingEnvText] = useState('{}');
  const [singleSessionInput, setSingleSessionInput] = useState('');
  const [singleSessionAgentIds, setSingleSessionAgentIds] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [currentSession, setCurrentSession] = useState<AiAgentSession | null>(null);
  const [batchId, setBatchId] = useState('');
  const [batchDetail, setBatchDetail] = useState<AiBatchSession | null>(null);
  const [batchRounds, setBatchRounds] = useState<AiBatchRound[]>([]);
  const [batchInput, setBatchInput] = useState('');

  const filteredHelpers = useMemo(() => {
    return helpers.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const byKeyword = !keyword || [item.agent_hostname, item.service_name, item.agent_key].join(' ').toLowerCase().includes(keyword);
      const byHealth = !healthFilter || item.health_status === healthFilter;
      const byNode = !nodeFilter || item.agent_hostname === nodeFilter;
      return byKeyword && byHealth && byNode;
    });
  }, [helpers, search, healthFilter, nodeFilter]);

  const nodeOptions = useMemo(() => Array.from(new Set(helpers.map((item) => item.agent_hostname || '').filter(Boolean))).sort(), [helpers]);

  useEffect(() => {
    if (!projectId) return;
    void loadHelpers(true);
  }, [projectId]);

  useEffect(() => {
    if (!selectedKey && filteredHelpers.length > 0) {
      setSelectedKey(`${filteredHelpers[0].agent_key}::${filteredHelpers[0].service_name}`);
    }
  }, [filteredHelpers, selectedKey]);

  useEffect(() => {
    if (!selectedKey) {
      setSelectedHelper(null);
      return;
    }
    const [agentKey, serviceName] = selectedKey.split('::');
    if (agentKey && serviceName) {
      void loadHelperDetail(agentKey, serviceName);
    }
  }, [selectedKey]);

  const loadHelpers = async (withSpinner = false) => {
    if (!projectId) return;
    if (withSpinner) setLoading(true);
    try {
      const data = await api.environment.listAiHelpers(projectId);
      setHelpers(data.items || []);
    } catch (error: any) {
      notify(`加载 AI Helper 列表失败: ${error?.message || error}`, 'error');
    } finally {
      if (withSpinner) setLoading(false);
    }
  };

  const loadHelperDetail = async (agentKey: string, serviceName: string) => {
    if (!projectId) return;
    try {
      const [detail, sessions] = await Promise.all([
        api.environment.getAiHelperDetail(projectId, agentKey, serviceName),
        api.environment.listAiHelperSessions(projectId, agentKey, serviceName),
      ]);
      setSelectedHelper(detail);
      setSelectedSessions(sessions.items || []);
      if (currentSessionId) {
        try {
          const current = await api.environment.getAiHelperSession(projectId, agentKey, serviceName, currentSessionId);
          setCurrentSession(current);
        } catch {
          setCurrentSession(null);
        }
      }
    } catch (error: any) {
      notify(`加载 AI Helper 详情失败: ${error?.message || error}`, 'error');
    }
  };

  const withHelper = <T,>(fn: (helper: AiHelperService) => Promise<T>) => {
    if (!selectedHelper) {
      notify('请先选择一个 AI Helper 服务', 'error');
      return;
    }
    return fn(selectedHelper);
  };

  const refreshCurrentHelper = async () => {
    if (!selectedHelper) return;
    await loadHelpers(false);
    await loadHelperDetail(selectedHelper.agent_key, selectedHelper.service_name);
  };

  const handleCreateAgent = async () => {
    await withHelper(async (helper) => {
      setBusyAction('create-agent');
      try {
        const payload = {
          agent_id: agentForm.agent_id,
          backend_type: agentForm.backend_type,
          command: agentForm.command || agentForm.backend_type,
          args: JSON.parse(agentForm.args || '[]'),
          env: JSON.parse(agentForm.env || '{}'),
          enabled: agentForm.enabled,
          description: agentForm.description,
        };
        await api.environment.createAiHelperAgent(projectId, helper.agent_key, helper.service_name, payload);
        notify('AI Agent 已创建', 'success');
        setShowCreateAgent(false);
        setAgentForm({ agent_id: '', backend_type: 'claude', command: '', args: '[]', env: '{}', enabled: true, description: '' });
        await refreshCurrentHelper();
      } catch (error: any) {
        notify(`创建 AI Agent 失败: ${error?.message || error}`, 'error');
      } finally {
        setBusyAction('');
      }
    });
  };

  const handleAgentAction = async (agentId: string, action: 'activate' | 'start' | 'stop' | 'delete') => {
    await withHelper(async (helper) => {
      setBusyAction(`${action}:${agentId}`);
      try {
        if (action === 'delete') {
          await api.environment.deleteAiHelperAgent(projectId, helper.agent_key, helper.service_name, agentId);
        } else {
          await api.environment.runAiHelperAgentAction(projectId, helper.agent_key, helper.service_name, agentId, action);
        }
        notify(`AI Agent ${action === 'delete' ? '已删除' : '操作成功'}`, 'success');
        await refreshCurrentHelper();
      } catch (error: any) {
        notify(`AI Agent 操作失败: ${error?.message || error}`, 'error');
      } finally {
        setBusyAction('');
      }
    });
  };

  const handleSaveEnv = async (agentId: string) => {
    await withHelper(async (helper) => {
      setBusyAction(`env:${agentId}`);
      try {
        await api.environment.replaceAiHelperAgentEnv(projectId, helper.agent_key, helper.service_name, agentId, JSON.parse(editingEnvText || '{}'));
        notify('环境变量已保存', 'success');
        setEditingEnvAgentId('');
        await refreshCurrentHelper();
      } catch (error: any) {
        notify(`保存环境变量失败: ${error?.message || error}`, 'error');
      } finally {
        setBusyAction('');
      }
    });
  };

  const handleCreateSingleSession = async () => {
    await withHelper(async (helper) => {
      setBusyAction('single-session');
      try {
        const session = await api.environment.createAiHelperSession(projectId, helper.agent_key, helper.service_name, {
          agent_ids: singleSessionAgentIds.length > 0 ? singleSessionAgentIds : undefined,
          metadata: { source: 'frontend-ai-agent-page' },
        });
        setCurrentSessionId(session.session_id);
        setCurrentSession(session);
        notify('单 Helper 会话已创建', 'success');
        await refreshCurrentHelper();
      } catch (error: any) {
        notify(`创建单 Helper 会话失败: ${error?.message || error}`, 'error');
      } finally {
        setBusyAction('');
      }
    });
  };

  const handleSendSingleMessage = async () => {
    if (!singleSessionInput.trim()) {
      notify('请输入消息内容', 'error');
      return;
    }
    await withHelper(async (helper) => {
      if (!currentSessionId) {
        notify('请先创建会话', 'error');
        return;
      }
      setBusyAction('single-message');
      try {
        const result = await api.environment.sendAiHelperSessionMessage(projectId, helper.agent_key, helper.service_name, currentSessionId, singleSessionInput.trim());
        setCurrentSession(result.session);
        setSingleSessionInput('');
        notify('消息已发送', 'success');
      } catch (error: any) {
        notify(`发送消息失败: ${error?.message || error}`, 'error');
      } finally {
        setBusyAction('');
      }
    });
  };

  const handleCreateBatch = async () => {
    setBusyAction('batch-create');
    try {
      const helpersPayload = filteredHelpers.map((item) => ({
        agent_key: item.agent_key,
        service_name: item.service_name,
      }));
      const result = await api.environment.createAiBatchSession(projectId, {
        helpers: helpersPayload,
        metadata: { source: 'frontend-ai-agent-page' },
      });
      setBatchId(result.batch_id);
      notify('批量会话已创建', 'success');
      const [detail, rounds] = await Promise.all([
        api.environment.getAiBatchSession(result.batch_id),
        api.environment.getAiBatchMessages(result.batch_id),
      ]);
      setBatchDetail(detail);
      setBatchRounds(rounds.items || []);
    } catch (error: any) {
      notify(`创建批量会话失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleRefreshBatch = async () => {
    if (!batchId) return;
    setBusyAction('batch-refresh');
    try {
      const [detail, rounds] = await Promise.all([
        api.environment.getAiBatchSession(batchId),
        api.environment.getAiBatchMessages(batchId),
      ]);
      setBatchDetail(detail);
      setBatchRounds(rounds.items || []);
    } catch (error: any) {
      notify(`刷新批量会话失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleSendBatchMessage = async () => {
    if (!batchId || !batchInput.trim()) {
      notify('请先创建批量会话并输入消息', 'error');
      return;
    }
    setBusyAction('batch-message');
    try {
      await api.environment.sendAiBatchMessage(batchId, batchInput.trim());
      setBatchInput('');
      await handleRefreshBatch();
      notify('批量消息已发送', 'success');
    } catch (error: any) {
      notify(`发送批量消息失败: ${error?.message || error}`, 'error');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      {feedbackNodes}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Agent 管理</h1>
          <p className="text-sm text-slate-500 mt-1">按项目聚合当前节点上的 AI Helper 服务，并管理其内部多个 AI Agent 与会话。</p>
        </div>
        <button
          onClick={() => void loadHelpers(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          刷新
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-bold text-slate-900">批量会话</div>
            <div className="text-xs text-slate-500">默认针对当前筛选结果中的全部 helper 服务创建 batch 会话，并支持多轮输入。</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void handleCreateBatch()} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold inline-flex items-center gap-2">
              {busyAction === 'batch-create' ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
              创建批量会话
            </button>
            <button onClick={() => void handleRefreshBatch()} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold">
              刷新批量状态
            </button>
          </div>
        </div>
        {batchDetail && (
          <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">Batch</div>
              <div className="mt-2 text-sm text-slate-700 break-all">{batchDetail.batch_id}</div>
              <div className="mt-3 text-sm text-slate-600">状态：<span className="font-semibold text-slate-900">{batchDetail.status}</span></div>
              <div className="mt-1 text-sm text-slate-600">目标 helper：<span className="font-semibold text-slate-900">{batchDetail.items.length}</span></div>
              <textarea value={batchInput} onChange={(e) => setBatchInput(e.target.value)} rows={5} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" placeholder="输入要 fanout 给当前 batch 的用户消息" />
              <button onClick={() => void handleSendBatchMessage()} className="mt-3 w-full px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2">
                {busyAction === 'batch-message' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                发送批量消息
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-4">
              <div className="text-sm font-bold text-slate-900">批量结果</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {batchDetail.items.map((item) => (
                  <div key={`${item.agent_key}::${item.service_name}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="text-sm font-semibold text-slate-900">{item.service_name}</div>
                    <div className="text-xs text-slate-500">{item.agent_key}</div>
                    <div className="mt-2 text-xs text-slate-700">状态：{item.status}</div>
                    <div className="text-xs text-slate-700 break-all">Session：{item.helper_session_id || '-'}</div>
                    {item.last_error ? <div className="mt-2 text-xs text-red-600 whitespace-pre-wrap">{item.last_error}</div> : null}
                  </div>
                ))}
              </div>
              <div className="text-sm font-bold text-slate-900">多轮记录</div>
              <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                {batchRounds.length === 0 ? <div className="text-sm text-slate-500">暂无多轮记录</div> : batchRounds.map((round) => (
                  <div key={round.round_no} className="rounded-xl border border-slate-200 p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">Round {round.round_no}</div>
                    <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{round.content}</div>
                    <pre className="mt-3 text-xs bg-slate-950 text-slate-100 rounded-xl p-3 overflow-auto">{prettyJson(round.response)}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="搜索节点、服务名、agent_key" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">全部健康状态</option>
              <option value="healthy">healthy</option>
              <option value="unhealthy">unhealthy</option>
            </select>
            <select value={nodeFilter} onChange={(e) => setNodeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">全部节点</option>
              {nodeOptions.map((node) => <option key={node} value={node}>{node}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-[960px] overflow-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" />加载中...</div>
            ) : filteredHelpers.length === 0 ? (
              <div className="text-sm text-slate-500">当前项目下没有识别到带 `AI_AGENT_HELPER` tag 的 helper 服务。</div>
            ) : filteredHelpers.map((helper) => {
              const key = `${helper.agent_key}::${helper.service_name}`;
              const selected = key === selectedKey;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{helper.service_name}</div>
                      <div className="text-xs text-slate-500 mt-1">{helper.agent_hostname} · {helper.agent_key}</div>
                    </div>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${helper.health_status === 'healthy' ? 'text-green-600' : 'text-amber-600'}`}>{helper.health_status || 'unknown'}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <Server size={12} />
                    <span>{helper.ai_agent_count} 个 AI Agent</span>
                    <Brain size={12} className="ml-2" />
                    <span>Active: {helper.active_agent_id || '-'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          {!selectedHelper ? (
            <div className="text-sm text-slate-500">请先从左侧选择一个 AI Helper 服务。</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">AI Helper</div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{selectedHelper.service_name}</h2>
                  <div className="mt-2 text-sm text-slate-600">{selectedHelper.agent_hostname} · {selectedHelper.agent_ip}</div>
                  <div className="mt-2 text-xs text-slate-500 break-all">Tags: {(selectedHelper.tags || []).join(', ') || '-'}</div>
                </div>
                <button onClick={() => void refreshCurrentHelper()} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold inline-flex items-center gap-2">
                  <RefreshCw size={15} />
                  刷新详情
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">AI Agent 列表</div>
                      <button onClick={() => setShowCreateAgent((v) => !v)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2">
                        <Plus size={15} />
                        新增 AI Agent
                      </button>
                    </div>
                    {showCreateAgent && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50">
                        <input value={agentForm.agent_id} onChange={(e) => setAgentForm((prev) => ({ ...prev, agent_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="agent_id" />
                        <select value={agentForm.backend_type} onChange={(e) => setAgentForm((prev) => ({ ...prev, backend_type: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                          <option value="claude">claude</option>
                          <option value="codex">codex</option>
                          <option value="opencode">opencode</option>
                          <option value="claude-a2a">claude-a2a</option>
                        </select>
                        <input value={agentForm.command} onChange={(e) => setAgentForm((prev) => ({ ...prev, command: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="command，留空默认使用 backend_type" />
                        <input value={agentForm.description} onChange={(e) => setAgentForm((prev) => ({ ...prev, description: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="description" />
                        <textarea value={agentForm.args} onChange={(e) => setAgentForm((prev) => ({ ...prev, args: e.target.value }))} rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" placeholder='args JSON，如 ["serve"]' />
                        <textarea value={agentForm.env} onChange={(e) => setAgentForm((prev) => ({ ...prev, env: e.target.value }))} rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" placeholder='env JSON，如 {"OPENAI_API_KEY":"..."}' />
                        <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
                          <input type="checkbox" checked={agentForm.enabled} onChange={(e) => setAgentForm((prev) => ({ ...prev, enabled: e.target.checked }))} />
                          默认启用
                        </label>
                        <button onClick={() => void handleCreateAgent()} className="md:col-span-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2">
                          {busyAction === 'create-agent' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                          保存 AI Agent
                        </button>
                      </div>
                    )}

                    <div className="mt-4 space-y-3">
                      {(selectedHelper.agents || []).map((agent) => (
                        <div key={agent.agent_id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-bold text-slate-900">{agent.agent_id}</div>
                              <div className="text-xs text-slate-500 mt-1">{agent.backend_type} · {agent.command}</div>
                              <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-black">
                                <span className={agent.active ? 'text-blue-600' : 'text-slate-400'}>{agent.active ? 'ACTIVE' : 'INACTIVE'}</span>
                                <span className={agent.running ? 'text-green-600' : 'text-slate-400'}>{agent.running ? 'RUNNING' : 'STOPPED'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <button onClick={() => void handleAgentAction(agent.agent_id, 'activate')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"><Brain size={12} />激活</button>
                              <button onClick={() => void handleAgentAction(agent.agent_id, 'start')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"><Play size={12} />启动</button>
                              <button onClick={() => void handleAgentAction(agent.agent_id, 'stop')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"><Power size={12} />停止</button>
                              <button onClick={() => void handleAgentAction(agent.agent_id, 'delete')} className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold inline-flex items-center gap-1"><Trash2 size={12} />删除</button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">环境变量</div>
                              <button
                                onClick={() => {
                                  setEditingEnvAgentId(editingEnvAgentId === agent.agent_id ? '' : agent.agent_id);
                                  setEditingEnvText(prettyJson(agent.env || {}));
                                }}
                                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                              >
                                <Settings2 size={12} />
                                编辑
                              </button>
                            </div>
                            {editingEnvAgentId === agent.agent_id ? (
                              <div className="mt-2 space-y-2">
                                <textarea value={editingEnvText} onChange={(e) => setEditingEnvText(e.target.value)} rows={6} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" />
                                <button onClick={() => void handleSaveEnv(agent.agent_id)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2">
                                  {busyAction === `env:${agent.agent_id}` ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                  保存环境变量
                                </button>
                              </div>
                            ) : (
                              <pre className="mt-2 text-xs bg-slate-950 text-slate-100 rounded-xl p-3 overflow-auto">{prettyJson(agent.env || {})}</pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-bold text-slate-900">单 Helper 会话</div>
                    <div className="mt-3 text-xs text-slate-500">可指定一个或多个 AI Agent 参与当前 helper 内会话。</div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <div className="flex flex-wrap gap-2">
                        {(selectedHelper.agents || []).map((agent) => {
                          const checked = singleSessionAgentIds.includes(agent.agent_id);
                          return (
                            <label key={agent.agent_id} className={`px-3 py-2 rounded-xl border text-sm cursor-pointer ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'}`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={checked}
                                onChange={() => setSingleSessionAgentIds((prev) => prev.includes(agent.agent_id) ? prev.filter((item) => item !== agent.agent_id) : [...prev, agent.agent_id])}
                              />
                              {agent.agent_id}
                            </label>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => void handleCreateSingleSession()} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold inline-flex items-center gap-2">
                          {busyAction === 'single-session' ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}
                          创建单 Helper 会话
                        </button>
                        {currentSessionId ? <div className="text-xs text-slate-500 self-center break-all">当前 Session: {currentSessionId}</div> : null}
                      </div>
                      <textarea value={singleSessionInput} onChange={(e) => setSingleSessionInput(e.target.value)} rows={5} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="输入要发送给当前 helper 会话的消息" />
                      <button onClick={() => void handleSendSingleMessage()} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2">
                        {busyAction === 'single-message' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                        发送消息
                      </button>
                      <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">会话列表</div>
                        <div className="mt-3 space-y-2 max-h-[180px] overflow-auto">
                          {selectedSessions.map((session) => (
                            <button key={session.session_id} onClick={async () => {
                              if (!selectedHelper) return;
                              setCurrentSessionId(session.session_id);
                              const detail = await api.environment.getAiHelperSession(projectId, selectedHelper.agent_key, selectedHelper.service_name, session.session_id);
                              setCurrentSession(detail);
                            }} className={`w-full text-left rounded-xl border px-3 py-2 ${currentSessionId === session.session_id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                              <div className="text-xs font-semibold text-slate-900 break-all">{session.session_id}</div>
                              <div className="text-[11px] text-slate-500 mt-1">{(session.agent_ids || []).join(', ') || session.backend || '-'}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      {currentSession && (
                        <div className="rounded-xl border border-slate-200 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">当前会话消息</div>
                          <div className="mt-3 space-y-3 max-h-[320px] overflow-auto">
                            {(currentSession.messages || []).map((message, index) => (
                              <div key={`${message.role}-${index}`} className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${message.role === 'assistant' ? 'bg-slate-100' : 'bg-blue-50'}`}>
                                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">{message.role}</div>
                                {message.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                    <div className="text-sm font-bold text-slate-900">Helper 健康详情</div>
                    <pre className="mt-3 text-xs bg-slate-950 text-slate-100 rounded-xl p-3 overflow-auto">{prettyJson(selectedHelper.health || {})}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
