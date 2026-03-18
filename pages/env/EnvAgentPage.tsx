import React, { useState, useEffect, useMemo } from 'react';
import {
  Monitor,
  RefreshCw,
  Loader2,
  Trash2,
  Search,
  Activity,
  ChevronRight,
  Server,
  AlertCircle,
  Zap,
  Globe,
  Plus,
  Terminal,
  Copy,
  Check,
  CheckSquare,
  X,
  Sparkles,
  Command
} from 'lucide-react';
import { Agent, EnvTemplate } from '../../types/types';
import { api } from '../../api/api';
import { AgentDetailPage } from './AgentDetailPage';

// Specialized Live Indicator Component
const LiveIndicator: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase();
  if (s === 'online') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">LIVE / ONLINE</span>
      </div>
    );
  }
  if (s === 'offline' || s === 'timeout') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.toUpperCase()}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
      <div className="h-2 w-2 rounded-full bg-red-500"></div>
      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{status?.toUpperCase() || 'UNKNOWN'}</span>
    </div>
  );
};

export const EnvAgentPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [selectedAgentKeys, setSelectedAgentKeys] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isCleaning, setIsCleaning] = useState(false);
  const [forceSyncing, setForceSyncing] = useState(false);

  // Integration Modals State
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [integrationType, setIntegrationType] = useState<'manual' | 'auto' | null>(null);
  const [copied, setCopied] = useState(false);
  
  // External IPs State
  const [externalIps, setExternalIps] = useState<string[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [ipsLoading, setIpsLoading] = useState(false);

  // Batch deploy states
  const [isBatchDeployModalOpen, setIsBatchDeployModalOpen] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [deployingBatch, setDeployingBatch] = useState(false);
  const [templates, setTemplates] = useState<EnvTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateNames, setSelectedTemplateNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  useEffect(() => {
    if (integrationType === 'manual' && externalIps.length === 0) {
      loadExternalIps();
    }
  }, [integrationType]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const agentsData = await api.environment.getAgents(projectId, { per_page: 2000 });
      const nextAgents = agentsData.agents || [];
      setAgents(nextAgents);
      setSelectedAgentKeys(prev => {
        const available = new Set(nextAgents.map(a => a.key));
        const prevKeys = Array.from(prev.values()) as string[];
        return new Set(prevKeys.filter(k => available.has(k)));
      });
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setLoading(false);
    }
  };

  const loadExternalIps = async () => {
    setIpsLoading(true);
    try {
      const res = await api.environment.getExternalIps();
      const ips = res.external_agent_ips || [];
      setExternalIps(ips);
      if (ips.length > 0) {
        setSelectedIp(ips[0]);
      }
    } catch (err) {
      console.error("Failed to load external IPs", err);
    } finally {
      setIpsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("确认清理当前项目下掉线超过 5 分钟的 Agent？")) return;
    setIsCleaning(true);
    try {
      await api.environment.cleanupAgents(projectId);
      loadData();
    } catch (err) {
      alert("清理失败");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleForceSyncServices = async () => {
    if (!projectId) return;
    if (forceSyncing) return;

    const selectedKeys = Array.from(selectedAgentKeys.values()) as string[];
    const mode = selectedKeys.length > 0 ? 'selected' : 'stale';
    const confirmText = mode === 'selected'
      ? `确认强制同步已选择的 ${selectedKeys.length} 个 Agent 服务状态？`
      : '未选择 Agent，将同步当前项目下异常/过期 Agent 的服务状态。确认继续？';

    if (!confirm(confirmText)) return;

    setForceSyncing(true);
    try {
      if (mode === 'selected') {
        let ok = 0;
        let fail = 0;
        for (const key of selectedKeys) {
          try {
            const res = await api.environment.syncGlobalServices({ agent_key: key });
            if (res?.status === 'ok' || res?.result?.ok) ok += 1;
            else fail += 1;
          } catch {
            fail += 1;
          }
        }
        alert(`强制同步完成：成功 ${ok}，失败 ${fail}`);
      } else {
        const result = await api.environment.syncGlobalServices({ project_id: projectId, stale_only: true });
        if (result?.total !== undefined) {
          alert(`异常节点同步完成：总计 ${result.total}，成功 ${result.ok_count || 0}，失败 ${result.fail_count || 0}`);
        } else {
          alert(result?.message || '已触发强制同步');
        }
      }
    } catch (err: any) {
      alert(`强制同步失败: ${err?.message || 'unknown error'}`);
    } finally {
      setForceSyncing(false);
    }
  };

  const getIntegrationCommand = () => {
    const ip = selectedIp || '192.168.12.90';
    return `wget http://${ip}/script/bootstrap.sh -O bootstrap.sh && chmod +x bootstrap.sh && ./bootstrap.sh -w ${projectId} -u ${ip}:80 -t /sothothv2`;
  };

  const handleCopyCommand = async () => {
    const cmd = getIntegrationCommand();

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        console.error('Clipboard API failed:', err);
      }
    }

    const textArea = document.createElement('textarea');
    textArea.value = cmd;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('复制失败，请手动复制命令');
      }
    } catch (err) {
      console.error('execCommand copy failed:', err);
      alert('复制失败，请手动复制命令');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleAgentClick = (key: string) => {
    setSelectedAgentKey(key);
    setViewMode('detail');
  };

  const toggleAgentSelect = (key: string) => {
    setSelectedAgentKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredAgents = agents.filter(a =>
    a.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ip_address.includes(searchTerm)
  );

  const getPermissionInfo = (agent: Agent) => {
    if (typeof agent.is_allowed === 'boolean') {
      return agent.is_allowed
        ? { label: '允许', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        : { label: '离线/受限', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return agent.status === 'online'
      ? { label: '允许', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : { label: '离线/受限', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const toggleSelectAllFilteredAgents = () => {
    if (filteredAgents.length === 0) return;
    setSelectedAgentKeys(prev => {
      const next = new Set(prev);
      const allSelected = filteredAgents.every(a => next.has(a.key));
      if (allSelected) {
        filteredAgents.forEach(a => next.delete(a.key));
      } else {
        filteredAgents.forEach(a => next.add(a.key));
      }
      return next;
    });
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      let page = 1;
      let total = 0;
      let all: EnvTemplate[] = [];
      while (true) {
        const res = await api.environment.getTemplates(page);
        const pageData = res.templates || [];
        total = res.total || 0;
        all = all.concat(pageData);
        if (pageData.length === 0) break;
        if (total > 0 && all.length >= total) break;
        page += 1;
      }
      setTemplates(all);
    } catch (err) {
      console.error('Failed to load templates', err);
      alert('获取模板列表失败');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const openBatchDeployModal = async () => {
    if (!projectId) {
      alert('请先选择项目');
      return;
    }
    if (selectedAgentKeys.size === 0) {
      alert('请先选择至少一个 Agent');
      return;
    }
    setTemplateSearch('');
    setSelectedTemplateNames(new Set());
    setIsBatchDeployModalOpen(true);
    await loadTemplates();
  };

  const filteredTemplates = useMemo(() => {
    const keyword = templateSearch.trim().toLowerCase();
    if (!keyword) return templates;
    return templates.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      (t.description || '').toLowerCase().includes(keyword)
    );
  }, [templates, templateSearch]);

  const toggleTemplateSelect = (name: string) => {
    setSelectedTemplateNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSelectAllFilteredTemplates = () => {
    if (filteredTemplates.length === 0) return;
    setSelectedTemplateNames(prev => {
      const next = new Set(prev);
      const allSelected = filteredTemplates.every(t => next.has(t.name));
      if (allSelected) {
        filteredTemplates.forEach(t => next.delete(t.name));
      } else {
        filteredTemplates.forEach(t => next.add(t.name));
      }
      return next;
    });
  };

  const buildServiceName = (templateName: string, agentKey: string) => {
    const normalized = templateName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 48);
    const stamp = Date.now().toString(36).slice(-6);
    return `${normalized}-${agentKey.slice(0, 6)}-${stamp}`;
  };

  const executeBatchDeploy = async () => {
    if (!projectId || selectedAgentKeys.size === 0 || selectedTemplateNames.size === 0) return;
    setDeployingBatch(true);
    try {
      const agentKeys = Array.from(selectedAgentKeys.values()) as string[];
      const templateNames = Array.from(selectedTemplateNames.values()) as string[];
      let successCount = 0;
      let failedCount = 0;

      for (const templateName of templateNames) {
        for (const agentKey of agentKeys) {
          try {
            await api.environment.deploy({
              service_name: buildServiceName(templateName, agentKey),
              agent_key: agentKey,
              template_name: templateName,
              project_id: projectId
            });
            successCount += 1;
          } catch {
            failedCount += 1;
          }
        }
      }

      alert(`批量部署已提交：成功 ${successCount}，失败 ${failedCount}`);
      setIsBatchDeployModalOpen(false);
      setSelectedTemplateNames(new Set());
    } catch (err) {
      console.error('Batch deploy failed', err);
      alert('批量部署失败');
    } finally {
      setDeployingBatch(false);
    }
  };

  if (viewMode === 'detail' && selectedAgentKey) {
    return <AgentDetailPage agentKey={selectedAgentKey} projectId={projectId} onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      {!projectId && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle size={16} /> 请先在顶部菜单选择一个项目
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
               <Monitor size={24} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agent 节点集群</h2>
          </div>
          <p className="text-slate-500 mt-1 font-medium italic">基于分布式容器化引擎的实时感知与安全探测底座</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            disabled={!projectId}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
          <button 
            onClick={handleCleanup}
            disabled={isCleaning || !projectId}
            className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
          >
            {isCleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            清理无效节点
          </button>
          <button
            onClick={openBatchDeployModal}
            disabled={!projectId || selectedAgentKeys.size === 0}
            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap size={18} /> 批量部署服务
          </button>
          <button
            onClick={handleForceSyncServices}
            disabled={!projectId || forceSyncing}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            title={selectedAgentKeys.size > 0 ? '强制同步选中Agent服务状态' : '同步当前项目异常/过期Agent服务状态'}
          >
            {forceSyncing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            强制同步服务
          </button>
          <button 
            onClick={() => {
              setIntegrationType(null);
              setIsIntegrationModalOpen(true);
            }}
            disabled={!projectId}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Plus size={20} /> 接入新节点
          </button>
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="通过主机名、IP 地址或 Agent Key 检索节点..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-bold text-slate-500">
            已选择 <span className="text-blue-600 font-black">{selectedAgentKeys.size}</span> / {agents.length} 个节点
          </p>
          <button
            onClick={toggleSelectAllFilteredAgents}
            disabled={!projectId || filteredAgents.length === 0}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50"
          >
            {filteredAgents.length > 0 && filteredAgents.every(a => selectedAgentKeys.has(a.key)) ? '取消全选筛选项' : '全选筛选项'}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-6 w-[72px] text-center">选择</th>
                <th className="px-8 py-6">节点标识 (Hostname / OS)</th>
                <th className="px-6 py-6">网络配置 (IP)</th>
                <th className="px-6 py-6">实时资源载荷 (CPU/Mem)</th>
                <th className="px-6 py-6">持续运行时间 (Uptime)</th>
                <th className="px-6 py-6">准入状态</th>
                <th className="px-8 py-6 text-right">活跃状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!projectId ? (
                <tr>
                  <td colSpan={7} className="py-40 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">请先在顶部菜单选择项目</p>
                  </td>
                </tr>
              ) : filteredAgents.map(agent => {
                const isOnline = agent.status === 'online';
                const permission = getPermissionInfo(agent);
                const sys = agent.system_info;
                const formatted = sys?.formatted;
                const daemon = agent.daemon_info;
                
                return (
                  <tr 
                    key={agent.key} 
                    onClick={() => handleAgentClick(agent.key)}
                    className={`hover:bg-slate-50 transition-all group cursor-pointer border-l-4 ${isOnline ? 'border-transparent hover:border-green-500' : 'border-transparent hover:border-red-500 bg-slate-50/30'}`}
                  >
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgentSelect(agent.key);
                        }}
                        className={`w-6 h-6 rounded-md border-2 inline-flex items-center justify-center transition-all ${
                          selectedAgentKeys.has(agent.key)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 text-transparent hover:border-blue-400'
                        }`}
                        aria-label={`select-${agent.key}`}
                      >
                        <Check size={14} />
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isOnline ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Server size={22} />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{agent.hostname}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                               {sys?.os_name} {sys?.architecture} ({sys?.os_release})
                             </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className={`w-1.5 h-1.5 rounded-full ${daemon?.status === 'running' ? 'bg-green-400' : 'bg-slate-300'}`} />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                               AGENT {daemon?.version || 'N/A'} / {daemon?.platform || 'N/A'}
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-black text-blue-600 mb-1">{agent.ip_address}</span>
                        <span className="text-[9px] font-mono text-slate-300 uppercase truncate max-w-[120px]">Key: {agent.key.slice(0, 12)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-3 w-56">
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                             <span>CPU Usage</span>
                             <span className={ (sys?.cpu?.usage_percent || 0) > 80 ? 'text-red-500' : 'text-slate-600' }>{sys?.cpu?.usage_percent || 0}%</span>
                           </div>
                           <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-700 ${isOnline ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${sys?.cpu?.usage_percent || 0}%` }} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                             <span>Memory ({formatted?.memory?.used} / {formatted?.memory?.total})</span>
                             <span className="text-slate-600">{sys?.memory?.usage_percent || 0}%</span>
                           </div>
                           <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-700 ${isOnline ? 'bg-indigo-500' : 'bg-slate-300'}`} style={{ width: `${sys?.memory?.usage_percent || 0}%` }} />
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                            <Activity size={14} className="text-green-500" />
                            <span>{formatted?.uptime || 'Updating...'}</span>
                         </div>
                         <p className="text-[9px] font-black text-slate-300 uppercase ml-5 tracking-widest truncate max-w-[180px]">Last: {agent.last_seen?.split('.')[0].replace('T', ' ')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex w-fit px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${permission.className}`}>
                          {permission.label}
                        </span>
                        {agent.allow_reason && (
                          <span className="text-[10px] text-slate-500 max-w-[200px] truncate" title={agent.allow_reason}>
                            {agent.allow_reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <LiveIndicator status={agent.status} />
                        <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && projectId && filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Monitor size={40} />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">未检索到匹配的 Agent 资产</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Deploy Modal */}
      {isBatchDeployModalOpen && (
        <div className="fixed inset-0 z-[119] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[88vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">批量部署环境模板服务</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  已选 Agent: {selectedAgentKeys.size}，请选择要部署的模板
                </p>
              </div>
              <button onClick={() => setIsBatchDeployModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="检索模板名称或描述..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 ring-blue-500/10"
                  />
                </div>
                <button
                  onClick={toggleSelectAllFilteredTemplates}
                  disabled={filteredTemplates.length === 0}
                  className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckSquare size={15} />
                  {filteredTemplates.length > 0 && filteredTemplates.every(t => selectedTemplateNames.has(t.name)) ? '取消全选' : '全选筛选模板'}
                </button>
              </div>

              {templatesLoading ? (
                <div className="py-24 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-600" size={28} />
                  <p className="mt-3 text-xs font-bold text-slate-400">正在加载模板...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => (
                    <button
                      key={template.name}
                      onClick={() => toggleTemplateSelect(template.name)}
                      className={`p-5 rounded-2xl border-2 transition-all text-left ${
                        selectedTemplateNames.has(template.name)
                          ? 'bg-blue-50 border-blue-600'
                          : 'bg-white border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-800">{template.name}</p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{template.description || '无描述'}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                          selectedTemplateNames.has(template.name)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-200 text-transparent'
                        }`}>
                          <Check size={14} />
                        </div>
                      </div>
                    </button>
                  ))}
                  {!templatesLoading && filteredTemplates.length === 0 && (
                    <div className="col-span-2 py-16 text-center text-slate-400 text-sm font-bold">无匹配模板</div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                本次将提交 <span className="text-blue-600 font-black">{selectedTemplateNames.size}</span> 个模板 ×
                <span className="text-blue-600 font-black"> {selectedAgentKeys.size}</span> 个 Agent 的部署任务
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsBatchDeployModalOpen(false)}
                  disabled={deployingBatch}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-black hover:bg-slate-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={executeBatchDeploy}
                  disabled={deployingBatch || selectedTemplateNames.size === 0 || selectedAgentKeys.size === 0}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {deployingBatch ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  提交批量部署
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Choice Modal */}
      {isIntegrationModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
              <div className="p-10 pb-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                     <Terminal size={28} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-800 tracking-tight">接入新执行节点</h3>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">扩展分布式安全探测网络</p>
                   </div>
                </div>
                <button onClick={() => setIsIntegrationModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-6">
                {!integrationType ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => setIntegrationType('manual')}
                      className="group p-8 bg-slate-50 border-2 border-transparent hover:border-blue-600 rounded-[2.5rem] text-left transition-all hover:bg-white hover:shadow-2xl"
                    >
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors mb-6">
                          <Terminal size={24} />
                       </div>
                       <h4 className="text-lg font-black text-slate-800 mb-2">手动脚本接入</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">在 Linux 主机一键执行初始化脚本，建立加密指令隧道。</p>
                       <div className="mt-6 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase">
                         查看指令 <ChevronRight size={14} />
                       </div>
                    </button>

                    <button 
                      onClick={() => setIntegrationType('auto')}
                      className="group p-8 bg-slate-50 border-2 border-transparent hover:border-indigo-600 rounded-[2.5rem] text-left transition-all hover:bg-white hover:shadow-2xl relative overflow-hidden"
                    >
                       <div className="absolute top-6 right-6">
                          <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Developing</span>
                       </div>
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-colors mb-6">
                          <Zap size={24} />
                       </div>
                       <h4 className="text-lg font-black text-slate-800 mb-2">自动化扫描接入</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">基于 SSH 凭据池自动探测内网存活资产并批量静默分发 Agent。</p>
                       <div className="mt-6 flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase">
                         开发中 <ChevronRight size={14} />
                       </div>
                    </button>
                  </div>
                ) : integrationType === 'manual' ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    {/* IP Selection UI */}
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Globe size={14} className="text-blue-500" /> 选择接入代理 IP (External Gateway)
                       </h5>
                       
                       {ipsLoading ? (
                         <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                           <Loader2 size={16} className="animate-spin text-blue-600" />
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">正在拉取可用路由节点...</span>
                         </div>
                       ) : externalIps.length > 0 ? (
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {externalIps.map(ip => (
                              <button 
                                key={ip}
                                onClick={() => setSelectedIp(ip)}
                                className={`px-4 py-3 rounded-2xl border-2 transition-all font-mono text-xs font-black flex items-center justify-between group ${
                                  selectedIp === ip 
                                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' 
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
                                }`}
                              >
                                {ip}
                                <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                                  selectedIp === ip ? 'bg-blue-600 border-blue-600' : 'border-slate-200'
                                }`} />
                              </button>
                            ))}
                         </div>
                       ) : (
                         <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-500">
                            <AlertCircle size={18} />
                            <p className="text-xs font-bold">未获取到后台配置的接入 IP，请联系系统管理员。</p>
                         </div>
                       )}
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Command size={14} className="text-blue-500" /> 请在目标服务器终端执行 (Root Auth)
                       </h5>
                       <div className="relative group">
                          <div className="absolute inset-0 bg-blue-600/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative bg-[#0f172a] p-8 rounded-[2rem] border border-white/5 font-mono text-[11px] leading-relaxed group shadow-inner">
                             <p className="text-blue-300/90 break-all select-all font-mono">
                               {getIntegrationCommand()}
                             </p>
                             <div className="absolute top-4 right-4">
                                <button 
                                  onClick={handleCopyCommand}
                                  className={`p-3 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                                >
                                  {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                       <div className="flex items-center gap-3 text-slate-600">
                          <AlertCircle size={18} className="text-blue-600" />
                          <h6 className="text-[10px] font-black uppercase tracking-widest">配置说明</h6>
                       </div>
                       <ul className="text-[11px] text-slate-500 space-y-1.5 font-medium list-disc pl-5 leading-relaxed">
                          <li>脚本会自动配置 Docker 运行时并建立与 Nacos 的长连接。</li>
                          <li>请确保目标主机可以访问所选 IP <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono">{selectedIp || 'Gateway'}</code> 的 80 端口。</li>
                          <li>节点注册成功后，其状态将在此管理页面实时呈现。</li>
                       </ul>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-6 animate-in zoom-in-95">
                     <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                        <Sparkles size={40} className="animate-pulse" />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-800">自动接入功能开发中</h4>
                        <p className="text-sm text-slate-400 mt-2 font-medium italic">正在对接企业级资产指纹库与 SSH 自动化运维通道</p>
                     </div>
                     <button 
                        onClick={() => setIntegrationType('manual')}
                        className="text-blue-600 font-black text-[10px] uppercase hover:underline"
                      >
                        返回使用手动脚本接入
                      </button>
                  </div>
                )}
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 {integrationType && (
                   <button 
                     onClick={() => setIntegrationType(null)}
                     className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-all flex items-center gap-2"
                   >
                     <RefreshCw size={14} /> 切换接入方案
                   </button>
                 )}
                 <div className="flex-1" />
                 <button 
                   onClick={() => setIsIntegrationModalOpen(false)}
                   className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                 >
                   关闭界面
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
