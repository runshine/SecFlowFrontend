
import React, { useState, useEffect } from 'react';
import { 
  CloudDownload, 
  Database, 
  Trash2, 
  Loader2, 
  Search, 
  Plus, 
  FileBox, 
  Workflow, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Archive, 
  Eraser, 
  Clock,
  HardDrive,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { ProjectResource, ProjectTask, ProjectPVC } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

// Defined at the top to avoid any potential hoisting/reference issues
const RefreshCw = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    className={className}
    width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M21 2v6h-6"></path>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
    <path d="M3 22v-6h6"></path>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
  </svg>
);

interface BaseResourcePageProps {
  type: 'document' | 'software' | 'code' | 'other';
  title: string;
  subtitle: string;
  projectId: string;
}

export const BaseResourcePage: React.FC<BaseResourcePageProps> = ({ type, title, subtitle, projectId }) => {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [pvcs, setPvcs] = useState<ProjectPVC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [pullData, setPullData] = useState({ url: '', target_path: '', extract: true });
  const [pullLoading, setPullLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (projectId) {
      loadData();
      const interval = setInterval(loadTasks, 5000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [projectId, type]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [resData, pvcData] = await Promise.all([
        api.resources.list(projectId, type),
        api.resources.getPVCs(projectId)
      ]);
      
      // Ensure we are setting arrays to prevent mapping crashes
      setResources(Array.isArray(resData) ? resData : []);
      
      // Handle the wrapped PVC response safely
      const pvcList = pvcData && Array.isArray(pvcData.pvcs) ? pvcData.pvcs : [];
      setPvcs(pvcList.filter((p: ProjectPVC) => p && p.resource_type === type));
      
      await loadTasks();
    } catch (err) {
      console.error("Failed to load input data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!projectId) return;
    try {
      const taskData = await api.resources.getTasks(projectId);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  };

  const handlePullResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setPullLoading(true);
    try {
      await api.resources.create({
        project_id: projectId,
        resource_type: type,
        url: pullData.url,
        target_path: pullData.target_path || type + 's',
        extract: pullData.extract
      });
      setIsPullModalOpen(false);
      setPullData({ url: '', target_path: '', extract: true });
      loadData();
    } catch (err: any) {
      alert("创建拉取任务失败: " + err.message);
    } finally {
      setPullLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认彻底删除该资源及其物理文件？")) return;
    try {
      await api.resources.delete(id);
      loadData();
    } catch (err: any) {
      alert("删除失败: " + err.message);
    }
  };

  const handleExtract = async (id: number) => {
    const path = prompt("输入解压目标路径:", "extracted");
    if (!path) return;
    try {
      await api.resources.extract(id, path);
      loadTasks();
    } catch (err: any) {
      alert("发起解压失败: " + err.message);
    }
  };

  const handleCleanup = async (id: number) => {
    if (!confirm("确认清理该资源的临时物理文件？")) return;
    try {
      await api.resources.cleanup(id);
      alert("清理任务已提交");
    } catch (e) {}
  };

  // Safe checks for arrays before filter
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const activeTasks = safeTasks.filter(t => t && (t.status === 'pending' || t.status === 'running'));
  
  const safeResources = Array.isArray(resources) ? resources : [];
  const filteredResources = safeResources.filter(r => 
    r && (r.file_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentPvc = Array.isArray(pvcs) && pvcs.length > 0 ? pvcs[0] : null;

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
               <FileBox size={24} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
          </div>
          <p className="text-slate-500 font-medium">{subtitle}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="手动刷新数据"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsPullModalOpen(true)}
            disabled={!projectId}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <CloudDownload size={20} /> 远程拉取资产
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已拉取资产</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{safeResources.length}</h3>
          </div>
          <FileBox className="text-blue-100" size={40} />
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PVC 存储状态 ({currentPvc?.pvc_name || 'N/A'})</p>
            <span className="text-xs font-black text-blue-600 uppercase">{currentPvc?.capacity || '0Gi'}</span>
          </div>
          <div className="h-4 bg-slate-50 rounded-full overflow-hidden flex border border-slate-100">
             <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: currentPvc ? '45%' : '0%' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
             <span>Mount: {currentPvc?.mount_path || '/'}</span>
             <span>Status: {currentPvc?.status || 'Offline'}</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between group overflow-hidden relative">
           <Workflow className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-5 rotate-12" />
           <div className="relative z-10">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">活跃调度任务</p>
             <h3 className="text-3xl font-black mt-1">{activeTasks.length}</h3>
           </div>
           <StatusBadge status={activeTasks.length > 0 ? 'Running' : 'Idle'} />
        </div>
      </div>

      {/* Active Tasks List */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">正在执行的任务</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTasks.map(task => (
              <div key={task.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 animate-in slide-in-from-top-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Loader2 className="animate-spin" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 uppercase truncate">{(task.task_type || 'Unknown').toUpperCase()} Task</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${task.progress || 0}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400">{task.progress || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="检索资源名称、路径或拉取来源..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">资源名称 / 文件 ID</th>
                <th className="px-6 py-5">存储路径</th>
                <th className="px-6 py-5">大小</th>
                <th className="px-6 py-5">入库时间</th>
                <th className="px-8 py-5 text-right">操作管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredResources.map(res => (
                <tr key={res.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {(res.file_name || 'R')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{res.file_name || 'Unnamed Resource'}</p>
                        <p className="text-[9px] font-mono text-slate-400 uppercase truncate">{res.url || 'Internal Asset'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <HardDrive size={14} className="text-slate-300" />
                      <span>{res.target_path || '/'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">
                      {res.file_size ? (res.file_size / 1024 / 1024).toFixed(2) : '0.00'} MB
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Clock size={12} /> {res.created_at ? res.created_at.split('T')[0] : 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleExtract(res.id)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="解压资源"
                      >
                        <Archive size={16} />
                      </button>
                      <button 
                        onClick={() => handleCleanup(res.id)}
                        className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="清理残留"
                      >
                        <Eraser size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(res.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="删除资源"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredResources.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <CloudDownload size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">未发现已拉取的资产资源</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pull Resource Modal */}
      {isPullModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <CloudDownload size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">远程资产拉取</h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">系统将自动创建调度任务下载至 PVC 存储</p>
                  </div>
                </div>
                <button onClick={() => setIsPullModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                  <X size={24} />
                </button>
             </div>

             <form onSubmit={handlePullResource} className="p-10 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">远程下载 URL *</label>
                  <div className="relative">
                    <Terminal className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      type="url"
                      placeholder="http://example.com/software-v1.0.zip"
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all"
                      value={pullData.url}
                      onChange={e => setPullData({...pullData, url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">目标存储路径</label>
                    <input 
                      placeholder={`默认: ${type}s/`}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all"
                      value={pullData.target_path}
                      onChange={e => setPullData({...pullData, target_path: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                         checked={pullData.extract}
                         onChange={e => setPullData({...pullData, extract: e.target.checked})}
                       />
                       <span className="text-xs font-black text-slate-600 uppercase">自动解压 Artifact</span>
                    </label>
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                    注意：拉取任务将在后台异步执行。下载完成后，资产将挂载到项目关联的 <span className="font-black">secflow-{type}-pvc</span> 中。系统支持大文件断点续传。
                  </p>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => { setIsPullModalOpen(false); setPullLoading(false); }}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                  >
                    取消操作
                  </button>
                  <button 
                    type="submit"
                    disabled={pullLoading}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {pullLoading ? <Loader2 className="animate-spin" size={20} /> : <CloudDownload size={20} />}
                    立即发起拉取
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
