
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, RotateCw, ShieldCheck, Clock, Settings, UserCog, Lock, LogOut, Calendar } from 'lucide-react';
import { SecurityProject, UserInfo, ViewType } from '../types/types';

interface HeaderProps {
  user: UserInfo | null;
  projects: SecurityProject[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  isProjectDropdownOpen: boolean;
  setIsProjectDropdownOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchProjects: (showRefresh: boolean) => void;
  isRefreshing: boolean;
  setCurrentView: (view: ViewType | string) => void;
  handleLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user, projects, selectedProjectId, setSelectedProjectId, 
  isProjectDropdownOpen, setIsProjectDropdownOpen, searchQuery, setSearchQuery, 
  fetchProjects, isRefreshing, setCurrentView, handleLogout
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const currentProject = projects.find(p => p.id === selectedProjectId) || { name: '选择项目' };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      weekday: 'long'
    };
    return date.toLocaleDateString('zh-CN', options);
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between shadow-sm z-20 sticky top-0">
      <div className="flex items-center gap-6">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">项目控制台</span>
        <div className="relative">
          <button onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)} className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-white transition-all">
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {currentProject.name} <ChevronDown size={16} />
          </button>
          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-3 z-50">
              <input placeholder="过滤项目..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl text-xs outline-none" onChange={(e) => setSearchQuery(e.target.value)} />
              <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
                {projects.filter(p => p.name.includes(searchQuery)).map(p => (
                  <button key={p.id} onClick={() => { setSelectedProjectId(p.id); setIsProjectDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold ${selectedProjectId === p.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'}`}>{p.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => fetchProjects(true)} className="p-3 text-slate-400 hover:text-blue-600 transition-all"><RotateCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
      </div>

      <div className="flex items-center gap-8">
        {/* Requirement: Precision time and current user info */}
        <div className="hidden lg:flex items-center gap-8 pr-8 border-r border-slate-100">
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-xl font-black text-slate-800 font-mono tracking-tighter leading-none">{formatTime(currentTime)}</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                 <Calendar size={10} /> {formatDate(currentTime)}
              </p>
           </div>

           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-black text-slate-800 leading-none">{user?.username}</span>
                 <div className="px-2 py-0.5 bg-green-50 border border-green-100 rounded text-[8px] font-black text-green-600 uppercase tracking-tighter">Online</div>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                 <ShieldCheck size={11} className="text-blue-500" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{user?.role?.[0] || 'Operator'}</span>
              </div>
           </div>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="group flex items-center gap-3 p-1 pr-4 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm border-2 border-slate-900 shadow-inner group-hover:rotate-6 transition-transform">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
               <p className="text-[10px] font-black text-white leading-tight">{user?.username}</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Administrator</p>
            </div>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 p-2 border-t-4 border-t-blue-600">
              <div className="px-4 py-4 border-b border-slate-50 mb-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Identity</p>
                 <div className="flex items-center gap-3 mt-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 font-black">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{user?.username}</p>
                      <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 inline-block">UID: {user?.id}</span>
                    </div>
                 </div>
              </div>
              
              <div className="p-1 space-y-0.5">
                <button 
                  onClick={() => { setCurrentView('sys-settings'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <Settings size={16} className="text-slate-400" /> 系统设置
                </button>
                <button 
                  onClick={() => { setCurrentView('user-mgmt-users'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <UserCog size={16} className="text-slate-400" /> 用户管理
                </button>
                <button 
                  onClick={() => { setCurrentView('change-password'); setIsUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <Lock size={16} className="text-slate-400" /> 修改密码
                </button>
              </div>
              
              <div className="h-px bg-slate-50 my-1 mx-2" />
              
              <button 
                onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
              >
                <LogOut size={16} /> 退出系统
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
