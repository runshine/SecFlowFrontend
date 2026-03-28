import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Loader2, RefreshCw, Shield, ShieldCheck, Users } from 'lucide-react';
import { authApi } from '../../clients/auth';
import { orgApi } from '../../clients/org';
import { Department, UserInfo } from '../../types/types';
import { getPlatformRoleLabel } from '../../utils/rbac';

interface UserDraft {
  platformRole: 'ordinary_admin' | 'ordinary_user';
  departmentId: string;
}

const isEditableUser = (user: UserInfo) => user.platform_role !== 'super_admin' && Number(user.id) !== 1;

export const UserPermissionPage: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [drafts, setDrafts] = useState<Record<number, UserDraft>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, departmentData] = await Promise.all([
        authApi.listUsers(),
        orgApi.listDepartments(),
      ]);
      const nextUsers = userData || [];
      setUsers(nextUsers);
      setDepartments(departmentData || []);
      setDrafts(
        Object.fromEntries(
          nextUsers.map(user => [
            user.id,
            {
              platformRole: (user.platform_role === 'ordinary_admin' ? 'ordinary_admin' : 'ordinary_user'),
              departmentId: user.department_id ? String(user.department_id) : '',
            },
          ]),
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter(user => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return true;
        return (
          user.username.toLowerCase().includes(keyword) ||
          (user.department_name || '').toLowerCase().includes(keyword) ||
          getPlatformRoleLabel((user.platform_role || 'ordinary_user') as any).toLowerCase().includes(keyword)
        );
      }),
    [searchTerm, users],
  );

  const roleStats = useMemo(() => ({
    superAdmin: users.filter(user => user.platform_role === 'super_admin').length,
    ordinaryAdmin: users.filter(user => user.platform_role === 'ordinary_admin').length,
    ordinaryUser: users.filter(user => (user.platform_role || 'ordinary_user') === 'ordinary_user').length,
  }), [users]);

  const updateDraft = (userId: number, patch: Partial<UserDraft>) => {
    setDrafts(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...patch,
      },
    }));
  };

  const saveUserPermission = async (user: UserInfo) => {
    const draft = drafts[user.id];
    if (!draft || !isEditableUser(user)) return;

    setSavingUserId(user.id);
    try {
      if (draft.platformRole !== (user.platform_role || 'ordinary_user')) {
        await authApi.updateUserPlatformRole(user.id, draft.platformRole);
      }

      const nextDepartmentId = draft.departmentId ? Number(draft.departmentId) : null;
      const currentDepartmentId = user.department_id ? Number(user.department_id) : null;

      if (nextDepartmentId && nextDepartmentId !== currentDepartmentId) {
        if (user.department_member_id) {
          await orgApi.updateDepartmentMember(user.department_member_id, { department_id: nextDepartmentId });
        } else {
          await orgApi.addDepartmentMember({
            user_id: user.id,
            department_id: nextDepartmentId,
            role: 'member',
          });
        }
      }

      await loadData();
    } catch (error: any) {
      alert(error.message || '保存失败');
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
              <ArrowRightLeft size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">用户权限管理</h2>
              <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Platform RBAC & Department Scope Control</p>
            </div>
          </div>
        </div>
        <button onClick={loadData} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">超级管理员</p>
          <h3 className="text-5xl font-black mt-4">{roleStats.superAdmin}</h3>
          <p className="text-blue-400 text-[10px] font-black uppercase mt-4 flex items-center gap-2">
            <ShieldCheck size={12} /> Full Control
          </p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">普通管理员</p>
          <h3 className="text-4xl font-black mt-4 text-amber-600">{roleStats.ordinaryAdmin}</h3>
          <p className="text-sm text-slate-400 mt-3 font-medium">仅可管理本部门及下级部门内用户的所属部门。</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">普通用户</p>
          <h3 className="text-4xl font-black mt-4 text-blue-600">{roleStats.ordinaryUser}</h3>
          <p className="text-sm text-slate-400 mt-3 font-medium">用户管理入口将被完全隐藏，默认新建用户即为该角色。</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">角色与部门边界</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">User Role Assignment</p>
            </div>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索用户、部门或角色..."
            className="w-full max-w-sm px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">用户</th>
                <th className="px-6 py-5">当前角色</th>
                <th className="px-6 py-5">目标角色</th>
                <th className="px-6 py-5">所属部门</th>
                <th className="px-6 py-5">目标部门</th>
                <th className="px-8 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={36} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center text-slate-400 font-bold">暂无匹配用户</td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const draft = drafts[user.id];
                  const editable = isEditableUser(user);
                  const hasChanged = !!draft && (
                    draft.platformRole !== (user.platform_role || 'ordinary_user') ||
                    draft.departmentId !== (user.department_id ? String(user.department_id) : '')
                  );

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{user.username}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {String(user.id).padStart(5, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border ${
                          user.platform_role === 'super_admin'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : user.platform_role === 'ordinary_admin'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          <Shield size={12} />
                          {getPlatformRoleLabel((user.platform_role || 'ordinary_user') as any)}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <select
                          disabled={!editable}
                          value={draft?.platformRole || 'ordinary_user'}
                          onChange={e => updateDraft(user.id, { platformRole: e.target.value as UserDraft['platformRole'] })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all font-medium disabled:opacity-60"
                        >
                          <option value="ordinary_user">普通用户</option>
                          <option value="ordinary_admin">普通管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-6 text-sm font-bold text-slate-600">
                        {user.department_name || '未分配'}
                      </td>
                      <td className="px-6 py-6">
                        <select
                          disabled={!editable}
                          value={draft?.departmentId || ''}
                          onChange={e => updateDraft(user.id, { departmentId: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 ring-indigo-500/5 transition-all font-medium disabled:opacity-60"
                        >
                          <option value="">未分配</option>
                          {departments.map(department => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {editable ? (
                          <button
                            onClick={() => saveUserPermission(user)}
                            disabled={!hasChanged || savingUserId === user.id}
                            className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600"
                          >
                            {savingUserId === user.id ? <Loader2 size={16} className="animate-spin mx-auto" /> : '保存变更'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">保留账户</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
