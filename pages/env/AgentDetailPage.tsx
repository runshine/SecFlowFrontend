
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  RefreshCw, 
  Loader2, 
  Server, 
  Info, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  Box, 
  History, 
  Terminal,
  Clock,
  ExternalLink,
  ShieldAlert,
  Globe,
  Database,
  Layers,
  Container,
  HardDrive,
  Network
} from 'lucide-react';
import { Agent, AgentService, AsyncTask } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

interface AgentDetailPageProps {
  agentKey: string;
  onBack: () => void;
}

export const AgentDetailPage: React.FC<AgentDetailPageProps> = ({ agentKey, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [services, setServices] = useState<AgentService[]>([]);
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'network' | 'disks' | 'services'>('overview');

  useEffect(() => {
    loadAllData();
  }, [agentKey]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [agentData, servicesData, tasksData] = await Promise.all([
        api.environment.getAgentDetail(agentKey),
        api.environment.getAgentServices(agentKey),
        api.environment.getTasks({ agent_key: agentKey })
      ]);
      setAgent(agentData);
      setServices(servicesData?.services || []);
      setTasks(tasksData?.task || []);
    } catch (err) {
      console.error("Failed to load agent detail", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepHealthCheck = async () => {
    try {
      const health = await api.environment.getAgentHealth(agentKey);
      alert(JSON.stringify(health, null, 2));
    } catch (err) {
      alert("健康检查失败");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 animate-in fade-in">
        <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">正在与远程节点同步状态...</p>
      </div>
    );
  }

  if (!agent) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <ShieldAlert size={48} className="text-slate-200" />
      <p className="font-black text-slate-400 uppercase tracking-widest">未找到该节点资产或连接已中断</p>
      <button onClick={onBack} className="text-blue-600 font-bold hover:underline">返回列表</button>
    </div>
  );

  const sys = agent.system_info;

  return (
    <div className="p-10 space-y-8 animate-in slide-in-from-right duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{agent.hostname}</h2>
              <StatusBadge status={agent.status} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Server size={14} /> 主机 IP: <span className="text-blue-600 font-black">{agent.ip_address}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Clock size={14} /> 运行时间: <span className="text-slate-600 font-black">{sys?.formatted?.uptime || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={loadAllData} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleDeepHealthCheck}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            <ShieldCheck size={18} /> 执行全量巡检
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
        {[
          { id: 'overview', label: '运行概览', icon: <Activity size={16} /> },
          { id: 'processes', label: '进程监控', icon: <Terminal size={16} /> },
          { id: 'network', label: '网卡配置', icon: <Network size={16} /> },
          { id: 'disks', label: '存储挂载', icon: <HardDrive size={16} /> },
          { id: 'services', label: '节点服务', icon: <Layers size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CPU Dashboard */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Cpu size={14} className="text-blue-500" /> 处理器负载
                     </h4>
                     <span className="text-xl font-black text-slate-800">{sys?.cpu?.usage_percent || 0}%</span>
                   </div>
                   <div className="space-y-4">
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${sys?.cpu?.usage_percent || 0}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">型号</p>
                          <p className="text-xs font-black text-slate-700 truncate">{sys?.cpu?.model || 'Generic x86_64'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">核心数</p>
                          <p className="text-xs font-black text-slate-700">{sys?.cpu?.logical_cores || 0} vCPU</p>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Memory Dashboard */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Database size={14} className="text-indigo-500" /> 内存状态
                     </h4>
                     <span className="text-xl font-black text-slate-800">{sys?.memory?.usage_percent || 0}%</span>
                   </div>
                   <div className="space-y-4">
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${sys?.memory?.usage_percent || 0}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">总量</p>
                          <p className="text-xs font-black text-slate-700">{sys?.formatted?.memory?.total || '0 GB'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">已用</p>
                          <p className="text-xs font-black text-slate-700">{sys?.formatted?.memory?.used || '0 GB'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">空闲</p>
                          <p className="text-xs font-black text-slate-700">{sys?.formatted?.memory?.available || '0 GB'}</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Docker Runtime Card */}
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                 <Container size={120} className="absolute right-[-20px] bottom-[-20px] text-white opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-700" />
                 <div className="flex-1 space-y-6 z-10 w-full">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600 rounded-2xl"><Container size={24} /></div>
                      <div>
                        <h4 className="text-xl font-black">Docker 容器运行时</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Engine v{sys?.docker?.version || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">运行中容器</p>
                         <p className="text-3xl font-black text-green-400 mt-1">{sys?.docker?.containers_running || 0}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">本地镜像数</p>
                         <p className="text-3xl font-black text-blue-400 mt-1">{sys?.docker?.images_total || 0}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">网络/桥接</p>
                         <p className="text-3xl font-black text-slate-300 mt-1">{ (sys as any)?.docker?.networks_total || 0 }</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'processes' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">PID / 进程名</th>
                    <th className="px-6 py-5">CPU</th>
                    <th className="px-6 py-5">内存 (RSS)</th>
                    <th className="px-6 py-5">状态</th>
                    <th className="px-8 py-5 text-right">命令行</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono text-[11px]">
                  {sys?.processes_top?.map(proc => (
                    <tr key={proc.pid} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-4">
                        <span className="text-blue-600 font-black mr-2">[{proc.pid}]</span>
                        <span className="text-slate-800 font-black">{proc.name}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-0.5 rounded ${proc.cpu_percent > 50 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                           {proc.cpu_percent?.toFixed(1)}%
                         </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{proc.memory_percent?.toFixed(2)}%</td>
                      <td className="px-6 py-4 uppercase font-black text-slate-400">{proc.status}</td>
                      <td className="px-8 py-4 text-right truncate max-w-[200px] text-slate-400" title={proc.cmdline?.join(' ')}>
                        {proc.cmdline?.join(' ')}
                      </td>
                    </tr>
                  ))}
                  {(!sys?.processes_top || sys.processes_top.length === 0) && (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-xs">暂无进程快照数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              {sys?.network_interfaces?.map(iface => (
                <div key={iface.name} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl ${iface.is_up ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Network size={18} />
                         </div>
                         <h5 className="font-black text-slate-800">{iface.name}</h5>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${iface.is_up ? 'text-green-500 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                        {iface.is_up ? 'UP' : 'DOWN'}
                      </span>
                   </div>
                   <div className="space-y-2 text-xs font-bold text-slate-500">
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                         <span>IP 地址</span>
                         <span className="text-blue-600 font-mono">{iface.ip_address || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between">
                         <span>MAC 物理地址</span>
                         <span className="font-mono">{iface.mac_address}</span>
                      </div>
                   </div>
                </div>
              ))}
              {(!sys?.network_interfaces || sys.network_interfaces.length === 0) && (
                <div className="col-span-2 py-20 text-center bg-white border border-slate-200 rounded-[2.5rem]">
                   <p className="text-sm font-black text-slate-300 uppercase tracking-widest">未检索到网卡接口数据</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'disks' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">挂载点 / 设备</th>
                    <th className="px-6 py-5">磁盘占用率</th>
                    <th className="px-8 py-5 text-right">已用 / 总量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {sys?.disks?.filter(d => d.total > 0).map(disk => (
                     <tr key={disk.device} className="hover:bg-slate-50">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <HardDrive size={16} className="text-slate-400" />
                              <div>
                                 <p className="text-sm font-black text-slate-800">{disk.mountpoint}</p>
                                 <p className="text-[10px] font-mono text-slate-400">{disk.device}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-32">
                                 <div className={`h-full ${disk.usage_percent > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${disk.usage_percent}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-slate-700">{disk.usage_percent?.toFixed(1)}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-xs text-slate-500">
                           {(disk.used / 1024 / 1024 / 1024).toFixed(1)}G / {(disk.total / 1024 / 1024 / 1024).toFixed(1)}G
                        </td>
                     </tr>
                   ))}
                   {(!sys?.disks || sys.disks.length === 0) && (
                      <tr><td colSpan={3} className="py-20 text-center text-slate-300 font-black uppercase text-xs">未找到活跃磁盘分区</td></tr>
                   )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'services' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/30 font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <tr>
                      <th className="px-8 py-5">服务名称</th>
                      <th className="px-6 py-5">镜像定义</th>
                      <th className="px-8 py-5 text-right">运行状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {services.map(svc => (
                      <tr key={svc.id} className="hover:bg-slate-50 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all font-black">
                              {svc.name ? svc.name[0].toUpperCase() : 'S'}
                            </div>
                            <span className="text-sm font-black text-slate-700">{svc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[10px] font-mono font-bold text-slate-400 truncate max-w-[200px]">{svc.image}</td>
                        <td className="px-8 py-5 text-right"><StatusBadge status={svc.status} /></td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">该节点暂未部署任何容器服务</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          )}
        </div>

        {/* Sidebar: System Manifest */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} /> 操作系统元数据
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-500">发行版本</span>
                <span className="text-xs font-black text-slate-800">{sys?.os_version || 'Unknown Linux'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-500">内核层</span>
                <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{sys?.kernel_version || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-500">指令集架构</span>
                <span className="text-xs font-black text-slate-800 uppercase">{sys?.architecture || 'x86_64'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-bold text-slate-500">引导时间</span>
                <span className="text-xs font-black text-slate-800">{sys?.boot_time?.replace('T', ' ') || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History size={14} /> 最近部署任务
            </h4>
            <div className="space-y-4">
               {tasks.slice(0, 3).map(t => (
                 <div key={t.id} className="flex gap-4 group">
                    <div className={`w-1 h-10 rounded-full shrink-0 ${t.status === 'success' || t.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div>
                       <p className="text-xs font-black text-slate-800">{t.service_name}</p>
                       <p className="text-[9px] font-black text-slate-400 uppercase">{t.type} · {t.status}</p>
                    </div>
                 </div>
               ))}
               {tasks.length === 0 && <p className="text-[10px] font-black text-slate-300 uppercase italic">暂无部署历史记录</p>}
            </div>
            <button className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition-all">
              查看全量任务审计
            </button>
          </div>

          <div className="bg-red-900 p-8 rounded-[3rem] text-white space-y-4 relative overflow-hidden group shadow-2xl shadow-red-900/20">
             <ShieldAlert className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
             <p className="text-[10px] font-black text-red-300 uppercase tracking-[0.2em]">危险操作区</p>
             <h4 className="text-xl font-black">节点权限管控</h4>
             <div className="space-y-3 pt-2">
                <button className="w-full py-3 bg-white/10 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase transition-all">
                  重置安全凭证
                </button>
                <button className="w-full py-3 bg-white text-red-900 rounded-xl font-black text-[10px] uppercase hover:bg-red-50 transition-all">
                  强制下线节点
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
