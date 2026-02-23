
import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Search, Loader2, RefreshCw, Box, Terminal, Database, ShieldAlert } from 'lucide-react';
import { JobTemplate } from '../../types/types';
import { api } from '../../api/api';

export const JobTemplatePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'project' | 'global'>('project');

  useEffect(() => {
    loadTemplates();
  }, [projectId, scope]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.workflow.listJobTemplates({ 
        scope, 
        project_id: scope === 'project' ? projectId : undefined 
      });
      setTemplates(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">任务模板</h2>
          <p className="text-slate-500 mt-1 font-medium italic">管理一次性安全探测任务（扫描、爆破、Fuzzing）的容器运行规范</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={() => setScope('project')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${scope === 'project' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>当前项目</button>
            <button onClick={() => setScope('global')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${scope === 'global' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>全局库</button>
          </div>
          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={20} /> 注册任务组件
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>
        ) : templates.map(t => (
          <div key={t.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition-all group flex flex-col justify-between">
             <div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all">
                   <Zap size={24} />
                </div>
                <h4 className="text-lg font-black text-slate-800 truncate">{t.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter truncate">IMAGE: {t.containers?.[0]?.image}</p>
             </div>
             <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                   <ShieldAlert size={12} className="text-amber-500" /> TTL: 3600s
                </div>
                <button onClick={() => api.workflow.deleteJobTemplate(t.id).then(loadTemplates)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
