
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Terminal, 
  RefreshCw, 
  Clock, 
  Trash2, 
  Search, 
  Workflow, 
  History,
  AlertTriangle,
  X,
  FileBox,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ProjectTask } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const TaskMgmtPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logModal, setLogModal] = useState<{ show: boolean; taskId: string; logs: string[] }>({ show: false, taskId: '', logs: [] });
  const [logLoading, setLogLoading] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; taskId: string | null }>({ show: false, taskId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadTasks();
      const interval = setInterval(loadTasks, 5000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const data = await api.resources.getTasks(projectId);
      setTasks(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };

  const showTaskLogs = async (taskId: string) => {
    setLogModal({ show: true, taskId, logs: [] });
    setLogLoading(true);
    try {
      const res = await api.resources.getTaskLogs(taskId);
      setLogModal(prev => ({ ...prev, logs: res.logs || [] }));
    } catch (err: any) {
      alert("获取日志失败");
    } finally {
      setLogLoading(false);
    }
  };

  const handleDeleteClick = (taskId: string) => {
    setDeleteConfirm({ show: true, taskId });
  };

  const executeDeleteTask = async () => {
    if (!deleteConfirm.taskId) return;
    setIsDeleting(true);
    try {
      await api.resources.deleteTask(deleteConfirm.taskId);
      setDeleteConfirm({ show: false, taskId: null });
      loadTasks();
    } catch (err: any) {
      alert("删除任务失败: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.task_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.task_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">资源任务管理</h2>
          <p className="text-slate-500 mt-1 font-medium">资产上传、镜像解压与持久化存储编排任务审计</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setLoading(true); loadTasks(); }}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <Workflow className="absolute right-[-20px] top-[-20px] w-40 h-40 opacity-5 rotate-12" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">活动任务</p>
          <h3 className="text-4xl font-black mt-2 text-blue-400 relative z-10">
            {tasks.filter(t => t.status === 'running' || t.status === 'pending').length}
          </h3>
          <p className="text-slate-400 text-xs mt-1 font-bold relative z-10">总任务数: {tasks.length}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">成功率</p>
          <h3 className="text-4xl font-black mt-2 text-slate-800">
            {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'succeeded').length / tasks.length) * 100) : 0}%
          </h3>
          <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black mt-1 uppercase">
            <CheckCircle2 size={12} /> Execution Health
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm col-span-2">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">异常监控 (Failed / Cancelled)</p>
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase">失败任务</p>
                <p className="text-2xl font-black text-red-600">{tasks.filter(t => t.status === 'failed').length}</p>
              </div>
              <AlertTriangle className="text-red-200" size={24} />
            </div>
            <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">已取消</p>
              <p className="text-2xl font-black text-slate-600">{tasks.filter(t => t.status === 'cancelled').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="搜索任务 ID、任务类型..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">任务标识 / ID</th>
                <th className="px-6 py-5">关联资源 ID</th>
                <th className="px-6 py-5">执行进度</th>
                <th className="px-6 py-5">创建日期</th>
                <th className="px-6 py-5">运行状态</th>
                <th className="px-8 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!projectId ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">请先在顶部菜单选择一个项目</p>
                  </td>
                </tr>
              ) : loading && tasks.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : filteredTasks.map(t => (
                <tr key={t.task_id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        t.status === 'succeeded' ? 'bg-green-50 text-green-600' : 
                        t.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Workflow size={18} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-700 block capitalize">{(t.task_type || 'Task').replace('_', ' ')}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{t.task_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <FileBox size={14} className="text-slate-300" />
                      <span>{t.resource_id}</span>
                    </div>
                  </td>
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
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock size={12} /> {t.created_at?.split('T')[0]}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => showTaskLogs(t.task_id)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="查看审计日志"
                      >
                        <Terminal size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(t.task_id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="删除/终止任务"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-40 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <History size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">暂无活跃任务流</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Viewer Modal */}
      {logModal.show && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#0f172a] w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden">
             <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><Terminal size={20} /></div>
                 <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">异步任务执行流审计</h3>
                   <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">Task ID: {logModal.taskId}</p>
                 </div>
               </div>
               <button onClick={() => setLogModal({ ...logModal, show: false })} className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all">
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 font-mono text-[11px] text-blue-300/80 space-y-1 bg-black/40 custom-scrollbar">
               {logLoading ? (
                 <div className="flex items-center gap-3 text-blue-500 font-black py-20 justify-center">
                   <Loader2 className="animate-spin" size={20} /> 正在同步后端任务缓冲区...
                 </div>
               ) : logModal.logs.length > 0 ? (
                  logModal.logs.map((line, i) => (
                    <div key={i} className="flex gap-4 group">
                      <span className="text-slate-700 w-6 text-right select-none opacity-50">{i+1}</span>
                      <span className="whitespace-pre-wrap leading-relaxed">{line}</span>
                    </div>
                  ))
               ) : (
                 <div className="py-20 flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <ShieldCheck size={48} className="opacity-10" />
                    <p className="text-xs uppercase font-black tracking-widest">暂无实时日志输出</p>
                 </div>
               )}
             </div>
             <div className="px-10 py-5 bg-white/5 border-t border-white/5 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Stream Ready
                 </div>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase">Lines: {logModal.logs.length}</p>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">终止异步任务？</h3>
              <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                您正准备移除或终止任务 <span className="text-red-600 font-black font-mono">{deleteConfirm.taskId}</span>。
                如果任务正在运行中，系统将尝试中断关联的 K8S Job。该操作<span className="font-black">不可逆</span>。
              </p>
            </div>
            <div className="px-10 pb-10 flex gap-4">
              <button 
                onClick={() => setDeleteConfirm({ show: false, taskId: null })}
                disabled={isDeleting}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
              >
                保留
              </button>
              <button 
                onClick={executeDeleteTask}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                确认销毁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
