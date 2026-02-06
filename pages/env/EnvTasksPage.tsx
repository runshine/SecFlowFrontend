
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

export const EnvTasksPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AsyncTask | null>(null);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (projectId) {
      loadTasks();
      const interval = setInterval(loadTasks, 10000); // Polling for progress
      return () => clearInterval(interval);
    }
  }, [projectId]);

  const loadTasks = async () => {
    if (!projectId) return;
    try {
      const data = await api.environment.getTasks(projectId);
      setTasks(data?.task || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  const openLogViewer = async (task: AsyncTask) => {
    if (!projectId) return;
    setSelectedTask(task);
    setLogLoading(true);
    setLogs([]);
    try {
      const data = await api.environment.getTaskLogs(task.id, projectId);
      setLogs(data?.log || []);
    } catch (err) {
      alert("获取日志失败");
    } finally {
      setLogLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId || !confirm("确认删除该任务记录？")) return;
    try {
      await api.environment.deleteTask(taskId, projectId);
      loadTasks();
    } catch (err) {
      alert("删除失败");
    }
  };

  const filteredTasks = (tasks || []).filter(t => {
    const serviceMatch = t?.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = t?.id?.includes(searchTerm);
    return serviceMatch || idMatch;
  });

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
            disabled={!projectId}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {!projectId && (
          <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-xs font-bold flex items-center gap-3">
            <AlertTriangle size={16} /> 请先在顶部菜单选择一个项目
          </div>
        )}
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
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
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
                         <button 
                           onClick={() => handleDeleteTask(t.id)}
                           className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           title="删除任务记录"
                         >
                           <Trash2 size={18} />
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
      {/* ... Log Overlay ... */}
    </div>
  );
};
