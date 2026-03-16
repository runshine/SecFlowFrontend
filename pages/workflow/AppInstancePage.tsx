import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, Trash2, Play, Square, RefreshCw, Power, AlertCircle, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api/api';
import { AppWorkflow, AppTemplate, AppWorkflowStatus } from '../../types/types';

export const AppInstancePage: React.FC<{
  projectId: string,
  onNavigateToDetail: (id: string) => void
}> = ({ projectId, onNavigateToDetail }) => {
  const [instances, setInstances] = useState<AppWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 创建模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    service_name: '',
    service_ports: [{ name: 'http', port: 80, target_port: 80, protocol: 'TCP' }],
    service_type: 'ClusterIP' as 'ClusterIP' | 'LoadBalancer' | 'NodePort',
    replicas: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 删除确认模态框
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 模板选择器状态
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<AppTemplate | null>(null);

  // 模板依赖状态
  const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null);
  const [inputEnvVarValues, setInputEnvVarValues] = useState<Record<string, string>>({});
  const [inputVolumeMountConfigs, setInputVolumeMountConfigs] = useState<Record<string, { pvc_name: string; sub_path: string; read_only: boolean }>>({});

  // PVC 列表（用于卷挂载选择）
  const [pvcList, setPvcList] = useState<Array<{ pvc_name: string; resource_name?: string }>>([]);

  // 加载数据
  useEffect(() => {
    if (projectId) {
      loadInstances();
    }
  }, [projectId, statusFilter]);

  const loadInstances = async () => {
    setLoading(true);
    try {
      const res = await api.workflow.listAppWorkflows({
        project_id: projectId,
        status: statusFilter || undefined
      });
      setInstances(res.items || []);
    } catch (error) {
      console.error('Failed to load app workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载模板（用于创建实例）
  const loadTemplates = async () => {
    try {
      const res = await api.workflow.listAppTemplates({ project_id: projectId });
      setTemplates(res.items || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // 搜索过滤
  const filteredInstances = useMemo(() => {
    return instances.filter(instance =>
      instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.template_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instances, searchTerm]);

  // 分页计算
  const totalPages = Math.ceil(filteredInstances.length / pageSize) || 1;
  const paginatedInstances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstances.slice(start, start + pageSize);
  }, [filteredInstances, currentPage, pageSize]);

  // 操作函数
  const handleInitialize = async (id: string) => {
    try {
      await api.workflow.initializeAppWorkflow(id);
      loadInstances();
    } catch (error: any) {
      alert(`初始化失败: ${error.message}`);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.workflow.startAppWorkflow(id);
      loadInstances();
    } catch (error: any) {
      alert(`启动失败: ${error.message}`);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.workflow.stopAppWorkflow(id);
      loadInstances();
    } catch (error: any) {
      alert(`停止失败: ${error.message}`);
    }
  };

  const handleSyncStatus = async (id: string) => {
    try {
      await api.workflow.syncAppWorkflowStatus(id);
      loadInstances();
    } catch (error: any) {
      alert(`同步状态失败: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.workflow.deleteAppWorkflow(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadInstances();
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  // 创建实例
  const handleCreate = async () => {
    // 基础字段校验
    if (!formData.name || !formData.template_id || !formData.service_name) {
      alert('请填写必填字段：名称、模板、服务名称');
      return;
    }

    // 依赖校验
    if (selectedTemplate) {
      // 校验环境变量依赖
      for (const container of selectedTemplate.containers) {
        if (container.input_env_vars) {
          for (const envVar of container.input_env_vars) {
            const key = `${container.name}.${envVar.name}`;
            const isRequired = !envVar.default_value;
            if (isRequired && !inputEnvVarValues[key]) {
              alert(`请填写环境变量依赖: ${envVar.name} (容器: ${container.name})`);
              return;
            }
          }
        }
      }

      // 校验卷挂载依赖
      for (const container of selectedTemplate.containers) {
        if (container.input_volume_mounts) {
          for (const mount of container.input_volume_mounts) {
            const key = `${container.name}.${mount.mount_path}`;
            const config = inputVolumeMountConfigs[key];
            if (!config || !config.pvc_name) {
              alert(`请选择PVC用于挂载路径: ${mount.mount_path} (容器: ${container.name})`);
              return;
            }
            if (!config.sub_path) {
              alert(`请填写子路径用于挂载路径: ${mount.mount_path} (容器: ${container.name})`);
              return;
            }
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      // 构建环境变量数组
      const envVars: Array<{ name: string; value: string }> = [];
      if (selectedTemplate) {
        selectedTemplate.containers.forEach(container => {
          if (container.input_env_vars) {
            container.input_env_vars.forEach(envVar => {
              const key = `${container.name}.${envVar.name}`;
              const value = inputEnvVarValues[key];
              if (value) {
                envVars.push({ name: envVar.name, value });
              }
            });
          }
        });
      }

      // 构建卷挂载数组
      const volumeMounts: Array<{ pvc_name: string; mount_path: string; sub_path: string; read_only: boolean }> = [];
      if (selectedTemplate) {
        selectedTemplate.containers.forEach(container => {
          if (container.input_volume_mounts) {
            container.input_volume_mounts.forEach(mount => {
              const key = `${container.name}.${mount.mount_path}`;
              const config = inputVolumeMountConfigs[key];
              if (config && config.pvc_name && config.sub_path) {
                volumeMounts.push({
                  pvc_name: config.pvc_name,
                  mount_path: mount.mount_path,
                  sub_path: config.sub_path,
                  read_only: config.read_only
                });
              }
            });
          }
        });
      }

      // 提交创建请求
      await api.workflow.createAppWorkflow({
        ...formData,
        project_id: projectId,
        env_vars: envVars.length > 0 ? envVars : undefined,
        volume_mounts: volumeMounts.length > 0 ? volumeMounts : undefined
      });

      setIsModalOpen(false);
      resetForm();
      loadInstances();
    } catch (error: any) {
      alert(`创建失败: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template_id: '',
      service_name: '',
      service_ports: [{ name: 'http', port: 80, target_port: 80, protocol: 'TCP' }],
      service_type: 'ClusterIP',
      replicas: 1
    });
    setSelectedTemplate(null);
    setInputEnvVarValues({});
    setInputVolumeMountConfigs({});
  };

  // 处理模板选择：获取完整详情并解析依赖
  const handleTemplateSelect = async (templateId: string) => {
    try {
      // 获取完整模板详情
      const template = await api.workflow.getAppTemplate(templateId);
      setSelectedTemplate(template);

      // 解析并初始化环境变量依赖
      const envVarValues: Record<string, string> = {};
      template.containers.forEach(container => {
        if (container.input_env_vars) {
          container.input_env_vars.forEach(envVar => {
            const key = `${container.name}.${envVar.name}`;
            envVarValues[key] = envVar.default_value || '';
          });
        }
      });
      setInputEnvVarValues(envVarValues);

      // 解析并初始化卷挂载依赖
      const volumeConfigs: Record<string, { pvc_name: string; sub_path: string; read_only: boolean }> = {};
      template.containers.forEach(container => {
        if (container.input_volume_mounts) {
          container.input_volume_mounts.forEach(mount => {
            const key = `${container.name}.${mount.mount_path}`;
            volumeConfigs[key] = {
              pvc_name: '',
              sub_path: '',
              read_only: mount.read_only !== undefined ? mount.read_only : true
            };
          });
        }
      });
      setInputVolumeMountConfigs(volumeConfigs);

      // 更新表单数据
      setFormData({ ...formData, template_id: templateId });
      setIsTemplateDropdownOpen(false);
    } catch (error) {
      console.error('Failed to load template details:', error);
      alert('加载模板详情失败');
    }
  };

  const openCreateModal = () => {
    loadTemplates();
    resetForm();
    loadPVCList();
    setIsModalOpen(true);
  };

  // 加载PVC列表
  const loadPVCList = async () => {
    try {
      console.log('[DEBUG] Loading PVC list for project:', projectId);
      const res = await api.resources.getPVCs(projectId);
      console.log('[DEBUG] PVC API response:', res);
      console.log('[DEBUG] PVC count:', res.pvcs?.length || 0);
      setPvcList(res.pvcs || []);
    } catch (error: any) {
      console.error('Failed to load PVC list:', error);
      alert(`加载PVC列表失败: ${error.message || '未知错误'}\n请检查项目ID是否正确，或刷新页面重试。`);
    }
  };

  // 状态颜色映射
  const getStatusColor = (status: AppWorkflowStatus) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      initializing: 'bg-blue-100 text-blue-700',
      initialized: 'bg-indigo-100 text-indigo-700',
      running: 'bg-green-100 text-green-700',
      succeeded: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
      stopped: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: AppWorkflowStatus) => {
    const texts = {
      pending: '待初始化',
      initializing: '初始化中',
      initialized: '已初始化',
      running: '运行中',
      succeeded: '执行成功',
      failed: '执行失败',
      stopped: '已停止'
    };
    return texts[status] || status;
  };

  // 根据状态判断可用操作
  const getAvailableActions = (status: AppWorkflowStatus) => {
    const actions: string[] = [];
    switch (status) {
      case 'pending':
        actions.push('initialize');
        break;
      case 'initialized':
        actions.push('start', 'stop', 'initialize_force');
        break;
      case 'running':
        actions.push('stop', 'sync');
        break;
      case 'stopped':
        actions.push('start', 'initialize_force');
        break;
      case 'failed':
        actions.push('initialize_force', 'sync');
        break;
    }
    return actions;
  };

  return (
    <div className="p-8">
      {/* 页面标题和操作栏 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">应用实例</h1>
          <p className="text-sm text-slate-500 mt-1">管理单应用工作流实例</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Plus size={18} /> 创建实例
        </button>
      </div>

      {/* 筛选和搜索栏 */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索实例名称、ID 或模板名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all"
        >
          <option value="">全部状态</option>
          <option value="pending">待初始化</option>
          <option value="initialized">已初始化</option>
          <option value="running">运行中</option>
          <option value="stopped">已停止</option>
          <option value="failed">执行失败</option>
        </select>
      </div>

      {/* 实例列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filteredInstances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Box className="text-slate-300 mb-4" size={64} />
          <p className="text-slate-400 font-medium">暂无应用实例</p>
          <p className="text-sm text-slate-400 mt-1">点击"创建实例"按钮开始</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">实例名称</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">模板</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">服务</th>
                <th className="text-left px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">创建时间</th>
                <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInstances.map((instance) => {
                const availableActions = getAvailableActions(instance.status);
                return (
                  <tr key={instance.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onNavigateToDetail(instance.id)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors text-left"
                      >
                        {instance.name}
                      </button>
                      <p className="text-xs text-slate-400 mt-1">{instance.id}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{instance.template_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(instance.status)}`}>
                        {getStatusText(instance.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{instance.service_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(instance.created_at).toLocaleString('zh-CN')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {availableActions.includes('initialize') && (
                          <button
                            onClick={() => handleInitialize(instance.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="初始化"
                          >
                            <Power size={16} />
                          </button>
                        )}
                        {availableActions.includes('start') && (
                          <button
                            onClick={() => handleStart(instance.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                            title="启动"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {availableActions.includes('stop') && (
                          <button
                            onClick={() => handleStop(instance.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                            title="停止"
                          >
                            <Square size={16} />
                          </button>
                        )}
                        {availableActions.includes('sync') && (
                          <button
                            onClick={() => handleSyncStatus(instance.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                            title="同步状态"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeletingId(instance.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredInstances.length > 0 && (
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">每页</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  条 | 共 {filteredInstances.length} 条
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-black text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-2 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 创建实例模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-900">创建应用实例</h2>
              <p className="text-sm text-slate-500 mt-1">基于应用模板创建新的工作流实例</p>
            </div>
            <div className="p-8 space-y-6">
              {/* 名称 */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">实例名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：my-nginx-app"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500"
                />
              </div>
              {/* 描述 */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="应用实例描述..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>
              {/* 选择模板 */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">应用模板 *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 text-left flex items-center justify-between"
                  >
                    <span className={formData.template_id ? 'text-slate-900' : 'text-slate-400'}>
                      {formData.template_id
                        ? templates.find(t => t.id === formData.template_id)?.name
                        : '选择模板...'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isTemplateDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-80 overflow-y-auto">
                      {templates.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">暂无可用模板</div>
                      ) : (
                        templates.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="relative"
                            onMouseEnter={() => setHoveredTemplate(tpl)}
                            onMouseLeave={() => setHoveredTemplate(null)}
                          >
                            <button
                              type="button"
                              onClick={() => handleTemplateSelect(tpl.id)}
                              className={`w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                                formData.template_id === tpl.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                              }`}
                            >
                              <span>{tpl.name}</span>
                              {formData.template_id === tpl.id && (
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>

                            {/* Tooltip - 显示详细信息 */}
                            {hoveredTemplate?.id === tpl.id && (
                              <div className="fixed left-[45%] top-1/2 -translate-y-1/2 w-80 bg-slate-900 text-white rounded-xl shadow-2xl p-4 z-[9999] max-h-[80vh] overflow-y-auto">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">模板详情</div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-xs font-medium text-slate-400 mb-1">描述</div>
                                    <div className="text-sm">{tpl.description || '暂无描述'}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-slate-400 mb-1">容器配置</div>
                                    <div className="text-sm">{tpl.containers.length} 个容器</div>
                                    {tpl.containers.map((container, idx) => (
                                      <div key={idx} className="text-xs text-slate-300 mt-1 pl-2">
                                        • {container.name}: {container.image}
                                      </div>
                                    ))}
                                  </div>
                                  {tpl.service_ports && tpl.service_ports.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-slate-400 mb-1">服务端口</div>
                                      <div className="text-sm space-y-1">
                                        {tpl.service_ports.map((port, idx) => (
                                          <div key={idx} className="text-xs text-slate-300">
                                            {port.name}: {port.port} → {port.target_port} ({port.protocol || 'TCP'})
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex gap-4 text-xs">
                                    <div>
                                      <span className="text-slate-400">服务类型: </span>
                                      <span>{tpl.service_type || 'ClusterIP'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">副本数: </span>
                                      <span>{tpl.replicas}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 模板依赖配置 */}
              {selectedTemplate && (
                <>
                  {/* 环境变量依赖 */}
                  {selectedTemplate.containers.some(c => c.input_env_vars && c.input_env_vars.length > 0) && (
                    <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-xs font-black text-blue-600 uppercase">环境变量依赖 *</div>
                        <span className="text-xs text-blue-500">模板需要以下环境变量才能正常运行</span>
                      </div>
                      <div className="space-y-3">
                        {selectedTemplate.containers.map(container =>
                          container.input_env_vars?.map(envVar => {
                            const key = `${container.name}.${envVar.name}`;
                            const isRequired = !envVar.default_value;
                            return (
                              <div key={key}>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                  {envVar.name} {isRequired && <span className="text-red-500">*</span>}
                                  <span className="text-xs font-normal text-slate-400 ml-2">
                                    容器: {container.name}
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={inputEnvVarValues[key] || ''}
                                  onChange={(e) => setInputEnvVarValues({
                                    ...inputEnvVarValues,
                                    [key]: e.target.value
                                  })}
                                  placeholder={envVar.default_value || '请输入环境变量值...'}
                                  className={`w-full px-3 py-2 bg-white border ${isRequired && !inputEnvVarValues[key] ? 'border-red-300' : 'border-slate-200'} rounded-xl text-sm outline-none focus:border-blue-500`}
                                />
                                {envVar.default_value && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    默认值: {envVar.default_value}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* 卷挂载依赖 */}
                  {selectedTemplate.containers.some(c => c.input_volume_mounts && c.input_volume_mounts.length > 0) && (
                    <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-xs font-black text-purple-600 uppercase">存储挂载依赖 *</div>
                        <span className="text-xs text-purple-500">模板需要挂载PVC才能正常运行</span>
                      </div>
                      <div className="space-y-3">
                        {selectedTemplate.containers.map(container =>
                          container.input_volume_mounts?.map(mount => {
                            const key = `${container.name}.${mount.mount_path}`;
                            const config = inputVolumeMountConfigs[key] || { pvc_name: '', sub_path: '', read_only: true };
                            return (
                              <div key={key} className="bg-white rounded-xl p-3 border border-purple-200">
                                <div className="text-xs font-bold text-slate-600 mb-2">
                                  挂载路径: {mount.mount_path}
                                  <span className="text-xs font-normal text-slate-400 ml-2">
                                    容器: {container.name} | {mount.read_only ? '只读' : '读写'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                      PVC名称 <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={config.pvc_name}
                                      onChange={(e) => setInputVolumeMountConfigs({
                                        ...inputVolumeMountConfigs,
                                        [key]: { ...config, pvc_name: e.target.value }
                                      })}
                                      className={`w-full px-3 py-2 border ${!config.pvc_name ? 'border-red-300' : 'border-slate-200'} rounded-lg text-sm outline-none focus:border-purple-500`}
                                    >
                                      <option value="">选择PVC...</option>
                                      {pvcList.map(pvc => (
                                        <option key={pvc.pvc_name} value={pvc.pvc_name}>
                                          {pvc.pvc_name} {pvc.resource_name && `(${pvc.resource_name})`}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                      子路径 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={config.sub_path}
                                      onChange={(e) => setInputVolumeMountConfigs({
                                        ...inputVolumeMountConfigs,
                                        [key]: { ...config, sub_path: e.target.value }
                                      })}
                                      placeholder="例如: data/config"
                                      className={`w-full px-3 py-2 border ${!config.sub_path ? 'border-red-300' : 'border-slate-200'} rounded-lg text-sm outline-none focus:border-purple-500`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 服务名称 */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">K8s Service 名称 *</label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  placeholder="例如：nginx-svc"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500"
                />
              </div>
              {/* 服务类型 */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Service 类型</label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500"
                >
                  <option value="ClusterIP">ClusterIP</option>
                  <option value="NodePort">NodePort</option>
                  <option value="LoadBalancer">LoadBalancer</option>
                </select>
              </div>
              {/* 副本数 */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">副本数</label>
                <input
                  type="number"
                  min="1"
                  value={formData.replicas}
                  onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-slate-600 hover:text-slate-700 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                创建实例
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">确认删除</h3>
                  <p className="text-sm text-slate-500 mt-1">此操作无法撤销</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                确定要删除该应用实例吗？如果实例正在运行，将会先停止实例并删除所有关联的 K8s 资源。
              </p>
            </div>
            <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingId(null);
                }}
                className="px-6 py-3 text-slate-600 hover:text-slate-700 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-500 active:scale-[0.98] transition-all"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};