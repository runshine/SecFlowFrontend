
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
  // Added missing Globe icon
  Globe
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
  if (s === 'offline') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OFFLINE</span>
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

export const EnvAgentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsData, statsData] = await Promise.all([
        api.environment.getAgents({ per_page: 2000 }), // Load more for the matrix view
        api.environment.getAgentStats()
      ]);
      setAgents(agentsData.agents || []);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("确认清理掉线超过 5 分钟的 Agent？")) return;
    setIsCleaning(true);
    try {
      await api.environment.cleanupAgents();
      loadData();
    } catch (err) {
      alert("清理失败");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAgentClick = (key: string) => {
    setSelectedAgentKey(key);
    setViewMode('detail');
  };

  const filteredAgents = agents.filter(a => 
    a.hostname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.ip_address.includes(searchTerm)
  );

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const offlineCount = agents.filter(a => a.status !== 'online').length;

  if (viewMode === 'detail' && selectedAgentKey) {
    return <AgentDetailPage agentKey={selectedAgentKey} onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
               <Monitor size={24} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agent 节点集群</h2>
          </div>
          <p className="text-slate-500 mt-1 font-medium italic">实时感知分布式安全执行引擎的运行负载与生命周期状态</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
          <button 
            onClick={handleCleanup}
            disabled={isCleaning}
            className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-500/5 disabled:opacity-50"
          >
            {isCleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            清理无效节点
          </button>
        </div>
      </div>

      {/* Health Overview & Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute right-[-10px] top-[-10px] w-40 h-40 bg-green-500 opacity-5 blur-[40px]" />
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">集群在线率</p>
             <div className="flex items-end gap-3 mt-4">
                <h3 className="text-6xl font-black text-white">{agents.length > 0 ? Math.round((onlineCount/agents.length)*100) : 0}%</h3>
                <div className="pb-2">
                   <p className="text-xs font-black text-green-400 flex items-center gap-1">
                     <Zap size={12} fill="currentColor" /> ONLINE
                   </p>
                </div>
             </div>
             <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase">就绪节点</p>
                   <p className="text-xl font-black">{onlineCount}</p>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                   <CheckCircle2 className="text-green-500" size={20} />
                </div>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-200 transition-colors">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">离线/异常</p>
                <h3 className="text-4xl font-black mt-2 text-slate-800">{offlineCount}</h3>
                <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black mt-2 uppercase animate-pulse">
                  <AlertCircle size={12} /> Needs Attention
                </div>
              </div>
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <XCircle size={32} />
              </div>
           </div>
        </div>

        {/* Status Grid Matrix - Essential for 1000+ nodes */}
        <div className="xl:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                    <Grid size={24} />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">集群健康矩阵 (Node Matrix)</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">实时刷新全量节点状态位图</p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Live</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-slate-300" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Off</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded bg-red-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Error</span>
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
                      a.status === 'online' ? 'bg-green-500 hover:shadow-green-500/50' : 
                      a.status === 'error' ? 'bg-red-500 hover:shadow-red-500/50' : 'bg-slate-200'
                    }`}
                  />
                ))}
                {agents.length === 0 && (
                  <div className="w-full h-32 flex items-center justify-center text-slate-300 italic text-sm">
                    No nodes connected to orchestra
                  </div>
                )}
              </div>
           </div>
           <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <BarChart3 size={14} className="text-blue-500" />
              当前显示 {agents.length} 个物理/虚拟节点资产
           </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="通过主机名、IP 地址或工作空间 UUID 检索节点..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">节点拓扑 / 标识</th>
                <th className="px-6 py-6">网络配置 (IP/OS)</th>
                <th className="px-6 py-6">实时资源负载</th>
                <th className="px-6 py-6">最后通信时间</th>
                <th className="px-8 py-6 text-right">活跃状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAgents.map(agent => {
                const isOnline = agent.status === 'online';
                return (
                  <tr 
                    key={agent.key} 
                    onClick={() => handleAgentClick(agent.key)}
                    className={`hover:bg-slate-50 transition-all group cursor-pointer border-l-4 ${isOnline ? 'border-transparent hover:border-green-500' : 'border-transparent hover:border-red-500 bg-slate-50/30'}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isOnline ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-red-500 group-hover:text-white'}`}>
                          <Server size={22} />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-800 block group-hover:text-blue-600 transition-colors">{agent.hostname}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                             <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {agent.key.slice(0, 12)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-xs font-mono font-black text-blue-600 block mb-1">{agent.ip_address}</span>
                      <div className="flex items-center gap-2">
                         <Globe size={12} className="text-slate-300" />
                         <span className="text-[10px] font-black text-slate-400 uppercase">{agent.system_info?.os_name || 'Standard'} {agent.system_info?.os_release || 'Linux'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-3 w-48">
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                             <span>CPU Usage</span>
                             <span className={ (agent.system_info?.cpu?.usage_percent || 0) > 80 ? 'text-red-500' : '' }>{agent.system_info?.cpu?.usage_percent || 0}%</span>
                           </div>
                           <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-700 ${isOnline ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${agent.system_info?.cpu?.usage_percent || 0}%` }} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                             <span>Memory Usage</span>
                             <span>{agent.system_info?.memory?.usage_percent || 0}%</span>
                           </div>
                           <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-700 ${isOnline ? 'bg-indigo-500' : 'bg-slate-300'}`} style={{ width: `${agent.system_info?.memory?.usage_percent || 0}%` }} />
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Clock size={14} className="text-slate-300" />
                            <span>{agent.last_seen?.replace('T', ' ').split('.')[0] || '-'}</span>
                         </div>
                         <p className="text-[9px] font-black text-slate-300 uppercase ml-5 tracking-widest">UTC SYNCED</p>
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
              {!loading && filteredAgents.length === 0 && (
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
    </div>
  );
};
