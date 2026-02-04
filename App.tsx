
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileSearch, Zap, Workflow, Loader2, AlertCircle, Shield, ClipboardCheck } from 'lucide-react';
import { ViewType, SecurityProject, FileItem, UserInfo, Agent, EnvTemplate, AsyncTask, StaticPackage, PackageStats } from './types/types';
import { api } from './api/api';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { WorkflowPlaceholder } from './components/WorkflowPlaceholder';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectMgmtPage } from './pages/ProjectMgmtPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { StaticPackagesPage } from './pages/StaticPackagesPage';
import { StaticPackageDetailPage } from './pages/StaticPackageDetailPage';
import { DeployScriptPage } from './pages/DeployScriptPage';
import { SecurityAssessmentPage } from './pages/SecurityAssessmentPage';

// Input Pages
import { ReleasePackagePage } from './pages/inputs/ReleasePackagePage';
import { CodeAuditPage } from './pages/inputs/CodeAuditPage';
import { DocAnalysisPage } from './pages/inputs/DocAnalysisPage';

// Env Pages
import { EnvAgentPage } from './pages/env/EnvAgentPage';
import { EnvTemplatePage } from './pages/env/EnvTemplatePage';
import { EnvTasksPage } from './pages/env/EnvTasksPage';
import { ServiceMgmtPage } from './pages/env/ServiceMgmtPage';

