
import React from 'react';
import { FileBox, Plus, Loader2 } from 'lucide-react';
import { FileItem } from '../../types/types';

export const CodeAuditPage: React.FC<{ resources: FileItem[]; isLoading: boolean }> = ({ resources, isLoading }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">源代码审计</h2><p className="text-slate-500 mt-1 font-medium">源码一致性检查与静态分析入口</p></div>
      <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95"><Plus size={20} /> 上传源码归档</button>
    </div>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-6">归档名称</th><th className="px-8 py-6">扫描进度</th><th className="px-8 py-6 text-right">操作</th></tr></thead>
        <tbody className="divide-y divide-slate-50">
          {isLoading ? <tr><td colSpan={3} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr> : resources.map(res => (
            <tr key={res.id} className="hover:bg-slate-50 group transition-all">
              <td className="px-8 py-6 font-bold text-sm flex items-center gap-4"><FileBox size={18} className="text-slate-400" />{res.name}</td>
              <td className="px-8 py-6"><span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-full uppercase">Ready</span></td>
              <td className="px-8 py-6 text-right"><button className="text-xs font-black text-blue-600 hover:underline">启动审计</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
