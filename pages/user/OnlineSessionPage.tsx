
import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Loader2, UserX, Monitor, Shield, Activity, Clock, Search, ExternalLink, MapPin, Hash, ShieldCheck, Zap } from 'lucide-react';
import { authApi } from '../../api/auth';
import { UserSession } from '../../types/types';

export const OnlineSessionPage: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000); // 15秒自动同步
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await authApi.listOnlineSessions();
      setSessions(data || []);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (userId: number, username: string) => {
    if (!confirm(`确认强制下线用户 "${username}"？此操作将立即吊销该用户所有活跃 JWT Token。`)) return;
    setIsActionLoading(true);
    try {
      await authApi.revokeUserSessions(userId);
      fetchSessions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.ip_address.includes(searchTerm)
  );

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-green-600 text-white rounded-[1.25rem] shadow-xl shadow-green-500/20">
               <Globe size={28} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">在线会话监控</h2>
               <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Real-time Session Audit & Intelligence</p>
               </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Update</p>
             <p className="text-[10px] font-mono font-bold text-slate-600">{lastRefreshed.toLocaleTimeString()}</p>
          </div>
          <button onClick={fetchSessions} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl min-h-[180px]">
           <Activity className="absolute right-[-10px] top-[-10px] w-32 h-32 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">活跃人机会话</p>
           <h3 className="text-6xl font-black mt-4 relative z-10">{sessions.length}</h3>
           <div className="mt-4 flex items-center gap-2 text-green-400 text-[10px] font-black uppercase tracking-widest relative z-10">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Monitoring Active
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm col-span-3 flex items-center gap-10">
           <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner">
             <Monitor size={40} />
           </div>
           <div className="space-y-4">
             <div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">安全治理策略已生效</h4>
                <p className="text-sm text-slate-400 mt-1 font-medium leading-relaxed max-w-2xl">
                   系统自动捕获所有成功登录的 JWT 句柄。您可以根据地理位置 (IP)、终端设备标识及活跃度进行安全风险研判，必要时可执行秒级「强制下线」。
                </p>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                   <ShieldCheck size={14} className="text-green-500" /> Identity Verified
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                   <Zap size={14} className="text-amber-500" /> Adaptive Kick Enabled
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" placeholder="快速检索在线用户名、IP 地址或终端标识..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">在线身份与角色</th>
                <th className="px-6 py-6">网络配置 (IP)</th>
                <th className="px-6 py-6">设备指纹 (User-Agent)</th>
                <th className="px-6 py-6">建立时间</th>
                <th className="px-8 py-6 text-right">强制阻断</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && sessions.length === 0 ? (
                <tr><td colSpan={5} className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></td></tr>
              ) : filteredSessions.length > 0 ? filteredSessions.map((session, idx) => (
                <tr key={`${session.user_id}-${idx}`} className="hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-500">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white border-2 border-slate-100 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        {session.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{session.username}</p>
                        <div className="flex gap-1.5 mt-1">
                          {session.role?.map(r => (
                             <span key={r} className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{r}</span>
                          ))}
                          {(!session.role || session.role.length === 0) && <span className="text-[8px] font-black uppercase text-slate-300 border border-slate-100 px-1.5 rounded">Guest</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-mono font-black text-blue-600 bg-blue-50/50 w-fit px-2 py-1 rounded-lg">
                        <MapPin size={12} className="text-blue-300" /> {session.ip_address}
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter ml-1">Verified Location</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="max-w-[240px]">
                      <p className="text-[10px] font-medium text-slate-400 line-clamp-1 italic group-hover:text-slate-600 transition-colors">"{session.user_agent}"</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                          <Clock size={12} className="text-slate-300" /> {session.login_at?.split('T')[1]?.split('.')[0] || '12:00:00'}
                       </div>
                       <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{session.login_at?.split('T')[0] || '2024-01-01'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleKick(session.user_id, session.username)}
                      disabled={isActionLoading}
                      className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2 ml-auto group/kick"
                    >
                       <UserX size={14} className="group-hover/kick:rotate-12 transition-transform" /> 吊销会话
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <ShieldCheck size={40} />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">目前暂无匹配的在线会话</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
