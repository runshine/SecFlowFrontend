
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  FileBox, 
  Terminal, 
  Database, 
  Activity, 
  RefreshCw, 
  Download, 
  Trash2, 
  Search, 
  Loader2, 
  Box, 
  Clock, 
  HardDrive,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { ProjectResource, ProjectTask, ProjectPVC, SecurityProject } from '../types/types';
import { api } from '../api/api';
import { StatusBadge } from '../components/StatusBadge';

interface ProjectDetailPageProps {
  projectId: string;
  projects: SecurityProject[];
  onBack: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId, projects, onBack }) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'tasks' | 'pvcs'>('resources');
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [pvcs, setPvcs] = useState<ProjectPVC[]>([]);
  const [logView, setLogView] = useState<{ show: boolean; taskId: string; logs: string }>({ show: false, taskId: '', logs: '' });
  const [logLoading, setLogLoading] = useState(false);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    loadAllData();
  }, [projectId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resData, taskData, pvcData] = await Promise.all([
        api.resources.listProjectResources(projectId),
        api.resources.listProjectTasks(projectId),
        api.resources.listProjectPVCs(projectId)
      ]);
      setResources(resData || []);
      setTasks(taskData || []);
      setPvcs(pvcData.pvcs || []);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setLoading(false);
    }
  };

  const openLogViewer = async (taskId: string) => {
    setLogView({ show: true, taskId, logs: 'Loading logs from POD...' });
    setLogLoading(true);
    try {
      const { logs } = await api.resources.getTaskLogs(taskId);
      setLogView(prev => ({ ...prev, logs }));
    } catch (err) {
      setLogView(prev => ({ ...prev, logs: "Failed to fetch logs: " + (err instanceof Error ? err.message : 'Unknown error') }));
    } finally {
      setLogLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 animate-in fade-in">
        <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">正在同步 K8S 集群资源状态...</p>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{project?.name || '未知项目'}</h2>
              <StatusBadge status={project?.status || 'Active'} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Box size={14} /> 命名空间: <span className="text-blue-600 font-black">{project?.k8s_namespace || 'default'}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Activity size={14} /> ID: <span className="text-slate-600">{projectId}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={loadAllData} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all">
            <RefreshCw size={20} />
          </button>
          <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
            创建资源
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
        {[
          { id: 'resources', label: '资源列表', icon: <FileBox size={16} /> },
          { id: 'tasks', label: '任务日志', icon: <Terminal size={16} /> },
          { id: 'pvcs', label: '存储资源', icon: <Database size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        {activeTab === 'resources' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <table className="w-full text-left">
               <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                 <tr>
                   <th className="px-8 py-5">资源名称</th>
                   <th className="px-6 py-5">类型</th>
                   <th className="px-6 py-5">物理大小</th>
                   <th className="px-6 py-5">PVC 映射</th>
                   <th className="px-6 py-5">创建时间</th>
                   <th className="px-8 py-5 text-right">操作</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {resources.map(res => (
                   <tr key={res.id} className="hover:bg-slate-50/50 transition-all group">
                     <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                           <FileText size={18} />
                         </div>
                         <span className="text-sm font-black text-slate-700 truncate max-w-[240px]">{res.file_name}</span>
                       </div>
                     </td>
                     <td className="px-6 py-5"><StatusBadge status={res.resource_type} /></td>
                     <td className="px-6 py-5 font-mono text-xs text-slate-500">{(res.file_size / 1024 / 1024).toFixed(2)} MB</td>
                     <td className="px-6 py-5 text-xs font-bold text-blue-500">{res.pvc_name}</td>
                     <td className="px-6 py-5 text-xs text-slate-400 font-medium">{res.created_at.split('T')[0]}</td>
                     <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="flex justify-end gap-1">
                         <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><Download size={16} /></button>
                         <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
                 {resources.length === 0 && (
                   <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No resources found in this project</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <table className="w-full text-left">
               <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                 <tr>
                   <th className="px-8 py-5">任务 ID / 类型</th>
                   <th className="px-6 py-5 w-64">进度</th>
                   <th className="px-6 py-5">耗时</th>
                   <th className="px-6 py-5">状态</th>
                   <th className="px-8 py-5 text-right">操作</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {tasks.map(task => (
                   <tr key={task.task_id} className="hover:bg-slate-50/50 transition-all">
                     <td className="px-8 py-5">
                       <div>
                         <p className="text-xs font-mono text-slate-400">{task.task_id}</p>
                         <p className="text-sm font-black text-slate-800 uppercase mt-1 tracking-tight">{task.task_type}</p>
                       </div>
                     </td>
                     <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                         <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-500 ${task.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${task.progress}%` }} />
                         </div>
                         <span className="text-[10px] font-black text-slate-400 w-8">{task.progress}%</span>
                       </div>
                     </td>
                     <td className="px-6 py-5 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5"><Clock size={12} /> {task.created_at.split('T')[1].substring(0, 5)}</div>
                     </td>
                     <td className="px-6 py-5"><StatusBadge status={task.status} /></td>
                     <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => openLogViewer(task.task_id)}
                         className="flex items-center gap-2 ml-auto px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all"
                       >
                         <Terminal size={14} /> 查看日志
                       </button>
                     </td>
                   </tr>
                 ))}
                 {tasks.length === 0 && (
                   <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No background tasks found</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'pvcs' && (
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {pvcs.map(pvc => (
              <div key={pvc.pvc_name} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white border border-slate-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Database size={24} />
                  </div>
                  <StatusBadge status={pvc.status} />
                </div>
                <h4 className="text-lg font-black text-slate-800 break-all">{pvc.pvc_name}</h4>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">资源类型</span>
                    <span className="text-slate-600">{pvc.resource_type}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">存储容量</span>
                    <span className="text-slate-800 font-black">{pvc.capacity}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">关联资源</span>
                    <span className="text-blue-600 font-black">{pvc.resources_count} Files</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/60 rounded-xl border border-white text-[10px] font-mono text-slate-400 break-all">
                  Mount: {pvc.mount_path || '/mnt/' + pvc.pvc_name}
                </div>
              </div>
            ))}
            {pvcs.length === 0 && (
              <div className="col-span-3 py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No PVC instances mapped to this project</div>
            )}
          </div>
        )}
      </div>

      {/* Log Terminal Overlay */}
      {logView.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-4xl h-[70vh] rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95">
             <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Terminal size={16} /></div>
                 <div>
                   <h3 className="text-sm font-black text-white">Pod Logs Viewer</h3>
                   <p className="text-[10px] font-mono text-slate-500">{logView.taskId}</p>
                 </div>
               </div>
               <button onClick={() => setLogView({ show: false, taskId: '', logs: '' })} className="p-2 text-slate-500 hover:text-white transition-all">
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 font-mono text-xs text-blue-400/90 space-y-1 bg-black/20 custom-scrollbar scroll-smooth">
               {logView.logs.split('\n').map((line, i) => (
                 <div key={i} className="flex gap-4">
                   <span className="text-slate-700 w-6 text-right select-none">{i+1}</span>
                   <span className="whitespace-pre-wrap">{line}</span>
                 </div>
               ))}
               {logLoading && <div className="flex items-center gap-3 text-blue-600 font-black mt-4"><Loader2 className="animate-spin" size={14} /> FETCHING STREAMING LOGS...</div>}
             </div>
             <div className="px-8 py-4 bg-slate-800/40 border-t border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Connection Live
               </div>
               <button onClick={() => openLogViewer(logView.taskId)} className="text-[10px] font-black text-blue-500 hover:underline flex items-center gap-1.5">
                 <RefreshCw size={12} /> 手动刷新
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
