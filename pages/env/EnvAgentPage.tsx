import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, 
  RefreshCw, 
  Loader2, 
  Trash2, 
  Search, 
  Activity, 
  Clock, 
  ChevronRight,
  Server,
  Cpu,
  Database,
  Grid,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
  BarChart3,
  Globe,
  Plus,
  Terminal,
  Copy,
  Check,
  X,
  Sparkles,
  Command,
  Info,
  ChevronDown
} from 'lucide-react';
import { Agent, AgentStats } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';
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
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isCleaning, setIsCleaning] = useState(false);

  // Integration Modals State
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [integrationType, setIntegrationType] = useState<'manual' | 'auto' | null>(null);
  const [copied, setCopied] = useState(false);
  
  // External IPs State
  const [externalIps, setExternalIps] = useState<string[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [ipsLoading, setIpsLoading] = useState(false);

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
      const [agentsData, statsData] = await Promise.all([
        api.environment.getAgents(projectId, { per_page: 2000 }), 
        api.environment.getAgentStats(projectId)
      ]);
      setAgents(agentsData.agents || []);
      setStats(statsData);
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

  const getIntegrationCommand = () => {
    const ip = selectedIp || '192.168.12.90';
    return `wget http://${ip}/script/bootstrap.sh -O bootstrap.sh && chmod +x bootstrap.sh && ./bootstrap.sh -w ${projectId} -u ${ip}:80 -t /sothothv2`;
  };

  const handleCopyCommand = () => {
    const cmd = getIntegrationCommand();
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgentClick = (key: string) => {
    setSelectedAgentKey(key);
    setViewMode('detail');
  };

  const filteredAgents = agents.filter(a => 
    a.hostname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.ip_address.includes(searchTerm)
  );

  // Get exact counts from the API stats summary if available
  const totalCount = stats?.summary.total_agents ?? agents.length;
  const onlineCount = stats?.summary.status_distribution.online ?? agents.filter(a => a.status === 'online').length;
  const unhealthyCount = (stats?.summary.status_distribution.offline ?? 0) + (stats?.summary.status_distribution.error ?? 0);

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

      {/* Health Overview & Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute right-[-10px] top-[-10px] w-40 h-40 bg-green-500 opacity-5 blur-[40px]" />
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">项目在线率 (Live Ratio)</p>
             <div className="flex items-end gap-3 mt-4">
                <h3 className="text-6xl font-black text-white">{totalCount > 0 ? Math.round((onlineCount/totalCount)*100) : 0}%</h3>
                <div className="pb-2">
                   <p className="text-xs font-black text-green-400 flex items-center gap-1 uppercase tracking-tighter">
                     <Zap size={12} fill="currentColor" /> {onlineCount} Ready
                   </p>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase">当前总量</p>
                   <p className="text-xl font-black">{totalCount}</p>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                   <CheckCircle2 className="text-green-500" size={20} />
                </div>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-200 transition-colors">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">离线/异常</p>
                <h3 className="text-4xl font-black mt-2 text-slate-800">{unhealthyCount}</h3>
                <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black mt-2 uppercase">
                  <AlertCircle size={12} /> Health Warning
                </div>
              </div>
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <XCircle size={32} />
              </div>
           </div>
        </div>

        {/* Status Grid Matrix */}
        <div className="xl:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                    <Grid size={24} />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">集群健康矩阵 (Node Matrix)</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">实时刷新全量 Agent 活跃位图</p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Online</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-slate-300" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Offline</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Error</span>
                 </div>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-4">
              <div className="flex flex-wrap gap-2">
                {agents.map((a) => (
                  <div 
                    key={a.key}
                    onClick={() => handleAgentClick(a.key)}
                    title={`${a.hostname} (${a.ip_address}): ${a.status}`}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-all hover:scale-125 hover:z-10 shadow-sm ${
                      a.status === 'online' ? 'bg-green-500' : 
                      a.status === 'error' ? 'bg-red-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
                {agents.length === 0 && (
                  <div className="w-full h-32 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Info size={24} />
                    <p className="italic text-sm">No agents connected to project workspace</p>
                  </div>
                )}
              </div>
           </div>
           <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <BarChart3 size={14} className="text-blue-500" />
                显示加载 {agents.length} 个本地感知节点
              </div>
              <p className="text-[10px] font-bold text-slate-300 italic uppercase">UTC: {new Date().toISOString().slice(0, 19).replace('T', ' ')}</p>
           </div>
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

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">节点标识 (Hostname / OS)</th>
                <th className="px-6 py-6">网络配置 (IP)</th>
                <th className="px-6 py-6">实时资源载荷 (CPU/Mem)</th>
                <th className="px-6 py-6">持续运行时间 (Uptime)</th>
                <th className="px-8 py-6 text-right">活跃状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!projectId ? (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">请先在顶部菜单选择项目</p>
                  </td>
                </tr>
              ) : filteredAgents.map(agent => {
                const isOnline = agent.status === 'online';
                const sys = agent.system_info;
                const formatted = sys?.formatted;
                
                return (
                  <tr 
                    key={agent.key} 
                    onClick={() => handleAgentClick(agent.key)}
                    className={`hover:bg-slate-50 transition-all group cursor-pointer border-l-4 ${isOnline ? 'border-transparent hover:border-green-500' : 'border-transparent hover:border-red-500 bg-slate-50/30'}`}
                  >
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
                  <td colSpan={5} className="py-40 text-center">
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