
import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, RefreshCw, Loader2, Trash2, Edit3, UserCheck, Shield, Crown, UserCircle, Lock, ArrowRightLeft, Building2 } from 'lucide-react';
import { orgApi, UserPermissionInfo } from '../../clients/org';
import { authApi } from '../../clients/auth';
import { Department, DepartmentMember, UserInfo } from '../../types/types';

export const DepartmentMemberPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DepartmentMember | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ user_id: '', department_id: '', role: 'member' });
  const [moveDepartmentId, setMoveDepartmentId] = useState('');
  const [userPermissions, setUserPermissions] = useState<UserPermissionInfo | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    if (userPermissions?.can_manage_users) {
      fetchUsers();
    }
  }, [userPermissions]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchMembers(selectedDepartmentId);
    }
  }, [selectedDepartmentId]);

  const fetchUserPermissions = async () => {
    try {
      const data = await orgApi.getUserPermissions();
      setUserPermissions(data);
    } catch (e) {
      console.error('获取用户权限失败:', e);
    }
  };

  const isAdmin = () => userPermissions?.is_admin || false;

  const canManageDepartment = (deptId: number): boolean => {
    if (!userPermissions) return false;
    return userPermissions.is_admin || (userPermissions.manageable_department_ids?.includes(deptId) || false);
  };

  const canManageCurrentDepartment = (): boolean => {
    if (!selectedDepartmentId) return false;
    return canManageDepartment(selectedDepartmentId);
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'leader': '组长',
      'vice_leader': '副组长',
      'member': '成员'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeStyle = (role: string): string => {
    const styles: Record<string, string> = {
      'leader': 'bg-amber-50 text-amber-600 border-amber-100',
      'vice_leader': 'bg-purple-50 text-purple-600 border-purple-100',
      'member': 'bg-blue-50 text-blue-600 border-blue-100'
    };
    return styles[role] || 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const canEditRole = (): boolean => {
    return !!userPermissions?.can_manage_users;
  };

  const getAvailableRoles = (): { value: string; label: string }[] => {
    const allRoles = [
      { value: 'member', label: '成员' },
      { value: 'vice_leader', label: '副组长' },
      { value: 'leader', label: '组长' }
    ];
    
    if (userPermissions?.can_manage_users) return allRoles;
    return [{ value: 'member', label: '成员' }];
  };

  const canRemoveMember = (member: DepartmentMember): boolean => {
    return !!userPermissions?.can_manage_users && canManageCurrentDepartment();
  };

  const canMoveMember = (member: DepartmentMember): boolean => {
    if (!userPermissions?.can_manage_department_members) return false;
    if (!canManageDepartment(member.department_id)) return false;
    if (userPermissions.is_admin) return true;
    return member.role === 'member';
  };

  const fetchDepartments = async () => {
    try {
      const data = await orgApi.listDepartments();
      setDepartments(data || []);
      if (data && data.length > 0 && !selectedDepartmentId) {
        setSelectedDepartmentId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authApi.listUsers();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async (departmentId: number) => {
    setLoading(true);
    try {
      const data = await orgApi.getDepartmentMembers(departmentId);
      setMembers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await orgApi.addDepartmentMember({
        user_id: parseInt(formData.user_id),
        department_id: parseInt(formData.department_id),
        role: formData.role
      });
      setIsAddModalOpen(false);
      setFormData({ user_id: '', department_id: '', role: 'member' });
      if (selectedDepartmentId) {
        fetchMembers(selectedDepartmentId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setFormLoading(true);
    try {
      await orgApi.updateDepartmentMember(selectedMember.id, { role: formData.role });
      setIsEditModalOpen(false);
      setSelectedMember(null);
      setFormData({ user_id: '', department_id: '', role: 'member' });
      if (selectedDepartmentId) {
        fetchMembers(selectedDepartmentId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (confirm('确认移除该成员？')) {
      try {
        await orgApi.removeDepartmentMember(memberId);
        if (selectedDepartmentId) {
          fetchMembers(selectedDepartmentId);
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleMoveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !moveDepartmentId) return;
    setFormLoading(true);
    try {
      await orgApi.updateDepartmentMember(selectedMember.id, { department_id: parseInt(moveDepartmentId, 10) });
      setIsMoveModalOpen(false);
      setSelectedMember(null);
      setMoveDepartmentId('');
      if (selectedDepartmentId) {
        fetchMembers(selectedDepartmentId);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (member: DepartmentMember) => {
    setSelectedMember(member);
    setFormData({
      user_id: member.user_id.toString(),
      department_id: member.department_id.toString(),
      role: member.role
    });
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({
      user_id: '',
      department_id: selectedDepartmentId ? selectedDepartmentId.toString() : '',
      role: 'member'
    });
    setIsAddModalOpen(true);
  };

  const openMoveModal = (member: DepartmentMember) => {
    setSelectedMember(member);
    setMoveDepartmentId(member.department_id.toString());
    setIsMoveModalOpen(true);
  };

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId);

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">部门成员管理</h2>
              <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Department Member Management</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => selectedDepartmentId && fetchMembers(selectedDepartmentId)} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          {userPermissions?.can_manage_users && canManageCurrentDepartment() && (
            <button onClick={openAddModal} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
              <Plus size={20} /> 添加成员
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl">
          <Users className="absolute right-[-20px] top-[-20px] w-32 h-32 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">当前部门成员</p>
          <h3 className="text-5xl font-black mt-4 relative z-10">{members.length}</h3>
          <p className="text-blue-400 text-[10px] font-black uppercase mt-4 relative z-10 flex items-center gap-2">
            <UserCheck size={12} /> Team Members
          </p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">组长数量</p>
          <h3 className="text-4xl font-black mt-4 text-amber-600">{members.filter(m => m.role === 'leader').length}</h3>
          <div className="h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(members.filter(m => m.role === 'leader').length / members.length) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm col-span-2 flex items-center gap-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
            <Shield size={32} />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-800">角色权限管理</h4>
            <p className="text-sm text-slate-400 mt-1 font-medium">组长可管理部门成员、查看部门相关项目、管理部门设置。成员可查看部门信息、参与部门相关项目。</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input
              type="text" placeholder="搜索成员名称..."
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm min-w-[200px]"
            value={selectedDepartmentId || ''}
            onChange={e => setSelectedDepartmentId(parseInt(e.target.value))}
          >
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">成员信息</th>
                <th className="px-6 py-6">所属部门</th>
                <th className="px-6 py-6 text-center">角色</th>
                <th className="px-6 py-6">加入时间</th>
                <th className="px-8 py-6 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-slate-400 font-bold">暂无成员数据</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-inner">
                        {member.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{member.username}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {member.user_id.toString().padStart(5, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-bold text-slate-600">{member.department_name}</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${getRoleBadgeStyle(member.role)}`}>
                      {getRoleDisplayName(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500">
                    {member.created_at?.split('T')[0] || '2024-01-01'}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {canManageCurrentDepartment() ? (
                        <>
                          {canMoveMember(member) && (
                            <button
                              onClick={() => openMoveModal(member)}
                              className="p-3 bg-indigo-50 text-indigo-500 border border-transparent hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                              title="调整所属部门"
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                          )}
                          {canEditRole() && (
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"
                              title="编辑角色"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          {canRemoveMember(member) && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-3 bg-red-50 text-red-400 border border-transparent hover:border-red-100 rounded-xl transition-all shadow-sm"
                              title="移除成员"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {!canMoveMember(member) && !canEditRole() && !canRemoveMember(member) && (
                            <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-lg">
                              <Lock size={10} className="inline mr-1" />无权操作
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-lg">
                          <Lock size={10} className="inline mr-1" />只读
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && userPermissions?.can_manage_users && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">添加部门成员</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Add Department Member</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">选择部门 *</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                  value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">请选择部门</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">选择用户 *</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                  value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                >
                  <option value="">请选择用户</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">角色 *</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                  value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  {getAvailableRoles().map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <button disabled={formLoading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <UserCircle size={20} />}
                确认添加成员
              </button>
            </form>
          </div>
        </div>
      )}

      {isMoveModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">调整所属部门: {selectedMember.username}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Move Department</p>
                </div>
              </div>
              <button onClick={() => setIsMoveModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleMoveMember} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">目标部门 *</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-indigo-500/10 font-bold text-slate-800"
                  value={moveDepartmentId}
                  onChange={e => setMoveDepartmentId(e.target.value)}
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <button disabled={formLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRightLeft size={20} />}
                确认调整部门
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && selectedMember && userPermissions?.can_manage_users && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">编辑成员角色: {selectedMember.username}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Edit Member Role</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleEditMember} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">角色 *</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-amber-500/10 font-bold text-slate-800"
                  value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  {getAvailableRoles().map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <button disabled={formLoading} className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-500/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-3">
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                立即更新角色
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
