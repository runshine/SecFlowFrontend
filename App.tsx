
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
  ArrowRight,
  History,
  Info,
  Check,
  Code,
  ActivitySquare,
  ClipboardCheck,
  Settings2
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
  const isActive = status?.toLowerCase() === 'active' || status?.toLowerCase() === 'valid' || status?.toLowerCase() === 'running' || status?.toLowerCase() === 'bound' || status?.toLowerCase() === 'owner' || status?.toLowerCase() === 'healthy' || status?.toLowerCase() === 'success';
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
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['test-input', 'pentest-root', 'env-mgmt', 'base-mgmt']));

  // Cloud & Resource data states
  const [resources, setResources] = useState<FileItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<EnvTemplate[]>([]);
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  
  // Static Packages states
  const [staticPackages, setStaticPackages] = useState<StaticPackage[]>([]);
  const [selectedStaticPkgIds, setSelectedStaticPkgIds] = useState<Set<string>>(new Set());
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
  const [detailPackage, setDetailPackage] = useState<{ pkg: StaticPackage; files: PackageFile[] } | null>(null);
  const [isPackageUploadModalOpen, setIsPackageUploadModalOpen] = useState(false);
  const [packageSearch, setPackageSearch] = useState({ name: '', version: '', architecture: '' });
  
  // Project detail states
  const [detailNamespace, setDetailNamespace] = useState<any>(null);
  const [detailResources, setDetailResources] = useState<any>(null);
  const [podLogs, setPodLogs] = useState<{ podName: string; logs: string } | null>(null);

  // Project Selection states
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
      if (currentView === 'env-tasks') fetchTasks();
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
    if (currentView === 'static-package-detail' && activePackageId) {
      fetchStaticPackageDetailData(activePackageId);
    }
  }, [currentView, activeProjectId, activePackageId]);

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

  const fetchStaticPackageDetailData = async (packageId: string) => {
    try {
      setIsLoading(true);
      const res = await api.staticPackages.get(packageId);
      setDetailPackage({ pkg: res.package, files: res.files });
    } catch (e: any) {
      alert('获取软件包详情失败: ' + e.message);
      setCurrentView('static-packages');
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
      let data;
      if (packageSearch.name || packageSearch.version || packageSearch.architecture) {
        data = await api.staticPackages.search(packageSearch);
      } else {
        data = await api.staticPackages.list();
      }
      setStaticPackages(data.packages || []);
      setSelectedStaticPkgIds(new Set()); // Reset selection on refresh
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

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await api.environment.getTasks();
      setTasks(data);
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

  const handleStaticPackageUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      setIsLoading(true);
      await api.staticPackages.upload(formData);
      setIsPackageUploadModalOpen(false);
      fetchStaticPackages();
      fetchPackageStats();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchStaticPkgDelete = async () => {
    if (selectedStaticPkgIds.size === 0) return;
    if (!confirm(`确定要永久删除选中的 ${selectedStaticPkgIds.size} 个软件包吗？`)) return;
    try {
      setIsLoading(true);
      await api.staticPackages.batchDelete(Array.from(selectedStaticPkgIds));
      fetchStaticPackages();
      fetchPackageStats();
      setSelectedStaticPkgIds(new Set());
    } catch (e: any) {
      alert('批量删除失败: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchStaticPkgCheck = async () => {
    if (selectedStaticPkgIds.size === 0) return;
    try {
      setIsLoading(true);
      await Promise.all(Array.from(selectedStaticPkgIds).map(id => api.staticPackages.check(id)));
      fetchStaticPackages();
    } catch (e: any) {
      alert('批量校验失败: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStaticPackageManagement = () => {
    const isAllSelected = staticPackages.length > 0 && selectedStaticPkgIds.size === staticPackages.length;
    const isSomeSelected = selectedStaticPkgIds.size > 0 && !isAllSelected;

    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">静态软件包管理</h2>
            <p className="text-slate-500 mt-1 font-medium">统一受信任的二进制分发、多架构存储与一致性校验</p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => api.staticPackages.checkAll().then(() => fetchStaticPackages())} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95">
                <CheckCircle2 size={18} /> 校验全部健康度
             </button>
             <button onClick={() => setIsPackageUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                <Upload size={18} /> 上传新包
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: '总软件包数', value: packageStats?.summary.total_packages || 0, icon: <Package size={20} />, color: 'blue' },
             { label: '存储占用', value: packageStats?.summary.total_size_human || '0 B', icon: <HardDrive size={20} />, color: 'indigo' },
             { label: '子文件总数', value: packageStats?.summary.total_files || 0, icon: <Layers size={20} />, color: 'green' },
             { label: '累计下载', value: packageStats?.summary.total_downloads || 0, icon: <Download size={20} />, color: 'purple' },
           ].map(stat => (
             <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm border border-slate-50`}>{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-0.5">{stat.value}</h4>
                </div>
             </div>
           ))}
        </div>

        <div className="flex flex-col gap-4">
           {selectedStaticPkgIds.size > 0 && (
             <div className="bg-slate-900 text-white p-4 rounded-3xl flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4 px-4">
                   <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">{selectedStaticPkgIds.size}</div>
                   <span className="text-sm font-black uppercase tracking-widest">已选择项目</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={handleBatchStaticPkgCheck} className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-black transition-all">
                      <CheckCircle2 size={16} className="text-green-400" /> 批量校验
                   </button>
                   <button onClick={handleBatchStaticPkgDelete} className="flex items-center gap-2 px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-2xl text-xs font-black transition-all">
                      <Trash2 size={16} /> 批量删除
                   </button>
                   <button onClick={() => setSelectedStaticPkgIds(new Set())} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
                </div>
             </div>
           )}
           
           <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                 <Search className="text-slate-400" size={18} />
                 <input 
                   placeholder="搜索软件包名称..." 
                   className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700"
                   value={packageSearch.name}
                   onChange={(e) => { setPackageSearch({...packageSearch, name: e.target.value}) }}
                   onKeyDown={(e) => e.key === 'Enter' && fetchStaticPackages()}
                 />
              </div>
              <div className="flex items-center gap-2">
                 <input 
                   placeholder="版本" 
                   className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold w-32 outline-none focus:ring-4 focus:ring-blue-500/10"
                   value={packageSearch.version}
                   onChange={(e) => setPackageSearch({...packageSearch, version: e.target.value})}
                 />
                 <input 
                   placeholder="架构" 
                   className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold w-32 outline-none focus:ring-4 focus:ring-blue-500/10"
                   value={packageSearch.architecture}
                   onChange={(e) => setPackageSearch({...packageSearch, architecture: e.target.value})}
                 />
                 <button onClick={fetchStaticPackages} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg"><Filter size={20} /></button>
                 <button onClick={() => { setPackageSearch({name:'', version:'', architecture:''}); fetchStaticPackages(); }} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:text-slate-600 transition-all"><History size={20} /></button>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-5 w-10 text-center">
                       <button onClick={() => {
                          if (isAllSelected) setSelectedStaticPkgIds(new Set());
                          else setSelectedStaticPkgIds(new Set(staticPackages.map(pkg => pkg.id)));
                       }} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                          {isAllSelected ? <CheckSquare className="text-blue-600" size={18} /> : isSomeSelected ? <CheckSquare className="text-blue-400 opacity-50" size={18} /> : <Square size={18} />}
                       </button>
                    </th>
                    <th className="px-4 py-5">软件包资产</th>
                    <th className="px-6 py-5">系统架构</th>
                    <th className="px-6 py-5 text-center">统计</th>
                    <th className="px-6 py-5">状态</th>
                    <th className="px-6 py-5 text-right">控制项</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {staticPackages.map(pkg => {
                   const isSelected = selectedStaticPkgIds.has(pkg.id);
                   return (
                    <tr key={pkg.id} className={`hover:bg-blue-50/30 transition-all group cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`} onClick={() => { setActivePackageId(pkg.id); setCurrentView('static-package-detail'); }}>
                       <td className="px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => {
                            const next = new Set(selectedStaticPkgIds);
                            if (next.has(pkg.id)) next.delete(pkg.id); else next.add(pkg.id);
                            setSelectedStaticPkgIds(next);
                          }} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200">
                             {isSelected ? <CheckSquare className="text-blue-600" size={18} /> : <Square className="text-slate-300" size={18} />}
                          </button>
                       </td>
                       <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white text-blue-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                               {pkg.name[0].toUpperCase()}
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{pkg.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version: {pkg.version}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                             <span className="text-xs font-black text-slate-700 uppercase">{pkg.system}</span>
                             <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{pkg.architecture}</span>
                          </div>
                       </td>
                       <td className="px-6 py-6 text-center">
                          <div className="inline-flex flex-col items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-black text-slate-800">{(pkg.total_size / 1024 / 1024).toFixed(2)} MB</span>
                             <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{pkg.file_count} Files</span>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <StatusBadge status={pkg.check_status} />
                       </td>
                       <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => api.staticPackages.check(pkg.id).then(() => fetchStaticPackages())} className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl" title="校验完整性"><CheckCircle2 size={18} /></button>
                             <a href={api.staticPackages.getDownloadUrl(pkg.id)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="下载包文件"><Download size={18} /></a>
                             <button onClick={() => { if(confirm('确认永久删除该软件包及其所有分发文件？')) api.staticPackages.delete(pkg.id).then(() => fetchStaticPackages()) }} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl" title="彻底删除"><Trash2 size={18} /></button>
                          </div>
                       </td>
                    </tr>
                   );
                 })}
                 {staticPackages.length === 0 && (
                   <tr><td colSpan={6} className="py-24 text-center text-slate-300 font-black italic">未找到匹配的软件包数据。</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    );
  };

  const renderEnvDashboard = () => (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">环境服务概览</h2>
          <p className="text-slate-500 mt-1 font-medium">实时监控资源池健康度与环境编排动态</p>
        </div>
        <button onClick={() => { fetchAgents(); fetchTasks(); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-2xl shadow-sm transition-all active:scale-95">
          <RotateCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <ActivitySquare className="text-blue-500 mb-4" size={32} />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活跃节点</p>
           <h3 className="text-4xl font-black text-slate-800 mt-1">{agents.filter(a => a.status === 'running').length} / {agents.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <ClipboardCheck className="text-green-500 mb-4" size={32} />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">进行中任务</p>
           <h3 className="text-4xl font-black text-slate-800 mt-1">{tasks.filter(t => t.status === 'running').length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <Settings2 className="text-indigo-500 mb-4" size={32} />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">配置模板</p>
           <h3 className="text-4xl font-black text-slate-800 mt-1">{templates.length}</h3>
        </div>
      </div>
    </div>
  );

  const renderEnvAgentMgmt = () => (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agent 节点管理</h2>
          <p className="text-slate-500 mt-1 font-medium">查看并管理注册到平台的测试执行节点</p>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">主机名 / IP</th>
                  <th className="px-8 py-5">系统状态</th>
                  <th className="px-8 py-5">资源占用</th>
                  <th className="px-8 py-5">最后活跃</th>
                  <th className="px-8 py-5 text-right">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {agents.map(a => (
                 <tr key={a.key} className="hover:bg-slate-50 transition-all group">
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${a.status === 'running' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                            <Monitor size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800">{a.hostname}</p>
                            <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">{a.ip_address}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6"><StatusBadge status={a.status} /></td>
                   <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                         <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase"><span>CPU: {a.system_info?.cpu || '0%'}</span><span>MEM: {a.system_info?.memory || '0%'}</span></div>
                         <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: a.system_info?.cpu || '0%' }} />
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-xs text-slate-500 font-bold uppercase">{a.last_seen?.replace('T', ' ').split('.')[0]}</td>
                   <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600"><Settings size={18} /></button>
                   </td>
                 </tr>
               ))}
               {agents.length === 0 && (
                 <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic font-black">暂无 Agent 节点在线。</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );

  const renderEnvTemplateMgmt = () => (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">配置模板管理</h2>
          <p className="text-slate-500 mt-1 font-medium">预定义环境部署 YAML 脚本与容器化策略</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
          <Plus size={20} /> 新建模板
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map(t => (
          <div key={t.name} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
             <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black transition-colors group-hover:bg-indigo-600 group-hover:text-white"><Database size={24} /></div>
                <StatusBadge status={t.type} />
             </div>
             <h4 className="text-xl font-black text-slate-800">{t.name}</h4>
             <p className="text-sm text-slate-400 font-medium mt-1 line-clamp-2">{t.description || '无详细描述'}</p>
             <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1"><History size={12} /> {t.updated_at?.split('T')[0]}</span>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={18} /></button>
                   <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEnvTasksMgmt = () => (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">异步任务队列</h2>
          <p className="text-slate-500 mt-1 font-medium">监控部署任务、审计扫描等长时间运行的异步作业</p>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">任务 ID / 类型</th>
                  <th className="px-8 py-5">当前状态</th>
                  <th className="px-8 py-5">进度 / 详情</th>
                  <th className="px-8 py-5">创建时间</th>
                  <th className="px-8 py-5 text-right">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {tasks.map(t => (
                 <tr key={t.id} className="hover:bg-slate-50 transition-all">
                   <td className="px-8 py-6">
                      <div>
                         <p className="text-sm font-black text-slate-800 uppercase font-mono tracking-tight">{t.id.slice(0, 8)}...</p>
                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t.task_type}</p>
                      </div>
                   </td>
                   <td className="px-8 py-6"><StatusBadge status={t.status} /></td>
                   <td className="px-8 py-6">
                      <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>{t.progress}%</span><span>{t.message || 'Processing...'}</span></div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${t.progress}%` }} />
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-xs text-slate-500 font-bold">{t.created_at?.replace('T', ' ').split('.')[0]}</td>
                   <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-800"><Terminal size={18} /></button>
                   </td>
                 </tr>
               ))}
               {tasks.length === 0 && (
                 <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic font-black">当前无正在运行的任务记录。</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );

  // Added renderProjectManagement to list all projects
  const renderProjectManagement = () => {
    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">安全项目管理</h2>
            <p className="text-slate-500 mt-1 font-medium">隔离、编排与生命周期管理</p>
          </div>
          <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
            <Plus size={18} /> 初始化项目
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">项目名称</th>
                <th className="px-8 py-5">命名空间</th>
                <th className="px-8 py-5">角色</th>
                <th className="px-8 py-5">创建时间</th>
                <th className="px-8 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => { setActiveProjectId(p.id); setCurrentView('project-detail'); }}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">{p.name[0].toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{p.description || '无描述'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><span className="text-xs font-mono font-bold text-slate-500">{p.k8s_namespace || 'N/A'}</span></td>
                  <td className="px-8 py-6"><StatusBadge status="Owner" /></td>
                  <td className="px-8 py-6 text-xs text-slate-400 font-bold uppercase">{p.created_at?.split('T')[0]}</td>
                  <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setProjectToEdit(p)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={18} /></button>
                      <button onClick={() => { setProjectToDeleteId(p.id); setIsBatchDeleteConfirmOpen(true); }} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic font-black">暂无活跃项目。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Added renderProjectDetail to show K8S resources of a project
  const renderProjectDetail = () => {
    if (isLoading && !detailNamespace) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={48} /><p className="font-black text-slate-400">正在同步云端上下文...</p></div>;
    const project = projects.find(p => p.id === activeProjectId);
    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-500">
        <button onClick={() => setCurrentView('project-mgmt')} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-sm mb-4 transition-colors">
          <ChevronLeft size={20} /> 返回项目列表
        </button>
        <div className="flex justify-between items-start">
           <div>
             <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{project?.name}</h2>
             <p className="text-slate-500 mt-1 font-medium">{project?.description}</p>
           </div>
           <StatusBadge status={detailNamespace?.namespace?.status || 'Active'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3"><Monitor size={20} className="text-blue-500" /><h3 className="font-black text-slate-800">计算资源 (Pods)</h3></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{detailNamespace?.resources?.pods?.length || 0} Instances</span>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {detailNamespace?.resources?.pods?.map((pod: any) => (
                      <div key={pod.name} className="px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${pod.status === 'Running' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                            <div><p className="text-sm font-black text-slate-700">{pod.name}</p><p className="text-[10px] text-slate-400 font-mono">{pod.pod_ip} • {pod.node_name}</p></div>
                         </div>
                         <div className="flex items-center gap-4">
                            <StatusBadge status={pod.status} />
                            <button onClick={() => handleFetchPodLogs(pod.name)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all"><Terminal size={18} /></button>
                         </div>
                      </div>
                    ))}
                    {(!detailNamespace?.resources?.pods || detailNamespace.resources.pods.length === 0) && (
                      <div className="p-12 text-center text-slate-300 italic font-black">未检测到存活 Pods 资源。</div>
                    )}
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3"><Globe size={20} className="text-indigo-500" /><h3 className="font-black text-slate-800">服务暴露 (Services)</h3></div>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {detailNamespace?.resources?.services?.map((svc: any) => (
                      <div key={svc.name} className="px-8 py-6 flex items-center justify-between">
                         <div><p className="text-sm font-black text-slate-700">{svc.name}</p><p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{svc.type} • {svc.cluster_ip}</p></div>
                         <div className="flex gap-2">
                            {svc.ports?.map((p: any) => <span key={p.port} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500">{p.port}:{p.target_port}/{p.protocol}</span>)}
                         </div>
                      </div>
                    ))}
                    {(!detailNamespace?.resources?.services || detailNamespace.resources.services.length === 0) && (
                      <div className="p-12 text-center text-slate-300 italic font-black">暂无暴露的服务记录。</div>
                    )}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Users size={20} className="text-purple-500" /> 项目成员</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">{user?.username?.[0].toUpperCase()}</div><span className="text-xs font-bold text-slate-700">{user?.username} (You)</span></div>
                       <StatusBadge status="Owner" />
                    </div>
                    <button className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"><UserPlus size={14} /> 邀请协作人员</button>
                 </div>
              </div>
              
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                 <h3 className="font-black mb-4 flex items-center gap-2"><Rocket size={20} className="text-blue-400" /> 快速操作</h3>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all"><Zap size={20} className="text-amber-400" /><span className="text-[10px] font-black uppercase">触发扫描</span></button>
                    <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all"><Server size={20} className="text-blue-400" /><span className="text-[10px] font-black uppercase">扩展实例</span></button>
                 </div>
              </div>
           </div>
        </div>

        {podLogs && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
             <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4"><Terminal className="text-blue-400" size={24} /><h3 className="text-white font-black text-xl tracking-tight">Pod Logs: {podLogs.podName}</h3></div>
                   <button onClick={() => setPodLogs(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="flex-1 p-6 font-mono text-xs text-slate-300 overflow-y-auto custom-scrollbar bg-black/50 select-text whitespace-pre-wrap leading-relaxed">
                   {podLogs.logs || 'No logs available for this container yet.'}
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  // Added renderStaticPackageDetail to show files inside a static package
  const renderStaticPackageDetail = () => {
    if (isLoading || !detailPackage) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={48} /></div>;
    const { pkg, files } = detailPackage;
    return (
      <div className="p-10 space-y-8 animate-in fade-in duration-500">
        <button onClick={() => setCurrentView('static-packages')} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-sm mb-4 transition-colors">
          <ChevronLeft size={20} /> 返回列表
        </button>
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-500/20">{pkg.name[0].toUpperCase()}</div>
              <div>
                 <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{pkg.name}</h2>
                 <p className="text-slate-500 font-medium">版本: {pkg.version} • 架构: {pkg.architecture} • 系统: {pkg.system}</p>
              </div>
           </div>
           <div className="flex gap-3">
              <a href={api.staticPackages.getDownloadUrl(pkg.id)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                 <Download size={20} /> 下载完整包
              </a>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
           <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2"><FileBox size={20} className="text-blue-500" /> 包内文件清单</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{files.length} Files Total</span>
           </div>
           <table className="w-full text-left">
              <thead className="bg-slate-50/30">
                 <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="px-8 py-4">文件路径</th>
                    <th className="px-8 py-4">大小</th>
                    <th className="px-8 py-4">下载量</th>
                    <th className="px-8 py-4 text-right">下载</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {files.map(file => (
                   <tr key={file.path} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 font-mono text-xs text-slate-600">{file.path}</td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-400">{(file.size / 1024 / 1024).toFixed(3)} MB</td>
                      <td className="px-8 py-4 text-xs font-bold text-slate-400">{file.download_count}</td>
                      <td className="px-8 py-4 text-right">
                         <a href={api.staticPackages.getFileDownloadUrl(pkg.id, file.path)} className="p-2 text-slate-400 hover:text-blue-600 inline-block transition-colors"><Download size={16} /></a>
                      </td>
                   </tr>
                 ))}
                 {files.length === 0 && (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic font-black">软件包中未检测到文件。</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    );
  };

  // Added renderDeployScriptMgmt as a placeholder for deployment scripts
  const renderDeployScriptMgmt = () => {
    return renderWorkflowPlaceholder('部署脚本管理', <ScrollText />);
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
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
      );
    }

    if (currentView === 'static-packages') return renderStaticPackageManagement();
    if (currentView === 'static-package-detail') return renderStaticPackageDetail();
    if (currentView === 'deploy-script-mgmt') return renderDeployScriptMgmt();
    if (currentView === 'project-mgmt') return renderProjectManagement();
    if (currentView === 'project-detail') return renderProjectDetail();
    
    // Environment Services
    if (currentView === 'env-dashboard') return renderEnvDashboard();
    if (currentView === 'env-agent') return renderEnvAgentMgmt();
    if (currentView === 'env-template') return renderEnvTemplateMgmt();
    if (currentView === 'env-tasks') return renderEnvTasksMgmt();
    if (currentView === 'env-service') return renderWorkflowPlaceholder('服务管理', <Cloud />);

    // Safety Engine Placeholders
    if (currentView === 'engine-validation') return renderWorkflowPlaceholder('安全验证', <ShieldCheck />);
    if (currentView === 'pentest-risk') return renderWorkflowPlaceholder('风险评估', <ShieldAlert />);
    if (currentView === 'pentest-system') return renderWorkflowPlaceholder('系统分析', <FileSearch />);
    if (currentView === 'pentest-threat') return renderWorkflowPlaceholder('威胁分析', <Zap />);
    if (currentView === 'pentest-orch') return renderWorkflowPlaceholder('测试编排', <Workflow />);
    if (currentView === 'pentest-exec-code') return renderWorkflowPlaceholder('C/C++ 源码审计 (VSCODE Remote)', <SearchCode />);
    if (currentView === 'pentest-exec-web') return renderWorkflowPlaceholder('WEB 渗透测试控制台', <Globe />);
    if (currentView === 'pentest-exec-poc') return renderWorkflowPlaceholder('POC 自动生成', <Activity />);
    if (currentView === 'pentest-exec-exp') return renderWorkflowPlaceholder('EXP 验证与后渗透', <Target />);
    if (currentView === 'pentest-report') return renderWorkflowPlaceholder('报告模块', <ClipboardList />);
    if (currentView === 'engine-assessment') return renderWorkflowPlaceholder('安全评估', <Monitor />);

    if (currentView.startsWith('test-input-')) {
      const typeLabel = currentView.includes('release') ? '发布包' : currentView.includes('code') ? '源代码' : '需求文档';
      return (
        <div className="p-8 space-y-6 flex flex-col h-full animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{typeLabel} 资源输入</h2>
            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700">
              <Upload size={18} /> 上传资产
            </button>
          </div>
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-3"><Loader2 className="animate-spin" /> <span className="font-bold">加载资源中...</span></div>
              ) : resources.length > 0 ? resources.map(res => (
                <div key={res.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><FileText size={20} /></div>
                    <div><p className="text-sm font-bold text-slate-700">{res.name}</p><p className="text-[10px] text-slate-400 font-mono">{res.size} • {res.updatedAt?.split('T')[0]}</p></div>
                  </div>
                  <button onClick={() => api.resources.delete(res.id).then(fetchResources)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-200 font-black italic">
                   <FileBox size={64} className="mb-4 opacity-20" />
                   <p>暂无资源上传记录</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return <div className="p-8 text-center text-slate-400 italic">"{currentView}" 模块正在开发中...</div>;
  };

  const renderWorkflowPlaceholder = (title: string, icon: any) => {
    return (
      <div className="p-10 h-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-inner mb-8">
           {React.cloneElement(icon as React.ReactElement<any>, { size: 48 })}
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{title}</h2>
        <p className="text-slate-400 font-medium max-w-md">当前模块已自动对接 K8S Namespace 安全上下文。请确认测试目标已在「项目空间」完成初始化编排。</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
           <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0"><Activity size={20} className="text-slate-400" /></div>
              <div><p className="text-sm font-black text-slate-700">自动化引擎</p><p className="text-xs text-slate-400 mt-1">基于镜像的持续模糊测试与动态分析</p></div>
           </div>
           <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex gap-4 items-start">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0"><FileBox size={20} className="text-slate-400" /></div>
              <div><p className="text-sm font-black text-slate-700">专家审计</p><p className="text-xs text-slate-400 mt-1">集成化的源码分析与专家级渗透套件</p></div>
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
              <SidebarItem id="base-mgmt" label="基础资源管理" icon={<Box size={20} />} children={[
                { id: 'static-packages', label: '静态软件包管理' },
                { id: 'deploy-script-mgmt', label: '部署脚本管理' }
              ]} />
              <SidebarItem id="project-mgmt" label="项目空间" icon={<Briefcase size={20} />} />
              <SidebarItem id="test-input" label="测试输入" icon={<FileBox size={20} />} children={[{ id: 'test-input-release', label: '发布包' }, { id: 'test-input-code', label: '源代码' }, { id: 'test-input-doc', label: '需求文档' }]} />
            </div>
          </div>
          <div>{!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">环境编排</p>}
            <div className="space-y-1">
              <SidebarItem id="env-mgmt" label="环境服务" icon={<Database size={20} />} children={[
                { id: 'env-dashboard', label: 'DashBoard' },
                { id: 'env-template', label: '模板管理' },
                { id: 'env-agent', label: 'Agent 管理' },
                { id: 'env-service', label: '服务管理' },
                { id: 'env-tasks', label: '任务管理' }
              ]} />
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">项目控制台</span>
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
          
          <div className="flex items-center gap-6">
             <div className="flex flex-col text-right">
                <div className="flex items-center justify-end gap-2">
                   <span className="text-xs font-black text-slate-800 tracking-tight">{user?.username}</span>
                   <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black border-2 border-slate-100 shadow-sm">{user?.username?.[0]?.toUpperCase()}</div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[8px] font-black uppercase">
                      <ShieldCheck size={10} /> {user?.role?.[0] || 'User'}
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200 text-[8px] font-black uppercase">
                      <Target size={10} /> {currentProject.name.slice(0, 10)}
                   </div>
                </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContent()}
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