// Pentest Pages
import { ExecutionCodeAuditPage } from './pages/pentest/ExecutionCodeAuditPage';
import { ExecutionWorkPlatformPage } from './pages/pentest/ExecutionWorkPlatformPage';
import { ReportsPage } from './pages/pentest/ReportsPage';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('secflow_token'));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentView, setCurrentView] = useState<ViewType | string>('dashboard');
  const [projects, setProjects] = useState<SecurityProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string>(''); // For detail view specifically
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['test-input', 'pentest-root', 'env-mgmt', 'base-mgmt']));
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Data States
  const [resources, setResources] = useState<FileItem[]>([]);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<EnvTemplate[]>([]);
  const [tasks, setTasks] = useState<AsyncTask[]>([]);
  const [staticPackages, setStaticPackages] = useState<StaticPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<string>('');
  const [selectedStaticPkgIds, setSelectedStaticPkgIds] = useState<Set<string>>(new Set());
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      api.auth.validateToken()
        .then(setUser)
        .catch(() => handleLogout());
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProjectId && token) {
      if (currentView === 'static-packages') {
        api.staticPackages.list().then(d => setStaticPackages(d.packages)).catch(e => console.error(e));
        api.staticPackages.getStats().then(d => setPackageStats(d.statistics)).catch(e => console.error(e));
      } else if (currentView.startsWith('test-input-')) {
        fetchResources();
      } else if (currentView === 'env-agent') {
        setIsLoading(true);
        // Map agents from the response object
        api.environment.getAgents().then(d => setAgents(d.agents)).catch(e => console.error(e)).finally(() => setIsLoading(false));
      } else if (currentView === 'env-template') {
        setIsLoading(true);
        api.environment.getTemplates().then(d => setTemplates(d.templates)).catch(e => console.error(e)).finally(() => setIsLoading(false));
      } else if (currentView === 'env-tasks') {
        setIsLoading(true);
        // Map task array from the response object
        api.environment.getTasks().then(d => setTasks(d.task)).catch(e => console.error(e)).finally(() => setIsLoading(false));
      }
    }
  }, [selectedProjectId, currentView, token]);

  const fetchProjects = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      const data = await api.projects.list();
      setProjects(data.projects);
      if (data.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      if (refresh) setIsRefreshing(false);
    }
  };

  const fetchResources = async () => {
    const typeMap: any = { 
      'test-input-release': 'software_package', 
      'test-input-code': 'code_package', 
      'test-input-doc': 'document_package' 
    };
    const type = typeMap[currentView];
    if (!type || !selectedProjectId) return;
    setIsLoading(true);
    setResourceError(null);
    try {
      const data = await api.resources.list(selectedProjectId, type);
      if (Array.isArray(data)) {
        setResources(data.map((r: any) => ({ 
          id: r.id.toString(), 
          name: r.file_name, 
          type: 'file',
          updatedAt: r.created_at?.split('T')[0], 
          size: (r.file_size / 1024 / 1024).toFixed(2) + ' MB' 
        })));
      } else {
        setResources([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch resources", err);
      setResourceError(err.message || "获取资源失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const credentials = Object.fromEntries(formData);
    
    try {
      const data = await api.auth.login(credentials);
      localStorage.setItem('secflow_token', data.access_token);
      setToken(data.access_token);
    } catch (err: any) {
      setLoginError(err.message || "登录失败，请检查用户名和密码");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('secflow_token');
    setToken(null);
    setUser(null);
    setProjects([]);
    setSelectedProjectId('');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardPage projects={projects} agents={agents} staticPackages={staticPackages} setCurrentView={setCurrentView} />;
      case 'project-mgmt': return <ProjectMgmtPage projects={projects} setActiveProjectId={(id) => { setActiveProjectId(id); }} setCurrentView={setCurrentView} setIsProjectModalOpen={() => {}} />;
      case 'project-detail': return <ProjectDetailPage projectId={activeProjectId} projects={projects} onBack={() => setCurrentView('project-mgmt')} />;
      case 'static-packages': return <StaticPackagesPage staticPackages={staticPackages} packageStats={packageStats} fetchStaticPackages={() => api.staticPackages.list().then(d => setStaticPackages(d.packages))} setActivePackageId={setActivePackageId} setCurrentView={setCurrentView} selectedIds={selectedStaticPkgIds} setSelectedIds={setSelectedStaticPkgIds} />;
      case 'static-package-detail': return <StaticPackageDetailPage packageId={activePackageId} onBack={() => setCurrentView('static-packages')} />;
      case 'deploy-script-mgmt': return <DeployScriptPage />;
      case 'test-input-release': return <ReleasePackagePage resources={resources} isLoading={isLoading} />;
      case 'test-input-code': return <CodeAuditPage resources={resources} isLoading={isLoading} />;
      case 'test-input-doc': return <DocAnalysisPage resources={resources} isLoading={isLoading} />;
      // Fix: Standalone pages handle their own data and don't require external props
      case 'env-agent': return <EnvAgentPage />;
      case 'env-service': return <ServiceMgmtPage />;
      case 'env-template': return <EnvTemplatePage />;
      case 'env-tasks': return <EnvTasksPage />;
      case 'engine-validation': return <WorkflowPlaceholder title="安全验证" icon={<ShieldCheck />} />;
      case 'pentest-risk': return <WorkflowPlaceholder title="风险评估" icon={<ShieldAlert />} />;
      case 'pentest-system': return <WorkflowPlaceholder title="系统分析" icon={<FileSearch />} />;
      case 'pentest-threat': return <WorkflowPlaceholder title="威胁分析" icon={<Zap />} />;
      case 'pentest-orch': return <WorkflowPlaceholder title="测试编排" icon={<Workflow />} />;
      case 'pentest-exec-code': return <ExecutionCodeAuditPage />;
      case 'pentest-exec-work': return <ExecutionWorkPlatformPage />;
      case 'pentest-report': return <ReportsPage />;
      case 'security-assessment': return <SecurityAssessmentPage />;
      default: return <div className="p-20 text-center"><h3 className="text-xl font-black text-slate-400">模块 "{currentView}" 开发中...</h3></div>;
    }
  };

  if (!token) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">SecFlow</h1>
          <p className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-[10px]">专业安全测试流程引擎</p>
        </div>

        {loginError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" />
            {loginError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">账户名称</label>
            <input name="username" required className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" placeholder="Username" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">身份凭证</label>
            <input name="password" type="password" required className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" placeholder="Password" />
          </div>
          <button disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:active:scale-100">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : '进入平台'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-600 font-medium leading-relaxed">
          &copy; 2025 SecFlow 极速安全测试平台 <br/> 受信任的二进制分发与自动化渗透环境
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar user={user} currentView={currentView} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} expandedMenus={expandedMenus} setExpandedMenus={setExpandedMenus} setCurrentView={setCurrentView} handleLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0">
        <Header user={user} projects={projects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} isProjectDropdownOpen={isProjectDropdownOpen} setIsProjectDropdownOpen={setIsProjectDropdownOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} fetchProjects={fetchProjects} isRefreshing={isRefreshing} />
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {resourceError && currentView.startsWith('test-input-') && (
            <div className="m-10 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} />
                <span>{resourceError}</span>
              </div>
              <button onClick={() => fetchResources()} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">重试</button>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
