
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ChevronRight, 
  ChevronDown, 
  Upload, 
  Search, 
  Trash2, 
  LayoutDashboard, 
  FileBox, 
  Server, 
  Terminal, 
  User, 
  Globe, 
  LogOut, 
  Settings,
  FileText,
  Plus,
  Monitor,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Download,
  SearchCode,
  ShieldAlert,
  Briefcase,
  Loader2,
  RotateCw,
  AlertTriangle,
  Cpu,
  Database,
  Layers,
  Rocket,
  Users,
  Cloud,
  Edit3,
  ExternalLink,
  UserPlus,
  Package,
  HardDrive,
  CheckCircle2,
  Filter,
  Calendar,
  Box,
  CheckSquare,
  Square,
  Eye,
  ScrollText,
  ShieldCheck,
  Zap,
  Target,
  FileSearch,
  Scan,
  Workflow,
  Play,
  ClipboardList,
  ShieldQuestion,
  UserCheck,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { 
  ViewType, 
  SecurityProject, 
  MenuStatus, 
  FileItem, 
  UserInfo,
  Agent,
  EnvTemplate,
  AsyncTask,
  NamespaceStatus,
  StaticPackage,
  PackageFile,
  PackageStats
} from './types';
import { api } from './api';

const API_DOMAIN = 'https://secflow.819819.xyz';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status?.toLowerCase() === 'active' || status?.toLowerCase() === 'valid' || status?.toLowerCase() === 'running' || status?.toLowerCase() === 'bound' || status?.toLowerCase() === 'owner';
  const isInvalid = status?.toLowerCase() === 'invalid' || status?.toLowerCase() === 'failed' || status?.toLowerCase() === 'offline' || status?.toLowerCase() === 'error';
  const isPending = status?.toLowerCase() === 'pending' || status?.toLowerCase() === 'checking' || status?.toLowerCase() === 'admin';
  
  let colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
  if (isActive) colorClass = 'bg-green-100 text-green-700 border-green-200';
  if (isInvalid) colorClass = 'bg-red-100 text-red-700 border-red-200';
  if (isPending) colorClass = 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${colorClass}`}>
      {status || 'Unknown'}
    </span>
  );
};

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('secflow_token'));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentView, setCurrentView] = useState<ViewType | string>('dashboard');
  const [projects, setProjects] = useState<SecurityProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['test-input', 'pentest-root', 'env-mgmt', 'base-mgmt']));

  // Cloud & Resource data states
  const [resources, setResources] = useState<FileItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<EnvTemplate[]>([]);
  const [staticPackages, setStaticPackages] = useState<StaticPackage[]>([]);
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
  
  // Detail page states
  const [detailNamespace, setDetailNamespace] = useState<any>(null);
  const [detailResources, setDetailResources] = useState<any>(null);
  const [podLogs, setPodLogs] = useState<{ podName: string; logs: string } | null>(null);

  // Modals / Selection states
  const [projectToEdit, setProjectToEdit] = useState<SecurityProject | null>(null);
  const [projectToManageRoles, setProjectToManageRoles] = useState<SecurityProject | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  // General UI states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      if (typeof currentView === 'string' && currentView.startsWith('test-input-')) {
        fetchResources();
      }
      if (currentView === 'env-agent') fetchAgents();
      if (currentView === 'env-template') fetchTemplates();
      if (currentView === 'static-packages') {
        fetchStaticPackages();
        fetchPackageStats();
      }
    }
  }, [selectedProjectId, currentView]);

  useEffect(() => {
    if (currentView === 'project-detail' && activeProjectId) {
      fetchProjectDetailData(activeProjectId);
    }
  }, [currentView, activeProjectId]);

  const fetchUser = async () => {
    try {
      const data = await api.auth.validateToken();
      setUser(data);
    } catch (e) {
      handleLogout();
    }
  };

  const fetchProjects = async (showRefreshState = false) => {
    try {
      if (showRefreshState) setIsRefreshing(true);
      const data = await api.projects.list();
      const list = data.projects || [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      if (showRefreshState) setIsRefreshing(false);
    }
  };

  const fetchProjectDetailData = async (projectId: string) => {
    try {
      setIsLoading(true);
      const [ns, res] = await Promise.all([
        api.projects.getNamespace(projectId),
        api.projects.getResources(projectId)
      ]);
      setDetailNamespace(ns);
      setDetailResources(res);
    } catch (e: any) {
      alert('获取详情失败: ' + e.message);
      setCurrentView('project-mgmt');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    const typeMap: Record<string, string> = {
      'test-input-release': 'software_package',
      'test-input-code': 'code_package',
      'test-input-doc': 'document_package'
    };
    const type = typeMap[currentView as string];
    if (!type || !selectedProjectId) return;
    try {
      setIsLoading(true);
      const data = await api.resources.list(selectedProjectId, type);
      const items: FileItem[] = data.map((res: any) => ({
        id: res.id.toString(),
        name: res.file_name,
        type: 'file',
        size: (res.file_size / 1024 / 1024).toFixed(2) + ' MB',
        updatedAt: res.created_at,
      }));
      setResources(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaticPackages = async () => {
    try {
      setIsLoading(true);
      const data = await api.staticPackages.list();
      setStaticPackages(data.packages || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchPackageStats = async () => {
    try {
      const data = await api.staticPackages.getStats();
      setPackageStats(data.statistics);
    } catch (e) { console.error(e); }
  };

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const data = await api.environment.getAgents();
      setAgents(data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await api.environment.getTemplates();
      setTemplates(data.templates || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleNavigateToView = (view: ViewType | string) => {
    setCurrentView(view);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const formData = new FormData(e.currentTarget);
    try {
      setIsLoading(true);
      const data = await api.auth.login(Object.fromEntries(formData));
      localStorage.setItem('secflow_token', data.access_token);
      setToken(data.access_token);
    } catch (e: any) {
      setLoginError(e.message || '登录失败，请检查用户名或密码');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('secflow_token');
    setToken(null);
    setUser(null);
    setLoginError(null);
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    try {
      setIsLoading(true);
      await api.projects.create({ name, description });
      await fetchProjects();
      setIsProjectModalOpen(false);
    } catch (e: any) {
      alert(e.message || '创建项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectToEdit) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    try {
      setIsLoading(true);
      await api.projects.update(projectToEdit.id, { name, description });
      await fetchProjects();
      setProjectToEdit(null);
    } catch (e: any) {
      alert(e.message || '修改项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeleteAction = async () => {
    setIsLoading(true);
    try {
      if (projectToDeleteId) {
        await api.projects.delete(projectToDeleteId);
        if (selectedProjectId === projectToDeleteId) setSelectedProjectId('');
        const newSelected = new Set(selectedProjectIds);
        newSelected.delete(projectToDeleteId);
        setSelectedProjectIds(newSelected);
      } else {
        const ids = Array.from(selectedProjectIds);
        await Promise.all(ids.map(id => api.projects.delete(id)));
        alert(`成功删除 ${ids.length} 个项目`);
        setSelectedProjectIds(new Set());
      }
      await fetchProjects();
      closeDeleteModal();
    } catch (e: any) {
      alert(e.message || '删除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setIsBatchDeleteConfirmOpen(false);
    setProjectToDeleteId(null);
  };

  const handleBindRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectToManageRoles) return;
    const formData = new FormData(e.currentTarget);
    const user_id = formData.get('user_id') as string;
    const role = formData.get('role') as string;
    try {
      setIsLoading(true);
      await api.projects.bindRole(projectToManageRoles.id, { user_id, role });
      const updated = await api.projects.get(projectToManageRoles.id);
      setProjectToManageRoles(updated);
      e.currentTarget.reset();
      fetchProjects();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbindRole = async (userId: string) => {
    if (!projectToManageRoles) return;
    if (projectToManageRoles.owner_id === userId) {
      alert('无法解绑项目所有者');
      return;
    }
    if (!confirm('确定解绑该用户的项目角色吗？')) return;
    try {
      setIsLoading(true);
      await api.projects.unbindRole(projectToManageRoles.id, userId);
      const updated = await api.projects.get(projectToManageRoles.id);
      setProjectToManageRoles(updated);
      fetchProjects();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchPodLogs = async (podName: string) => {
    if (!activeProjectId) return;
    try {
      setIsLoading(true);
      const data = await api.projects.getPodLogs(activeProjectId, podName);
      setPodLogs({ podName, logs: data.logs });
    } catch (e: any) {
      alert('获取日志失败: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProjectDetail = () => {
    const project = projects.find(p => p.id === activeProjectId);
    if (!project || isLoading && !detailNamespace) return (
      <div className="h-full flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-xl font-black italic">加载项目环境详情中...</span>
      </div>
    );

    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentView('project-mgmt')} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-2xl shadow-sm transition-all hover:shadow-md active:scale-95">
             <ChevronLeft size={24} />
          </button>
          <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
               {project.name} <StatusBadge status={project.status || 'Active'} />
             </h2>
             <p className="text-slate-400 font-medium mt-1">项目详情与底层容器资源实时监控 (ID: {project.id})</p>
          </div>
          <button onClick={() => activeProjectId && fetchProjectDetailData(activeProjectId)} className="ml-auto flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition-all">
             <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} /> 刷新资源状态
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Pods', count: detailResources?.pods?.length, icon: <Terminal size={14} />, color: 'blue' },
                  { label: 'Services', count: detailResources?.services?.length, icon: <Globe size={14} />, color: 'indigo' },
                  { label: 'Deployments', count: detailResources?.deployments?.length, icon: <Rocket size={14} />, color: 'purple' },
                  { label: 'PVCs', count: detailResources?.pvcs?.length, icon: <HardDrive size={14} />, color: 'green' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:border-blue-300 transition-all hover:shadow-xl">
                     <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1 group-hover:text-blue-500`}>{stat.icon} {stat.label}</p>
                     <p className="text-2xl font-black text-slate-800">{stat.count || 0}</p>
                  </div>
                ))}
              </div>

              {/* Resource Sections */}
              <div className="space-y-6">
                 <section className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Terminal size={14} /> 容器实例 (Pods)</h4>
                       <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{detailResources?.pods?.length || 0} Total</span>
                    </div>
                    <div className="p-4 space-y-2">
                       {detailResources?.pods?.map((pod: any) => (
                         <div key={pod.name} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-white transition-all group">
                            <div className="flex items-center gap-4 min-w-0">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100"><Box size={20} /></div>
                               <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-800 truncate">{pod.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono font-medium">IP: {pod.ip} • Node: {pod.node}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <StatusBadge status={pod.status} />
                               <button 
                                 onClick={() => handleFetchPodLogs(pod.name)} 
                                 className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                               >
                                  <ScrollText size={14} /> 查看日志
                               </button>
                            </div>
                         </div>
                       ))}
                       {!detailResources?.pods?.length && (
                         <p className="text-center py-10 text-slate-300 font-black italic">暂无运行中的 Pod</p>
                       )}
                    </div>
                 </section>

                 <section className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> 网络服务 (Services)</h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                       {detailResources?.services?.map((svc: any) => (
                         <div key={svc.name} className="p-5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-200 hover:bg-white transition-all group">
                            <div className="flex justify-between items-start mb-3">
                               <p className="text-sm font-black text-slate-800 truncate pr-4">{svc.name}</p>
                               <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 uppercase">{svc.type}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono font-bold mb-3 tracking-tighter">CLUSTER-IP: {svc.cluster_ip}</p>
                            <div className="flex flex-wrap gap-1">
                               {svc.ports?.map((p: any) => (
                                 <span key={p} className="text-[9px] font-black px-2 py-0.5 bg-white text-slate-500 rounded border border-slate-200">Port {p}</span>
                               ))}
                            </div>
                         </div>
                       ))}
                       {!detailResources?.services?.length && (
                         <p className="col-span-full text-center py-10 text-slate-300 font-black italic">暂无 Service 资源</p>
                       )}
                    </div>
                 </section>
              </div>
           </div>

           <div className="space-y-8">
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldCheck size={14} /> 环境信息</h4>
                 <div className="space-y-6">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">K8S Namespace</p>
                       <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between group">
                          <span className="text-xs font-black text-blue-400 font-mono">{detailNamespace?.namespace?.name}</span>
                          <StatusBadge status={detailNamespace?.namespace?.status} />
                       </div>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">创建时间</p>
                       <p className="text-sm font-black text-slate-800 px-1">{detailNamespace?.namespace?.created_at?.split('T')[0]}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">部署控制器</p>
                       <div className="space-y-2">
                          {detailResources?.deployments?.map((dep: any) => (
                             <div key={dep.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{dep.name}</span>
                                <div className="flex gap-2">
                                   <span className="text-[10px] font-black text-green-600">{dep.ready_replica}/{dep.replica}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </section>

              <section className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/20 text-white overflow-hidden relative group">
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">安全引擎状态</h4>
                    <p className="text-2xl font-black mb-6">就绪 / Ready</p>
                    <button onClick={() => setCurrentView('engine-validation')} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all active:scale-95 group-hover:shadow-lg">
                       进入测试编排 <ArrowRight size={16} />
                    </button>
                 </div>
                 <Shield className="absolute -bottom-8 -right-8 text-white/10" size={160} />
              </section>
           </div>
        </div>

        {/* Pod Log Viewer Modal - Repurposed for page detail */}
        {podLogs && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-4">
             <div className="bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[85vh] border border-white/10">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><Terminal size={24} /></div>
                      <div>
                        <h4 className="font-black text-2xl text-white tracking-tight">容器实时日志输出</h4>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Pod: {podLogs.podName}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button onClick={() => handleFetchPodLogs(podLogs.podName)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all hover:bg-slate-700 flex items-center gap-2 font-black text-xs">
                        <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} /> 刷新
                      </button>
                      <button onClick={() => setPodLogs(null)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all hover:bg-slate-700">
                        <X size={24} />
                      </button>
                   </div>
                </div>
                <div className="flex-1 bg-black/50 p-8 overflow-auto custom-scrollbar font-mono text-[12px] leading-relaxed text-blue-100 selection:bg-blue-500/30">
                   <div className="space-y-1">
                      {podLogs.logs ? podLogs.logs.split('\n').map((line, idx) => (
                        <div key={idx} className="flex gap-4 group">
                           <span className="text-slate-700 select-none w-8 text-right shrink-0">{idx + 1}</span>
                           <span className="whitespace-pre-wrap">{line}</span>
                        </div>
                      )) : <p className="text-slate-600 italic">正在流式拉取日志数据...</p>}
                   </div>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">SecFlow Log Engine • Only showing last 100 lines</p>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderProjectManagement = () => {
    const isAllSelected = projects.length > 0 && selectedProjectIds.size === projects.length;
    const isSomeSelected = selectedProjectIds.size > 0 && !isAllSelected;

    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">项目空间</h2>
            <p className="text-slate-500 mt-1 font-medium">集中管理安全资产、生命周期与 K8S 底层资源</p>
          </div>
          <div className="flex gap-3">
            {selectedProjectIds.size > 0 && (
              <button 
                onClick={() => { setProjectToDeleteId(null); setIsBatchDeleteConfirmOpen(true); }}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-95 animate-in slide-in-from-right-2"
              >
                <Trash2 size={18} /> 批量删除 ({selectedProjectIds.size})
              </button>
            )}
            <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
              <Plus size={20} /> 初始化项目
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-5 w-10 text-center">
                       <button onClick={() => {
                          if (isAllSelected) setSelectedProjectIds(new Set());
                          else setSelectedProjectIds(new Set(projects.map(p => p.id)));
                       }} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                          {isAllSelected ? <CheckSquare className="text-blue-600" size={18} /> : isSomeSelected ? <CheckSquare className="text-blue-400 opacity-50" size={18} /> : <Square size={18} />}
                       </button>
                    </th>
                    <th className="px-4 py-5">项目信息</th>
                    <th className="px-6 py-5">Namespace / 状态</th>
                    <th className="px-6 py-5">角色/成员</th>
                    <th className="px-6 py-5">创建时间</th>
                    <th className="px-6 py-5 text-right">管理操作</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {projects.map(p => {
                   const isSelected = selectedProjectIds.has(p.id);
                   return (
                    <tr key={p.id} className={`hover:bg-blue-50/30 transition-all group cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`} onClick={() => { setActiveProjectId(p.id); setCurrentView('project-detail'); }}>
                       <td className="px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => {
                            const next = new Set(selectedProjectIds);
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setSelectedProjectIds(next);
                          }} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200">
                             {isSelected ? <CheckSquare className="text-blue-600" size={18} /> : <Square className="text-slate-300" size={18} />}
                          </button>
                       </td>
                       <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-11 h-11 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-slate-100 shrink-0 group-hover:scale-110 transition-transform">
                                {p.name[0].toUpperCase()}
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">{p.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{p.description || '无详细描述'}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                             <span className="text-[11px] font-black font-mono text-slate-500">{p.k8s_namespace}</span>
                             <StatusBadge status={p.status || 'Active'} />
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                             <Users size={12} className="text-slate-400" />
                             <span className="text-[10px] font-black text-slate-500 uppercase">{(p.roles?.length || 0)} 名成员</span>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                             <Calendar size={12} /> {p.created_at?.split('T')[0]}
                          </div>
                       </td>
                       <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => api.projects.get(p.id).then(setProjectToManageRoles)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="角色管理"><UserCheck size={18} /></button>
                             <button onClick={() => { setActiveProjectId(p.id); setCurrentView('project-detail'); }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="底层云状态"><Cloud size={18} /></button>
                             <button onClick={() => setProjectToEdit(p)} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl" title="基础修改"><Edit3 size={18} /></button>
                             <button onClick={() => { setProjectToDeleteId(p.id); setIsBatchDeleteConfirmOpen(true); }} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl" title="彻底删除"><Trash2 size={18} /></button>
                          </div>
                       </td>
                    </tr>
                   );
                 })}
                 {projects.length === 0 && (
                   <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-black italic">暂无任何项目空间，请初始化一个。</td></tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* Delete Confirmation Modal */}
        {isBatchDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-10 text-center">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40} /></div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">{projectToDeleteId ? '确定删除项目吗？' : '确定批量删除吗？'}</h3>
                  <div className="text-slate-500 font-medium leading-relaxed">
                    {projectToDeleteId ? (
                      <p>项目 <span className="text-red-600 font-black">{projects.find(p => p.id === projectToDeleteId)?.name}</span> 将被永久移除。</p>
                    ) : (
                      <p>您已选择 <span className="text-red-600 font-black">{selectedProjectIds.size}</span> 个项目进行批量删除。</p>
                    )}
                    <p className="mt-2 text-sm italic">此操作将同步销毁关联的 K8S Namespace 及所有工作负载。</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button onClick={closeDeleteModal} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-100 transition-all active:scale-95">取消</button>
                  <button onClick={handleConfirmDeleteAction} disabled={isLoading} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">{isLoading ? <Loader2 className="animate-spin" /> : '确认销毁'}</button>
               </div>
            </div>
          </div>
        )}

        {/* Role Management Modal */}
        {projectToManageRoles && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserCheck size={24} /></div>
                     <div>
                        <h3 className="font-black text-2xl text-slate-800 tracking-tight">项目成员与角色管理</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Project: {projectToManageRoles.name}</p>
                     </div>
                  </div>
                  <button onClick={() => setProjectToManageRoles(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <section className="mb-10">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4 flex items-center gap-2"><Plus size={12} /> 添加成员</h4>
                     <form onSubmit={handleBindRole} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">用户 ID</label>
                           <input name="user_id" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="e.g. 1001" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">分配角色</label>
                           <select name="role" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10">
                              <option value="member">普通成员 (Member)</option>
                              <option value="admin">管理员 (Admin)</option>
                              <option value="owner">所有者 (Owner)</option>
                           </select>
                        </div>
                        <button disabled={isLoading} className="bg-slate-900 text-white py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                           {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> 绑定角色</>}
                        </button>
                     </form>
                  </section>

                  <section>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4 flex items-center gap-2"><Users size={12} /> 当前团队</h4>
                     <div className="space-y-2">
                        {projectToManageRoles.roles?.map(role => (
                          <div key={role.user_id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black">{role.user_id}</div>
                                <div>
                                   <p className="text-sm font-black text-slate-700">User #{role.user_id} {role.user_id === projectToManageRoles.owner_id && '(Owner)'}</p>
                                   <p className="text-[10px] text-slate-400 font-medium">绑定于 {role.created_at?.split('T')[0] || '未知'}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <StatusBadge status={role.role} />
                                {role.role !== 'owner' && (
                                   <button 
                                      onClick={() => handleUnbindRole(role.user_id)}
                                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                   >
                                      <Trash2 size={18} />
                                   </button>
                                )}
                             </div>
                          </div>
                        ))}
                     </div>
                  </section>
               </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {projectToEdit && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-2xl text-slate-800 tracking-tight">修改项目信息</h3>
                <button onClick={() => setProjectToEdit(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateProject} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">项目标识名称</label>
                  <input name="name" required defaultValue={projectToEdit.name} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">项目详细描述</label>
                  <textarea name="description" rows={4} defaultValue={projectToEdit.description} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none resize-none font-bold" />
                </div>
                <button disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex justify-center active:scale-95">
                  {isLoading ? <Loader2 className="animate-spin" /> : '保存修改'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWorkflowPlaceholder = (title: string, icon: any) => {
    return (
      <div className="p-10 h-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-inner mb-8">
           {React.cloneElement(icon as React.ReactElement<any>, { size: 48 })}
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{title}</h2>
        <p className="text-slate-400 font-medium max-w-md">当前模块已自动对接 K8S Namespace 安全上下文。请确认测试目标已在「项目空间」完成初始化编排。</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
           <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-left flex gap-4 items-start">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0"><Activity size={20} className="text-slate-400" /></div>
              <div>
                 <p className="text-sm font-black text-slate-700">自动化引擎</p>
                 <p className="text-xs text-slate-400 mt-1">基于镜像的持续模糊测试与动态分析</p>
              </div>
           </div>
           <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-left flex gap-4 items-start">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0"><FileBox size={20} className="text-slate-400" /></div>
              <div>
                 <p className="text-sm font-black text-slate-700">专家审计</p>
                 <p className="text-xs text-slate-400 mt-1">集成的源码分析控制台与手动渗透工具</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const SidebarItem = ({ id, label, icon, children, depth = 0 }: any) => {
    const isExpanded = expandedMenus.has(id);
    const isActive = currentView === id;
    const hasChildren = children && children.length > 0;
    return (
      <div className="space-y-1">
        <div onClick={() => {
            if (hasChildren) {
              setExpandedMenus(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              });
            } else {
              setCurrentView(id);
            }
          }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer transition-all ${
            isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold' : 
            'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
          style={{ marginLeft: depth > 0 ? `${depth * 0.75}rem` : '0' }}
        >
          {icon || <div className="w-5" />}
          {!isSidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between overflow-hidden">
              <span className={`${depth > 0 ? 'text-[11px]' : 'text-sm'} truncate`}>{label}</span>
              {hasChildren && <ChevronRight size={12} className={`transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />}
            </div>
          )}
        </div>
        {!isSidebarCollapsed && isExpanded && children?.map((child: any) => (
          <SidebarItem 
            key={child.id} 
            id={child.id} 
            label={child.label} 
            children={child.children} 
            depth={depth + 1} 
          />
        ))}
      </div>
    );
  };

  if (!token) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 overflow-hidden px-4 font-sans">
        <div className="w-full max-w-md p-10 bg-white rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6"><Shield className="text-white" size={40} /></div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">SecFlow</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">统一安全测试与环境管理平台</p>
          </div>
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm animate-in fade-in slide-in-from-top-1">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">用户名</label><input name="username" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold" placeholder="请输入用户名" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">密码</label><input name="password" type="password" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold" placeholder="请输入密码" /></div>
            <button disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70">{isLoading ? <Loader2 className="animate-spin" /> : '即刻登录'}</button>
          </form>
        </div>
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === selectedProjectId) || { name: '选择项目' };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-30 shadow-2xl shrink-0`}>
        <div className="p-8 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30"><Shield className="text-white" size={28} /></div>
          {!isSidebarCollapsed && <span className="text-2xl font-black text-white tracking-tighter">SecFlow</span>}
        </div>
        <nav className="flex-1 px-5 py-2 space-y-8 overflow-y-auto custom-scrollbar">
          <div>{!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">主入口</p>}
            <div className="space-y-1">
              <SidebarItem id="dashboard" label="控制台" icon={<LayoutDashboard size={20} />} />
              <SidebarItem id="base-mgmt" label="基础资源管理" icon={<Box size={20} />} children={[{ id: 'static-packages', label: '静态软件包管理' }]} />
              <SidebarItem id="project-mgmt" label="项目空间" icon={<Briefcase size={20} />} />
              <SidebarItem id="test-input" label="测试输入" icon={<FileBox size={20} />} children={[{ id: 'test-input-release', label: '发布包' }, { id: 'test-input-code', label: '源代码' }, { id: 'test-input-doc', label: '需求文档' }]} />
            </div>
          </div>
          <div>{!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">环境编排</p>}
            <div className="space-y-1">
              <SidebarItem id="env-mgmt" label="环境服务" icon={<Database size={20} />} children={[{ id: 'env-agent', label: 'Agent 管理' }, { id: 'env-template', label: '配置模板' }]} />
            </div>
          </div>
          <div>{!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">安全引擎</p>}
            <div className="space-y-1">
              <SidebarItem id="engine-validation" label="安全验证" icon={<ShieldCheck size={20} />} />
              <SidebarItem id="pentest-root" label="渗透测试" icon={<Target size={20} />} children={[
                { id: 'pentest-risk', label: '风险评估' },
                { id: 'pentest-system', label: '系统分析' },
                { id: 'pentest-threat', label: '威胁分析' },
                { id: 'pentest-orch', label: '测试编排' },
                { id: 'pentest-exec', label: '测试执行', children: [
                    { id: 'pentest-exec-code', label: 'C/C++源码审计(VSCODE)' },
                    { id: 'pentest-exec-web', label: 'WEB渗透测试' },
                    { id: 'pentest-exec-poc', label: 'POC自动生成' },
                    { id: 'pentest-exec-exp', label: 'EXP验证' }
                ]},
                { id: 'pentest-report', label: '报告模块' }
              ]} />
              <SidebarItem id="engine-assessment" label="安全评估" icon={<Monitor size={20} />} />
            </div>
          </div>
        </nav>
        <div className="p-6 border-t border-slate-800 flex flex-col gap-4">
           {!isSidebarCollapsed && <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-3xl border border-white/5"><div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-black shrink-0">{user?.username?.[0]?.toUpperCase()}</div><div className="flex-1 min-w-0"><p className="text-sm font-black text-white truncate">{user?.username}</p><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">高级工程师</p></div><button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors shrink-0"><LogOut size={18} /></button></div>}
           <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="flex items-center justify-center p-3 text-slate-600 hover:text-white transition-all bg-slate-800/20 rounded-2xl">{isSidebarCollapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">当前项目空间</span>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <button onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                     <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40" /> {currentProject.name} <ChevronDown size={16} className="text-slate-300" />
                  </button>
                  {isProjectDropdownOpen && <div className="absolute top-full left-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50"><div className="relative mb-3"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input autoFocus placeholder="过滤项目列表..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10" onChange={(e) => setSearchQuery(e.target.value)} /></div><div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar">{projects.filter(p => p.name.includes(searchQuery)).map(p => (<button key={p.id} onClick={() => { setSelectedProjectId(p.id); setIsProjectDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${selectedProjectId === p.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-50 text-slate-600'}`}>{p.name}</button>))}</div></div>}
               </div>
               <button onClick={() => fetchProjects(true)} disabled={isRefreshing} className="p-3 hover:bg-slate-100 text-slate-400 hover:text-blue-600 border border-slate-100 rounded-2xl transition-all disabled:opacity-50"><RotateCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{API_DOMAIN.replace('https://', '')}</span></div>
             <div className="flex items-center gap-4"><div className="text-right hidden sm:block"><p className="text-sm font-black text-slate-800">{user?.username}</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">高级管理员</p></div><div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-slate-900/20">{user?.username?.[0]?.toUpperCase()}</div></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'dashboard' && (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">SecFlow 控制台</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => handleNavigateToView('project-mgmt')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Briefcase size={24} /></div>
                  <p className="text-slate-500 text-sm font-medium">活动项目</p>
                  <h2 className="text-3xl font-black mt-1 flex items-center justify-between">{projects.length}<ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={24} /></h2>
                </div>
                <div onClick={() => handleNavigateToView('env-agent')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Monitor size={24} /></div>
                  <p className="text-slate-500 text-sm font-medium">存活 Agent</p>
                  <h2 className="text-3xl font-black mt-1 flex items-center justify-between">{agents.filter(a => a.status === 'running').length}<ChevronRight className="text-slate-200 group-hover:text-indigo-500 transition-colors" size={24} /></h2>
                </div>
                <div onClick={() => handleNavigateToView('static-packages')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Package size={24} /></div>
                  <p className="text-slate-500 text-sm font-medium">受信任软件包</p>
                  <h2 className="text-3xl font-black mt-1 flex items-center justify-between">{staticPackages.length}<ChevronRight className="text-slate-200 group-hover:text-purple-500 transition-colors" size={24} /></h2>
                </div>
              </div>
            </div>
          )}
          {currentView === 'project-mgmt' && renderProjectManagement()}
          {currentView === 'project-detail' && renderProjectDetail()}
          {currentView === 'engine-validation' && renderWorkflowPlaceholder('安全验证', <ShieldCheck />)}
          {currentView === 'pentest-risk' && renderWorkflowPlaceholder('风险评估', <ShieldAlert />)}
          {currentView === 'pentest-system' && renderWorkflowPlaceholder('系统分析', <FileSearch />)}
          {currentView === 'pentest-threat' && renderWorkflowPlaceholder('威胁分析', <Zap />)}
          {currentView === 'pentest-orch' && renderWorkflowPlaceholder('测试编排', <Workflow />)}
          {currentView === 'pentest-exec-code' && renderWorkflowPlaceholder('C/C++ 源码审计 (VSCODE Remote)', <SearchCode />)}
          {currentView === 'pentest-exec-web' && renderWorkflowPlaceholder('WEB 渗透测试控制台', <Globe />)}
          {currentView === 'pentest-exec-poc' && renderWorkflowPlaceholder('POC 自动生成', <Activity />)}
          {currentView === 'pentest-exec-exp' && renderWorkflowPlaceholder('EXP 验证与后渗透', <Target />)}
          {currentView === 'pentest-report' && renderWorkflowPlaceholder('安全分析报告', <ClipboardList />)}
          {currentView === 'engine-assessment' && renderWorkflowPlaceholder('安全评估', <Monitor />)}
          {currentView.startsWith('test-input-') && (
            <div className="p-8 space-y-6 flex flex-col h-full animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">测试输入资源</h2>
                <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700">
                  <Upload size={18} /> 上传资产
                </button>
              </div>
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                        <div><p className="text-sm font-bold text-slate-700">{res.name}</p><p className="text-[10px] text-slate-400 font-mono">{res.size} • {res.updatedAt?.split('T')[0]}</p></div>
                      </div>
                      <button onClick={() => api.resources.delete(res.id).then(fetchResources)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-2xl text-slate-800 tracking-tight">初始化新安全项目</h3>
                <button onClick={() => setIsProjectModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateProject} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">项目标识</label><input name="name" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold" placeholder="输入项目名称" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">详细描述</label><textarea name="description" rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none resize-none font-bold" placeholder="描述该项目测试范围..." /></div>
                <button disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex justify-center active:scale-95">{isLoading ? <Loader2 className="animate-spin" /> : '即刻初始化'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
      <style>{`.animate-in { animation: fade-in 0.3s ease-out; } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; } .bg-slate-900 .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }`}</style>
    </div>
  );
};

export default App;
