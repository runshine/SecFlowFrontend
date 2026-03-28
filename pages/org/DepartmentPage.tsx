
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, RefreshCw, Loader2, Trash2, Edit3, Users, ChevronRight, ChevronDown, Lock } from 'lucide-react';
import { orgApi, UserPermissionInfo } from '../../clients/org';
import { Department } from '../../types/types';
import { StatusBadge } from '../../components/StatusBadge';

export const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' });
  const [userPermissions, setUserPermissions] = useState<UserPermissionInfo | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('expandedDepartments');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    fetchDepartments();
    fetchUserPermissions();
  }, []);

  useEffect(() => {
    localStorage.setItem('expandedDepartments', JSON.stringify([...expandedDepts]));
  }, [expandedDepts]);

  const fetchUserPermissions = async () => {
    try {
      const data = await orgApi.getUserPermissions();
      console.log('用户权限信息:', data);
      setUserPermissions(data);
    } catch (e) {
      console.error('获取用户权限失败:', e);
    }
  };

  const toggleExpand = (deptId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const isAdmin = () => userPermissions?.is_admin || false;
  
  const canManageDepartment = (deptId: number): boolean => {
    if (!userPermissions) {
      console.log('权限信息未加载');
      return false;
    }
    const manageableIds = userPermissions.department_structure_manageable_ids || [];
    const result = userPermissions.is_admin || manageableIds.includes(deptId);
    console.log(`检查部门${deptId}结构管理权限:`, result, 'department_structure_manageable_ids:', manageableIds);
    return result;
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await orgApi.listDepartments();
      setDepartments(data || []);
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
      const payload: any = { name: formData.name, description: formData.description };
      if (formData.parent_id) {
        payload.parent_id = parseInt(formData.parent_id);
      }
      await orgApi.createDepartment(payload);
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', parent_id: '' });
      fetchDepartments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    setFormLoading(true);
    try {
      const payload: any = { name: formData.name, description: formData.description };
      if (formData.parent_id) {
        payload.parent_id = parseInt(formData.parent_id);
      }
      await orgApi.updateDepartment(selectedDepartment.id, payload);
      setIsEditModalOpen(false);
      setSelectedDepartment(null);
      setFormData({ name: '', description: '', parent_id: '' });
      fetchDepartments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (departmentId: number) => {
    if (confirm('确认删除该部门？删除部门将同时删除部门下的所有成员和项目关联。')) {
      try {
        await orgApi.deleteDepartment(departmentId);
        fetchDepartments();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      parent_id: department.parent_id ? department.parent_id.toString() : ''
    });
    setIsEditModalOpen(true);
  };

  const buildDepartmentTree = (
    departments: Department[], 
    parentId: number | null = null, 
    visited: Set<number> = new Set()
  ): any[] => {
    const deptIds = new Set(departments.map(d => d.id));
    
    return departments
      .filter(dept => {
        if (parentId === null) {
          return dept.parent_id === null || !deptIds.has(dept.parent_id);
        }
        return dept.parent_id === parentId;
      })
      .map(dept => {
        if (visited.has(dept.id)) {
          console.warn(`检测到循环引用: 部门ID ${dept.id} 已在访问路径中`);
          return {
            ...dept,
            children: [],
            hasCircularReference: true
          };
        }
        const newVisited = new Set(visited);
        newVisited.add(dept.id);
        return {
          ...dept,
          children: buildDepartmentTree(departments, dept.id, newVisited)
        };
      });
  };

  const getAllDescendantIds = (departmentId: number): number[] => {
    const descendants: number[] = [];
    const findDescendants = (parentId: number) => {
      departments.forEach(dept => {
        if (dept.parent_id === parentId) {
          descendants.push(dept.id);
          findDescendants(dept.id);
        }
      });
    };
    findDescendants(departmentId);
    return descendants;
  };

  const getAvailableParentDepartments = (excludeId?: number): Department[] => {
    if (!excludeId) return departments;
    const excludeIds = [excludeId, ...getAllDescendantIds(excludeId)];
    return departments.filter(dept => !excludeIds.includes(dept.id));
  };

  const renderDepartmentTree = (departments: any[], depth = 0) => {
    return departments.map(dept => {
      const hasChildren = dept.children && dept.children.length > 0;
      const isExpanded = expandedDepts.has(dept.id);
      
      return (
        <div key={dept.id}>
          <div 
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-all group"
            style={{ paddingLeft: `${depth * 24 + 24}px` }}
          >
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={(e) => hasChildren && toggleExpand(dept.id, e)}
                className={`flex items-center justify-center w-5 h-5 transition-transform duration-200 ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!hasChildren}
              >
                {hasChildren ? (
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} 
                  />
                ) : (
                  <div className="w-4" />
                )}
              </button>
              <div className={`w-10 h-10 ${dept.hasCircularReference ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} rounded-xl flex items-center justify-center font-black shadow-inner`}>
                <Building2 size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-slate-800">{dept.name}</p>
                  {dept.hasCircularReference && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black rounded-full border border-amber-200">
                      循环引用
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{dept.description || '无描述'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManageDepartment(dept.id) ? (
                <>
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    title="编辑部门"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-2 bg-red-50 text-red-400 border border-transparent hover:border-red-100 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    title="删除部门"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Lock size={10} className="inline mr-1" />只读
                </span>
              )}
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div className="overflow-hidden animate-in slide-in-from-top-2 duration-200">
              {renderDepartmentTree(dept.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const departmentTree = buildDepartmentTree(filteredDepartments);

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">组织架构管理</h2>
              <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Organization Structure Management</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchDepartments} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin() && (
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
              <Plus size={20} /> 创建新部门
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between group overflow-hidden relative shadow-2xl">
          <Building2 className="absolute right-[-20px] top-[-20px] w-32 h-32 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">总部门数</p>
          <h3 className="text-5xl font-black mt-4 relative z-10">{departments.length}</h3>
          <p className="text-blue-400 text-[10px] font-black uppercase mt-4 relative z-10 flex items-center gap-2">
            <Users size={12} /> Organization Structure
          </p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">顶级部门</p>
          <h3 className="text-4xl font-black mt-4 text-green-600">{departments.filter(d => !d.parent_id).length}</h3>
          <div className="h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${(departments.filter(d => !d.parent_id).length / departments.length) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm col-span-2 flex items-center gap-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
            <Building2 size={32} />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-800">层级化管理</h4>
            <p className="text-sm text-slate-400 mt-1 font-medium">支持多级部门结构，实现组织架构的灵活管理。每个部门可设置组长与成员角色。</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input
            type="text" placeholder="搜索部门名称..."
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div>
          ) : departmentTree.length === 0 ? (
            <div className="py-32 text-center text-slate-400 font-bold">暂无部门数据</div>
          ) : (
            renderDepartmentTree(departmentTree)
          )}
        </div>
      </div>

      {/* Create Department Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">创建新部门</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Create Department</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">部门名称 *</label>
                <input
                  required placeholder="Department Name"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">部门描述</label>
                <textarea
                  placeholder="Description"
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 resize-none"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">上级部门</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800"
                  value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">无（顶级部门）</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <button disabled={formLoading} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <Building2 size={20} />}
                确认创建部门
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {isEditModalOpen && selectedDepartment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">编辑部门: {selectedDepartment.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Edit Department</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 text-slate-300 hover:text-slate-600">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">部门名称 *</label>
                <input
                  required placeholder="Department Name"
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-amber-500/10 font-bold text-slate-800"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">部门描述</label>
                <textarea
                  placeholder="Description"
                  rows={3}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-amber-500/10 font-bold text-slate-800 resize-none"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">上级部门</label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-amber-500/10 font-bold text-slate-800"
                  value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">无（顶级部门）</option>
                  {getAvailableParentDepartments(selectedDepartment.id).map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <button disabled={formLoading} className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-500/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-3">
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                立即更新部门
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
