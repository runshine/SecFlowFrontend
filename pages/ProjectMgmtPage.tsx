
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight, 
  AlertTriangle, 
  Loader2,
  Calendar,
  Box,
  Settings2,
  Activity,
  User,
  RefreshCw,
  Layers,
  ArrowRight,
  Hash,
  FileText,
  CheckSquare,
  Square,
  X,
  CheckCircle2
} from 'lucide-react';
import { SecurityProject } from '../types/types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/api';

interface ProjectMgmtPageProps {
  projects: SecurityProject[];
  setActiveProjectId: (id: string) => void;
  setCurrentView: (view: string) => void;
  refreshProjects: (showRefresh?: boolean) => Promise<void>;
}

export const ProjectMgmtPage: React.FC<ProjectMgmtPageProps> = ({ 
  projects, 
  setActiveProjectId, 
  setCurrentView,
  refreshProjects
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{show: boolean, ids: string[]}>({ show: false, ids: [] });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', k8s_namespace: '' });
  const [error, setError] = useState<string | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredProjects = useMemo(() => {
    return (projects || []).filter(p => {
      if (!p) return false;
      const name = p.name || '';
      const id = p.id || '';
      const description = p.description || '';
      const namespace = p.k8s_namespace || '';
      const owner = p.owner_name || '';
      const term = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(term) || 
             id.toLowerCase().includes(term) ||
             description.toLowerCase().includes(term) ||
             namespace.toLowerCase().includes(term) ||
             owner.toLowerCase().includes(term);
    });
  }, [projects, searchTerm]);

  const isAllSelected = filteredProjects.length > 0 && selectedIds.size === filteredProjects.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProjects(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.projects.create({
        name: newProject.name,
        description: newProject.description
      });
      setIsCreateModalOpen(false);
      setNewProject({ name: '', description: '', k8s_namespace: '' });
      await refreshProjects();
    } catch (err: any) {
      setError(err.message || "创建项目失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteClick = (e: React.MouseEvent, ids: string[]) => {
    e.stopPropagation();
    setShowConfirm({ show: true, ids });
  };

  const executeDelete = async () => {
    if (showConfirm.ids.length === 0) return;
    setIsDeleting(true);
    try {
      // Current API only supports single delete, we iterate for now
      await Promise.all(showConfirm.ids.map(id => api.projects.delete(id)));
      setShowConfirm({ show: false, ids: [] });
      setSelectedIds(new Set());
      await refreshProjects();
    } catch (err: any) {
      alert("部分或全部项目删除失败: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRowClick = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('project-detail');
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
               <Layers size={24} />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">项目空间</h2>
          </div>
          <p className="text-slate-500 font-medium">统一编排安全评估目标及其 K8S 运行环境上下文</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleRefresh}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="刷新列表"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
          >
            <Plus size={20} /> 初始化项目
          </button>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-50 bg-slate-900 px-8 py-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                 <CheckCircle2 size={20} />
              </div>
              <span className="text-sm font-black text-white">已选中 {selectedIds.size} 个项目资源</span>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={(e) => handleDeleteClick(e, Array.from(selectedIds))}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">总项目数</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{projects.length}</h3>
          </div>
          <Box className="text-blue-100" size={40} />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活跃环境</p>
            <h3 className="text-3xl font-black text-green-600 mt-1">{projects.filter(p => p.status === 'active').length}</h3>
          </div>
          <Activity className="text-green-100" size={40} />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最近活动</p>
            <p className="text-xs font-bold text-slate-600 mt-2 truncate max-w-[200px]">系统就绪，等待评估指令</p>
          </div>
          <User className="text-slate-100" size={40} />
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="搜索项目 ID、名称、描述或负责人..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-12">
                   <button 
                     onClick={toggleSelectAll}
                     className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                   >
                     {isAllSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                   </button>
                </th>
                <th className="px-4 py-5">项目 ID / 名称</th>
                <th className="px-6 py-5">项目描述</th>
                <th className="px-6 py-5">命名空间</th>
                <th className="px-6 py-5">负责人</th>
                <th className="px-6 py-5">状态</th>
                <th className="px-8 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr 
                    key={project.id}
                    onClick={() => handleRowClick(project.id)}
                    className={`group hover:bg-slate-50/80 cursor-pointer transition-all relative border-l-4 ${selectedIds.has(project.id) ? 'bg-blue-50/30 border-blue-600' : 'border-transparent hover:border-blue-600'}`}
                  >
                    <td className="px-6 py-5" onClick={(e) => toggleSelect(e, project.id)}>
                      <button className="p-2">
                        {selectedIds.has(project.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-300 hover:text-slate-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${selectedIds.has(project.id) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                          {(project.name || 'P')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{project.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Hash size={10} className="text-slate-300" />
                            <span className="text-[10px] font-mono text-slate-400 font-bold truncate max-w-[120px]">{project.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2 max-w-[250px]">
                        <FileText size={14} className="text-slate-300 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                          {project.description || "未提供项目详细描述..."}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Settings2 size={14} className="text-slate-300" />
                        <span>{project.k8s_namespace || 'default'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <User size={14} className="text-slate-300" />
                        <span>{project.owner_name || 'Admin'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={project.status || 'Active'} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDeleteClick(e, [project.id])}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="删除项目"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="p-2.5 text-blue-600 bg-blue-50 rounded-xl">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Layers size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">未检索到匹配项目</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 pb-0">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6">
                 <Plus size={32} />
               </div>
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">初始化项目空间</h3>
               <p className="text-slate-500 mt-2 font-medium">系统将自动在 K8S 集群中预置对应的安全沙箱 Namespace</p>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-10 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">项目名称 *</label>
                <input 
                  required
                  placeholder="例如：核心业务 API 渗透测试"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">项目简述</label>
                <textarea 
                  rows={3}
                  placeholder="描述该项目的评估目标与范围..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all resize-none"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                />
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  立即创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">确认删除项目？</h3>
              <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                您正准备移除 <span className="text-red-600 font-black">{showConfirm.ids.length}</span> 个项目空间。
                此操作将同步销毁关联的 <span className="text-red-600 font-black">K8S Namespace</span> 及其中运行的所有容器资产。该过程<span className="font-black">不可逆</span>。
              </p>
            </div>
            <div className="px-10 pb-10 flex gap-4">
              <button 
                onClick={() => setShowConfirm({ show: false, ids: [] })}
                disabled={isDeleting}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                保留
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
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
