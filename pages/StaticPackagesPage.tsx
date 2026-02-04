
import React from 'react';
import { Package, CheckCircle2, Upload, HardDrive, Layers, Download, Trash2, CheckSquare, Square, Server } from 'lucide-react';
import { StaticPackage, PackageStats } from '../types/types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../api/api';

interface StaticPackagesPageProps {
  staticPackages: StaticPackage[];
  packageStats: PackageStats | null;
  fetchStaticPackages: () => void;
  setActivePackageId: (id: string) => void;
  setCurrentView: (view: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
}

export const StaticPackagesPage: React.FC<StaticPackagesPageProps> = ({ staticPackages, packageStats, fetchStaticPackages, setActivePackageId, setCurrentView, selectedIds, setSelectedIds }) => {
  const isAllSelected = staticPackages.length > 0 && selectedIds.size === staticPackages.length;
  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">静态软件包管理</h2><p className="text-slate-500 mt-1 font-medium">统一受信任的二进制分发与一致性校验</p></div>
        <div className="flex gap-3">
           <button onClick={() => api.staticPackages.checkAll().then(fetchStaticPackages)} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2"><CheckCircle2 size={18} /> 校验全部</button>
           <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/20"><Upload size={18} /> 上传新包</button>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-5 w-10"><button onClick={() => setSelectedIds(isAllSelected ? new Set() : new Set(staticPackages.map(p => p.id)))} className="p-2 hover:bg-slate-200 rounded-lg">{isAllSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}</button></th><th className="px-4 py-5">软件包</th><th className="px-6 py-5">架构</th><th className="px-6 py-5 text-center">统计</th><th className="px-6 py-5">状态</th><th className="px-6 py-5 text-right">操作</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {staticPackages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-blue-50/30 transition-all group cursor-pointer" onClick={() => { setActivePackageId(pkg.id); setCurrentView('static-package-detail'); }}>
                     <td className="px-6 py-6" onClick={e => e.stopPropagation()}><button onClick={() => { const n = new Set(selectedIds); if (n.has(pkg.id)) n.delete(pkg.id); else n.add(pkg.id); setSelectedIds(n); }}>{selectedIds.has(pkg.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}</button></td>
                     <td className="px-4 py-6"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">{pkg.name[0].toUpperCase()}</div><div><p className="text-sm font-black text-slate-800">{pkg.name}</p><p className="text-[10px] text-slate-400">{pkg.version}</p></div></div></td>
                     <td className="px-6 py-6"><div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase"><Server size={14} />{pkg.architecture}</div></td>
                     <td className="px-6 py-6 text-center"><div className="flex flex-col"><span className="text-xs font-black text-slate-700">{(pkg.total_size / 1024 / 1024).toFixed(1)}MB</span><span className="text-[10px] text-slate-400">{pkg.file_count} 文件</span></div></td>
                     <td className="px-6 py-6"><StatusBadge status={pkg.check_status} /></td>
                     <td className="px-6 py-6 text-right" onClick={e => e.stopPropagation()}><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all"><a href={api.staticPackages.getDownloadUrl(pkg.id)} className="p-2.5 text-slate-400 hover:text-indigo-600"><Download size={18} /></a><button onClick={() => api.staticPackages.delete(pkg.id).then(fetchStaticPackages)} className="p-2.5 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button></div></td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};
