
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Loader2,
  Calendar,
  Hash,
  Box
} from 'lucide-react';
import { SecurityProject } from '../types/types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/api';

interface ProjectMgmtPageProps {
  projects: SecurityProject[];
  setActiveProjectId: (id: string) => void;
  setCurrentView: (view: string) => void;
  setIsProjectModalOpen: (open: boolean) => void;
}

export const ProjectMgmtPage: React.FC<ProjectMgmtPageProps> = ({ 
  projects, 
  setActiveProjectId, 
  setCurrentView, 
  setIsProjectModalOpen 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{show: boolean, ids: string[]}>({ show: false, ids: [] });

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.k8s_namespace?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const isAllSelected = filteredProjects.length > 0 && selectedIds.size === filteredProjects.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteClick = (ids: string[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowConfirm({ show: true, ids });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (showConfirm.ids.length === 1) {
        await api.projects.delete(showConfirm.ids[0]);
      } else {
        await api.projects.batchDelete(showConfirm.ids);
      }
      // 在实际应用中，这里应该调用父组件的刷新函数
      // 为了演示，我们仅关闭弹窗并重置选中项
      setSelectedIds(new Set());
      window.location.reload(); // 临时方案：重新加载以获取最新列表
    } catch (err) {
      alert("删除失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setIsDeleting(false);
      setShowConfirm({ show: false, ids: [] });
    }
  };

  const handleRowClick = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('project-detail');
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">项目空间</h2>
          <p className="text-slate-500 mt-1 font-medium">统一管理安全评估目标、Namespace 及资源生命周期</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={20} /> 初始化项目
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="搜索项目名称或命名空间..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-3 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
          >
            {isAllSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
            <span>全选</span>
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">已选中 {selectedIds.size} 个项目</span>
            <button 
              onClick={() => handleDeleteClick(Array.from(selectedIds))}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={16} /> 批量删除
            </button>
          </div>
        )}
      </div>

      {/* Project List */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleRowClick(project.id)}
              className={`group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white border rounded-[2rem] transition-all cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 ${selectedIds.has(project.id) ? 'border-blue-200 bg-blue-50/10' : 'border-slate-100'}`}
            >
              {/* Checkbox */}
              <button 
                onClick={(e) => toggleSelect(project.id, e)}
                className="absolute top-6 left-6 md:static p-1 text-slate-300 hover:text-blue-600 transition-all"
              >
                {selectedIds.has(project.id) ? <CheckSquare size={22} className="text-blue-600" /> : <Square size={22} />}
              </button>

              {/* Project Icon & Main Info */}
              <div className="flex-1 flex items-center gap-5 min-w-0">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl border border-slate-100 group-hover:scale-105 transition-transform shrink-0">
                  {project.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-slate-800 truncate">{project.name}</h3>
                    <StatusBadge status={project.status || 'Active'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1">
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                      <Hash size={12} />
                      <span className="truncate max-w-[120px]">{project.id}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-500 font-black">
                      <Box size={12} />
                      <span>{project.k8s_namespace || 'default'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Data */}
              <div className="flex items-center gap-8 px-6 md:border-l border-slate-100">
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">创建日期</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-1">
                    <Calendar size={14} className="text-slate-300" />
                    <span>{project.created_at?.split('T')[0] || '2024-01-01'}</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">角色</p>
                  <p className="text-xs font-black text-slate-700 mt-1">所有者</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRowClick(project.id); }}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all"
                >
                  详情 <ChevronRight size={14} />
                </button>
                <button 
                  onClick={(e) => handleDeleteClick([project.id], e)}
                  className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center bg-white border border-slate-100 rounded-[3rem] border-dashed">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Box size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800">暂无匹配项目</h3>
            <p className="text-slate-400 mt-2 font-medium">您可以尝试调整搜索关键词或初始化一个新项目</p>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="mt-8 text-blue-600 font-black flex items-center gap-2 mx-auto hover:underline"
            >
              <Plus size={18} /> 立即创建首个项目
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">确认删除项目？</h3>
              <p className="text-slate-500 mt-3 font-medium leading-relaxed">
                您正在尝试删除 <span className="text-red-600 font-black">{showConfirm.ids.length}</span> 个项目。
                此操作将移除所有关联的资源映射，且<span className="font-black">不可恢复</span>。
              </p>
            </div>
            <div className="p-8 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setShowConfirm({ show: false, ids: [] })}
                disabled={isDeleting}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-100 transition-all"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
