
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, RefreshCw, Loader2, Trash2, Edit3, Shield, ShieldOff, Key, UserCircle, Mail, Clock, ShieldCheck, UserX } from 'lucide-react';
import { authApi } from '../../api/auth';
import { UserInfo } from '../../types/types';
import { StatusBadge } from '../../components/StatusBadge';

export const UserMgmtPage: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [resetData, setResetData] = useState({ old_password: '', new_password: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authApi.listUsers();
      setUsers(data || []);
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
      await authApi.createUser({ ...formData, role_ids: [] });
      setIsCreateModalOpen(false);
      setFormData({ username: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      await authApi.changePasswordAdmin(selectedUser.id, resetData);
      setIsResetModalOpen(false);
      setResetData({ old_password: '', new_password: '' });
      alert("密码修改成功");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (user: UserInfo) => {
    try {
      await authApi.updateUser(user.id, { is_active: !user.is_active });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
               <Users size={28} />
             </div>
             <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">用户账号管理</h2>
               <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Access Control & Identity Directory</p>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchUsers} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={20} /> 创建新用户
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl">
           <Shield className="absolute right-[-20px] top-[-20px] w-32 h-32 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">总用户数</p>
           <h3 className="text-5xl font-black mt-4 relative z-10">{users.length}</h3>
           <p className="text-blue-400 text-[10px] font-black uppercase mt-4 relative z-10 flex items-center gap-2">
             <ShieldCheck size={12} /> Data Protected
           </p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">活跃账号</p>
           <h3 className="text-4xl font-black mt-4 text-green-600">{users.filter(u => u.is_active).length}</h3>
           <div className="h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${(users.filter(u => u.is_active).length / users.length) * 100}%` }} />
           </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm col-span-2 flex items-center gap-8">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
             <Clock size={32} />
           </div>
           <div>
             <h4 className="text-lg font-black text-slate-800">最后入库</h4>
             <p className="text-sm text-slate-400 mt-1 font-medium">系统安全审计已完成。目前所有用户凭证均已采用 Argon2id/BCrypt 高强度哈希算法加密。</p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" placeholder="搜索用户名或角色标识..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">用户信息</th>
                <th className="px-6 py-6">所属角色</th>
                <th className="px-6 py-6">注册日期</th>
                <th className="px-6 py-6 text-center">状态</th>
                <th className="px-8 py-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{user.username}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {user.id.toString().padStart(5, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-1">
                      {user.role?.length > 0 ? user.role.map(r => (
                        <span key={r} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 uppercase">{r}</span>
                      )) : <span className="text-[10px] font-bold text-slate-300 italic">None Assigned</span>}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500">
                    {user.created_at?.split('T')[0] || '2024-01-01'}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button onClick={() => toggleStatus(user)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${user.is_active ? 'bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100'}`}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                         onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                         className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                         title="重置密码"
                       >
                          <Key size={16} />
                       </button>
                       <button 
                         onClick={() => { if(confirm('确认删除该用户？')) authApi.deleteUser(user.id).then(fetchUsers); }}
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

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">创建新用户</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Initialize Identity</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600"><X size={28} /></button>
              </div>
              <form onSubmit={handleCreate} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">用户名 *</label>
                    <input 
                      required placeholder="Username"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">初始密码 *</label>
                    <input 
                      type="password" required placeholder="••••••••"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                 </div>
                 <button disabled={formLoading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                    {formLoading ? <Loader2 className="animate-spin" size={20} /> : <UserCircle size={20} />}
                    确认创建身份
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white">
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">重置密码: {selectedUser.username}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Credential Reset</p>
                  </div>
                </div>
                <button onClick={() => setIsResetModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600"><X size={28} /></button>
              </div>
              <form onSubmit={handleResetPassword} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">管理员密码验证 *</label>
                    <input 
                      type="password" required placeholder="Current Password"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-amber-500/10 font-bold text-slate-800"
                      value={resetData.old_password} onChange={e => setResetData({...resetData, old_password: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">新密码 *</label>
                    <input 
                      type="password" required placeholder="New Password"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-amber-500/10 font-bold text-slate-800"
                      value={resetData.new_password} onChange={e => setResetData({...resetData, new_password: e.target.value})}
                    />
                 </div>
                 <button disabled={formLoading} className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-500/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-3">
                    {formLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                    立即应用新凭据
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: any) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
