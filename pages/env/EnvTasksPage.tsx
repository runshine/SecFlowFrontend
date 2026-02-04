
import React from 'react';
import { Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AsyncTask } from '../../types/types';
import { StatusBadge } from '../../components/StatusBadge';

export const EnvTasksPage: React.FC<{ tasks: AsyncTask[]; isLoading: boolean }> = ({ tasks, isLoading }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">任务调度管理</h2>
        <p className="text-slate-500 mt-1 font-medium">编排执行日志与异步任务监控</p>
      </div>
    </div>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-6">任务 ID</th>
            <th className="px-8 py-6">类型</th>
            <th className="px-8 py-6">进度状态</th>
            <th className="px-8 py-6">创建时间</th>
            <th className="px-8 py-6">状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {isLoading ? (
            <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
          ) : tasks.map(t => (
            <tr key={t.id} className="hover:bg-slate-50 transition-all group">
              <td className="px-8 py-6 font-mono text-xs text-slate-500">{t.id}</td>
              <td className="px-8 py-6 font-black text-sm text-slate-700">{t.task_type}</td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${t.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{t.progress}%</span>
                </div>
              </td>
              <td className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase">{t.created_at?.split('.')[0].replace('T', ' ')}</td>
              <td className="px-8 py-6"><StatusBadge status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
