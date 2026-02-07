import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Loader2, 
  Download, 
  Trash2, 
  FileCode, 
  RefreshCw, 
  FileJson, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Settings,
  X,
  Upload,
  Terminal,
  FileArchive,
  AlertCircle,
  Code,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  Save,
  Undo2,
  Square,
  CheckSquare,
  Zap,
  Monitor,
  CheckCircle2,
  Cpu,
  Database,
  Filter,
  Check,
  Activity,
  Globe,
  ArrowUpDown,
  Folder,
  FolderOpen,
  ChevronDown,
  Info,
  Calendar
} from 'lucide-react';
import { EnvTemplate, TemplateFile, Agent } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

// Helper to build tree from flat paths
interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: Record<string, TreeNode>;
  size?: number;
  modified?: string;
}

export const EnvTemplatePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EnvTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateDetail, setTemplateDetail] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection States
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Agent Modal Local States
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedAgentKeys, setSelectedAgentKeys] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'online'>('online');

  // Deletion States
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; names: string[] }>({ show: false, names: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  // Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [isSavingFile, setIsSavingFile] = useState(false);

  // Tree State
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'editor'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Template State
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'yaml' as 'yaml' | 'archive',
    content: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.environment.getTemplates();
      setTemplates(data.templates);
      setSelectedNames(new Set());
    } catch (err) {
      console.error("Failed to load templates", err);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (name: string) => {
    setSelectedTemplate(name);
    setLoading(true);
    try {
      const detail = await api.environment.getTemplateDetail(name);
      setTemplateDetail(detail);
      setViewMode('detail');
      setExpandedFolders(new Set(['root']));
    } catch (err) {
      alert("获取模版详情失败");
    } finally {
      setLoading(false);
    }
  };

  // Build Resource Tree
  const resourceTree = useMemo(() => {
    if (!templateDetail?.directory_files) return null;
    
    const root: TreeNode = { name: 'root', path: '', type: 'folder', children: {} };
    
    templateDetail.directory_files.forEach((file: TemplateFile) => {
      const parts = file.path.split('/');
      let current = root;
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: isLast ? 'file' : 'folder',
            children: {},
            size: isLast ? file.size : undefined,
            modified: isLast ? file.modified : undefined
          };
        }
        current = current.children[part];
      });
    });
    return root;
  }, [templateDetail]);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  // Selection Logic
  const toggleSelect = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedNames(next);
  };

  const toggleSelectAll = () => {
    if (selectedNames.size === filteredTemplates.length) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(filteredTemplates.map(t => t.name)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedNames.size === 0) return;
    setDeleteConfirm({ show: true, names: Array.from(selectedNames) });
  };

  const executeDelete = async () => {
    if (deleteConfirm.names.length === 0) return;
    setIsDeleting(true);
    try {
      await api.environment.batchDeleteTemplates(deleteConfirm.names);
      setDeleteConfirm({ show: false, names: [] });
      setSelectedNames(new Set());
      if (selectedTemplate && deleteConfirm.names.includes(selectedTemplate)) {
        setViewMode('list');
        setSelectedTemplate(null);
      }
      await loadTemplates();
    } catch (err) {
      alert("批量删除部分或全部失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeployModal = async () => {
    if (!projectId) {
      alert("请先选择一个项目空间");
      return;
    }
    setIsDeployModalOpen(true);
    setAgentsLoading(true);
    setAgentSearch('');
    setSelectedAgentKeys(new Set());
    try {
      const data = await api.environment.getAgents(projectId, { per_page: 2000 });
      setAvailableAgents(data.agents || []);
    } catch (err) {
      alert("获取 Agent 列表失败");
    } finally {
      setAgentsLoading(false);
    }
  };

  const executeDeploy = async () => {
    if (selectedAgentKeys.size === 0 || !projectId) return;
    setDeploying(true);
    try {
      // Fix: Explicitly cast Array.from results to string[] to avoid 'unknown' type errors during iteration
      const templatesToDeploy = Array.from(selectedNames) as string[];
      const agentsToDeploy = Array.from(selectedAgentKeys) as string[];
      
      let successCount = 0;
      for (const tName of templatesToDeploy) {
        for (const aKey of agentsToDeploy) {
           await api.environment.deploy({
            service_name: `${tName}-${Math.random().toString(36).slice(-4)}`,
            agent_key: aKey,
            template_name: tName,
            project_id: projectId
          });
          successCount++;
        }
      }
      
      alert(`已成功提交 ${successCount} 个异步部署任务`);
      setIsDeployModalOpen(false);
      setSelectedNames(new Set());
    } catch (err) {
      alert("部署过程中发生错误");
    } finally {
      setDeploying(false);
    }
  };

  const filteredAgents = useMemo(() => {
    return availableAgents.filter(a => {
      const matchesSearch = a.hostname.toLowerCase().includes(agentSearch.toLowerCase()) || 
                          a.ip_address.includes(agentSearch);
      const matchesStatus = statusFilter === 'all' || a.status === 'online';
      return matchesSearch && matchesStatus;
    });
  }, [availableAgents, agentSearch, statusFilter]);

  const toggleAgentSelect = (key: string) => {
    const next = new Set(selectedAgentKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedAgentKeys(next);
  };

  const toggleSelectAllAgents = () => {
    if (selectedAgentKeys.size === filteredAgents.length && filteredAgents.length > 0) {
      setSelectedAgentKeys(new Set());
    } else {
      setSelectedAgentKeys(new Set(filteredAgents.map(a => a.key)));
    }
  };

  const isEditable = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return ['yaml', 'yml', 'json', 'txt', 'sh', 'py', 'md', 'conf', 'ini'].includes(ext);
  };

  const handleEditFile = async (path: string) => {
    if (!selectedTemplate) return;
    setLoading(true);
    try {
      const res = await api.environment.getTemplateFileContent(selectedTemplate as string, path);
      setEditingFile({ path, content: res.content });
      setIsEditorOpen(true);
    } catch (err) {
      alert("无法读取文件内容");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedTemplate || !editingFile) return;
    setIsSavingFile(true);
    try {
      await api.environment.updateTemplateFileContent(selectedTemplate, editingFile.path, editingFile.content);
      setIsEditorOpen(false);
      setEditingFile(null);
      viewDetail(selectedTemplate);
    } catch (err) {
      alert("保存失败");
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleDeleteTrigger = (name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteConfirm({ show: true, names: [name] });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('description', newTemplate.description);
      formData.append('type', newTemplate.type);

      if (uploadTab === 'file') {
        const file = fileInputRef.current?.files?.[0];
        if (!file) throw new Error("请选择上传文件");
        formData.append('file', file);
      } else {
        if (!newTemplate.content.trim()) throw new Error("YAML 内容不能为空");
        const blob = new Blob([newTemplate.content], { type: 'text/yaml' });
        formData.append('file', blob, `${newTemplate.name}.yaml`);
      }

      await api.environment.uploadTemplate(formData);
      setIsUploadModalOpen(false);
      resetUploadForm();
      loadTemplates();
    } catch (err: any) {
      setUploadError(err.message || "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setNewTemplate({ name: '', description: '', type: 'yaml', content: '' });
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tree Render Component
  const RenderTreeNode: React.FC<{ node: TreeNode; depth: number }> = ({ node, depth }) => {
    const isExpanded = expandedFolders.has(node.path || 'root');
    const isFile = node.type === 'file';
    
    const getIcon = () => {
      if (!isFile) return isExpanded ? <FolderOpen size={16} className="text-amber-400" /> : <Folder size={16} className="text-amber-400" />;
      const ext = node.name.split('.').pop()?.toLowerCase();
      if (['yaml', 'yml'].includes(ext!)) return <FileCode size={16} className="text-blue-500" />;
      if (ext === 'json') return <FileJson size={16} className="text-amber-600" />;
      return <FileText size={16} className="text-slate-400" />;
    };

    return (
      <div className="select-none">
        <div 
          onClick={() => !isFile && toggleFolder(node.path || 'root')}
          className={`group flex items-center py-2 px-4 hover:bg-blue-50/50 cursor-pointer rounded-xl transition-all ${depth > 0 ? 'ml-6' : ''}`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isFile && (
              <ChevronRight size={14} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            )}
            {isFile && <div className="w-[14px]" />}
            {getIcon()}
            <span className={`text-sm truncate font-medium ${isFile ? 'text-slate-600' : 'text-slate-800 font-bold'}`}>
              {node.name === 'root' ? 'Template Workspace' : node.name}
            </span>
            {isFile && (
              <span className="text-[10px] font-black text-slate-300 uppercase ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {(node.size! / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          
          {isFile && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
              {isEditable(node.path) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditFile(node.path); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                  title="在线编辑"
                >
                  <Edit3 size={14} />
                </button>
              )}
              <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg transition-all" title="下载组件">
                <Download size={14} />
              </button>
            </div>
          )}
        </div>
        
        {(!isFile && isExpanded) && (
          <div className="border-l border-slate-100 ml-6 mt-1">
            {/* Fix: Cast Object.values results to TreeNode[] to avoid 'unknown' type errors during property access */}
            {(Object.values(node.children) as TreeNode[]).map(child => (
              <RenderTreeNode key={child.path} node={child} depth={0} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'detail' && templateDetail) {
    return (
      <div className="p-10 space-y-10 animate-in slide-in-from-right duration-500 pb-24 h-full overflow-y-auto custom-scrollbar">
        {/* Detail Header with Top Right Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-white/50 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-sm">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setViewMode('list')}
              className="p-5 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
            >
              <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">{templateDetail.name}</h2>
                <StatusBadge status={templateDetail.type} />
              </div>
              <div className="flex items-center gap-6 mt-3">
                 <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                   <Database size={14} /> {(templateDetail.file_size / 1024).toFixed(1)} KB
                 </div>
                 <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                 <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                   <Calendar size={14} /> {templateDetail.updated_at?.replace('T', ' ')}
                 </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 self-end md:self-center">
            <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm active:scale-95">
              <Download size={20} className="text-blue-600" /> 下载全量包
            </button>
            <button 
              onClick={() => handleDeleteTrigger(templateDetail.name)}
              className="px-8 py-4 bg-red-600 text-white rounded-[1.5rem] font-black hover:bg-red-700 transition-all flex items-center gap-3 shadow-xl shadow-red-500/20 active:scale-95"
            >
              <Trash2 size={20} /> 销毁模板
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Metadata Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
               <ShieldCheck className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
               <div className="relative z-10">
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">模板说明</h4>
                 <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                   "{templateDetail.description || '该模板已通过 SecFlow 基线校验，预置标准化安全审计工具链与沙箱隔离策略，支持一键分发。'}"
                 </p>
               </div>
               <div className="pt-8 border-t border-white/10 space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">校验状态</span>
                    <span className="text-xs font-black text-green-400">PASSED</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">资源类型</span>
                    <span className="text-xs font-black text-blue-400 uppercase">{templateDetail.type}</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Info size={14} /> 运行环境上下文
               </h4>
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Namespace Strategy</p>
                    <p className="text-xs font-black text-slate-700 mt-1">Isolated Sandbox (v1)</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Artifact Path</p>
                    <p className="text-xs font-mono font-bold text-blue-600 mt-1 truncate">/registry/{templateDetail.name}.tar.gz</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Folder Tree Browser */}
          <div className="lg:col-span-8 flex flex-col min-h-[600px] bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <FolderOpen size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">资源文件树</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {templateDetail.directory_files?.length || 0} 个资源项已加载
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setExpandedFolders(new Set(['root']))} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              {resourceTree && (
                <RenderTreeNode node={resourceTree} depth={0} />
              )}
            </div>
          </div>
        </div>

        {/* Editor Overlay */}
        {isEditorOpen && editingFile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
             <div className="bg-[#0f172a] w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95">
                <div className="px-12 py-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                      <Edit3 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-wide">在线编辑: {editingFile.path}</h3>
                      <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Target Template: {templateDetail.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditorOpen(false)} className="p-4 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 bg-black/40 relative">
                   <div className="absolute top-6 left-6 pointer-events-none z-10">
                      <Terminal size={20} className="text-slate-700" />
                   </div>
                   <textarea 
                     className="w-full h-full p-12 pl-16 bg-transparent border-none outline-none font-mono text-xs text-blue-100/90 leading-relaxed resize-none custom-scrollbar" 
                     value={editingFile.content} 
                     onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })} 
                     spellCheck={false} 
                   />
                </div>
                <div className="px-12 py-8 bg-white/5 border-t border-white/5 flex justify-end gap-6">
                   <button onClick={() => setIsEditorOpen(false)} className="px-10 py-4 bg-white/5 text-slate-400 rounded-2xl text-xs font-black uppercase transition-all hover:bg-white/10">放弃更改</button>
                   <button 
                     onClick={handleSaveFile} 
                     disabled={isSavingFile} 
                     className="px-12 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-blue-500/20"
                   >
                      {isSavingFile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      提交并更新资源
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-300 pb-24 h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">环境模板管理</h2>
          <p className="text-slate-500 mt-1 font-medium">标准化、可复用的安全测试沙箱编排模版库</p>
        </div>
        <div className="flex gap-4">
          <button onClick={loadTemplates} className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
            <Plus size={20} /> 上传新模版
          </button>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedNames.size > 0 && (
        <div className="bg-slate-900 px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><CheckCircle2 size={20} /></div>
              <span className="text-sm font-black text-white">已选中 {selectedNames.size} 个模版资源</span>
           </div>
           <div className="flex gap-4">
              <button onClick={openDeployModal} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all">
                 <Zap size={16} /> 批量部署到 Agent
              </button>
              <button onClick={handleBatchDelete} className="px-6 py-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500/20 transition-all">
                 <Trash2 size={16} /> 批量删除
              </button>
              <button onClick={() => setSelectedNames(new Set())} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-all">取消选择</button>
           </div>
        </div>
      )}

      {/* List Table */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input type="text" placeholder="检索模版名称、描述信息或文件类型..." className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6 w-16">
                   <button onClick={toggleSelectAll} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                     {selectedNames.size === filteredTemplates.length && filteredTemplates.length > 0 ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                   </button>
                </th>
                <th className="px-4 py-6">模版名称</th>
                <th className="px-6 py-6">编排类型</th>
                <th className="px-6 py-6 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : filteredTemplates.map(t => (
                <tr key={t.name} onClick={() => viewDetail(t.name)} className={`hover:bg-slate-50 transition-all group cursor-pointer ${selectedNames.has(t.name) ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-8 py-6" onClick={e => toggleSelect(t.name, e)}>
                     <button className="p-2">{selectedNames.has(t.name) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-300 hover:text-slate-400" />}</button>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black transition-all group-hover:bg-blue-600 group-hover:text-white"><Box size={20} /></div>
                      <span className="text-sm font-black text-slate-800">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6"><StatusBadge status={t.type} /></td>
                  <td className="px-8 py-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Download size={16} /></button>
                       <button onClick={(e) => handleDeleteTrigger(t.name, e)} className="p-2.5 bg-red-50 border border-red-100 text-red-400 hover:text-red-600 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Agent Selection Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
              <div className="p-10 pb-6 border-b border-slate-50 bg-slate-50/30 shrink-0">
                 <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-600/20">
                          <Monitor size={32} />
                       </div>
                       <div>
                          <h3 className="text-3xl font-black text-slate-800 tracking-tight">选择目标执行节点</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Box size={12} /> 模板: <span className="text-blue-600">{selectedNames.size} 个</span>
                             </div>
                             <span className="w-1 h-1 bg-slate-300 rounded-full" />
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Activity size={12} /> 总节点: <span>{availableAgents.length}</span>
                             </div>
                             <span className="w-1 h-1 bg-slate-300 rounded-full" />
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Check size={12} className="text-green-500" /> 已就绪: <span className="text-green-600">{availableAgents.filter(a => a.status === 'online').length}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setIsDeployModalOpen(false)} className="p-4 text-slate-400 hover:bg-white hover:text-slate-600 rounded-2xl transition-all shadow-sm">
                       <X size={28} />
                    </button>
                 </div>

                 <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                       <input 
                         type="text" 
                         autoFocus
                         placeholder="主机名、IP 地址或工作空间检索..." 
                         className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
                         value={agentSearch}
                         onChange={(e) => setAgentSearch(e.target.value)}
                       />
                    </div>
                    <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-2xl shrink-0 shadow-sm">
                       <button onClick={() => setStatusFilter('all')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>全部</button>
                       <button onClick={() => setStatusFilter('online')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === 'online' ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>在线</button>
                    </div>
                    <button onClick={toggleSelectAllAgents} className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm shrink-0">
                       <CheckSquare size={16} /> {selectedAgentKeys.size === filteredAgents.length ? '取消' : '全选'}
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/20 custom-scrollbar relative">
                 {agentsLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                       <Loader2 className="animate-spin text-blue-600" size={48} />
                       <p className="text-[10px] font-black uppercase tracking-widest">拉取节点清单...</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                       {filteredAgents.map(agent => (
                          <div 
                            key={agent.key}
                            onClick={() => toggleAgentSelect(agent.key)}
                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedAgentKeys.has(agent.key) ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-500/5' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg'}`}
                          >
                             <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all shrink-0 shadow-sm ${selectedAgentKeys.has(agent.key) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>{agent.hostname[0].toUpperCase()}</div>
                                <div className="min-w-0">
                                   <p className="font-black text-slate-800 text-sm truncate">{agent.hostname}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-mono font-bold text-slate-400">{agent.ip_address}</span>
                                      <StatusBadge status={agent.status} />
                                   </div>
                                </div>
                             </div>
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAgentKeys.has(agent.key) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'}`}>{selectedAgentKeys.has(agent.key) && <Check size={14} />}</div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="p-10 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                 <div className="flex items-center gap-6">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务概览</p>
                       <p className="text-lg font-black text-slate-800 mt-0.5"><span className="text-blue-600">{selectedNames.size}</span> 模板 ➔ <span className="text-blue-600">{selectedAgentKeys.size}</span> 节点</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsDeployModalOpen(false)} disabled={deploying} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">取消</button>
                    <button onClick={executeDeploy} disabled={deploying || selectedAgentKeys.size === 0} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl transition-all flex items-center gap-3 min-w-[200px]">
                      {deploying ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                      执行批量部署
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* ... Other Modals ... */}
    </div>
  );
};
