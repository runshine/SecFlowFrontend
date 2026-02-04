
import React from 'react';
import { FileBox, Plus, Download, Trash2, Loader2, Clock, HardDrive } from 'lucide-react';
import { FileItem } from '../types/types';

interface TestInputPageProps {
  resources: FileItem[];
  isLoading: boolean;
  currentView: string;
}

export const TestInputPage: React.FC<TestInputPageProps> = ({ resources, isLoading, currentView }) => {
  const titles: Record<string, string> = { 'test-input-release': '发布包管理', 'test-input-code': '源代码审计', 'test-input-doc': '需求文档分析' };
  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">{titles[currentView] || '测试输入'}</h2><p className="text-slate-500 mt-1 font-medium">自动识别并注入安全测试上下文</p></div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2"><Plus size={20} /> 上传文件</button>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-8 py-6">文件名</th><th className="px-8 py-6">大小</th><th className="px-8 py-6">上传时间</th><th className="px-8 py-6 text-right">操作</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr> : resources.map(res => (
              <tr key={res.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-6"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center"><FileBox size={18} /></div><span className="text-sm font-bold text-slate-700">{res.name}</span></div></td>
                <td className="px-8 py-6 text-xs font-bold text-slate-500">{res.size || '0 MB'}</td>
                <td className="px-8 py-6 text-xs font-bold text-slate-500">{res.updatedAt}</td>
                <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition-all"><div className="flex justify-end gap-2"><button className="p-3 text-slate-400 hover:text-blue-600"><Download size={18} /></button><button className="p-3 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
