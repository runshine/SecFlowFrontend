import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Loader2,
  Search,
  Plus,
  Layout,
  Monitor,
  Zap,
  AlertCircle,
  Play,
  Square,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { AgentService } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

type BatchAction = 'start' | 'stop' | 'delete';

export const ServiceMgmtPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [allServices, setAllServices] = useState<AgentService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId) {
      void loadAllServices();
    }
  }, [projectId]);

  const loadAllServices = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.environment.getGlobalServices(projectId, { per_page: 2000 });
      setAllServices(data?.items || []);
      setSelectedServiceIds(new Set());
    } catch (err) {
      console.error('Failed to load global services', err);
    } finally {
      setLoading(false);
    }
  };

  const serviceRowId = (svc: AgentService) => `${svc.agent_key || 'unknown'}::${svc.name}`;

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allServices.filter((svc) => {
      const hitKeyword = !q
        || svc.name.toLowerCase().includes(q)
        || (svc.template_name || '').toLowerCase().includes(q)
        || (svc.agent_hostname || '').toLowerCase().includes(q)
        || (svc.agent_key || '').toLowerCase().includes(q);
      const hitNode = nodeFilter === 'all' || (svc.agent_key || '') === nodeFilter;
      const hitTemplate = templateFilter === 'all' || (svc.template_name || '') === templateFilter;
      return hitKeyword && hitNode && hitTemplate;
    });
  }, [allServices, searchTerm, nodeFilter, templateFilter]);

  const nodeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    allServices.forEach((svc) => {
      if (svc.agent_key) {
        seen.set(svc.agent_key, svc.agent_hostname || svc.agent_key);
      }
    });
    return Array.from(seen.entries()).map(([key, hostname]) => ({ key, hostname }));
  }, [allServices]);

  const templateOptions = useMemo(() => {
    const seen = new Set<string>();
    allServices.forEach((svc) => {
      if (svc.template_name) seen.add(svc.template_name);
    });
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [allServices]);

  const selectedItems = filteredServices.filter((svc) => selectedServiceIds.has(serviceRowId(svc)));

  const toggleSelectService = (svc: AgentService) => {
    const id = serviceRowId(svc);
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (filteredServices.length === 0) return;
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      const allSelected = filteredServices.every((svc) => next.has(serviceRowId(svc)));
      if (allSelected) {
        filteredServices.forEach((svc) => next.delete(serviceRowId(svc)));
      } else {
        filteredServices.forEach((svc) => next.add(serviceRowId(svc)));
      }
      return next;
    });
  };

  const applyBatchAction = async (action: BatchAction, targets: AgentService[]) => {
    if (!projectId || targets.length === 0) return;
    const actionText = action === 'start' ? '启动' : action === 'stop' ? '停止' : '删除';
    if (!window.confirm(`确认批量${actionText} ${targets.length} 个服务实例？`)) return;

    setActionLoading(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const svc of targets) {
        const agentKey = svc.agent_key || '';
        if (!agentKey) {
          fail += 1;
          continue;
        }
        try {
          if (action === 'start') {
            await api.environment.startAgentService(agentKey, svc.name);
          } else if (action === 'stop') {
            await api.environment.stopAgentService(agentKey, svc.name);
          } else {
            await api.environment.deleteAgentService(agentKey, svc.name);
          }
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      alert(`批量${actionText}完成：成功 ${ok}，失败 ${fail}`);
      await loadAllServices();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteByTemplate = async () => {
    if (templateFilter === 'all') {
      alert('请先选择模板过滤条件');
      return;
    }
    const targets = filteredServices.filter((svc) => (svc.template_name || '') === templateFilter);
    await applyBatchAction('delete', targets);
  };

  if (loading && projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 animate-in fade-in">
        <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">正在加载项目服务实例...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">集群服务发现</h2>
          <p className="text-slate-500 mt-1 font-medium">服务批量启停删与实例筛选管理</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadAllServices}
            disabled={!projectId}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={20} />
          </button>
          <button disabled className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-900/10 opacity-60">
            <Plus size={18} /> 部署新服务
          </button>
        </div>
      </div>

      {!projectId && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle size={16} /> 请先在顶部菜单选择一个项目
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Layout size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服务实例</p>
            <h3 className="text-3xl font-black text-slate-800">{allServices.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Monitor size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">节点数</p>
            <h3 className="text-3xl font-black text-indigo-600">{nodeOptions.length}</h3>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">模板数</p>
            <p className="text-3xl font-black mt-1">{templateOptions.length}</p>
          </div>
          <Zap className="opacity-20" size={30} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="过滤服务名 / 模板名 / 节点"
            className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/10"
          />
        </div>
        <select
          value={nodeFilter}
          onChange={(e) => setNodeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white"
        >
          <option value="all">全部节点</option>
          {nodeOptions.map((node) => (
            <option key={node.key} value={node.key}>
              {node.hostname} ({node.key.slice(0, 8)}...)
            </option>
          ))}
        </select>
        <select
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white"
        >
          <option value="all">全部模板</option>
          {templateOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-2">
        <button
          onClick={toggleSelectAllFiltered}
          disabled={!projectId || filteredServices.length === 0}
          className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2"
        >
          <CheckSquare size={14} /> 全选筛选结果
        </button>
        <button
          onClick={() => void applyBatchAction('start', selectedItems)}
          disabled={!projectId || actionLoading || selectedItems.length === 0}
          className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} 批量启动
        </button>
        <button
          onClick={() => void applyBatchAction('stop', selectedItems)}
          disabled={!projectId || actionLoading || selectedItems.length === 0}
          className="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Square size={14} /> 批量停止
        </button>
        <button
          onClick={() => void applyBatchAction('delete', selectedItems)}
          disabled={!projectId || actionLoading || selectedItems.length === 0}
          className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 size={14} /> 批量删除
        </button>
        <button
          onClick={() => void handleDeleteByTemplate()}
          disabled={!projectId || actionLoading || templateFilter === 'all'}
          className="px-4 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          按模板删除实例
        </button>
        <div className="text-xs text-slate-500 ml-auto">
          已选 {selectedItems.length} / 当前结果 {filteredServices.length}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-5">选择</th>
              <th className="px-6 py-5">服务标识</th>
              <th className="px-6 py-5">服务模板 (ID/名称)</th>
              <th className="px-6 py-5">承载节点</th>
              <th className="px-6 py-5">网络暴露</th>
              <th className="px-6 py-5">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projectId && filteredServices.map((svc) => {
              const rowId = serviceRowId(svc);
              return (
                <tr key={rowId} className="hover:bg-slate-50 transition-all">
                  <td className="px-4 py-5">
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.has(rowId)}
                      onChange={() => toggleSelectService(svc)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-slate-700">{svc.name}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-mono text-slate-600">
                      {svc.template_id ? `#${svc.template_id}` : '-'} / {svc.template_name || '未识别'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{svc.agent_hostname || '-'}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                        {(svc.agent_key || '').slice(0, 12)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(svc.ports || {}).map(([proto, port]) => (
                        <span key={proto} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">
                          {proto} ➔ {port}
                        </span>
                      ))}
                      {Object.keys(svc.ports || {}).length === 0 && (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Isolated</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={svc.status} />
                  </td>
                </tr>
              );
            })}
            {(!projectId || filteredServices.length === 0) && !loading && (
              <tr>
                <td colSpan={6} className="py-28 text-center">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    {projectId ? '未检索到符合条件的服务实例' : '请先选择项目'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
