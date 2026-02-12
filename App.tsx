
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileSearch, Zap, Workflow, Loader2, AlertCircle, Shield, ClipboardCheck, FileBox, HardDrive, Settings, UserCog, Lock, Globe, Users, UserCheck } from 'lucide-react';
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
import { TaskMgmtPage } from './pages/inputs/TaskMgmtPage';
import { OtherInputPage } from './pages/inputs/OtherInputPage';
import { OutputPvcPage } from './pages/inputs/OutputPvcPage';

// Env Pages
import { EnvAgentPage } from './pages/env/EnvAgentPage';
import { EnvTemplatePage } from './pages/env/EnvTemplatePage';
import { EnvTasksPage } from './pages/env/EnvTasksPage';
import { ServiceMgmtPage } from './pages/env/ServiceMgmtPage';

// Pentest Pages
import { ExecutionCodeAuditPage } from './pages/pentest/ExecutionCodeAuditPage';
import { ExecutionWorkPlatformPage } from './pages/pentest/ExecutionWorkPlatformPage';
import { SecMateNGPage } from './pages/pentest/SecMateNGPage';
import { ReportsPage } from './pages/pentest/ReportsPage';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('secflow_token'));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentView, setCurrentView] = useState<ViewType | string>('dashboard');
  const [projects, setProjects] = useState<SecurityProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(localStorage.getItem('last_project_id') || '');
  const [activeProjectId, setActiveProjectId] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['test-input', 'pentest-root', 'env-mgmt', 'base-mgmt', 'pentest-exec', 'user-mgmt-root']));
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Data States
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<EnvTemplate[]>([]);
  const [staticPackages, setStaticPackages] = useState<StaticPackage[]>([]);
  const [activePackageId, setActivePackageId] = useState<string>('');
  const [selectedStaticPkgIds, setSelectedStaticPkgIds] = useState<Set<string>>(new Set());
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [dashboardServicesCount, setDashboardServicesCount] = useState(0);

  // Health Status
  const [resourceServiceHealthy, setResourceServiceHealthy] = useState<boolean | null>(null);
  const [staticPackageHealthy, setStaticPackageHealthy] = useState<boolean | null>(null);
  const [projectServiceHealthy, setProjectServiceHealthy] = useState<boolean | null>(null);
  const [envServiceHealthy, setEnvServiceHealthy] = useState<boolean | null>(null);
  const [codeAuditServiceHealthy, setCodeAuditServiceHealthy] = useState<boolean | null>(null);

  // 监听 401 身份失效事件
  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('secflow-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('secflow-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (token) {
      api.auth.validateToken()
        .then(setUser)
        .catch(() => handleLogout());
      fetchProjects();
      
      checkAllHealth();
      const healthInterval = setInterval(checkAllHealth, 30000);
      return () => clearInterval(healthInterval);
    }
  }, [token]);

  const checkAllHealth = () => {
    checkResourceHealth();
    checkStaticPackageHealth();
    checkProjectHealth();
    checkEnvHealth();
    checkCodeAuditHealth();
  };

  const checkResourceHealth = async () => {
    try {
      const res = await api.resources.getHealth();
      setResourceServiceHealthy(res.status === 'UP' || res.status === 'healthy' || res.status === 'active');
    } catch (e) {
      setResourceServiceHealthy(false);
    }
  };

  const checkStaticPackageHealth = async () => {
    try {
      const res = await api.staticPackages.getHealth();
      setStaticPackageHealthy(res.status === 'UP' || res.status === 'healthy' || res.status === 'active');
    } catch (e) {
      setStaticPackageHealthy(false);
    }
  };

  const checkProjectHealth = async () => {
    try {
      const res = await api.projects.getHealth();
      setProjectServiceHealthy(res.status === 'ok' || res.status === 'UP' || res.status === 'healthy');
    } catch (e) {
      setProjectServiceHealthy(false);
    }
  };

  const checkEnvHealth = async () => {
    try {
      const res = await api.environment.getHealth();
      setEnvServiceHealthy(res.status === 'healthy' || res.status === 'UP' || res.status === 'active');
    } catch (e) {
      setEnvServiceHealthy(false);
    }
  };

  const checkCodeAuditHealth = async () => {
    try {
      const res = await api.codeServer.getHealth();
      setCodeAuditServiceHealthy(res.status === 'healthy' || res.status === 'UP' || res.status === 'active');
    } catch (e) {
      setCodeAuditServiceHealthy(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('last_project_id', selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchDashboardServicesCount = async (onlineAgents: Agent[]) => {
    if (onlineAgents.length === 0) return;
    try {
      const promises = onlineAgents.map(a => api.environment.getAgentServices(a.key).catch(() => ({ services: [] })));
      const results = await Promise.all(promises);
      const total = results.reduce((acc, curr) => acc + (curr.services?.length || 0), 0);
      setDashboardServicesCount(total);
    } catch (e) {
      console.error("Dashboard services count aggregation failed", e);
    }
  };

  useEffect(() => {
    if (token) {
      if (currentView === 'dashboard' && selectedProjectId) {
        api.environment.getAgents(selectedProjectId).then(d => {
          const agentList = d.agents || [];
          setAgents(agentList);
          fetchDashboardServicesCount(agentList.filter(a => a.status === 'online'));
        }).catch(e => console.error(e));
        
        api.environment.getTemplates().then(d => setTemplates(d.templates || [])).catch(e => console.error(e));
        api.staticPackages.list().then(d => setStaticPackages(d.packages || [])).catch(e => console.error(e));
        api.staticPackages.getStats().then(d => setPackageStats(d.statistics)).catch(e => console.error(e));
      }
    }
  }, [selectedProjectId, currentView, token]);

  const fetchProjects = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      const data = await api.projects.list();
      setProjects(data.projects || []);
      if (data.projects && data.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      if (refresh) setIsRefreshing(false);
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
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return (
        <DashboardPage 
          projects={projects} 
          agents={agents} 
          staticPackages={staticPackages} 
          templates={templates}
          servicesCount={dashboardServicesCount}
          setCurrentView={setCurrentView} 
        />
      );
      case 'project-mgmt': return (
        <ProjectMgmtPage 
          projects={projects} 
          setActiveProjectId={(id) => { setActiveProjectId(id); }} 
          setCurrentView={setCurrentView} 
          refreshProjects={fetchProjects}
        />
      );
      case 'project-detail': return <ProjectDetailPage projectId={activeProjectId} projects={projects} onBack={() => setCurrentView('project-mgmt')} />;
      case 'static-packages': return <StaticPackagesPage staticPackages={staticPackages} packageStats={packageStats} fetchStaticPackages={() => api.staticPackages.list().then(d => setStaticPackages(d.packages))} setActivePackageId={setActivePackageId} setCurrentView={setCurrentView} selectedIds={selectedStaticPkgIds} setSelectedIds={setSelectedStaticPkgIds} />;
      case 'static-package-detail': return <StaticPackageDetailPage packageId={activePackageId} onBack={() => setCurrentView('static-packages')} />;
      case 'deploy-script-mgmt': return <DeployScriptPage />;
      
      // Resource Management Pages
      case 'test-input-release': return <ReleasePackagePage projectId={selectedProjectId} />;
      case 'test-input-code': return <CodeAuditPage projectId={selectedProjectId} />;
      case 'test-input-doc': return <DocAnalysisPage projectId={selectedProjectId} />;
      case 'test-input-tasks': return <TaskMgmtPage projectId={selectedProjectId} />;
      case 'test-input-other': return <OtherInputPage projectId={selectedProjectId} />;
      case 'test-output-pvc': return <OutputPvcPage projectId={selectedProjectId} />;
      
      case 'env-agent': return <EnvAgentPage projectId={selectedProjectId} />;
      case 'env-service': return <ServiceMgmtPage projectId={selectedProjectId} />;
      case 'env-template': return <EnvTemplatePage projectId={selectedProjectId} />;
      case 'env-tasks': return <EnvTasksPage projectId={selectedProjectId} />;
      case 'engine-validation': return <WorkflowPlaceholder title="安全验证" icon={<ShieldCheck />} />;
      case 'pentest-risk': return <WorkflowPlaceholder title="风险评估" icon={<ShieldAlert />} />;
      case 'pentest-system': return <WorkflowPlaceholder title="系统分析" icon={<FileSearch />} />;
      case 'pentest-threat': return <WorkflowPlaceholder title="威胁分析" icon={<Zap />} />;
      case 'pentest-orch': return <WorkflowPlaceholder title="测试编排" icon={<Workflow />} />;
      case 'pentest-exec-code': return <ExecutionCodeAuditPage projectId={selectedProjectId} />;
      case 'pentest-exec-work': return <ExecutionWorkPlatformPage projectId={selectedProjectId} />;
      case 'pentest-exec-secmate': return <SecMateNGPage />;
      case 'pentest-report': return <ReportsPage />;
      case 'security-assessment': return <SecurityAssessmentPage />;

      // New Admin Pages (Blank Placeholders)
      case 'sys-settings': return <WorkflowPlaceholder title="系统设置" icon={<Settings />} />;
      case 'change-password': return <WorkflowPlaceholder title="修改密码" icon={<Lock />} />;
      case 'user-mgmt-users': return <WorkflowPlaceholder title="用户账号管理" icon={<Users />} />;
      case 'user-mgmt-roles': return <WorkflowPlaceholder title="角色定义管理" icon={<UserCheck />} />;
      case 'user-mgmt-perms': return <WorkflowPlaceholder title="功能权限分配" icon={<ShieldAlert />} />;
      case 'user-mgmt-online': return <WorkflowPlaceholder title="在线会话监控" icon={<Globe />} />;

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
      <Sidebar 
        user={user} 
        currentView={currentView} 
        isSidebarCollapsed={isSidebarCollapsed} 
        setIsSidebarCollapsed={setIsSidebarCollapsed} 
        expandedMenus={expandedMenus} 
        setExpandedMenus={setExpandedMenus} 
        setCurrentView={setCurrentView} 
        handleLogout={handleLogout}
        resourceHealth={resourceServiceHealthy}
        staticPackageHealth={staticPackageHealthy}
        projectHealth={projectServiceHealthy}
        envHealth={envServiceHealthy}
        codeAuditHealth={codeAuditServiceHealthy}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          user={user} 
          projects={projects} 
          selectedProjectId={selectedProjectId} 
          setSelectedProjectId={setSelectedProjectId} 
          isProjectDropdownOpen={isProjectDropdownOpen} 
          setIsProjectDropdownOpen={setIsProjectDropdownOpen} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          fetchProjects={fetchProjects} 
          isRefreshing={isRefreshing}
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
        />
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
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
