
import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Box, 
  Briefcase, 
  FileBox, 
  Database, 
  ShieldCheck, 
  Target, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen,
  ChevronRight,
  Monitor,
  ClipboardCheck,
  FileText,
  Play
} from 'lucide-react';
import { UserInfo, ViewType } from '../types/types';

interface SidebarProps {
  user: UserInfo | null;
  currentView: ViewType | string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  expandedMenus: Set<string>;
  setExpandedMenus: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCurrentView: (v: ViewType | string) => void;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, currentView, isSidebarCollapsed, setIsSidebarCollapsed, 
  expandedMenus, setExpandedMenus, setCurrentView, handleLogout
}) => {
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
            } else setCurrentView(id);
          }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer transition-all ${
            isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
          <SidebarItem key={child.id} id={child.id} label={child.label} children={child.children} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-30 shadow-2xl shrink-0`}>
      <div className="p-8 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30"><Shield className="text-white" size={28} /></div>
        {!isSidebarCollapsed && <span className="text-2xl font-black text-white tracking-tighter">SecFlow</span>}
      </div>
      <nav className="flex-1 px-5 py-2 space-y-8 overflow-y-auto custom-scrollbar">
        <div>
          <div className="space-y-1">
            <SidebarItem id="dashboard" label="控制台" icon={<LayoutDashboard size={20} />} />
            <SidebarItem id="base-mgmt" label="基础资源管理" icon={<Box size={20} />} children={[
              { id: 'static-packages', label: '静态软件包管理' },
              { id: 'deploy-script-mgmt', label: '部署脚本管理' }
            ]} />
            <SidebarItem id="project-mgmt" label="项目空间" icon={<Briefcase size={20} />} />
            <SidebarItem id="test-input" label="测试输入" icon={<FileBox size={20} />} children={[{ id: 'test-input-release', label: '发布包' }, { id: 'test-input-code', label: '源代码' }, { id: 'test-input-doc', label: '需求文档' }]} />
            <SidebarItem id="env-mgmt" label="环境服务" icon={<Database size={20} />} children={[
              { id: 'env-template', label: '模板管理' }, 
              { id: 'env-agent', label: 'Agent 管理' }, 
              { id: 'env-service', label: '服务管理' },
              { id: 'env-tasks', label: '任务管理' }
            ]} />
            <SidebarItem id="engine-validation" label="安全验证" icon={<ShieldCheck size={20} />} />
            <SidebarItem id="pentest-root" label="渗透测试" icon={<Target size={20} />} children={[
              { id: 'pentest-risk', label: '风险评估' }, 
              { id: 'pentest-system', label: '系统分析' }, 
              { id: 'pentest-threat', label: '威胁分析' }, 
              { id: 'pentest-orch', label: '测试编排' },
              { id: 'pentest-exec', label: '测试执行', icon: <Play size={14} />, children: [
                { id: 'pentest-exec-code', label: '在线代码审计（VSCODE AI版）' },
                { id: 'pentest-exec-work', label: '知微在线工作平台（AI版）' }
              ]},
              { id: 'pentest-report', label: '报告', icon: <FileText size={14} /> }
            ]} />
            <SidebarItem id="security-assessment" label="安全评估" icon={<ClipboardCheck size={20} />} />
          </div>
        </div>
      </nav>
      <div className="p-6 border-t border-slate-800">
         {!isSidebarCollapsed && (
           <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-3xl">
             <div className="w-11 h-11 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-black">
               {user?.username?.[0]?.toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-black text-white truncate">{user?.username}</p>
               {/* Fix: Changed handleLogout to onClick to resolve property error on HTML button element */}
               <button onClick={handleLogout} className="text-[10px] text-red-400 font-bold hover:underline">退出登录</button>
             </div>
             <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-slate-500">
               <PanelLeftClose size={18} />
             </button>
           </div>
         )}
         {isSidebarCollapsed && (
           <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="w-full flex justify-center p-3 text-slate-500">
             <PanelLeftOpen size={22} />
           </button>
         )}
      </div>
    </aside>
  );
};
