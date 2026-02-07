
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  Search, 
  HardDrive, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  Layers,
  ChevronRight,
  X,
  Container,
  Box,
  Layout,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  // Added missing Clock import
  Clock
} from 'lucide-react';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';
import { ProjectResource } from '../../types/types';

export const OutputPvcPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pvc_size: 10
  });

  // Details
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Deletion
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null; name: string }>({ show: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.resources.list(projectId, 'output_pvc');
      // For Output PVCs, we'll want to enrich them with full detail to show K8S status
      const detailedPromises = res.map(r => api.resources.getOutputPvcDetail(r.id).catch(() => r));
      const enriched = await Promise.all(detailedPromises);
      setResources(enriched);
    } catch (err) {
      console.error("Failed to load output PVCs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.resources.createOutputPvc({
        ...formData,
        project_id: projectId
      });
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', pvc_size: 10 });
      loadData();
    } catch (err: any) {
      alert("创建失败: " + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteTrigger = (id: number, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsDeleting(true);
    try {
      await api.resources.deleteOutputPvc(deleteConfirm.id);
      setDeleteConfirm({ show: false, id: null, name: '' });
      loadData();
    } catch (err: any) {
      alert("删除失败: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const viewDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await api.resources.getOutputPvcDetail(id);
      setSelectedDetail(detail);
    } catch (err) {
      alert("获取详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pvc_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resources, searchTerm]);

  const stats = useMemo(() => {
    const totalSize = resources.reduce((acc, r) => acc + (parseInt(r.pvc_size) || 0), 0);
    const inUseCount = resources.filter(r => r.in_use).length;
    return { totalSize, inUseCount };
  }, [resources]);

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-600 text-white rounded-[1.25rem] shadow-lg shadow-indigo-500/20">
               <Database size={28} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">输出-PVC 资源管理</h2>
               <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Persistent Volume Orchestration for Tasks</p>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!projectId}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Plus size={20} /> 创建输出存储
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] w-40 h-40 bg-indigo-500 opacity-5 blur-3xl group-hover:opacity-10 transition-opacity" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">纳管存储总量</p>
          <div className="flex items-end gap-3 mt-4">
             <h3 className="text-6xl font-black text-white">{stats.totalSize}</h3>
             <div className="pb-2">
                <p className="text-xs font-black text-indigo-400 uppercase">Gi Total</p>
             </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase">活跃 PVC 实例</p>
                <p className="text-xl font-black">{resources.length}</p>
             </div>
             <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                <Layers className="text-indigo-500" size={20} />
             </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">当前使用中</p>
              <h3 className="text-4xl font-black mt-2 text-slate-800">{stats.inUseCount}</h3>
           </div>
           <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase mt-4">
              <Activity size={12} className="animate-pulse" /> Active Task Mounting
           </div>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden relative group">
           <HardDrive className="absolute right-[-10px] bottom-[-10px] w-32 h-32 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform" />
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">存储环境概览</p>
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-indigo-500" />
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Provisioning</p>
                       <p className="text-xs font-bold text-slate-700">K8S Dynamic Allocator</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Isolation Level</p>
                       <p className="text-xs font-bold text-slate-700">Project Namespace (Sandboxed)</p>
                    </div>
                 </div>
              </div>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase">System Readiness</p>
                 <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600" style={{ width: '100%' }} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600">READY</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="通过资源名称、PVC 标识或描述过滤..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">资源/存储标识</th>
                <th className="px-6 py-6">命名空间 (NS)</th>
                <th className="px-6 py-6">容量配额</th>
                <th className="px-6 py-6">使用状态</th>
                <th className="px-6 py-6">K8S 状态</th>
                <th className="px-8 py-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></td></tr>
              ) : filteredResources.map(res => (
                <tr 
                  key={res.id} 
                  className="hover:bg-slate-50 transition-all group cursor-pointer"
                  onClick={() => viewDetail(res.id)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Database size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{res.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter mt-0.5">{res.pvc_name || 'Allocating...'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-mono text-[11px] text-slate-500 font-bold uppercase">{res.pvc_namespace}</td>
                  <td className="px-6 py-6">
                    <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                       {res.pvc_size}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    {res.in_use ? (
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 w-fit">
                          <Activity size={12} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase">Mounted</span>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl border border-slate-200 w-fit">
                          <CheckCircle2 size={12} />
                          <span className="text-[10px] font-black uppercase">Idle</span>
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <StatusBadge status={res.pvc_k8s_status?.status || 'Unknown'} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                        title="查看详细挂载信息"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteTrigger(res.id, res.name, e)}
                        className="p-3 bg-red-50 text-red-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-xl transition-all shadow-sm"
                        title="回收存储资源"
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
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Box size={40} />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">当前项目下暂无输出 PVC 资源</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-10 pb-6 border-b border-slate-50 bg-slate-50/30">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                       <Plus size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">创建输出存储卷</h3>
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">自动编排 K8S 持久化存储配额</p>
                    </div>
                 </div>
              </div>

              <form onSubmit={handleCreate} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">资源显示名称 *</label>
                    <input 
                       required
                       placeholder="例如：auth-service-report-storage"
                       className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-indigo-500/10 font-bold text-slate-800 transition-all"
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                       <span>容量大小 (Gi) *</span>
                       <span className="text-indigo-600 font-bold tracking-tight">Range: 1-500 Gi</span>
                    </label>
                    <input 
                       type="number"
                       min="1"
                       max="500"
                       required
                       className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-indigo-500/10 font-bold text-slate-800 transition-all"
                       value={formData.pvc_size}
                       onChange={e => setFormData({...formData, pvc_size: parseInt(e.target.value)})}
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">资源描述</label>
                    <textarea 
                       placeholder="描述该存储卷的使用场景或关联任务..."
                       rows={2}
                       className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-indigo-500/10 font-bold text-slate-800 transition-all resize-none"
                       value={formData.description}
                       onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>

                 <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex gap-4 items-start">
                    <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                       输出存储卷将自动创建在当前项目的 K8S Namespace 中。创建后，该卷可直接被后续的渗透测试任务、审计任务挂载使用。
                    </p>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button 
                       type="button"
                       onClick={() => setIsCreateModalOpen(false)}
                       className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                    >
                       取消
                    </button>
                    <button 
                       type="submit"
                       disabled={createLoading}
                       className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                       {createLoading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                       确认创建并分配
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Trash2 size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">销毁存储资源？</h3>
              <p className="text-slate-500 mt-4 font-medium leading-relaxed">
                您正准备移除输出存储 <span className="text-red-600 font-black">"{deleteConfirm.name}"</span>。
                所有存储在其中的非持久化数据将<span className="font-bold underline text-red-600 uppercase">立即永久丢失</span>。
              </p>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-left">
                 <div className="flex gap-3 text-amber-700 font-black text-xs items-center mb-1">
                    <AlertCircle size={16} /> 注意：正在使用中的卷无法销毁
                 </div>
              </div>
            </div>
            <div className="px-10 pb-10 flex gap-4">
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                disabled={isDeleting}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                保留资源
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                确认销毁
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Overlay */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
              <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                       <Layout size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">存储资源详情</h3>
                       <StatusBadge status={selectedDetail.pvc_k8s_status?.status || 'Unknown'} />
                    </div>
                 </div>
                 <button onClick={() => setSelectedDetail(null)} className="p-4 bg-white/50 border border-slate-200 text-slate-400 hover:text-slate-800 rounded-2xl transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">K8S PVC Name</p>
                       <p className="text-sm font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 truncate">{selectedDetail.pvc_name}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Storage Capacity</p>
                       <p className="text-sm font-black text-slate-800">{selectedDetail.pvc_size}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provisioning Type</p>
                       <p className="text-sm font-bold text-slate-600">{selectedDetail.pvc_k8s_status?.storage_class || 'Standard'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Binding Status</p>
                       <p className="text-sm font-black text-green-600">{selectedDetail.pvc_k8s_status?.status}</p>
                    </div>
                 </div>

                 <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-6 relative overflow-hidden group">
                    <Container className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
                    <div className="flex justify-between items-center relative z-10">
                       <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Mount Usage Analysis</h4>
                       <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${selectedDetail.in_use ? 'bg-amber-600' : 'bg-slate-700'}`}>
                          {selectedDetail.in_use ? 'LIVE_MOUNT' : 'NO_POD_ASSOCIATED'}
                       </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium relative z-10 italic">
                       "{selectedDetail.use_message || 'PVC is currently isolated and not mounted by any running security worker or pipeline job.'}"
                    </p>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Clock size={14} /> Lifecycle Management
                    </h4>
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">Created At</span>
                          <span className="font-black text-slate-800">{selectedDetail.created_at?.replace('T', ' ')}</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">Last Synchronized</span>
                          <span className="font-black text-slate-800">{selectedDetail.updated_at?.replace('T', ' ')}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-10 border-t border-slate-50 bg-slate-50/30 shrink-0">
                 <button 
                    onClick={() => setSelectedDetail(null)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                 >
                    Close Inspection
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
