
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, 
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
  Info,
  Download,
  FileArchive,
  Layers,
  FileText,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { ProjectResource, ProjectTask, ProjectPVC } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

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

interface UploadQueueItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export const BaseResourcePage: React.FC<BaseResourcePageProps> = ({ type, title, subtitle, projectId }) => {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [pvcs, setPvcs] = useState<ProjectPVC[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Deletion State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; ids: number[] }>({ show: false, ids: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [globalPvcSize, setGlobalPvcSize] = useState(10);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log Modal States
  const [logModal, setLogModal] = useState<{ show: boolean; taskId: string; logs: string[] }>({ show: false, taskId: '', logs: [] });
  const [logLoading, setLogLoading] = useState(false);

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
      setResources(Array.isArray(resData) ? resData : []);
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

  const addFilesToQueue = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadQueueItem[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
  };

  const removeFileFromQueue = (id: string) => {
    if (isUploadingBatch) return;
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || uploadQueue.length === 0) return;
    
    setIsUploadingBatch(true);
    
    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === 'completed') continue;

      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q));

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('name', item.file.name.split('.')[0]);
        formData.append('resource_type', type);
        formData.append('project_ids', projectId);
        formData.append('pvc_size', globalPvcSize.toString());

        await api.resources.upload(formData);
        
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q));
      } catch (err: any) {
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', progress: 0, error: err.message } : q));
      }
    }

    setIsUploadingBatch(false);
    loadData();
  };

  const handleDeleteClick = (ids: number[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteConfirm({ show: true, ids });
  };

  const executeDelete = async () => {
    if (deleteConfirm.ids.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(deleteConfirm.ids.map(id => api.resources.delete(id)));
      setDeleteConfirm({ show: false, ids: [] });
      setSelectedIds(new Set());
      loadData();
    } catch (err: any) {
      alert("删除失败: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredResources = useMemo(() => {
    const safeResources = Array.isArray(resources) ? resources : [];
    return safeResources.filter(r => 
      r && (r.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resources, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResources.length && filteredResources.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResources.map(r => r.id)));
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

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFilesToQueue(e.dataTransfer.files);
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const activeTasks = safeTasks.filter(t => t && (t.status === 'pending' || t.status === 'running'));
  const currentPvc = Array.isArray(pvcs) && pvcs.length > 0 ? pvcs[0] : null;

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto relative">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
               <Layers size={24} />
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
            onClick={() => {
              setUploadQueue([]);
              setIsUploadModalOpen(true);
            }}
            disabled={!projectId}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <Plus size={20} /> 批量上传资产
          </button>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-40 bg-slate-900 px-8 py-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                 <CheckCircle2 size={20} />
              </div>
              <span className="text-sm font-black text-white uppercase tracking-widest">已选中 {selectedIds.size} 项资产</span>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={(e) => handleDeleteClick(Array.from(selectedIds), e)}
                className="px-6 py-2.5 bg-red-500/10 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500/20 transition-all"
              >
                 <Trash2 size={16} /> 批量销毁
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-6 py-2.5 bg-white/5 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
              >
                 取消选择
              </button>
           </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已纳管资产</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{resources.length}</h3>
          </div>
          <FileBox className="text-blue-100" size={40} />
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">存储配额状态 (PVC 集群)</p>
            <span className="text-xs font-black text-blue-600 uppercase">{pvcs.length} 个活跃卷</span>
          </div>
          <div className="h-4 bg-slate-50 rounded-full overflow-hidden flex border border-slate-100">
             <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: pvcs.length > 0 ? '45%' : '0%' }} />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
             <span>Storage Class: {currentPvc?.storage_class || 'Standard'}</span>
             <span>Status: Distributed</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between group overflow-hidden relative">
           <Workflow className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-5 rotate-12" />
           <div className="relative z-10">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">后台异步任务</p>
             <h3 className="text-3xl font-black mt-1">{activeTasks.length}</h3>
           </div>
           <StatusBadge status={activeTasks.length > 0 ? 'Running' : 'Idle'} />
        </div>
      </div>

      {/* Active Tasks Grid */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">正在执行的任务流</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTasks.map(task => (
              <div key={task.task_id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 animate-in slide-in-from-top-2">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Loader2 className="animate-spin" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 uppercase truncate">{(task.task_type || 'Task').replace('_', ' ')}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${task.progress || 0}%` }} />
                  </div>
                </div>
                <button 
                  onClick={() => showTaskLogs(task.task_id)}
                  className="p-2 text-slate-300 hover:text-blue-600 transition-all"
                >
                  <Terminal size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Resource List */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="搜索资产名称、原始文件名或 UUID..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 w-12 text-center">
                  <button onClick={toggleSelectAll} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    {selectedIds.size === filteredResources.length && filteredResources.length > 0 ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-5">资源名称 / 原始文件</th>
                <th className="px-6 py-5">PVC 存储实例</th>
                <th className="px-6 py-5">大小 / 配额</th>
                <th className="px-6 py-5">入库状态</th>
                <th className="px-8 py-5 text-right">操作管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : filteredResources.map(res => (
                <tr 
                  key={res.id} 
                  className={`hover:bg-slate-50 transition-all group cursor-pointer ${selectedIds.has(res.id) ? 'bg-blue-50/30' : ''}`}
                  onClick={(e) => toggleSelect(res.id, e)}
                >
                  <td className="px-6 py-6 text-center">
                    <button className="p-2">
                      {selectedIds.has(res.id) ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} className="text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black transition-all shadow-sm ${selectedIds.has(res.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                        {(res.name || 'R')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{res.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase truncate mt-0.5">{res.original_file_name || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <HardDrive size={14} className="text-slate-300" />
                        <span>{res.pvc_name || 'Allocating...'}</span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase">NS: {res.pvc_namespace || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg w-fit">
                        {(res.original_file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Quota: {res.pvc_size}Gi</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={res.upload_status} />
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={api.resources.downloadFile(res.resource_uuid)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        onClick={e => e.stopPropagation()}
                        title="下载原始压缩包"
                      >
                        <Download size={16} />
                      </a>
                      <button 
                        onClick={(e) => handleDeleteClick([res.id], e)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="删除并清理 PVC"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredResources.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-40 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Upload size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">暂无资产，请先上传测试资源</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Upload size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">批量资产上传</h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">支持多文件并行上传并自动解压至 K8S 独立 PVC</p>
                  </div>
                </div>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                  <X size={24} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">默认 PVC 配额 (Gi)</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all"
                      value={globalPvcSize}
                      onChange={e => setGlobalPvcSize(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">关联项目 ID</label>
                    <div className="w-full px-6 py-4 bg-slate-200 text-slate-500 rounded-2xl font-mono text-[10px] flex items-center">
                       {projectId}
                    </div>
                  </div>
                </div>

                <div 
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={handleDragOver}
                   onDragEnter={handleDragEnter}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   className={`p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all group ${
                     isDragging ? 'bg-blue-50 border-blue-500 scale-[1.01]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-blue-400'
                   }`}
                >
                    <input 
                       type="file" 
                       multiple
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={(e) => addFilesToQueue(e.target.files)} 
                    />
                    <FileArchive size={48} className={`mb-3 transition-all ${isDragging ? 'text-blue-500 animate-bounce' : 'text-slate-300 group-hover:text-blue-500'}`} />
                    <p className="text-sm font-black text-slate-600">点击或拖拽多个本地压缩包</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">ZIP, TAR.GZ (MAX 500MB PER FILE)</p>
                </div>

                {uploadQueue.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                         <span>待上传列表 ({uploadQueue.length})</span>
                         <button onClick={() => !isUploadingBatch && setUploadQueue([])} className="text-blue-600 hover:underline">清空列表</button>
                      </h4>
                      <div className="space-y-2">
                         {uploadQueue.map((item) => (
                            <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/item">
                               <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                     item.status === 'completed' ? 'bg-green-100 text-green-600' :
                                     item.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-white text-slate-400'
                                  }`}>
                                     {item.status === 'uploading' ? <Loader2 size={18} className="animate-spin" /> : <FileArchive size={18} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-xs font-black text-slate-700 truncate">{item.file.name}</p>
                                     <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
                                           <div className={`h-full transition-all duration-300 ${item.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${item.progress}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400">{(item.file.size / 1024 / 1024).toFixed(1)}MB</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="ml-4 shrink-0 flex items-center gap-2">
                                  {/* Fix: Wrapped AlertCircle in a span with title because Lucide icons do not support the 'title' prop */}
                                  {item.status === 'failed' && <span title={item.error}><AlertCircle size={14} className="text-red-500" /></span>}
                                  {item.status === 'completed' && <CheckCircle2 size={14} className="text-green-500" />}
                                  <button 
                                     onClick={() => removeFileFromQueue(item.id)}
                                     disabled={isUploadingBatch}
                                     className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover/item:opacity-100 disabled:hidden"
                                  >
                                     <Trash2 size={14} />
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex gap-4 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploadingBatch}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  取消
                </button>
                <button 
                  onClick={handleUploadSubmit}
                  disabled={isUploadingBatch || uploadQueue.length === 0}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isUploadingBatch ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                  开始批量上传
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">确认销毁资产？</h3>
              <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                您正准备永久删除 <span className="text-red-600 font-black">{deleteConfirm.ids.length}</span> 项测试资产。
                此操作将同步销毁关联的 <span className="text-red-600 font-black">K8S PVC 存储卷</span>。该过程<span className="font-black">不可逆</span>。
              </p>
            </div>
            <div className="px-10 pb-10 flex gap-4">
              <button 
                onClick={() => setDeleteConfirm({ show: false, ids: [] })}
                disabled={isDeleting}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
              >
                保留资产
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                确认销毁
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Viewer Modal */}
      {logModal.show && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-[#0f172a] w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden">
             <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Terminal size={20} /></div>
                 <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">任务执行日志</h3>
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
                   <Loader2 className="animate-spin" size={20} /> 正在同步 K8S Job 缓冲区...
                 </div>
               ) : logModal.logs.length > 0 ? (
                  logModal.logs.map((line, i) => (
                    <div key={i} className="flex gap-4 group">
                      <span className="text-slate-700 w-6 text-right select-none opacity-50">{i+1}</span>
                      <span className="whitespace-pre-wrap leading-relaxed">{line}</span>
                    </div>
                  ))
               ) : (
                 <div className="py-20 text-center text-slate-600 uppercase font-black tracking-widest">暂无日志输出</div>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
