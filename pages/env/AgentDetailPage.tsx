
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
  Network,
  Cpu as CpuIcon,
  Monitor,
  TerminalSquare,
  ArrowUpRight,
  Hash,
  ChevronRight,
  Zap,
  Trash2
} from 'lucide-react';
import { Agent, AgentService, AsyncTask } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

interface AgentDetailPageProps {
  agentKey: string;
  projectId: string;
  onBack: () => void;
}

export const AgentDetailPage: React.FC<AgentDetailPageProps> = ({ agentKey, projectId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [services, setServices] = useState<AgentService[]>([]);
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'network' | 'disks' | 'services'>('overview');

  useEffect(() => {
    if (agentKey && projectId) {
      loadAllData();
    }
  }, [agentKey, projectId]);

  const loadAllData = async () => {
    if (!agentKey || !projectId) return;
    setLoading(true);
    try {
      const [agentData, servicesData, tasksData] = await Promise.all([
        api.environment.getAgentDetail(agentKey, projectId),
        api.environment.getAgentServices(agentKey),
        api.environment.getTasks(projectId, { agent_key: agentKey })
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
  const formatted = sys?.formatted;

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
                <Clock size={14} /> 运行时间: <span className="text-slate-600 font-black">{formatted?.uptime || 'N/A'}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                   <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <CpuIcon size={14} className="text-blue-500" /> 处理器负载
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
                          <p className="text-xs font-black text-slate-700">{formatted?.memory?.total || '0 GB'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">已用</p>
                          <p className="text-xs font-black text-slate-700">{formatted?.memory?.used || '0 GB'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">空闲</p>
                          <p className="text-xs font-black text-slate-700">{formatted?.memory?.available || '0 GB'}</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Docker Runtime Section */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Container size={16} className="text-blue-600" /> Docker 运行时摘要
                    </h4>
                    <span className="text-xs font-black text-slate-400">VERSION: {sys?.docker?.version || 'N/A'}</span>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase">容器总量</p>
                       <p className="text-lg font-black text-slate-800">{sys?.docker?.containers_total || 0}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                       <p className="text-[9px] font-black text-blue-400 uppercase">运行中</p>
                       <p className="text-lg font-black text-blue-600">{sys?.docker?.containers_running || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase">镜像数量</p>
                       <p className="text-lg font-black text-slate-800">{sys?.docker?.images_total || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase">网络/卷</p>
                       <p className="text-lg font-black text-slate-800">{sys?.docker?.networks_total || 0} / {sys?.docker?.volumes_total || 0}</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'processes' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <TerminalSquare size={16} /> 进程列表 (Top 10)
                 </h4>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                       <div className="w-2 h-2 rounded-full bg-blue-500" /> CPU
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                       <div className="w-2 h-2 rounded-full bg-indigo-500" /> Memory
                    </div>
                 </div>
              </div>
              <table className="w-full text-left">
                 <thead className="bg-slate-50/30 border-b border-slate-100 font-black text-[9px] text-slate-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-8 py-4">PID</th>
                       <th className="px-6 py-4">进程名称 / 指令</th>
                       <th className="px-6 py-4">CPU %</th>
                       <th className="px-6 py-4">MEM %</th>
                       <th className="px-8 py-4 text-right">状态</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {sys?.processes_top?.map((p: any) => (
                       <tr key={p.pid} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-8 py-4 font-mono text-xs text-slate-400">{p.pid}</td>
                          <td className="px-6 py-4">
                             <p className="text-xs font-black text-slate-700">{p.name}</p>
                             <p className="text-[9px] text-slate-400 font-mono truncate max-w-[300px] mt-0.5" title={p.cmdline?.join(' ')}>
                                {p.cmdline?.join(' ') || 'N/A'}
                             </p>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-600">{p.cpu_percent.toFixed(1)}%</span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-500" style={{ width: `${p.cpu_percent}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-600">{p.memory_percent.toFixed(1)}%</span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-indigo-500" style={{ width: `${p.memory_percent}%` }} />
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{p.status}</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sys?.network_interfaces?.map((iface: any) => (
                     <div key={iface.name} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iface.is_up ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                 <Network size={22} />
                              </div>
                              <div>
                                 <h5 className="text-sm font-black text-slate-800">{iface.name}</h5>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{iface.is_up ? 'Interface Up' : 'Interface Down'}</span>
                              </div>
                           </div>
                           {iface.is_up && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        </div>
                        <div className="space-y-2 border-t border-slate-50 pt-4">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">IPv4 Address</span>
                              <span className="font-mono font-black text-blue-600">{iface.ip_address || 'Unassigned'}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">MAC Address</span>
                              <span className="font-mono text-slate-500 uppercase">{iface.mac_address || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">Data Sent/Recv</span>
                              <span className="text-slate-700 font-black">
                                 {(iface.bytes_sent / 1024 / 1024).toFixed(1)} MB / {(iface.bytes_recv / 1024 / 1024).toFixed(1)} MB
                              </span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'disks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
               {formatted?.disks?.map((disk: any, idx: number) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 group">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                              <HardDrive size={22} />
                           </div>
                           <div>
                              <h5 className="text-sm font-black text-slate-800">{disk.device}</h5>
                              <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">MOUNT: {disk.mountpoint}</p>
                           </div>
                        </div>
                        <span className="text-xs font-black text-slate-700">{disk.usage_percent}</span>
                     </div>
                     <div className="space-y-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-1000 ${parseFloat(disk.usage_percent) > 90 ? 'bg-red-500' : 'bg-amber-500'}`} 
                              style={{ width: disk.usage_percent }} 
                           />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                           <span>USED: {disk.used}</span>
                           <span>FREE: {disk.free}</span>
                           <span>TOTAL: {disk.total}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
               <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-blue-500" /> 发现的存活服务 (Services)
                  </h4>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-slate-50/30 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                     <tr>
                        <th className="px-8 py-5">服务名称</th>
                        <th className="px-6 py-5">镜像标签 (Image)</th>
                        <th className="px-6 py-5">网络映射</th>
                        <th className="px-8 py-5 text-right">管理</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {services.map(svc => (
                        <tr key={svc.id} className="hover:bg-slate-50 transition-all group">
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                                    {svc.name[0].toUpperCase()}
                                 </div>
                                 <span className="text-sm font-black text-slate-700">{svc.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <span className="text-xs font-mono text-slate-400 truncate max-w-[200px] inline-block">{svc.image}</span>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-1">
                                 {Object.entries(svc.ports || {}).map(([p, v]) => (
                                    <span key={p} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">
                                       {p}➔{v}
                                    </span>
                                 ))}
                                 {!svc.ports && <span className="text-[10px] text-slate-300 italic">None</span>}
                              </div>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={16} />
                                 </button>
                                 <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <ExternalLink size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {services.length === 0 && (
                        <tr><td colSpan={4} className="py-24 text-center text-slate-300 italic text-sm">No services discovered on this node</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Metadata Sidebar Card */}
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8 relative overflow-hidden group">
             <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-blue-500 opacity-5 blur-3xl group-hover:opacity-10 transition-opacity" />
             <div className="space-y-2">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">节点元数据</p>
                <div className="flex items-center gap-3 mt-4">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400">
                      <Monitor size={24} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">系统架构</p>
                      <p className="text-lg font-black">{sys?.architecture || 'x86_64'}</p>
                   </div>
                </div>
             </div>
             <div className="pt-8 border-t border-white/10 space-y-5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                   <span className="uppercase tracking-widest">操作系统</span>
                   <span className="text-white font-black">{sys?.os_name} {sys?.os_release}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                   <span className="uppercase tracking-widest">内核版本</span>
                   <span className="text-white font-black">{sys?.kernel_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                   <span className="uppercase tracking-widest">启动时间</span>
                   <span className="text-white font-black">{sys?.boot_time?.split('T')[0]}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                   <span className="uppercase tracking-widest">最后活跃</span>
                   <span className="text-white font-black">{agent.last_seen?.split('.')[0].replace('T', ' ')}</span>
                </div>
             </div>
          </div>

          {/* Activity Log / Tasks Card */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History size={16} /> 关联部署任务 (Latest 5)
             </h4>
             <div className="space-y-4">
                {tasks.slice(0, 5).map(task => (
                   <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.status === 'succeeded' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Zap size={14} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-black text-slate-700 truncate max-w-[120px]">{task.service_name}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">{task.type}</p>
                         </div>
                      </div>
                      <StatusBadge status={task.status} />
                   </div>
                ))}
                {tasks.length === 0 && (
                   <div className="text-center py-10">
                      <p className="text-xs font-bold text-slate-300 italic">No tasks executed on node</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
