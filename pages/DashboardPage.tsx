
import React from 'react';
import { Briefcase, Monitor, Package, ChevronRight } from 'lucide-react';
import { SecurityProject, Agent, StaticPackage } from '../types/types';

interface DashboardPageProps {
  projects: SecurityProject[];
  agents: Agent[];
  staticPackages: StaticPackage[];
  setCurrentView: (view: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ projects, agents, staticPackages, setCurrentView }) => {
  const stats = [
    { id: 'project-mgmt', label: '活动项目', value: projects.length, icon: <Briefcase size={24} />, bg: 'bg-blue-100', text: 'text-blue-600' },
    // Fix: status "online" is the correct value for online agents per types
    { id: 'env-agent', label: '存活 Agent', value: agents.filter(a => a.status === 'online').length, icon: <Monitor size={24} />, bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { id: 'static-packages', label: '受信任软件包', value: staticPackages.length, icon: <Package size={24} />, bg: 'bg-purple-100', text: 'text-purple-600' }
  ];
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">SecFlow 控制台</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(stat => (
          <div key={stat.id} onClick={() => setCurrentView(stat.id)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
            <div className={`w-14 h-14 ${stat.bg} ${stat.text} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <h2 className="text-4xl font-black mt-2 flex items-center justify-between text-slate-900">{stat.value}<ChevronRight className="text-slate-200" size={28} /></h2>
          </div>
        ))}
      </div>
    </div>
  );
};
