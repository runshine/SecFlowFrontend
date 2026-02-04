
import React, { useState, useEffect } from 'react';
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
  Database
} from 'lucide-react';
import { Agent, AgentStats } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';
import { AgentDetailPage } from './AgentDetailPage';

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
        api.environment.getAgents(),
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

  if (viewMode === 'detail' && selectedAgentKey) {
    return <AgentDetailPage agentKey={selectedAgentKey} onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agent 节点管理</h2>
          <p className="text-slate-500 mt-1 font-medium">分布式安全执行引擎与沙箱环境控制器</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleCleanup}
            disabled={isCleaning}
            className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            {isCleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            清理掉线节点
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <Activity className="absolute right-[-20px] top-[-20px] w-40 h-40 opacity-5 group-hover:opacity-10 transition-opacity" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">在线节点</p>
          <h3 className="text-4xl font-black mt-2 text-green-400">{agents.filter(a => a.status === 'online').length}</h3>
          <p className="text-slate-400 text-xs mt-1 font-bold">集群总数: {agents.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">掉线待清理</p>
          <h3 className="text-4xl font-black mt-2 text-slate-800">{agents.filter(a => a.status !== 'online').length}</h3>
          <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black mt-1 uppercase">
            <Clock size={12} /> Heartbeat Timeout
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm col-span-2">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">节点健康分布</p>
          <div className="flex gap-4">
            {['online', 'offline', 'error'].map(status => (
              <div key={status} className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">{status}</p>
                <p className="text-xl font-black text-slate-800">{agents.filter(a => a.status === status).length}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="检索主机名、IP 地址或工作空间..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">节点标识</th>
                <th className="px-6 py-5">IP 地址 / 系统</th>
                <th className="px-6 py-5">资源负载 (CPU/MEM)</th>
                <th className="px-6 py-5">最后活跃</th>
                <th className="px-8 py-5 text-right">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAgents.map(agent => (
                <tr 
                  key={agent.key} 
                  onClick={() => handleAgentClick(agent.key)}
                  className="hover:bg-slate-50 cursor-pointer transition-all group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Monitor size={18} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-700 block">{agent.hostname}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WS: {agent.workspace_id?.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono font-bold text-slate-500 block">{agent.ip_address}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{agent.system_info?.os_name || 'Linux'} {agent.system_info?.os_release || ''}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2 w-40">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                        <span>CPU</span>
                        <span>{agent.system_info?.cpu?.usage_percent || 0}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${agent.system_info?.cpu?.usage_percent || 0}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                        <span>MEM</span>
                        <span>{agent.system_info?.memory?.usage_percent || 0}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-50" style={{ width: `${agent.system_info?.memory?.usage_percent || 0}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-500 block">{agent.last_seen?.replace('T', ' ').split('.')[0] || '-'}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{agent.system_info?.formatted?.uptime || 'Active'}</span>
                  </td>
                  <td className="px-8 py-5 text-right flex items-center justify-end gap-3 h-20">
                    <StatusBadge status={agent.status} />
                    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </td>
                </tr>
              ))}
              {!loading && filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">暂无 Agent 节点资产</p>
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
