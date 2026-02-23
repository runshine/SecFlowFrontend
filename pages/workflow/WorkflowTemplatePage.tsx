
import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Search, Trash2, Edit3, GitCommit, Layout, Info, Layers, Loader2, RefreshCw } from 'lucide-react';
import { WorkflowTemplate } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const WorkflowTemplatePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'project' | 'global'>('project');

  useEffect(() => {
    loadTemplates();
  }, [projectId, scope]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.workflow.listWorkflowTemplates({ 
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">工作流模板</h2>
          <p className="text-slate-500 mt-1 font-medium">设计并复用复杂的安全评估任务链，支持多节点依赖与资产流转</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={() => setScope('project')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${scope === 'project' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>当前项目</button>
            <button onClick={() => setScope('global')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${scope === 'global' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>全局通用</button>
          </div>
          <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={20} /> 创建编排模板
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>
        ) : templates.map(t => (
          <div key={t.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:shadow-2xl hover:border-blue-300 transition-all group flex flex-col justify-between h-[320px] relative overflow-hidden">
             <GitBranch className="absolute right-[-20px] top-[-20px] w-32 h-32 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
             <div>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Layout size={28} />
                   </div>
                   <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase text-slate-500">{t.scope}</span>
                </div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{t.name}</h4>
                <p className="text-xs text-slate-400 font-medium mt-3 line-clamp-2 italic">"{t.description || '未填写模板描述信息。'}"</p>
             </div>

             <div className="space-y-6">
                <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                      <GitCommit size={14} className="text-blue-400" /> {t.nodes?.length || 0} Nodes
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                      <Layers size={14} className="text-indigo-400" /> {t.edges?.length || 0} Edges
                   </div>
                </div>
                <div className="flex gap-2">
                   <button className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">编辑设计</button>
                   <button onClick={() => api.workflow.deleteWorkflowTemplate(t.id).then(loadTemplates)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
