
import React from 'react';
import { ExternalLink, Terminal } from 'lucide-react';
import { API_BASE } from '../api/base';

export const DeployScriptPage: React.FC = () => {
  const iframeUrl = `${API_BASE}/api/deploy-script/`;

  return (
    <div className="p-10 h-full flex flex-col space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">部署脚本管理</h2>
          <p className="text-slate-500 mt-1 font-medium">中心化自动化分发脚本库与配置中心</p>
        </div>
        <div className="flex gap-3">
           <a 
             href={iframeUrl} 
             target="_blank" 
             rel="noopener noreferrer"
             className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
           >
             <ExternalLink size={18} /> 新窗口打开
           </a>
        </div>
      </div>

      <div className="flex-1 min-h-[600px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center gap-3">
          <Terminal size={16} className="text-blue-600" />
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Nginx File Index: {iframeUrl}</span>
        </div>
        <iframe 
          src={iframeUrl} 
          className="w-full flex-1 border-none"
          title="Deployment Scripts Index"
        />
      </div>
    </div>
  );
};
