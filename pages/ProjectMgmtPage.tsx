
import React from 'react';
import { Plus, Edit3, Trash2, Briefcase } from 'lucide-react';
import { SecurityProject } from '../types/types';
import { StatusBadge } from '../components/StatusBadge';

interface ProjectMgmtPageProps {
  projects: SecurityProject[];
  setActiveProjectId: (id: string) => void;
  setCurrentView: (view: string) => void;
  setIsProjectModalOpen: (open: boolean) => void;
}

export const ProjectMgmtPage: React.FC<ProjectMgmtPageProps> = ({ projects, setActiveProjectId, setCurrentView, setIsProjectModalOpen }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">安全项目管理</h2><p className="text-slate-500 mt-1 font-medium">隔离、编排与生命周期管理</p></div>
      <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl transition-all"><Plus size={20} /> 初始化项目</button>
    </div>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-6">项目名称</th><th className="px-8 py-6">命名空间</th><th className="px-8 py-6">项目角色</th><th className="px-8 py-6 text-right">操作</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {projects.map(p => (
            <tr key={p.id} className="hover:bg-blue-50/30 transition-all group cursor-pointer" onClick={() => { setActiveProjectId(p.id); setCurrentView('project-detail'); }}>
              <td className="px-8 py-7"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg border border-slate-100">{p.name[0].toUpperCase()}</div><div><p className="text-sm font-black text-slate-800">{p.name}</p></div></div></td>
              <td className="px-8 py-7"><span className="font-mono text-[11px] bg-slate-100 px-3 py-1 rounded-full">{p.k8s_namespace || 'default'}</span></td>
              <td className="px-8 py-7"><StatusBadge status="Owner" /></td>
              <td className="px-8 py-7 text-right" onClick={e => e.stopPropagation()}><div className="flex justify-end gap-2"><button className="p-3 text-slate-400 hover:text-blue-600"><Edit3 size={18} /></button><button className="p-3 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
