
import React from 'react';
import { FileBox, Plus, Download, Trash2, Loader2 } from 'lucide-react';
import { FileItem } from '../../types/types';

export const ReleasePackagePage: React.FC<{ resources: FileItem[]; isLoading: boolean }> = ({ resources, isLoading }) => (
  <div className="p-10 space-y-8 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">发布包管理</h2><p className="text-slate-500 mt-1 font-medium">管理待测软件发布包资产</p></div>
      <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95"><Plus size={20} /> 上传发布包</button>
    </div>
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-6">文件名</th><th className="px-8 py-6">大小</th><th className="px-8 py-6 text-right">操作</th></tr></thead>
        <tbody className="divide-y divide-slate-50">
          {isLoading ? <tr><td colSpan={3} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr> : resources.map(res => (
            <tr key={res.id} className="hover:bg-slate-50 group transition-all">
              <td className="px-8 py-6"><div className="flex items-center gap-4 text-sm font-bold"><FileBox size={18} className="text-slate-400" />{res.name}</div></td>
              <td className="px-8 py-6 text-xs text-slate-500 font-bold">{res.size || '0 MB'}</td>
              <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition-all"><div className="flex justify-end gap-2"><button className="p-3 text-slate-400 hover:text-blue-600"><Download size={18} /></button><button className="p-3 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
