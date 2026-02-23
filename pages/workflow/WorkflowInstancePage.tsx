
import React, { useState, useEffect } from 'react';
import { Activity, Play, StopCircle, Trash2, RefreshCw, Search, Loader2, Clock, History, AlertCircle, Terminal, ChevronRight } from 'lucide-react';
import { WorkflowInstance, WorkflowStatus } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const WorkflowInstancePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeInstance, setActiveInstance] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadInstances();
      const interval = setInterval(loadInstances, 10000);
      return () => clearInterval(interval);
    }
  }, [projectId]);

  const loadInstances = async () => {
    try {
      const res = await api.workflow.listInstances({ project_id: projectId });
      setInstances(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.workflow.startInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("启动失败: " + e.message);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.workflow.stopInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("停止失败: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除工作流实例及关联的 K8S 资源？")) return;
    try {
      await api.workflow.deleteInstance(id);
      loadInstances();
    } catch (e: any) {
      alert("删除失败: " + e.message);
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">工作流实例</h2>
          <p className="text-slate-500 mt-1 font-medium italic">实时监控安全评估流水线的执行进度与底层容器负载</p>
        </div>
        <div className="flex gap-4">
          <button onClick={loadInstances} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" placeholder="搜索实例名称或 ID..." 
          className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">实例信息</th>
              <th className="px-6 py-6">关联模板</th>
              <th className="px-6 py-6">启动时间</th>
              <th className="px-6 py-6 text-center">当前状态</th>
              <th className="px-8 py-6 text-right">控制台</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && instances.length === 0 ? (
              <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
            ) : instances.filter(i => i.name.includes(searchTerm)).map(instance => (
              <tr key={instance.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-inner transition-all ${instance.status === 'running' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                      <Activity size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{instance.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">ID: {instance.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Terminal size={14} className="text-blue-500" />
                    <span>{instance.template_id.slice(0, 12)}...</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <Clock size={12} /> {instance.started_at ? instance.started_at.replace('T', ' ').split('.')[0] : 'Not Started'}
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <StatusBadge status={instance.status} />
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {instance.status !== 'running' && (
                      <button onClick={() => handleStart(instance.id)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all">
                        <Play size={16} />
                      </button>
                    )}
                    {instance.status === 'running' && (
                      <button onClick={() => handleStop(instance.id)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all">
                        <StopCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(instance.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {instances.length === 0 && !loading && (
              <tr><td colSpan={5} className="py-40 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">暂无运行中的工作流实例</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
