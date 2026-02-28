
import React, { useState, useEffect } from 'react';
import { Activity, Play, StopCircle, Trash2, RefreshCw, Search, Loader2, Clock, Terminal, Plus, Power, PowerOff, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkflowInstance, WorkflowStatus } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const WorkflowInstancePage: React.FC<{ projectId: string, onNavigateToDetail: (id: string) => void }> = ({ projectId, onNavigateToDetail }) => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(1000);
  const [total, setTotal] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null); // null means batch delete
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    run_mode: 'once',
    trigger_type: 'manual',
    trigger_enabled: false
  });

  useEffect(() => {
    if (projectId) {
      loadInstances(1);
      const interval = setInterval(() => loadInstances(page), 10000);
      return () => clearInterval(interval);
    }
  }, [projectId, page, pageSize]);

  const loadInstances = async (p = page) => {
    try {
      const res = await api.workflow.listInstances({ 
        project_id: projectId,
        page: p,
        page_size: pageSize
      });
      setInstances((res as any).item || (res as any).items || []);
      setTotal((res as any).total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.workflow.createInstance({
        ...formData,
        project_id: projectId,
        nodes: [],
        edges: []
      });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', run_mode: 'once', trigger_type: 'manual', trigger_enabled: false });
      loadInstances();
    } catch (e: any) {
      alert("创建失败: " + e.message);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.workflow.startInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("启动失败: " + e.message);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.workflow.stopInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("停止失败: " + e.message);
    }
  };

  const handleSync = async (id: string) => {
    try {
      await api.workflow.syncInstanceStatus(id);
      loadInstances();
    } catch (e: any) {
      alert("同步失败: " + e.message);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.workflow.activateInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("激活失败: " + e.message);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.workflow.deactivateInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("停用失败: " + e.message);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      if (deletingId) {
        // Single delete
        await api.workflow.deleteInstance(deletingId);
      } else {
        // Batch delete
        await Promise.all(selectedIds.map(id => api.workflow.deleteInstance(id)));
        setSelectedIds([]);
      }
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadInstances();
    } catch (e: any) {
      alert("删除失败: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === instances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(instances.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">工作流实例</h2>
          <p className="text-slate-500 mt-1 font-medium italic">实时监控安全评估流水线的执行进度与底层容器负载</p>
        </div>
        <div className="flex gap-4">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => {
                setDeletingId(null);
                setIsDeleteModalOpen(true);
              }} 
              className="flex items-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-bold border border-red-100"
            >
              <Trash2 size={20} />
              批量删除 ({selectedIds.length})
            </button>
          )}
          <button onClick={() => loadInstances()} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/20">
            <Plus size={20} />
            创建实例
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" placeholder="搜索实例名称或 ID..." 
          className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6 w-10">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={instances.length > 0 && selectedIds.length === instances.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-6">实例信息</th>
              <th className="px-6 py-6">运行模式</th>
              <th className="px-6 py-6">节点数</th>
              <th className="px-6 py-6">最后运行时间</th>
              <th className="px-6 py-6 text-center">当前状态</th>
              <th className="px-8 py-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && instances.length === 0 ? (
              <tr><td colSpan={7} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
            ) : instances.filter(i => i.name.includes(searchTerm)).map(instance => (
              <tr key={instance.id} className={`hover:bg-slate-50 transition-all group ${selectedIds.includes(instance.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="px-8 py-6">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.includes(instance.id)}
                    onChange={() => toggleSelect(instance.id)}
                  />
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner transition-all ${instance.status === 'running' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                      <Activity size={22} />
                    </div>
                    <div>
                      <p 
                        className="text-sm font-black text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => onNavigateToDetail(instance.id)}
                      >
                        {instance.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">ID: {instance.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded-md w-fit">
                      {instance.run_mode === 'persistent' ? '持久化' : '一次性'}
                    </span>
                    {instance.run_mode === 'persistent' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${instance.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        {instance.is_active ? '已激活' : '未激活'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Terminal size={14} className="text-blue-500" />
                    <span>{instance.nodes?.length || 0} 节点</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock size={12} /> {instance.last_run_at ? instance.last_run_at.replace('T', ' ').split('.')[0] : '尚未运行'}
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <StatusBadge status={instance.status} />
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onNavigateToDetail(instance.id)} title="查看详情" className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                      <Search size={16} />
                    </button>
                    <button onClick={() => handleSync(instance.id)} title="同步状态" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                      <RefreshCw size={16} />
                    </button>
                    
                    {instance.status !== 'running' && (
                      <button onClick={() => handleStart(instance.id)} title="启动" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all">
                        <Play size={16} />
                      </button>
                    )}
                    
                    {instance.status === 'running' && (
                      <button onClick={() => handleStop(instance.id)} title="停止" className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all">
                        <StopCircle size={16} />
                      </button>
                    )}

                    {instance.run_mode === 'persistent' && !instance.is_active && (
                      <button onClick={() => handleActivate(instance.id)} title="激活" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                        <Power size={16} />
                      </button>
                    )}

                    {instance.run_mode === 'persistent' && instance.is_active && (
                      <button onClick={() => handleDeactivate(instance.id)} title="停用" className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-600 hover:text-white transition-all">
                        <PowerOff size={16} />
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        setDeletingId(instance.id);
                        setIsDeleteModalOpen(true);
                      }} 
                      title="删除" 
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {instances.length === 0 && !loading && (
              <tr><td colSpan={7} className="py-40 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">暂无工作流实例</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-8 py-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            共 {total} 个实例 | 每页 {pageSize} 条
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-black text-slate-800">
              {page} / {Math.ceil(total / pageSize) || 1}
            </span>
            <button 
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
              className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-800">创建空白实例</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">创建一个不包含任何节点的空白工作流实例，稍后可添加节点。</p>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">实例名称</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如: prod-security-scan" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">描述</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none transition-all" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="实例描述信息..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">运行模式</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none transition-all" value={formData.run_mode} onChange={e => setFormData({...formData, run_mode: e.target.value})}>
                    <option value="once">一次性 (Once)</option>
                    <option value="persistent">持久化 (Persistent)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">触发类型</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none transition-all" value={formData.trigger_type} onChange={e => setFormData({...formData, trigger_type: e.target.value})}>
                    <option value="manual">手动 (Manual)</option>
                    <option value="http">HTTP触发 (HTTP)</option>
                  </select>
                </div>
              </div>
              {formData.run_mode === 'persistent' && formData.trigger_type === 'http' && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <input type="checkbox" id="trigger_enabled" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" checked={formData.trigger_enabled} onChange={e => setFormData({...formData, trigger_enabled: e.target.checked})} />
                  <label htmlFor="trigger_enabled" className="text-sm font-bold text-blue-900 cursor-pointer">启用触发器</label>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">取消</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">确认删除？</h3>
              <p className="text-slate-500 mt-4 font-medium">
                {deletingId 
                  ? "您确定要删除这个工作流实例吗？此操作不可撤销，且会清理关联的 K8S 资源。" 
                  : `您确定要删除选中的 ${selectedIds.length} 个工作流实例吗？此操作将批量清理所有关联资源。`}
              </p>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingId(null);
                }} 
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                取消
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
