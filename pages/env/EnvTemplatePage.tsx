
import React from 'react';
import { Box, Plus, Loader2 } from 'lucide-react';
import { EnvTemplate } from '../../types/types';
import { StatusBadge } from '../../components/StatusBadge';

export const EnvTemplatePage: React.FC<{ templates: EnvTemplate[]; isLoading: boolean }> = ({ templates, isLoading }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">环境模板管理</h2>
        <p className="text-slate-500 mt-1 font-medium">标准化的安全测试沙箱编排模板</p>
      </div>
      <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/20">
        <Plus size={20} /> 创建模板
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {isLoading ? (
        <div className="col-span-3 py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
      ) : templates.map(t => (
        <div key={t.name} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Box size={24} />
          </div>
          <h4 className="text-xl font-black text-slate-800">{t.name}</h4>
          <p className="text-slate-400 text-sm mt-2 line-clamp-2 font-medium leading-relaxed">{t.description}</p>
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <StatusBadge status={t.type} />
            <span className="text-[10px] font-black text-slate-300 uppercase">{t.updated_at?.split('T')[0]}</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all" />
        </div>
      ))}
    </div>
  </div>
);
