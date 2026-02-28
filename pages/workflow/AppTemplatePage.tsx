
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  RefreshCw, 
  Layers, 
  Monitor, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  ExternalLink,
  Hash,
  X,
  Container,
  Zap,
  Globe,
  Settings,
  AlertCircle
} from 'lucide-react';
import { AppTemplate, TemplateScope } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const AppTemplatePage: React.FC<{ projectId: string, onNavigateToDetail: (id: string) => void }> = ({ projectId, onNavigateToDetail }) => {
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<TemplateScope>('project');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultContainer = { 
    name: 'main', 
    image: '', 
    command: '', 
    args: '', 
    env_vars: [{ name: '', value: '' }],
    volume_mounts: [{ pvc_name: '', mount_path: '', sub_path: '', read_only: false }],
    input_env_vars: [{ name: '', default_value: '' }],
    input_volume_mounts: [{ mount_path: '', sub_path: '', read_only: true }],
    output_env_vars: [],
    output_volume_mounts: [],
    privileged: false,
    image_pull_policy: 'IfNotPresent',
    resources: { requests: { cpu: '', memory: '' }, limits: { cpu: '', memory: '' } },
    liveness_probe: { type: 'http', port: '', path: '', initial_delay_seconds: 0, period_seconds: 10, timeout_seconds: 1, failure_threshold: 3, success_threshold: 1 },
    readiness_probe: { type: 'http', port: '', path: '', initial_delay_seconds: 0, period_seconds: 10, timeout_seconds: 1, failure_threshold: 3, success_threshold: 1 }
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'project' as TemplateScope,
    replicas: 1,
    service_ports: [{ name: 'http', port: 80, target_port: 80, protocol: 'TCP' }],
    service_name: '',
    create_service: true,
    service_type: 'ClusterIP' as 'ClusterIP' | 'LoadBalancer' | 'NodePort',
    containers: [ JSON.parse(JSON.stringify(defaultContainer)) ]
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadTemplates();
  }, [projectId, scope]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Fix: Query current project or 'all' for global
      const res = await api.workflow.listAppTemplates({ 
        scope, 
        project_id: scope === 'project' ? projectId : 'all' 
      });
      setTemplates(res.items || []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTemplates.slice(start, start + itemsPerPage);
  }, [filteredTemplates, currentPage]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要注销此应用组件模板吗？")) return;
    try {
      await api.workflow.deleteAppTemplate(id);
      loadTemplates();
    } catch (e: any) {
      alert("删除失败: " + e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.containers.some(c => !c.image)) {
      alert("请确保所有容器都已指定镜像");
      return;
    }
    
    const payload = {
      ...formData,
      project_id: formData.scope === 'project' ? projectId : undefined,
      service_ports: formData.service_ports.filter(p => p.port > 0),
      containers: formData.containers.map((c: any) => {
        const formatProbe = (p: any) => {
          if (!p.port && p.type !== 'exec') return undefined;
          return {
            ...p,
            port: p.port ? parseInt(p.port) : undefined,
            initial_delay_seconds: parseInt(p.initial_delay_seconds || 0),
            period_seconds: parseInt(p.period_seconds || 10),
            timeout_seconds: p.timeout_seconds ? parseInt(p.timeout_seconds) : undefined,
            failure_threshold: p.failure_threshold ? parseInt(p.failure_threshold) : undefined,
            success_threshold: p.success_threshold ? parseInt(p.success_threshold) : undefined,
            command: p.type === 'exec' && typeof p.command === 'string' ? p.command.split(',').map((s: string) => s.trim()) : p.command
          };
        };

        return {
          ...c,
          command: c.command ? c.command.split(',').map((s: string) => s.trim()) : undefined,
          args: c.args ? c.args.split(',').map((s: string) => s.trim()) : undefined,
          env_vars: c.env_vars.filter((e: any) => e.name && e.value),
          volume_mounts: c.volume_mounts.filter((v: any) => v.pvc_name && v.mount_path),
          input_env_vars: c.input_env_vars.filter((e: any) => e.name),
          input_volume_mounts: c.input_volume_mounts.filter((v: any) => v.mount_path),
          output_env_vars: undefined,
          output_volume_mounts: undefined,
          resources: (c.resources?.requests?.cpu || c.resources?.limits?.cpu) ? c.resources : undefined,
          liveness_probe: formatProbe(c.liveness_probe),
          readiness_probe: formatProbe(c.readiness_probe)
        };
      })
    };
    
    setIsSubmitting(true);
    try {
      await api.workflow.createAppTemplate(payload);
      setIsModalOpen(false);
      setFormData({
        name: '', description: '', scope: 'project', replicas: 1, 
        service_ports: [{ name: 'http', port: 80, target_port: 80, protocol: 'TCP' }],
        service_name: '',
        create_service: true,
        service_type: 'ClusterIP',
        containers: [ JSON.parse(JSON.stringify(defaultContainer)) ]
      });
      loadTemplates();
    } catch (err: any) {
      alert("创建失败: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">应用模板</h2>
          <p className="text-slate-500 mt-1 font-medium italic">管理常驻安全服务（WAF、蜜罐、流量镜像）的容器编排模版</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={loadTemplates}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={() => setScope('project')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${scope === 'project' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'}`}>当前项目</button>
            <button onClick={() => setScope('global')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${scope === 'global' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'}`}>公共资源</button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus size={20} /> 注册应用组件
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="搜索模板名称或 ID..." 
          className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List Content */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[550px]">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">应用组件信息</th>
              <th className="px-6 py-6">运行实例 (Replicas)</th>
              <th className="px-6 py-6">服务端口 / 类型</th>
              <th className="px-6 py-6">容器栈</th>
              <th className="px-6 py-6">创建者/更新时间</th>
              <th className="px-8 py-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-32 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-600" size={40} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">同步仓库数据中...</p>
                </td>
              </tr>
            ) : paginatedItems.length > 0 ? paginatedItems.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                      <Layers size={22} />
                    </div>
                    <div className="min-w-0">
                      <p 
                        className="text-sm font-black text-slate-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => onNavigateToDetail(t.id)}
                      >
                        {t.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Hash size={10} className="text-slate-300" />
                        <span className="text-[10px] font-mono text-slate-400 font-bold truncate max-w-[150px]">{t.id}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {t.replicas}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Instances</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {t.service_ports && t.service_ports.length > 0 ? t.service_ports.map((p: any, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-[9px] font-black uppercase" title={`${p.name}: ${p.port}->${p.target_port}/${p.protocol}`}>
                          {p.port}
                        </span>
                      )) : (
                        <span className="text-[10px] font-bold text-slate-400">-</span>
                      )}
                    </div>
                    {t.create_service && (
                      <div className="flex items-center gap-1">
                        <Globe size={10} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{t.service_type || 'ClusterIP'}</span>
                        {t.service_name && <span className="text-[9px] font-mono text-slate-400">({t.service_name})</span>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-wrap gap-1.5">
                    {t.containers?.map((c, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 text-[9px] font-black uppercase" title={c.image}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                      <Monitor size={12} className="text-blue-500" /> {t.created_by || 'system'}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                      <Clock size={10} /> {t.updated_at ? new Date(t.updated_at).toLocaleString() : (t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A')}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onNavigateToDetail(t.id)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="查看详细编排">
                      <ExternalLink size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="注销模板">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-40 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <Layers size={40} />
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">暂无匹配的应用模板资产</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer Pagination */}
        <div className="mt-auto px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {Math.min(filteredTemplates.length, itemsPerPage)} / {filteredTemplates.length} results
          </span>
          <div className="flex items-center gap-4">
             <button 
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg">
                   <Plus size={28} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">注册应用组件</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Deployment Orchestration Blueprint</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:text-slate-600 transition-colors">
                 <X size={28} />
               </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
               {/* Basic Info */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">模板名称 *</label>
                    <input 
                      required placeholder="e.g. security-waf-proxy" 
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-4 ring-blue-500/10 text-sm font-bold text-slate-800 transition-all"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">发布范围</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-4 ring-blue-500/10 text-sm font-bold text-slate-800"
                      value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value as any})}
                    >
                      <option value="project">仅限当前项目 (Project-only)</option>
                      <option value="global">公共资源库 (Global)</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">运行副本数 (Replicas)</label>
                     <span className="text-xs font-black text-blue-600">{formData.replicas} Pods</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={formData.replicas} onChange={(e) => setFormData({...formData, replicas: parseInt(e.target.value)})}
                  />
               </div>

               <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">服务端口 (Service Ports)</label>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, service_ports: [...formData.service_ports, { name: 'http-' + formData.service_ports.length, port: 80, target_port: 80, protocol: 'TCP' }]})}
                      className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                    >
                      + 添加端口
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.service_ports.map((p, pIdx) => (
                      <div key={pIdx} className="flex gap-2 items-center">
                        <input 
                          placeholder="Name" 
                          className="w-24 px-4 py-2 bg-slate-50 rounded-xl border-none outline-none text-xs font-bold"
                          value={p.name} onChange={e => {
                            const n = [...formData.service_ports];
                            n[pIdx].name = e.target.value;
                            setFormData({...formData, service_ports: n});
                          }}
                        />
                        <input 
                          type="number" placeholder="Port" 
                          className="w-20 px-4 py-2 bg-slate-50 rounded-xl border-none outline-none text-xs font-mono"
                          value={p.port} onChange={e => {
                            const n = [...formData.service_ports];
                            n[pIdx].port = parseInt(e.target.value);
                            setFormData({...formData, service_ports: n});
                          }}
                        />
                        <input 
                          type="number" placeholder="Target" 
                          className="w-20 px-4 py-2 bg-slate-50 rounded-xl border-none outline-none text-xs font-mono"
                          value={p.target_port} onChange={e => {
                            const n = [...formData.service_ports];
                            n[pIdx].target_port = parseInt(e.target.value);
                            setFormData({...formData, service_ports: n});
                          }}
                        />
                        <select 
                          className="w-24 px-4 py-2 bg-slate-50 rounded-xl border-none outline-none text-xs font-bold"
                          value={p.protocol} onChange={e => {
                            const n = [...formData.service_ports];
                            n[pIdx].protocol = e.target.value;
                            setFormData({...formData, service_ports: n});
                          }}
                        >
                          <option value="TCP">TCP</option>
                          <option value="UDP">UDP</option>
                        </select>
                        {formData.service_ports.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, service_ports: formData.service_ports.filter((_, i) => i !== pIdx)})}
                            className="p-2 text-slate-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-1 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service 名称</label>
                    <input 
                      placeholder="自动生成" 
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-4 ring-blue-500/10 text-sm font-bold text-slate-800 transition-all"
                      value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service 类型</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-4 ring-blue-500/10 text-sm font-bold text-slate-800"
                      value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value as any})}
                    >
                      <option value="ClusterIP">ClusterIP</option>
                      <option value="LoadBalancer">LoadBalancer</option>
                      <option value="NodePort">NodePort</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.create_service}
                        onChange={e => setFormData({...formData, create_service: e.target.checked})}
                      />
                      <span className="text-xs font-black text-slate-700 uppercase">创建 Service</span>
                    </label>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">组件描述</label>
                  <textarea 
                    placeholder="描述该应用组件的功能、挂载需求及预期的服务类型..." rows={2}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-4 ring-blue-500/10 text-sm font-bold text-slate-800 transition-all resize-none"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  />
               </div>

               {/* Container Stack */}
               <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      <Container size={16} className="text-blue-500" /> 容器编排栈 (Container Stack)
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, containers: [...formData.containers, JSON.parse(JSON.stringify(defaultContainer))]})}
                      className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                    >
                       + 添加辅助容器
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.containers.map((container: any, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group/c space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">容器名称</label>
                            <input 
                              required placeholder="e.g. main-service"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-bold"
                              value={container.name}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].name = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">镜像 (Image) *</label>
                            <input 
                              required placeholder="e.g. nginx:latest"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono font-bold text-blue-600"
                              value={container.image}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].image = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">启动命令 (Command)</label>
                            <input 
                              placeholder="e.g. /bin/sh, -c (逗号分隔)"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                              value={container.command}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].command = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">命令参数 (Args)</label>
                            <input 
                              placeholder="e.g. start, --prod (逗号分隔)"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                              value={container.args}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].args = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">拉取策略 (Image Pull Policy)</label>
                            <select 
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-bold"
                              value={container.image_pull_policy}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].image_pull_policy = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            >
                              <option value="IfNotPresent">IfNotPresent</option>
                              <option value="Always">Always</option>
                              <option value="Never">Never</option>
                            </select>
                          </div>
                          <div className="space-y-1.5 flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={container.privileged}
                                onChange={e => {
                                  const n = [...formData.containers];
                                  n[idx].privileged = e.target.checked;
                                  setFormData({...formData, containers: n});
                                }}
                              />
                              <span className="text-xs font-black text-slate-700 uppercase">特权模式 (Privileged)</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">环境变量 (Env Vars)</label>
                            <button 
                              type="button" 
                              onClick={() => {
                                const n = [...formData.containers];
                                n[idx].env_vars.push({ name: '', value: '' });
                                setFormData({...formData, containers: n});
                              }}
                              className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                            >
                              + 添加变量
                            </button>
                          </div>
                          <div className="space-y-2">
                            {container.env_vars.map((env: any, envIdx: number) => (
                              <div key={envIdx} className="flex gap-2 items-center">
                                <input 
                                  placeholder="Name (e.g. ENV_KEY)"
                                  className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                  value={env.name}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].env_vars[envIdx].name = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                                <input 
                                  placeholder="Value (e.g. ENV_VALUE)"
                                  className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                  value={env.value}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].env_vars[envIdx].value = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const n = [...formData.containers];
                                    n[idx].env_vars = n[idx].env_vars.filter((_: any, i: number) => i !== envIdx);
                                    setFormData({...formData, containers: n});
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">固定挂载 (Volume Mounts)</label>
                            <button 
                              type="button" 
                              onClick={() => {
                                const n = [...formData.containers];
                                n[idx].volume_mounts.push({ pvc_name: '', mount_path: '' });
                                setFormData({...formData, containers: n});
                              }}
                              className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                            >
                              + 添加挂载
                            </button>
                          </div>
                          <div className="space-y-2">
                            {container.volume_mounts.map((vol: any, volIdx: number) => (
                              <div key={volIdx} className="flex gap-2 items-center">
                                <input 
                                  placeholder="PVC Name"
                                  className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                  value={vol.pvc_name}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].volume_mounts[volIdx].pvc_name = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                                <input 
                                  placeholder="Mount Path"
                                  className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                  value={vol.mount_path}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].volume_mounts[volIdx].mount_path = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                                <input 
                                  placeholder="Sub Path"
                                  className="w-24 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                  value={vol.sub_path}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].volume_mounts[volIdx].sub_path = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                                <label className="flex items-center gap-1 cursor-pointer shrink-0">
                                  <input 
                                    type="checkbox"
                                    className="w-3 h-3 rounded border-slate-300 text-blue-600"
                                    checked={vol.read_only}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].volume_mounts[volIdx].read_only = e.target.checked;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">RO</span>
                                </label>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const n = [...formData.containers];
                                    n[idx].volume_mounts = n[idx].volume_mounts.filter((_: any, i: number) => i !== volIdx);
                                    setFormData({...formData, containers: n});
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">输入环境变量依赖 (Input Env Vars)</label>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const n = [...formData.containers];
                                  n[idx].input_env_vars.push({ name: '', default_value: '' });
                                  setFormData({...formData, containers: n});
                                }}
                                className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                              >
                                + 添加依赖
                              </button>
                            </div>
                            <div className="space-y-2">
                              {container.input_env_vars.map((env: any, envIdx: number) => (
                                <div key={envIdx} className="flex gap-2 items-center">
                                  <input 
                                    placeholder="Name"
                                    className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                    value={env.name}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].input_env_vars[envIdx].name = e.target.value;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  <input 
                                    placeholder="Default Value"
                                    className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                    value={env.default_value}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].input_env_vars[envIdx].default_value = e.target.value;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const n = [...formData.containers];
                                      n[idx].input_env_vars = n[idx].input_env_vars.filter((_: any, i: number) => i !== envIdx);
                                      setFormData({...formData, containers: n});
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">输入挂载依赖 (Input Mounts)</label>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const n = [...formData.containers];
                                  n[idx].input_volume_mounts.push({ mount_path: '' });
                                  setFormData({...formData, containers: n});
                                }}
                                className="text-[9px] font-black text-blue-600 hover:underline uppercase"
                              >
                                + 添加依赖
                              </button>
                            </div>
                            <div className="space-y-2">
                              {container.input_volume_mounts.map((vol: any, volIdx: number) => (
                                <div key={volIdx} className="flex gap-2 items-center">
                                  <input 
                                    placeholder="Mount Path"
                                    className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                    value={vol.mount_path}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].input_volume_mounts[volIdx].mount_path = e.target.value;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  <input 
                                    placeholder="Sub Path"
                                    className="w-24 px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                                    value={vol.sub_path}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].input_volume_mounts[volIdx].sub_path = e.target.value;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  <label className="flex items-center gap-1 cursor-pointer shrink-0">
                                    <input 
                                      type="checkbox"
                                      className="w-3 h-3 rounded border-slate-300 text-blue-600"
                                      checked={vol.read_only}
                                      onChange={e => {
                                        const n = [...formData.containers];
                                        n[idx].input_volume_mounts[volIdx].read_only = e.target.checked;
                                        setFormData({...formData, containers: n});
                                      }}
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">RO</span>
                                  </label>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const n = [...formData.containers];
                                      n[idx].input_volume_mounts = n[idx].input_volume_mounts.filter((_: any, i: number) => i !== volIdx);
                                      setFormData({...formData, containers: n});
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">资源限制 (Resources)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input 
                              placeholder="Requests CPU (e.g. 100m)"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                              value={container.resources.requests.cpu}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].resources.requests.cpu = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                            <input 
                              placeholder="Requests Memory (e.g. 128Mi)"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                              value={container.resources.requests.memory}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].resources.requests.memory = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                            <input 
                              placeholder="Limits CPU (e.g. 500m)"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                              value={container.resources.limits.cpu}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].resources.limits.cpu = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                            <input 
                              placeholder="Limits Memory (e.g. 512Mi)"
                              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-100 outline-none text-xs font-mono"
                              value={container.resources.limits.memory}
                              onChange={e => {
                                const n = [...formData.containers];
                                n[idx].resources.limits.memory = e.target.value;
                                setFormData({...formData, containers: n});
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2 p-3 bg-white rounded-2xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">存活探针 (Liveness Probe)</label>
                            <div className="grid grid-cols-3 gap-2">
                              <select 
                                className="px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-bold"
                                value={container.liveness_probe.type}
                                onChange={e => {
                                  const n = [...formData.containers];
                                  n[idx].liveness_probe.type = e.target.value;
                                  setFormData({...formData, containers: n});
                                }}
                              >
                                <option value="http">HTTP</option>
                                <option value="tcp">TCP</option>
                                <option value="exec">Exec</option>
                              </select>
                              {container.liveness_probe.type !== 'exec' ? (
                                <>
                                  <input 
                                    placeholder="Port" type="number"
                                    className="px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-mono"
                                    value={container.liveness_probe.port}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].liveness_probe.port = e.target.value;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  {container.liveness_probe.type === 'http' && (
                                    <input 
                                      placeholder="Path"
                                      className="px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-mono"
                                      value={container.liveness_probe.path}
                                      onChange={e => {
                                        const n = [...formData.containers];
                                        n[idx].liveness_probe.path = e.target.value;
                                        setFormData({...formData, containers: n});
                                      }}
                                    />
                                  )}
                                </>
                              ) : (
                                <input 
                                  placeholder="Command (comma separated)"
                                  className="col-span-2 px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-mono"
                                  value={container.liveness_probe.command}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].liveness_probe.command = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                              )}
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-2">
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Delay</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.liveness_probe.initial_delay_seconds}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].liveness_probe.initial_delay_seconds = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Period</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.liveness_probe.period_seconds}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].liveness_probe.period_seconds = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Timeout</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.liveness_probe.timeout_seconds}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].liveness_probe.timeout_seconds = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Fail</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.liveness_probe.failure_threshold}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].liveness_probe.failure_threshold = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Succ</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.liveness_probe.success_threshold}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].liveness_probe.success_threshold = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                            </div>
                          </div>

                          <div className="space-y-2 p-3 bg-white rounded-2xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">就绪探针 (Readiness Probe)</label>
                            <div className="grid grid-cols-3 gap-2">
                              <select 
                                className="px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-bold"
                                value={container.readiness_probe.type}
                                onChange={e => {
                                  const n = [...formData.containers];
                                  n[idx].readiness_probe.type = e.target.value;
                                  setFormData({...formData, containers: n});
                                }}
                              >
                                <option value="http">HTTP</option>
                                <option value="tcp">TCP</option>
                                <option value="exec">Exec</option>
                              </select>
                              {container.readiness_probe.type !== 'exec' ? (
                                <>
                                  <input 
                                    placeholder="Port" type="number"
                                    className="px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-mono"
                                    value={container.readiness_probe.port}
                                    onChange={e => {
                                      const n = [...formData.containers];
                                      n[idx].readiness_probe.port = e.target.value;
                                      setFormData({...formData, containers: n});
                                    }}
                                  />
                                  {container.readiness_probe.type === 'http' && (
                                    <input 
                                      placeholder="Path"
                                      className="px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-mono"
                                      value={container.readiness_probe.path}
                                      onChange={e => {
                                        const n = [...formData.containers];
                                        n[idx].readiness_probe.path = e.target.value;
                                        setFormData({...formData, containers: n});
                                      }}
                                    />
                                  )}
                                </>
                              ) : (
                                <input 
                                  placeholder="Command (comma separated)"
                                  className="col-span-2 px-3 py-1.5 bg-slate-50 rounded-lg outline-none text-[10px] font-mono"
                                  value={container.readiness_probe.command}
                                  onChange={e => {
                                    const n = [...formData.containers];
                                    n[idx].readiness_probe.command = e.target.value;
                                    setFormData({...formData, containers: n});
                                  }}
                                />
                              )}
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-2">
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Delay</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.readiness_probe.initial_delay_seconds}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].readiness_probe.initial_delay_seconds = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Period</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.readiness_probe.period_seconds}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].readiness_probe.period_seconds = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Timeout</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.readiness_probe.timeout_seconds}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].readiness_probe.timeout_seconds = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Fail</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.readiness_probe.failure_threshold}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].readiness_probe.failure_threshold = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                               <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                                 <span className="text-[8px] font-black text-slate-400 uppercase">Succ</span>
                                 <input 
                                   type="number" className="w-8 bg-transparent text-right outline-none text-[10px] font-mono"
                                   value={container.readiness_probe.success_threshold}
                                   onChange={e => {
                                     const n = [...formData.containers];
                                     n[idx].readiness_probe.success_threshold = e.target.value;
                                     setFormData({...formData, containers: n});
                                   }}
                                 />
                               </div>
                            </div>
                          </div>
                        </div>
                        {idx > 0 && (
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, containers: formData.containers.filter((_, i) => i !== idx)})}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 shadow-sm opacity-0 group-hover/c:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </form>

            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-4 shrink-0">
               <button 
                 type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                 className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black hover:bg-slate-100 transition-all"
               >
                 取消
               </button>
               <button 
                 onClick={handleCreate} disabled={isSubmitting}
                 className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="text-amber-400" />}
                  确认注册组件
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
