
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, RotateCw, ShieldCheck, Clock, Settings, UserCog, Lock, LogOut } from 'lucide-react';
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

  // 点击外部关闭用户菜单
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

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between shadow-sm z-20">
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

      <div className="flex items-center gap-4 relative" ref={userMenuRef}>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black text-slate-800 leading-none">{user?.username}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center justify-end gap-1.5">
            <Clock size={10} className="text-blue-500" /> {formatTime(currentTime)}
          </p>
        </div>
        
        <button 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs border-2 border-white shadow-sm hover:scale-105 transition-transform active:scale-95"
        >
          {user?.username?.[0]?.toUpperCase()}
        </button>

        {isUserMenuOpen && (
          <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 p-2">
            <div className="px-4 py-3 border-b border-slate-50 mb-1">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">当前登录身份</p>
               <p className="text-sm font-black text-slate-800 mt-0.5">{user?.username}</p>
               <div className="flex gap-1 mt-1">
                  <ShieldCheck size={10} className="text-blue-500" />
                  <span className="text-[8px] font-black uppercase text-slate-400">{user?.role?.[0] || 'USER'}</span>
               </div>
            </div>
            
            <button 
              onClick={() => { setCurrentView('sys-settings'); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
            >
              <Settings size={16} className="text-slate-400" /> 系统设置
            </button>
            <button 
              onClick={() => { setCurrentView('user-mgmt-users'); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
            >
              <UserCog size={16} className="text-slate-400" /> 用户管理
            </button>
            <button 
              onClick={() => { setCurrentView('change-password'); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
            >
              <Lock size={16} className="text-slate-400" /> 修改密码
            </button>
            
            <div className="h-px bg-slate-50 my-1 mx-2" />
            
            <button 
              onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={16} /> 退出系统
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
