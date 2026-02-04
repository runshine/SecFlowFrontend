
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Terminal, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  X, 
  Trash2, 
  Search, 
  Workflow, 
  History,
  AlertTriangle
} from 'lucide-react';
import { AsyncTask, TaskLog } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const EnvTasksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AsyncTask | null>(null);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 10000); // Polling for progress
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.environment.getTasks();
      setTasks(data?.task || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  const openLogViewer = async (task: AsyncTask) => {
    setSelectedTask(task);
    setLogLoading(true);
    setLogs([]);
    try {
      const data = await api.environment.getTaskLogs(task.id);
      setLogs(data?.log || []);
    } catch (err) {
      alert("获取日志失败");
    } finally {
      setLogLoading(false);
    }
  };

  const filteredTasks = (tasks || []).filter(t => {
    const serviceMatch = t?.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = t?.id?.includes(searchTerm);
    return serviceMatch || idMatch;
  });

  // Helper to safely format time
  const formatTaskTime = (timeStr: string | undefined) => {
    if (!timeStr) return { date: '-', time: '-' };
    const parts = timeStr.split('T');
    const datePart = parts[0] || '-';
    const timePart = parts[1] ? parts[1].split('.')[0] : '-';
    return { date: datePart, time: timePart };
  };

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">任务调度管理</h2>
          <p className="text-slate-500 mt-1 font-medium">分布式节点部署任务队列与实时执行审计</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadTasks}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="检索任务 ID、服务名称或目标节点..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">任务/服务标识</th>
                <th className="px-6 py-5">类型</th>
                <th className="px-6 py-5">目标节点</th>
                <th className="px-6 py-5">进度状态</th>
                <th className="px-6 py-5">创建时间</th>
                <th className="px-8 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && tasks.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredTasks.map(t => {
                const timeInfo = formatTaskTime(t?.create_time);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'deploy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          <Workflow size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{t.service_name || 'Unknown'}</p>
                          <p className="text-[10px] font-mono text-slate-400 tracking-tighter">ID: {t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 uppercase text-[10px] font-black text-slate-500">{t.type}</td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-600 truncate max-w-[150px]">{t.agent_key}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                          <div 
                            className={`h-full transition-all duration-1000 ${t.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`} 
                            style={{ width: `${t.progress || 0}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{t.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock size={10} /> {timeInfo.date}
                        </div>
                        <div className="text-[10px] font-black text-slate-300 ml-4 font-mono">
                          {timeInfo.time}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <StatusBadge status={t.status} />
                         <button 
                           onClick={() => openLogViewer(t)}
                           className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                           title="查看实时执行日志"
                         >
                           <Terminal size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <History size={40} />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">暂无活跃部署任务</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terminal Log Viewer Overlay */}
      {selectedTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#0f172a] w-full max-w-5xl h-[80vh] rounded-[3rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                   <Terminal size={20} />
                 </div>
                 <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">执行审计：{selectedTask.service_name || 'Task'}</h3>
                   <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Task ID: {selectedTask.id}</p>
                 </div>
               </div>
               <button 
                 onClick={() => setSelectedTask(null)} 
                 className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
               >
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 font-mono text-xs text-blue-300/80 space-y-2 bg-black/20 custom-scrollbar scroll-smooth">
               {logs.map((log, i) => (
                 <div key={i} className="flex gap-6 group hover:bg-white/5 transition-colors p-1 rounded-lg">
                   <span className="text-slate-700 w-28 shrink-0 font-bold select-none text-[9px] uppercase tracking-tighter self-center">
                     {log?.timestamp?.split('T')[1]?.split('.')[0] || '00:00:00'}
                   </span>
                   <span className={`w-14 shrink-0 font-black text-[9px] uppercase px-1.5 py-0.5 rounded text-center self-center ${
                     log.level === 'INFO' ? 'bg-blue-900/40 text-blue-400' : 
                     log.level === 'ERROR' ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-500'
                   }`}>
                     {log.level}
                   </span>
                   <span className="whitespace-pre-wrap leading-relaxed text-slate-300 flex-1">{log.message}</span>
                 </div>
               ))}
               {logLoading && (
                 <div className="flex items-center gap-3 text-blue-500 font-black mt-8 bg-blue-500/10 p-6 rounded-2xl w-fit">
                   <Loader2 className="animate-spin" size={16} /> 正在同步 Agent 缓冲区执行流...
                 </div>
               )}
               {!logLoading && logs.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                    <AlertTriangle size={48} className="opacity-10" />
                    <p className="text-sm font-black uppercase tracking-widest">暂无执行日志输出</p>
                 </div>
               )}
             </div>
             <div className="px-10 py-5 bg-white/5 border-t border-white/5 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Agent Connection Established
                 </div>
                 <div className="h-4 w-[1px] bg-white/10" />
                 <p className="text-[10px] font-black text-slate-500 uppercase">Lines Buffered: {logs.length}</p>
               </div>
               <button 
                 onClick={() => openLogViewer(selectedTask)}
                 className="px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/10"
               >
                 <RefreshCw size={12} /> 重新获取日志
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
