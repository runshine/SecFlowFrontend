
import React from 'react';
import { FileText, Plus, Loader2, Search } from 'lucide-react';
import { FileItem } from '../../types/types';

export const DocAnalysisPage: React.FC<{ resources: FileItem[]; isLoading: boolean }> = ({ resources, isLoading }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">需求文档分析</h2>
        <p className="text-slate-500 mt-1 font-medium">利用 AI 引擎自动提取业务逻辑与潜在攻击面</p>
      </div>
      <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95">
        <Plus size={20} /> 上传文档
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isLoading ? (
        <div className="col-span-2 py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
      ) : resources.map(res => (
        <div key={res.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-5 hover:shadow-lg transition-all group">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-800 truncate">{res.name}</h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">{res.updatedAt} · {res.size}</p>
            <div className="mt-4 flex gap-2">
              <button className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all">提取攻击面</button>
              <button className="text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">查看详情</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
