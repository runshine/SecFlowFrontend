
import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, RotateCw, ShieldCheck, Target, FolderTree, FileJson, Layers, Layout, Share2, Clock } from 'lucide-react';
import { SecurityProject, UserInfo } from '../types/types';

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
}

export const Header: React.FC<HeaderProps> = ({
  user, projects, selectedProjectId, setSelectedProjectId, 
  isProjectDropdownOpen, setIsProjectDropdownOpen, searchQuery, setSearchQuery, 
  fetchProjects, isRefreshing
}) => {
  const [showStructure, setShowStructure] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const currentProject = projects.find(p => p.id === selectedProjectId) || { name: '选择项目' };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const StructureNode = ({ name, icon: Icon, children }: any) => (
    <div className="ml-4 mt-2">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <Icon size={14} className="text-blue-500" /> {name}
      </div>
      {children}
    </div>
  );

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

      <div className="flex items-center gap-4">
        {/* 源码结构可视化按钮 */}
        <div className="relative">
          <button 
            onClick={() => setShowStructure(!showStructure)}
            className={`p-3 rounded-xl transition-all ${showStructure ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
            title="查看重构后的源码结构"
          >
            <FolderTree size={20} />
          </button>
          
          {showStructure && (
            <div className="absolute top-full right-0 mt-3 w-72 bg-slate-900 text-slate-300 border border-slate-800 rounded-3xl shadow-2xl p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">当前重构后的文件夹结构</p>
              <div className="space-y-1 border-l border-slate-800 ml-2">
                <StructureNode name="api/" icon={Share2} />
                <StructureNode name="types/" icon={FileJson} />
                <StructureNode name="layout/" icon={Layers} />
                <StructureNode name="components/" icon={Layers} />
                <StructureNode name="pages/" icon={Layout}>
                  <StructureNode name="inputs/" icon={FolderTree} />
                  <StructureNode name="env/" icon={FolderTree} />
                </StructureNode>
              </div>
              <p className="mt-6 text-[9px] text-slate-500 italic font-medium leading-relaxed">
                注：根目录下的 *.ts 文件已迁移至子目录。重复文件建议在物理磁盘上执行删除。
              </p>
            </div>
          )}
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-800 leading-none">{user?.username}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center justify-end gap-1.5">
              <Clock size={10} className="text-blue-500" /> {formatTime(currentTime)}
            </p>
            <div className="flex gap-1 justify-end mt-0.5">
              <ShieldCheck size={10} className="text-blue-500" />
              <span className="text-[8px] font-black uppercase text-slate-400">{user?.role?.[0]}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs border-2 border-white shadow-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
