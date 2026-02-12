
import React, { useState, useEffect } from 'react';
import { Cpu, Plus, Search, RefreshCw, Loader2, Trash2, Key, ShieldCheck, Clock, Check, Copy, AlertCircle, X, Server, Power, PowerOff, Zap } from 'lucide-react';
import { authApi } from '../../api/auth';
import { MachineToken } from '../../types/types';

export const MachineTokenPage: React.FC = () => {
  const [tokens, setTokens] = useState<MachineToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ machine_code: '', description: '', expires_at: '' });
  const [lastCreatedToken, setLastCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const data = await authApi.listMachineTokens();
      setTokens(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await authApi.createMachineToken({
        ...formData,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      });
      setLastCreatedToken(res.token || 'Token created successfully');
      setFormData({ machine_code: '', description: '', expires_at: '' });
      fetchTokens();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (token: MachineToken) => {
    try {
      if (token.is_active) {
        await authApi.disableMachineToken(token.id);
      } else {
        await authApi.enableMachineToken(token.id);
      }
      fetchTokens();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegenerate = async (token: MachineToken) => {
    if (!confirm(`确认重新生成机器 "${token.machine_code}" 的 Token？旧凭据将立即失效。`)) return;
    try {
      const res = await authApi.regenerateMachineToken(token.id);
      setLastCreatedToken(res.token);
      setIsCreateModalOpen(true); // 借用创建模态框显示新生成的 Token
      fetchTokens();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTokens = tokens.filter(t => 
    t.machine_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10">
               <Cpu size={28} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">机机 Token 管理</h2>
               <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Machine-to-Machine Credentials Vault</p>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchTokens} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setLastCreatedToken(null); setIsCreateModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={20} /> 申请新 Token
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 p-8 rounded-[3rem] text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl">
           <Key className="absolute right-[-10px] top-[-10px] w-32 h-32 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
           <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest relative z-10">已签发凭证</p>
           <h3 className="text-5xl font-black mt-4 relative z-10">{tokens.length}</h3>
           <p className="text-blue-200 text-[10px] font-black uppercase mt-4 relative z-10 flex items-center gap-2">
             <ShieldCheck size={12} /> Service Verified
           </p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm col-span-2 flex items-center gap-8">
           <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-3xl flex items-center justify-center shrink-0">
             <Server size={32} />
           </div>
           <div>
             <h4 className="text-lg font-black text-slate-800 tracking-tight">安全调用说明</h4>
             <p className="text-sm text-slate-400 mt-1 font-medium leading-relaxed">
               机机 Token 专用于服务间调用。建议为每个独立节点申请唯一的 <code className="bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-600">machine_code</code>，并根据合规要求设置合理的有效期。
             </p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" placeholder="搜索机器码或描述..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">机器码 / 标识</th>
                <th className="px-6 py-6">描述</th>
                <th className="px-6 py-6">过期时间</th>
                <th className="px-6 py-6 text-center">状态控制</th>
                <th className="px-8 py-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && tokens.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" size={40} /></td></tr>
              ) : filteredTokens.map(token => (
                <tr key={token.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono text-xs shadow-lg">
                        <Key size={16} />
                      </div>
                      <span className="text-sm font-black text-slate-800">{token.machine_code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500 italic max-w-[200px] truncate">
                    {token.description || 'No description provided'}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                       <Clock size={12} className="text-slate-300" />
                       <span className={`text-[10px] font-black uppercase ${!token.expires_at ? 'text-green-500' : 'text-slate-500'}`}>
                         {token.expires_at ? token.expires_at.split('T')[0] : 'PERMANENT'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button 
                      onClick={() => handleToggleStatus(token)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all flex items-center gap-2 mx-auto ${token.is_active ? 'bg-green-50 text-green-600 border-green-100 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100'}`}
                    >
                      {token.is_active ? <><Power size={12} /> Enabled</> : <><PowerOff size={12} /> Disabled</>}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                         onClick={() => handleRegenerate(token)}
                         className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                         title="重新生成凭证值"
                       >
                          <Zap size={16} />
                       </button>
                       <button 
                         onClick={() => { if(confirm('确认撤销此机器凭证？该操作不可逆。')) authApi.deleteMachineToken(token.id).then(fetchTokens); }}
                         className="p-3 bg-red-50 text-red-400 border border-transparent hover:border-red-100 rounded-xl transition-all shadow-sm"
                         title="彻底删除"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal (Reuse for Regenerated Token Display) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
              <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    {lastCreatedToken ? <ShieldCheck size={24} /> : <Plus size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{lastCreatedToken ? '新凭据已生成' : '申请机器 Token'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Automated Identity Provisioning</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600"><X size={28} /></button>
              </div>

              {lastCreatedToken ? (
                <div className="p-10 space-y-8 animate-in slide-in-from-bottom-2">
                   <div className="p-6 bg-green-50 border border-green-100 rounded-[2rem] flex items-start gap-4">
                      <ShieldCheck className="text-green-600 shrink-0 mt-1" size={20} />
                      <div>
                        <h4 className="text-sm font-black text-green-800">凭证托管就绪</h4>
                        <p className="text-xs text-green-600/80 mt-1">请立即保存下方原始 Token 值，此窗口关闭后将无法再次通过界面获取。</p>
                      </div>
                   </div>
                   <div className="relative group">
                      <div className="bg-slate-900 p-8 rounded-[2rem] font-mono text-xs text-blue-300 break-all leading-relaxed shadow-inner">
                         {lastCreatedToken}
                      </div>
                      <button 
                        onClick={() => handleCopy(lastCreatedToken)}
                        className={`absolute top-4 right-4 p-3 rounded-xl transition-all ${copied ? 'bg-green-50 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                      >
                         {copied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                   </div>
                   <button 
                     onClick={() => { setLastCreatedToken(null); setIsCreateModalOpen(false); }}
                     className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all"
                   >
                     我已安全保存凭据
                   </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="p-10 space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">机器唯一标识码 *</label>
                      <input 
                        required placeholder="e.g. scanner-node-beijing-01"
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-slate-500/10 font-bold text-slate-800"
                        value={formData.machine_code} onChange={e => setFormData({...formData, machine_code: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">用途描述</label>
                      <input 
                        placeholder="例如：分布式漏洞扫描引擎专用接入凭证"
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-slate-500/10 font-bold text-slate-800"
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">有效截止日期 (可选)</label>
                      <input 
                        type="date"
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-slate-500/10 font-bold text-slate-800"
                        value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})}
                      />
                   </div>
                   <button disabled={formLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                      {formLoading ? <Loader2 className="animate-spin" size={20} /> : <Key size={20} />}
                      提交签发申请
                   </button>
                </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
