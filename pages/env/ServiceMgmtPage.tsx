
import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  Globe, 
  Lock, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Search,
  Plus,
  Box,
  Trash2,
  Monitor,
  Layout,
  AlertCircle
} from 'lucide-react';
import { AgentService } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

interface SyncHistoryItem {
  sync_id: string;
  scope: string;
  status: string;
  stale_only: boolean;
  total: number;
  ok_count: number;
  fail_count: number;
  message: string;
  created_at: string;
  agent_key?: string;
  details?: Array<{
    ok?: boolean;
    agent_key?: string;
    seen?: number;
    upserted?: number;
    error?: string;
    status_code?: number;
  }>;
}

export const ServiceMgmtPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [allServices, setAllServices] = useState<AgentService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncScope, setSyncScope] = useState<'project' | 'stale' | 'agent'>('stale');
  const [targetAgentKey, setTargetAgentKey] = useState('');
  const [lastSyncMessage, setLastSyncMessage] = useState('');
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<SyncHistoryItem | null>(null);

  useEffect(() => {
    if (projectId) {
      loadAllServices();
      loadSyncHistory();
    }
  }, [projectId]);

  const loadAllServices = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.environment.getGlobalServices(projectId, { per_page: 1000 });
      setAllServices(data?.items || []);
    } catch (err) {
      console.error("Failed to load global services", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndeploy = async (agentKey: string, serviceName: string) => {
    if (!projectId || !confirm(`确认卸载服务 ${serviceName}？`)) return;
    try {
      await api.environment.undeploy({ agent_key: agentKey, service_name: serviceName, project_id: projectId });
      alert("卸载任务已提交");
      loadAllServices();
    } catch (err) {
      alert("卸载失败");
    }
  };

  const handleQuickScan = async () => {
    if (!projectId) return;
    const payload: { project_id?: string; agent_key?: string; stale_only?: boolean } = {};
    if (syncScope === 'agent') {
      if (!targetAgentKey.trim()) {
        alert('请输入要同步的 Agent Key');
        return;
      }
      payload.agent_key = targetAgentKey.trim();
    } else {
      payload.project_id = projectId;
      payload.stale_only = syncScope === 'stale';
    }

    setSyncing(true);
    try {
      const result = await api.environment.syncGlobalServices(payload);
      await loadAllServices();
      await loadSyncHistory();
      if (result?.total !== undefined) {
        setLastSyncMessage(`同步完成：总计 ${result.total}，成功 ${result.ok_count || 0}，失败 ${result.fail_count || 0}`);
      } else {
        setLastSyncMessage(result?.message || '同步任务已触发');
      }
    } catch (err) {
      console.error('Quick scan failed', err);
      alert('快速扫描失败');
    } finally {
      setSyncing(false);
    }
  };

  const filteredServices = allServices.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.image.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadSyncHistory = async () => {
    if (!projectId) return;
    try {
      const data = await api.environment.getGlobalServiceSyncHistory({ project_id: projectId, per_page: 10 });
      setSyncHistory(data?.items || []);
    } catch (err) {
      console.error('Failed to load sync history', err);
    }
  };

  if (loading && projectId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 animate-in fade-in">
        <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">正在跨项目 Agent 节点发现存活服务...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">集群服务发现</h2>
          <p className="text-slate-500 mt-1 font-medium">统一服务治理、代理分发与生命周期管理中心</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadAllServices}
            disabled={!projectId}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={20} />
          </button>
          <button disabled={!projectId} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">
            <Plus size={18} /> 部署新服务
          </button>
        </div>
      </div>

      {!projectId && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-xs font-bold flex items-center gap-3">
          <AlertCircle size={16} /> 请先在顶部菜单选择一个项目
        </div>
      )}

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
             <Layout size={24} />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">运行中服务</p>
             <h3 className="text-3xl font-black text-slate-800">{allServices.length}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
             <Monitor size={24} />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">承载节点</p>
             <h3 className="text-3xl font-black text-indigo-600">{new Set(allServices.map(s => s.agent_key)).size}</h3>
           </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] col-span-2 text-white flex items-center justify-between group overflow-hidden relative">
           <Zap className="absolute right-[-20px] top-[-20px] w-40 h-40 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity" />
           <div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">项目服务网格</p>
             <div className="flex items-center gap-4 mt-2">
                <div className="h-2 w-48 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-green-500" style={{ width: '100%' }} />
                </div>
                <span className="text-sm font-black text-green-500 uppercase tracking-tighter">Verified</span>
             </div>
           </div>
           <button
             onClick={handleQuickScan}
             disabled={!projectId || syncing}
             className="px-6 py-3 bg-white/10 rounded-xl text-xs font-black hover:bg-white/20 transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
             快速扫描
           </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">强制同步模式</div>
          <select
            value={syncScope}
            onChange={(e) => setSyncScope(e.target.value as 'project' | 'stale' | 'agent')}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white"
          >
            <option value="stale">仅异常/过期Agent</option>
            <option value="project">当前项目全部在线Agent</option>
            <option value="agent">单个Agent</option>
          </select>
          {syncScope === 'agent' && (
            <input
              type="text"
              value={targetAgentKey}
              onChange={(e) => setTargetAgentKey(e.target.value)}
              placeholder="输入完整 agent_key"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/10"
            />
          )}
          {lastSyncMessage && (
            <div className="text-xs font-bold text-slate-500">{lastSyncMessage}</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">最近同步记录</div>
            <button onClick={loadSyncHistory} className="text-xs font-bold text-blue-600 hover:text-blue-700">刷新</button>
          </div>
          <div className="space-y-2">
            {syncHistory.length === 0 ? (
              <div className="text-xs text-slate-400">暂无同步记录</div>
            ) : syncHistory.map(item => (
              <button
                key={item.sync_id}
                onClick={() => setSelectedHistory(item)}
                className="w-full text-left border border-slate-100 rounded-xl px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                <div className="text-xs text-slate-600">
                  <span className="font-black uppercase mr-2">{item.scope}</span>
                  <span>{item.message || '-'}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  total={item.total} ok={item.ok_count} fail={item.fail_count} · {item.created_at}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="过滤项目下服务名称、镜像定义或目标节点..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">服务标识 (Service)</th>
                <th className="px-6 py-5">镜像标签 (Image)</th>
                <th className="px-6 py-5">承载节点</th>
                <th className="px-6 py-5">网络暴露 (Ports)</th>
                <th className="px-6 py-5">状态</th>
                <th className="px-8 py-5 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projectId && filteredServices.map(svc => (
                <tr key={`${svc.agent_key}-${svc.id}`} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {svc.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-black text-slate-700">{svc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono text-slate-500 truncate max-w-[150px] inline-block">
                      {svc.image}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-700">{(svc as any).agent_hostname}</span>
                       <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{(svc as any).agent_key.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(svc.ports).map(([proto, port]) => (
                        <span key={proto} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">
                          {proto} ➔ {port}
                        </span>
                      ))}
                      {Object.keys(svc.ports).length === 0 && <span className="text-[10px] font-black text-slate-300 uppercase italic">Isolated</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={svc.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                          <ExternalLink size={16} />
                       </button>
                       <button 
                         onClick={() => handleUndeploy(svc.agent_key!, svc.name)}
                         className="p-2.5 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!projectId || filteredServices.length === 0) && !loading && (
                <tr>
                  <td colSpan={6} className="py-40 text-center">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <Zap size={40} />
                     </div>
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                       {projectId ? '未检索到任何活跃集群服务' : '请先选择项目以发现服务'}
                     </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedHistory && (
        <div className="fixed inset-0 z-[220] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedHistory(null)}>
          <div className="w-full max-w-6xl h-[78vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">同步记录详情</p>
                <p className="text-sm font-black text-slate-800 mt-1">
                  {selectedHistory.scope.toUpperCase()} · {selectedHistory.sync_id}
                </p>
              </div>
              <button onClick={() => setSelectedHistory(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">关闭</button>
            </div>
            <div className="px-6 py-3 border-b border-slate-100 text-xs text-slate-600 flex flex-wrap gap-4">
              <span>status={selectedHistory.status}</span>
              <span>total={selectedHistory.total}</span>
              <span>ok={selectedHistory.ok_count}</span>
              <span>fail={selectedHistory.fail_count}</span>
              <span>time={selectedHistory.created_at}</span>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              {Array.isArray((selectedHistory as any).details) && (selectedHistory as any).details.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Agent</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Seen</th>
                      <th className="px-3 py-2">Upserted</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border border-slate-100 border-t-0 text-xs">
                    {(selectedHistory as any).details.map((d: any, idx: number) => (
                      <tr key={`${d.agent_key || 'na'}-${idx}`}>
                        <td className="px-3 py-2 font-mono text-slate-700">{d.agent_key || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`font-black ${d.ok ? 'text-green-600' : 'text-red-600'}`}>{d.ok ? 'OK' : 'FAILED'}</span>
                        </td>
                        <td className="px-3 py-2">{d.seen ?? '-'}</td>
                        <td className="px-3 py-2">{d.upserted ?? '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{d.error || (d.status_code ? `status_code=${d.status_code}` : '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-slate-400 py-10 text-center">该记录没有明细数据</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
