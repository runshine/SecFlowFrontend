import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Play, Square, RefreshCw, Power, AlertCircle, FileText, Settings, Terminal } from 'lucide-react';
import { api } from '../../api/api';
import { AppWorkflow, AppWorkflowStatus } from '../../types/types';

export const AppInstanceDetailPage: React.FC<{
  instanceId: string,
  onBack: () => void
}> = ({ instanceId, onBack }) => {
  const [instance, setInstance] = useState<AppWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'config' | 'logs'>('info');
  const [logs, setLogs] = useState<string>('');
  const [isOperating, setIsOperating] = useState(false);
  const [isOperatingForce, setIsOperatingForce] = useState(false);

  useEffect(() => {
    loadInstance();
  }, [instanceId]);

  const loadInstance = async () => {
    setLoading(true);
    try {
      const data = await api.workflow.getAppWorkflow(instanceId);
      setInstance(data);
    } catch (error) {
      console.error('Failed to load app workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  // 操作函数
  const handleInitialize = async (force = false) => {
    setIsOperating(true);
    if (force) setIsOperatingForce(true);
    try {
      await api.workflow.initializeAppWorkflow(instanceId, force);
      await loadInstance();
    } catch (error: any) {
      alert(`初始化失败: ${error.message}`);
    } finally {
      setIsOperating(false);
      setIsOperatingForce(false);
    }
  };

  const handleStart = async () => {
    setIsOperating(true);
    try {
      await api.workflow.startAppWorkflow(instanceId);
      await loadInstance();
    } catch (error: any) {
      alert(`启动失败: ${error.message}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleStop = async () => {
    setIsOperating(true);
    try {
      await api.workflow.stopAppWorkflow(instanceId);
      await loadInstance();
    } catch (error: any) {
      alert(`停止失败: ${error.message}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleSyncStatus = async () => {
    setIsOperating(true);
    try {
      await api.workflow.syncAppWorkflowStatus(instanceId);
      await loadInstance();
    } catch (error: any) {
      alert(`同步状态失败: ${error.message}`);
    } finally {
      setIsOperating(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await api.workflow.getAppWorkflowLogs(instanceId, { tail_lines: 100 });
      setLogs(data.logs || '暂无日志');
    } catch (error: any) {
      setLogs(`加载日志失败: ${error.message}`);
    }
  };

  // 根据状态判断可用操作
  const getAvailableActions = () => {
    if (!instance) return [];
    const actions: string[] = [];
    switch (instance.status) {
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

  const getNodeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      not_ready: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      stopped: 'bg-slate-100 text-slate-700',
      failed: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getNodeStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Pod未运行',
      not_ready: 'Pod未就绪',
      ready: 'Pod已就绪',
      stopped: '已停止',
      failed: '执行失败'
    };
    return texts[status] || status;
  };

  // 自动加载日志
  useEffect(() => {
    if (activeTab === 'logs' && instance) {
      loadLogs();
    }
  }, [activeTab, instance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="text-red-400 mb-4" size={64} />
        <p className="text-slate-600 font-medium">应用实例不存在</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-3 text-blue-600 hover:text-blue-700 font-medium"
        >
          返回列表
        </button>
      </div>
    );
  }

  const availableActions = getAvailableActions();

  return (
    <div className="p-8">
      {/* 页面标题和操作栏 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{instance.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{instance.description || '暂无描述'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 操作按钮 */}
          {availableActions.includes('initialize') && (
            <button
              onClick={() => handleInitialize(false)}
              disabled={isOperating}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isOperating && !isOperatingForce ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
              初始化
            </button>
          )}
          {availableActions.includes('start') && (
            <button
              onClick={handleStart}
              disabled={isOperating}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isOperating ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              启动
            </button>
          )}
          {availableActions.includes('stop') && (
            <button
              onClick={handleStop}
              disabled={isOperating}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isOperating ? <Loader2 className="animate-spin" size={16} /> : <Square size={16} />}
              停止
            </button>
          )}
          {availableActions.includes('sync') && (
            <button
              onClick={handleSyncStatus}
              disabled={isOperating}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isOperating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              同步状态
            </button>
          )}
          {availableActions.includes('initialize_force') && (
            <button
              onClick={() => handleInitialize(true)}
              disabled={isOperating}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isOperating && isOperatingForce ? <Loader2 className="animate-spin" size={16} /> : <Power size={16} />}
              强制重新初始化
            </button>
          )}
        </div>
      </div>

      {/* 状态和基本信息卡片 */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">实例状态</div>
          <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(instance.status)}`}>
            {getStatusText(instance.status)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">应用模板</div>
          <div className="text-sm font-bold text-slate-900">{instance.template_name}</div>
          <div className="text-xs text-slate-400 mt-1">{instance.template_id}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">K8s Service</div>
          <div className="text-sm font-bold text-slate-900">{instance.service_name}</div>
          <div className="text-xs text-slate-400 mt-1">{instance.service_type || 'ClusterIP'}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">副本数</div>
          <div className="text-2xl font-black text-slate-900">{instance.replicas || 1}</div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'info'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'config'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            配置详情
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'logs'
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            运行日志
          </button>
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        {activeTab === 'info' && (
          <div className="space-y-8">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">实例信息</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase mb-2">实例 ID</div>
                  <div className="text-sm text-slate-900 font-mono">{instance.id}</div>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase mb-2">创建时间</div>
                  <div className="text-sm text-slate-900">{new Date(instance.created_at).toLocaleString('zh-CN')}</div>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase mb-2">项目 ID</div>
                  <div className="text-sm text-slate-900 font-mono">{instance.project_id}</div>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase mb-2">工作流类型</div>
                  <div className="text-sm text-slate-900">{instance.workflow_type}</div>
                </div>
              </div>
            </div>

            {/* 节点信息 */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">节点状态</h3>
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">节点名称</div>
                    <div className="text-sm text-slate-900">{instance.node.name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">节点状态</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getNodeStatusColor(instance.node.status)}`}>
                      {getNodeStatusText(instance.node.status)}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">K8s 资源</div>
                    <div className="text-sm text-slate-900 font-mono">
                      {instance.node.k8s_resource_name || '-'}
                    </div>
                  </div>
                </div>
                {instance.node.message && (
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">消息</div>
                    <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                      {instance.node.message}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 服务端口 */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">服务端口</h3>
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="grid grid-cols-4 gap-4 mb-2">
                  <div className="text-xs font-black text-slate-500 uppercase">端口名称</div>
                  <div className="text-xs font-black text-slate-500 uppercase">Service 端口</div>
                  <div className="text-xs font-black text-slate-500 uppercase">容器端口</div>
                  <div className="text-xs font-black text-slate-500 uppercase">协议</div>
                </div>
                {instance.service_ports.map((port, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-4 py-2 border-t border-slate-200">
                    <div className="text-sm text-slate-900">{port.name}</div>
                    <div className="text-sm text-slate-900">{port.port}</div>
                    <div className="text-sm text-slate-900">{port.target_port}</div>
                    <div className="text-sm text-slate-900">{port.protocol || 'TCP'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-8">
            {/* 环境变量 */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">环境变量</h3>
              {instance.env_vars && instance.env_vars.length > 0 ? (
                <div className="bg-slate-50 rounded-2xl p-6">
                  {instance.env_vars.map((env, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between border-t border-slate-200 first:border-t-0">
                      <div className="text-sm font-mono text-slate-900">{env.name}</div>
                      <div className="text-sm text-slate-600">{env.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">无环境变量</div>
              )}
            </div>

            {/* 卷挂载 */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">卷挂载</h3>
              {instance.volume_mounts && instance.volume_mounts.length > 0 ? (
                <div className="bg-slate-50 rounded-2xl p-6">
                  {instance.volume_mounts.map((vol, idx) => (
                    <div key={idx} className="py-3 border-t border-slate-200 first:border-t-0">
                      <div className="text-sm font-bold text-slate-900">{vol.pvc_name}</div>
                      <div className="text-xs text-slate-500 mt-1">挂载路径: {vol.mount_path}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">无卷挂载</div>
              )}
            </div>

            {/* 资源配置 */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">资源配置</h3>
              {instance.resources ? (
                <div className="bg-slate-50 rounded-2xl p-6 grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">请求资源</div>
                    <div className="text-sm text-slate-900">
                      CPU: {instance.resources.requests?.cpu || '-'} / 内存: {instance.resources.requests?.memory || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">资源限制</div>
                    <div className="text-sm text-slate-900">
                      CPU: {instance.resources.limits?.cpu || '-'} / 内存: {instance.resources.limits?.memory || '-'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">无资源配置</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">运行日志</h3>
              <button
                onClick={loadLogs}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                刷新日志
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 overflow-auto max-h-[600px]">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                {logs || '点击"刷新日志"加载日志内容'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};