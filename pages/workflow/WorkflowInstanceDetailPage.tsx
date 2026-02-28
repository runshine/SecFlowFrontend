import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Play, Square, RefreshCw, Plus, Trash2, Settings, Terminal, Activity, Loader2 } from 'lucide-react';
import { api } from '../../api/api';
import { WorkflowInstance, WorkflowNodeInstance, WorkflowStatus } from '../../types/types';
import { StatusBadge } from '../../components/StatusBadge';

const nodeColor = (status: WorkflowStatus) => {
  switch (status) {
    case 'succeeded': return '#10b981';
    case 'failed': return '#ef4444';
    case 'running': return '#3b82f6';
    case 'pending': return '#f59e0b';
    case 'stopped': return '#64748b';
    default: return '#cbd5e1';
  }
};

export const WorkflowInstanceDetailPage: React.FC<{ instanceId: string, onBack: () => void }> = ({ instanceId, onBack }) => {
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodeTemplateDetails, setSelectedNodeTemplateDetails] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  
  const [menu, setMenu] = useState<{ id: string; top: number; left: number; right: number; bottom: number } | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [nodeLogs, setNodeLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [addNodeStep, setAddNodeStep] = useState<'select' | 'configure'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string, name: string, type: 'app' | 'job' } | null>(null);
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [newNodeConfig, setNewNodeConfig] = useState({
    name: '',
    node_id: '',
    env_vars: [] as { name: string, value: string }[],
    volume_mounts: [] as { mount_path: string, pvc_name: string }[]
  });
  const [templates, setTemplates] = useState<{ id: string, name: string, type: 'app' | 'job' }[]>([]);
  const [pvcs, setPvcs] = useState<any[]>([]);

  const loadInstance = async () => {
    try {
      const data = await api.workflow.getInstance(instanceId);
      setInstance(data);
      
      // Transform nodes for React Flow
      const flowNodes: Node[] = (data.nodes || []).map((n: any, index: number) => ({
        id: n.node_id,
        type: 'default',
        position: n.position || { x: 250, y: index * 100 + 50 },
        data: { 
          label: (
            <div className="flex flex-col items-center p-2">
              <div className="font-bold text-sm">{n.name}</div>
              <div className="text-[10px] text-slate-500 uppercase">{n.node_type}</div>
              <div className="mt-2">
                <StatusBadge status={n.status} />
              </div>
            </div>
          ),
          ...n
        },
        style: {
          border: `2px solid ${nodeColor(n.status)}`,
          borderRadius: '12px',
          padding: '10px',
          background: '#fff',
          minWidth: '150px'
        }
      }));

      // Transform edges
      let flowEdges: Edge[] = [];
      if (data.edges && data.edges.length > 0) {
        flowEdges = data.edges.map((e: any) => ({
          id: e.edge_id || `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          animated: data.status === 'running',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        }));
      } else {
        // Fallback to depends_on
        (data.nodes || []).forEach((n: any) => {
          if (n.depends_on && n.depends_on.length > 0) {
            n.depends_on.forEach((dep: string) => {
              flowEdges.push({
                id: `${dep}-${n.node_id}`,
                source: dep,
                target: n.node_id,
                animated: data.status === 'running',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#94a3b8', strokeWidth: 2 }
              });
            });
          }
        });
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        api.workflow.listAppTemplates({ project_id: instance?.project_id }),
        api.workflow.listJobTemplates({ project_id: instance?.project_id })
      ]);
      const appTmpls = (appRes.items || []).map(t => ({ id: t.id, name: t.name, type: 'app' as const }));
      const jobTmpls = (jobRes.items || []).map(t => ({ id: t.id, name: t.name, type: 'job' as const }));
      setTemplates([...appTmpls, ...jobTmpls]);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPvcs = async () => {
    if (!instance?.project_id) return;
    try {
      const res = await api.resources.getPVCs(instance.project_id);
      setPvcs(res.pvcs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInstance();
    const interval = setInterval(() => {
      if (!isEditMode) {
        loadInstance();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [instanceId, isEditMode]);

  useEffect(() => {
    if (isAddNodeModalOpen) {
      loadTemplates();
    }
  }, [isAddNodeModalOpen]);

  const onConnect = useCallback((params: Connection) => {
    if (!isEditMode) return;
    const newEdge: Edge = {
      ...params,
      id: `edge-${params.source}-${params.target}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges, isEditMode]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // 1. Get current state from backend
      const currentInstance = await api.workflow.getInstance(instanceId);
      const currentNodes = currentInstance.nodes || [];
      const currentEdges = currentInstance.edges || [];
      
      // 2. Process Nodes (Create/Update/Delete)
      // Nodes to delete
      const flowNodeIds = new Set(nodes.map(n => n.id));
      for (const cn of currentNodes) {
        if (!flowNodeIds.has(cn.node_id)) {
          await api.workflow.deleteNode(instanceId, cn.id);
        }
      }

      // Nodes to create/update
      for (const node of nodes) {
        const existingNode = currentNodes.find((n: any) => n.node_id === node.id);
        if (existingNode) {
          await api.workflow.updateNode(instanceId, existingNode.id, {
            name: node.data.name,
            position: node.position
          });
        } else {
          // This case should be handled by handleCreateNode now, 
          // but keeping it as fallback for any nodes added via other means
          await api.workflow.createNode(instanceId, {
            node_id: node.id,
            node_type: node.data.node_type,
            template_id: node.data.template_id,
            name: node.data.name,
            position: node.position
          });
        }
      }

      // 3. Process Edges (Add/Delete)
      // Edges to delete
      for (const ce of currentEdges) {
        const stillExists = edges.find(e => e.source === ce.source && e.target === ce.target);
        if (!stillExists) {
          await api.workflow.updateEdge(instanceId, {
            edge_id: ce.edge_id,
            action: 'delete'
          });
        }
      }

      // Edges to add
      for (const fe of edges) {
        const alreadyExists = currentEdges.find(e => e.source === fe.source && e.target === fe.target);
        if (!alreadyExists) {
          await api.workflow.updateEdge(instanceId, {
            edge_id: fe.id,
            source: fe.source,
            target: fe.target,
            action: 'add'
          });
        }
      }
      
      setIsEditMode(false);
      await loadInstance();
      alert("保存成功");
    } catch (e: any) {
      alert("保存失败: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (template: { id: string, name: string, type: 'app' | 'job' }) => {
    try {
      setLoading(true);
      const [details, _] = await Promise.all([
        template.type === 'app' ? api.workflow.getAppTemplate(template.id) : api.workflow.getJobTemplate(template.id),
        loadPvcs()
      ]);
      
      setSelectedTemplate(template);
      setTemplateDetails(details);
      
      // Initialize config with required inputs
      const envVars: { name: string, value: string }[] = [];
      const volumeMounts: { mount_path: string, pvc_name: string }[] = [];
      
      details.containers.forEach((c: any) => {
        if (c.input_env_vars) {
          c.input_env_vars.forEach((iv: any) => {
            if (!envVars.find(e => e.name === iv.name)) {
              envVars.push({ name: iv.name, value: iv.default_value || '' });
            }
          });
        }
        if (c.input_volume_mounts) {
          c.input_volume_mounts.forEach((iv: any) => {
            if (!volumeMounts.find(v => v.mount_path === iv.mount_path)) {
              volumeMounts.push({ mount_path: iv.mount_path, pvc_name: '' });
            }
          });
        }
      });
      
      setNewNodeConfig({
        name: template.name,
        node_id: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`,
        env_vars: envVars,
        volume_mounts: volumeMounts
      });
      
      setAddNodeStep('configure');
    } catch (e) {
      console.error(e);
      alert("获取模板详情失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNode = async () => {
    if (!selectedTemplate || !newNodeConfig.node_id || !newNodeConfig.name) {
      alert("请填写完整信息");
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditingNode && editingNodeId) {
        await api.workflow.updateNode(instanceId, editingNodeId, {
          name: newNodeConfig.name,
          env_vars: newNodeConfig.env_vars.filter(e => e.value),
          volume_mounts: newNodeConfig.volume_mounts.filter(v => v.pvc_name)
        });
        alert("更新成功");
      } else {
        const payload = {
          node_id: newNodeConfig.node_id,
          node_type: selectedTemplate.type,
          template_id: selectedTemplate.id,
          name: newNodeConfig.name,
          position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
          env_vars: newNodeConfig.env_vars.filter(e => e.value),
          volume_mounts: newNodeConfig.volume_mounts.filter(v => v.pvc_name)
        };
        
        await api.workflow.createNode(instanceId, payload);
        alert("创建成功");
      }
      
      setIsAddNodeModalOpen(false);
      setIsEditingNode(false);
      setEditingNodeId(null);
      setAddNodeStep('select');
      setSelectedTemplate(null);
      setTemplateDetails(null);
      await loadInstance();
    } catch (e: any) {
      alert((isEditingNode ? "更新" : "创建") + "节点失败: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = async (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedNodeTemplateDetails(null);
    setLoadingTemplate(true);
    try {
      let details;
      if (node.data.node_type === 'app') {
        details = await api.workflow.getAppTemplate(node.data.template_id as string);
      } else {
        details = await api.workflow.getJobTemplate(node.data.template_id as string);
      }
      setSelectedNodeTemplateDetails(details);
    } catch (e) {
      console.error("Failed to load template details for node:", e);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setMenu(null);
  };

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
        right: window.innerWidth - event.clientX,
        bottom: window.innerHeight - event.clientY,
      });
    },
    [setMenu]
  );

  const handleCopyNode = async (nodeId: string) => {
    try {
      setLoading(true);
      // 1. Fetch the latest node details from backend
      const nodeDetails = await api.workflow.getNode(instanceId, nodeId);
      
      // 2. Prepare new node data
      const newNodeId = `${nodeDetails.node_id}-copy-${Math.random().toString(36).substring(2, 7)}`;
      const newNodeName = `${nodeDetails.name} (Copy)`;
      
      // 3. Create the new node
      await api.workflow.createNode(instanceId, {
        node_id: newNodeId,
        node_type: nodeDetails.node_type,
        template_id: nodeDetails.template_id,
        name: newNodeName,
        position: { 
          x: (nodeDetails.position?.x || 0) + 50, 
          y: (nodeDetails.position?.y || 0) + 50 
        },
        env_vars: nodeDetails.env_vars,
        volume_mounts: nodeDetails.volume_mounts,
        resources: nodeDetails.resources,
        timeout_seconds: nodeDetails.timeout_seconds,
        input_env_vars: nodeDetails.input_env_vars,
        input_volume_mounts: nodeDetails.input_volume_mounts
      });
      
      await loadInstance();
      setMenu(null);
      alert("复制成功");
    } catch (e: any) {
      alert("复制失败: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = async (nodeId: string) => {
    setMenu(null);
    setIsLogsModalOpen(true);
    setLoadingLogs(true);
    setNodeLogs('');
    try {
      const res = await api.workflow.getNodeLogs(instanceId, nodeId);
      setNodeLogs(res.logs || '暂无日志');
    } catch (e: any) {
      setNodeLogs("获取日志失败: " + e.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleModifyNode = async (nodeId: string) => {
    setMenu(null);
    try {
      setLoading(true);
      // 1. Fetch the latest node details from backend
      const nodeDetails = await api.workflow.getNode(instanceId, nodeId);
      
      setIsEditingNode(true);
      setEditingNodeId(nodeDetails.id); // The backend ID
      
      // 2. Fetch template details to know what inputs are required
      let details;
      if (nodeDetails.node_type === 'app') {
        details = await api.workflow.getAppTemplate(nodeDetails.template_id);
      } else {
        details = await api.workflow.getJobTemplate(nodeDetails.template_id);
      }
      
      await loadPvcs();
      
      setSelectedTemplate({ id: nodeDetails.template_id, name: details.name, type: nodeDetails.node_type });
      setTemplateDetails(details);
      
      // 3. Populate config from node details
      // We merge the template's required inputs with the node's provided values
      const envVars: { name: string, value: string }[] = [];
      const volumeMounts: { mount_path: string, pvc_name: string }[] = [];

      details.containers.forEach((c: any) => {
        if (c.input_env_vars) {
          c.input_env_vars.forEach((iv: any) => {
            if (!envVars.find(e => e.name === iv.name)) {
              const existingValue = nodeDetails.env_vars?.find((ev: any) => ev.name === iv.name);
              envVars.push({ name: iv.name, value: existingValue?.value || iv.default_value || '' });
            }
          });
        }
        if (c.input_volume_mounts) {
          c.input_volume_mounts.forEach((iv: any) => {
            if (!volumeMounts.find(v => v.mount_path === iv.mount_path)) {
              const existingValue = nodeDetails.volume_mounts?.find((vm: any) => vm.mount_path === iv.mount_path);
              volumeMounts.push({ mount_path: iv.mount_path, pvc_name: existingValue?.pvc_name || '' });
            }
          });
        }
      });

      setNewNodeConfig({
        name: nodeDetails.name,
        node_id: nodeDetails.node_id,
        env_vars: envVars,
        volume_mounts: volumeMounts
      });
      
      setAddNodeStep('configure');
      setIsAddNodeModalOpen(true);
    } catch (e: any) {
      alert("获取节点详情失败: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = (nodeId?: string) => {
    const idToDelete = nodeId || selectedNode?.id;
    if (!idToDelete || !isEditMode) return;
    
    setNodes((nds) => nds.filter((n) => n.id !== idToDelete));
    setEdges((eds) => eds.filter((e) => e.source !== idToDelete && e.target !== idToDelete));
    if (selectedNode?.id === idToDelete) {
      setSelectedNode(null);
    }
  };

  if (loading && !instance) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{instance?.name}</h2>
              {instance?.status && <StatusBadge status={instance.status} />}
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">ID: {instance?.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => loadInstance()} className="p-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all" title="刷新">
            <RefreshCw size={18} />
          </button>
          
          {isEditMode ? (
            <>
              <button onClick={() => setIsEditMode(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                <Save size={16} /> 保存
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm">
              <Settings size={16} /> 编辑模式
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            nodesDraggable={isEditMode}
            nodesConnectable={isEditMode}
            elementsSelectable={true}
            deleteKeyCode={isEditMode ? 'Backspace' : null}
            fitView
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
            
            {isEditMode && (
              <Panel position="top-left" className="m-4">
                <button 
                  onClick={() => setIsAddNodeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 font-bold text-sm"
                >
                  <Plus size={16} /> 添加节点
                </button>
              </Panel>
            )}
          </ReactFlow>

          {/* Context Menu */}
          {menu && (
            <div 
              className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-2 min-w-[160px] animate-in zoom-in-95 duration-100"
              style={{ top: menu.top, left: menu.left }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">节点操作</div>
                <div className="text-xs font-bold text-slate-600 truncate max-w-[140px]">{menu.id}</div>
              </div>
              
              {isEditMode ? (
                <>
                  <button 
                    onClick={() => handleModifyNode(menu.id)}
                    className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all"
                  >
                    <Settings size={14} className="text-slate-400" /> 修改配置
                  </button>
                  <button 
                    onClick={() => handleCopyNode(menu.id)}
                    className="w-full px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all"
                  >
                    <Plus size={14} className="text-slate-400" /> 复制节点
                  </button>
                  <button 
                    onClick={() => {
                      handleDeleteNode(menu.id);
                      setMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-all"
                  >
                    <Trash2 size={14} /> 删除节点
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleViewLogs(menu.id)}
                  className="w-full px-4 py-2 text-left text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-all"
                >
                  <Terminal size={14} /> 查看日志
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar for Node Details */}
        {selectedNode && (
          <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 animate-in slide-in-from-right-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800">节点详情</h3>
              {isEditMode && (
                <button onClick={() => handleDeleteNode()} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="删除节点">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">节点名称</label>
                  <div className="mt-1 text-sm font-bold text-slate-800">{selectedNode.data.name as string}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">节点类型</label>
                  <div className="mt-1 text-sm font-bold text-slate-800 uppercase">{selectedNode.data.node_type as string}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">节点 ID</label>
                  <div className="mt-1 text-xs font-mono text-slate-600 truncate" title={selectedNode.data.node_id}>
                    {selectedNode.data.node_id as string}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">运行状态</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedNode.data.status as WorkflowStatus} />
                  </div>
                </div>
              </div>

              {/* Node Configuration (Inputs) */}
              {(selectedNode.data.input_env_vars?.length > 0 || selectedNode.data.input_volume_mounts?.length > 0) && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">节点配置 (实例化参数)</h4>
                  
                  {selectedNode.data.input_env_vars?.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">环境变量</label>
                      <div className="space-y-1.5">
                        {selectedNode.data.input_env_vars.map((ev: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-[9px] font-black text-slate-400 uppercase">{ev.name}</div>
                            <div className="text-xs font-mono text-slate-700 break-all">{ev.value || ev.default_value || '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedNode.data.input_volume_mounts?.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">存储挂载</label>
                      <div className="space-y-1.5">
                        {selectedNode.data.input_volume_mounts.map((vm: any, i: number) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-[9px] font-black text-slate-400 uppercase">路径: {vm.mount_path}</div>
                            <div className="text-xs font-bold text-slate-700">PVC: {vm.pvc_name || '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Template Details (Read-only) */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">模板详细信息</h4>
                  {loadingTemplate && <Loader2 size={12} className="animate-spin text-blue-600" />}
                </div>

                {selectedNodeTemplateDetails ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">模板名称</label>
                      <div className="mt-1 text-xs font-bold text-slate-700">{selectedNodeTemplateDetails.name}</div>
                    </div>

                    {selectedNodeTemplateDetails.containers?.map((container: any, cIdx: number) => (
                      <div key={cIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-600 uppercase">容器: {container.name}</span>
                        </div>
                        
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase">镜像</label>
                          <div className="text-[10px] font-mono text-slate-600 break-all">{container.image}</div>
                        </div>

                        {container.command && (
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase">启动命令</label>
                            <div className="text-[10px] font-mono text-slate-600 break-all bg-white p-1.5 rounded border border-slate-100">
                              {Array.isArray(container.command) ? container.command.join(' ') : container.command}
                            </div>
                          </div>
                        )}

                        {container.resources && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase">CPU 限制</label>
                              <div className="text-[10px] font-mono text-slate-600">{container.resources.limits?.cpu || '-'}</div>
                            </div>
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase">内存限制</label>
                              <div className="text-[10px] font-mono text-slate-600">{container.resources.limits?.memory || '-'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {selectedNodeTemplateDetails.service_ports?.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">服务端口</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedNodeTemplateDetails.service_ports.map((p: any, i: number) => (
                            <div key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">
                              {p.name}: {p.port} → {p.target_port}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !loadingTemplate && (
                  <div className="text-center py-4 text-slate-400 text-[10px] font-bold italic">未找到模板详情</div>
                )}
              </div>

              {!isEditMode && selectedNode.data.k8s_resource_name && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">K8S 资源名称</label>
                  <div className="mt-1 text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 break-all">
                    {selectedNode.data.k8s_resource_name as string}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Node Modal */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">
                {addNodeStep === 'select' ? '选择模板' : `配置节点: ${selectedTemplate?.name}`}
              </h3>
              {addNodeStep === 'configure' && (
                <button 
                  onClick={() => setAddNodeStep('select')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  返回选择
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {addNodeStep === 'select' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-slate-400 text-sm font-bold">暂无可用模板</div>
                  ) : (
                    templates.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => handleTemplateSelect(t)}
                        className="p-4 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-800 group-hover:text-blue-700">{t.name}</div>
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-md group-hover:bg-blue-100 group-hover:text-blue-600">
                            {t.type}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-2 truncate">{t.id}</div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">节点 ID</label>
                      <input 
                        type="text"
                        className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-mono text-sm ${isEditingNode ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        value={newNodeConfig.node_id}
                        onChange={e => !isEditingNode && setNewNodeConfig({...newNodeConfig, node_id: e.target.value})}
                        readOnly={isEditingNode}
                        placeholder="e.g. web-server-1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">显示名称</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm"
                        value={newNodeConfig.name}
                        onChange={e => setNewNodeConfig({...newNodeConfig, name: e.target.value})}
                        placeholder="e.g. 前端服务"
                      />
                    </div>
                  </div>

                  {newNodeConfig.env_vars.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">环境变量依赖</label>
                      <div className="space-y-2">
                        {newNodeConfig.env_vars.map((ev, i) => (
                          <div key={ev.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex-1">
                              <div className="text-[10px] font-black text-slate-500 uppercase">{ev.name}</div>
                              <input 
                                type="text"
                                className="w-full mt-1 bg-transparent outline-none text-sm font-bold text-slate-800"
                                value={ev.value}
                                onChange={e => {
                                  const n = [...newNodeConfig.env_vars];
                                  n[i].value = e.target.value;
                                  setNewNodeConfig({...newNodeConfig, env_vars: n});
                                }}
                                placeholder="输入变量值"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newNodeConfig.volume_mounts.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">存储挂载依赖</label>
                      <div className="space-y-2">
                        {newNodeConfig.volume_mounts.map((vm, i) => (
                          <div key={vm.mount_path} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex-1">
                              <div className="text-[10px] font-black text-slate-500 uppercase">挂载路径: {vm.mount_path}</div>
                              <select 
                                className="w-full mt-1 bg-transparent outline-none text-sm font-bold text-slate-800"
                                value={vm.pvc_name}
                                onChange={e => {
                                  const n = [...newNodeConfig.volume_mounts];
                                  n[i].pvc_name = e.target.value;
                                  setNewNodeConfig({...newNodeConfig, volume_mounts: n});
                                }}
                              >
                                <option value="">选择 PVC</option>
                                {pvcs.map(pvc => (
                                  <option key={pvc.pvc_name} value={pvc.pvc_name}>
                                    {pvc.pvc_name} ({pvc.capacity}) - {pvc.resource_name || '未关联资源'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={() => {
                  setIsAddNodeModalOpen(false);
                  setIsEditingNode(false);
                  setEditingNodeId(null);
                  setAddNodeStep('select');
                  setSelectedTemplate(null);
                  setTemplateDetails(null);
                }}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
              >
                取消
              </button>
              {addNodeStep === 'configure' && (
                <button 
                  onClick={handleCreateNode}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  确认创建
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Terminal size={20} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-white">节点日志</h3>
              </div>
              <button 
                onClick={() => setIsLogsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-black/50 rounded-2xl border border-slate-800 p-4 h-[60vh] overflow-y-auto custom-scrollbar font-mono text-sm text-slate-300 leading-relaxed">
                {loadingLogs ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <div className="text-slate-500 font-bold animate-pulse">正在获取实时日志...</div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{nodeLogs}</pre>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setIsLogsModalOpen(false)}
                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
