
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Agent } from '../../types/types';
import { StatusBadge } from '../../components/StatusBadge';

export const EnvAgentPage: React.FC<{ agents: Agent[]; isLoading: boolean }> = ({ agents, isLoading }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex flex-col"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Agent 节点管理</h2><p className="text-slate-500 font-medium">分布式执行引擎状态监控</p></div>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-6">节点名称</th><th className="px-8 py-6">IP 地址</th><th className="px-8 py-6">状态</th></tr></thead>
        <tbody className="divide-y divide-slate-50">
          {isLoading ? <tr><td colSpan={3} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr> : agents.map(a => (
            <tr key={a.key} className="hover:bg-slate-50 transition-all">
              <td className="px-8 py-6 font-black text-slate-700">{a.hostname}</td>
              <td className="px-8 py-6 font-mono text-xs text-slate-500">{a.ip_address}</td>
              <td className="px-8 py-6"><StatusBadge status={a.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
