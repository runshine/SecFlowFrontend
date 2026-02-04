
import React, { useState, useEffect, useRef } from 'react';
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
  Database
} from 'lucide-react';
import { EnvTemplate, TemplateFile, Agent } from '../../types/types';
import { api } from '../../api/api';
import { StatusBadge } from '../../components/StatusBadge';

export const EnvTemplatePage: React.FC = () => {
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

  // Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [isSavingFile, setIsSavingFile] = useState(false);

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
    content: '' // Used for editor
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await api.environment.getTemplates();
      setTemplates(data.templates);
      setSelectedNames(new Set()); // Reset selection on reload
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
    } catch (err) {
      alert("获取模版详情失败");
    } finally {
      setLoading(false);
    }
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
    const count = selectedNames.size;
    if (!confirm(`确认删除选中的 ${count} 个模版？此操作无法撤销。`)) return;
    setLoading(true);
    try {
      await api.environment.batchDeleteTemplates(Array.from(selectedNames));
      await loadTemplates();
    } catch (err) {
      alert("批量删除部分或全部失败");
    } finally {
      setLoading(false);
    }
  };

  const openDeployModal = async () => {
    setIsDeployModalOpen(true);
    setAgentsLoading(true);
    try {
      const data = await api.environment.getAgents();
      // Filter for online agents to ensure deployment target is available
      setAvailableAgents(data.agents.filter(a => a.status === 'online'));
    } catch (err) {
      alert("获取 Agent 列表失败");
    } finally {
      setAgentsLoading(false);
    }
  };

  const executeDeploy = async (agentKey: string) => {
    setDeploying(true);
    try {
      const templatesToDeploy = Array.from(selectedNames);
      for (const name of templatesToDeploy) {
        // Deploy each template as a service with its own name
        await api.environment.deploy({
          service_name: `${name}-${Math.random().toString(36).slice(-4)}`,
          agent_key: agentKey,
          template_name: name
        });
      }
      alert(`成功提交 ${templatesToDeploy.length} 个部署任务`);
      setIsDeployModalOpen(false);
      setSelectedNames(new Set());
    } catch (err) {
      alert("部署过程中发生错误");
    } finally {
      setDeploying(false);
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
      // The API returns { content: string, ... }
      const res = await api.environment.getTemplateFileContent(selectedTemplate, path);
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

  const handleDelete = async (name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`确认删除模版 ${name}？此操作不可逆。`)) return;
    try {
      await api.environment.deleteTemplate(name);
      loadTemplates();
      if (selectedTemplate === name) setViewMode('list');
    } catch (err) {
      alert("删除失败");
    }
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

  if (viewMode === 'detail' && templateDetail) {
    return (
      <div className="p-10 space-y-8 animate-in slide-in-from-right duration-500 pb-24">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setViewMode('list')}
            className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{templateDetail.name}</h2>
              <StatusBadge status={templateDetail.type} />
            </div>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                 大小: { (templateDetail.file_size / 1024).toFixed(1) } KB
               </span>
               <span className="w-1 h-1 bg-slate-200 rounded-full" />
               <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                 更新于: {templateDetail.updated_at?.replace('T', ' ')}
               </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                  <FileJson size={18} className="text-blue-600" /> 包内资源索引
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/30 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">文件路径</th>
                      <th className="px-6 py-5">大小</th>
                      <th className="px-6 py-5">修改时间</th>
                      <th className="px-8 py-5 text-right">管理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {templateDetail.directory_files?.map((f: TemplateFile, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            {f.path.endsWith('.yaml') || f.path.endsWith('.yml') ? <FileCode size={14} className="text-blue-400" /> : <FileText size={14} className="text-slate-400" />}
                            <span className="text-sm font-bold text-slate-700">{f.path}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-slate-400">{ (f.size / 1024).toFixed(1) } KB</td>
                        <td className="px-6 py-5 text-xs text-slate-400">{ f.modified?.replace('T', ' ') }</td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex justify-end gap-2">
                             {isEditable(f.path) && (
                               <button 
                                 onClick={() => handleEditFile(f.path)}
                                 className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl transition-all"
                                 title="在线编辑"
                               >
                                 <Edit3 size={16} />
                               </button>
                             )}
                             <button className="p-2.5 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-xl transition-all" title="下载">
                               <Download size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-slate-900/40">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">模版详细描述</h4>
               <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                 "{templateDetail.description || '暂无详细说明。该模版已预置标准安全沙盒环境，支持一键分发至分布式 Agent 节点。'}"
               </p>
               <div className="pt-6 border-t border-white/10 space-y-4">
                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                    <Download size={18} /> 下载资源 artifact
                  </button>
                  <button 
                    onClick={() => handleDelete(templateDetail.name)}
                    className="w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-black hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> 彻底销毁
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Online Editor Overlay */}
        {isEditorOpen && editingFile && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#0f172a] w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95">
               <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                     <Edit3 size={20} />
                   </div>
                   <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">在线编辑资源: {editingFile.path}</h3>
                     <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Template: {selectedTemplate}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => setIsEditorOpen(false)} 
                   className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                 >
                   <X size={20} />
                 </button>
               </div>
               
               <div className="flex-1 relative group bg-black/40">
                  <Terminal size={20} className="absolute top-6 left-6 text-slate-700 z-10" />
                  <textarea 
                    className="w-full h-full pl-16 pr-8 py-8 bg-transparent border-none outline-none font-mono text-xs text-blue-100/90 leading-relaxed resize-none custom-scrollbar"
                    value={editingFile.content}
                    onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                    spellCheck={false}
                  />
               </div>

               <div className="px-10 py-6 bg-white/5 border-t border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <FileText size={14} /> {editingFile.content.length} characters
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                       <ShieldCheck size={14} /> Auto-linting active
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setIsEditorOpen(false)}
                      className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                       <Undo2 size={14} /> 放弃更改
                    </button>
                    <button 
                      onClick={handleSaveFile}
                      disabled={isSavingFile}
                      className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                       {isSavingFile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                       保存并更新 Artifact
                    </button>
                 </div>
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
          <button 
            onClick={loadTemplates}
            className="p-4 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} /> 上传新模版
          </button>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedNames.size > 0 && (
        <div className="bg-slate-900 px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                 <CheckCircle2 size={20} />
              </div>
              <span className="text-sm font-black text-white">已选中 {selectedNames.size} 个模版资源</span>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={openDeployModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all"
              >
                 <Zap size={16} /> 批量部署到 Agent
              </button>
              <button 
                onClick={handleBatchDelete}
                className="px-6 py-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500/20 transition-all"
              >
                 <Trash2 size={16} /> 批量删除
              </button>
              <button 
                onClick={() => setSelectedNames(new Set())}
                className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
              >
                 取消选择
              </button>
           </div>
        </div>
      )}

      {/* List Search & Table */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="检索模版名称、描述信息或文件类型..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6 w-16">
                   <button 
                     onClick={toggleSelectAll}
                     className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                   >
                     {selectedNames.size === filteredTemplates.length && filteredTemplates.length > 0 ? (
                       <CheckSquare size={18} className="text-blue-600" />
                     ) : (
                       <Square size={18} />
                     )}
                   </button>
                </th>
                <th className="px-4 py-6">模版名称</th>
                <th className="px-6 py-6">编排类型</th>
                <th className="px-6 py-6">模版描述</th>
                <th className="px-6 py-6">文件大小</th>
                <th className="px-6 py-6 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : filteredTemplates.map(t => (
                <tr 
                  key={t.name} 
                  onClick={() => viewDetail(t.name)}
                  className={`hover:bg-slate-50 transition-all group cursor-pointer ${selectedNames.has(t.name) ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="px-8 py-6" onClick={e => toggleSelect(t.name, e)}>
                     <button className="p-2">
                       {selectedNames.has(t.name) ? (
                         <CheckSquare size={18} className="text-blue-600" />
                       ) : (
                         <Square size={18} className="text-slate-300 hover:text-slate-400" />
                       )}
                     </button>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black transition-all group-hover:bg-blue-600 group-hover:text-white">
                        <Box size={20} />
                      </div>
                      <span className="text-sm font-black text-slate-800">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <StatusBadge status={t.type} />
                  </td>
                  <td className="px-6 py-6 text-xs text-slate-400 max-w-[200px] truncate font-medium italic">
                    {t.description || "暂无描述"}
                  </td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500 uppercase">
                    { (t.file_size / 1024).toFixed(1) } KB
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm">
                          <Download size={16} />
                       </button>
                       <button 
                         onClick={(e) => handleDelete(t.name, e)}
                         className="p-2.5 bg-red-50 border border-red-100 text-red-400 hover:text-red-600 rounded-xl transition-all shadow-sm"
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

      {/* Deploy Agent Selection Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                       <Monitor size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-800">选择目标 Agent</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          即将部署 {selectedNames.size} 个安全沙箱环境
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setIsDeployModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar">
                 {agentsLoading ? (
                    <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
                 ) : availableAgents.map(agent => (
                    <div 
                      key={agent.key}
                      onClick={() => !deploying && executeDeploy(agent.key)}
                      className={`p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition-all ${deploying ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all font-black">
                             {agent.hostname[0].toUpperCase()}
                          </div>
                          <div>
                             <p className="font-black text-slate-800">{agent.hostname}</p>
                             <p className="text-[10px] font-mono font-bold text-slate-400">{agent.ip_address}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                <Cpu size={12} /> {agent.system_info?.cpu.usage_percent}%
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mt-1">
                                <Database size={12} /> {agent.system_info?.memory.usage_percent}%
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                 ))}
                 {availableAgents.length === 0 && !agentsLoading && (
                    <div className="py-20 text-center text-slate-400 font-black uppercase text-xs">暂无在线的部署节点</div>
                 )}
              </div>

              {deploying && (
                <div className="px-10 py-6 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
                   <Loader2 className="animate-spin text-blue-600" size={18} />
                   <span className="text-xs font-black text-blue-600 uppercase tracking-widest">正在编排分布式部署任务，请勿关闭窗口...</span>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Upload Modal (Existing) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-10 pb-6 border-b border-slate-50 shrink-0">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Upload size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">上传环境模版</h3>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">创建标准化安全测试上下文</p>
                    </div>
                  </div>
                  <button onClick={() => setIsUploadModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
                    <X size={24} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
               {/* Modal Navigation */}
               <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-full">
                  <button 
                    onClick={() => setUploadTab('file')}
                    className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase transition-all flex items-center justify-center gap-2 ${uploadTab === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileArchive size={16} /> 文件上传 (.zip / .yaml)
                  </button>
                  <button 
                    onClick={() => setUploadTab('editor')}
                    className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase transition-all flex items-center justify-center gap-2 ${uploadTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Code size={16} /> 在线 YAML 编辑器
                  </button>
               </div>

               {uploadError && (
                 <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-black flex items-center gap-3 uppercase animate-in shake">
                   <AlertTriangle size={16} /> {uploadError}
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">模版名称 *</label>
                    <input 
                      required
                      placeholder="例如: nginx-waf-cluster"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">模版类型</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all appearance-none"
                      value={newTemplate.type}
                      onChange={e => setNewTemplate({...newTemplate, type: e.target.value as any})}
                    >
                      <option value="yaml">Single YAML</option>
                      <option value="archive">Standard Archive (ZIP)</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">模版详细描述</label>
                  <textarea 
                    rows={2}
                    placeholder="简述该模版的适用场景及内置组件..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold text-slate-800 transition-all resize-none"
                    value={newTemplate.description}
                    onChange={e => setNewTemplate({...newTemplate, description: e.target.value})}
                  />
               </div>

               {uploadTab === 'file' ? (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all group"
                 >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".zip,.yaml,.yml" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file && !newTemplate.name) {
                          setNewTemplate(prev => ({ ...prev, name: file.name.split('.')[0] }));
                       }
                    }} />
                    <Upload size={48} className="text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-4" />
                    <p className="text-sm font-black text-slate-600">点击或拖拽文件至此处上传</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">支持 .ZIP 或 .YAML (MAX 50MB)</p>
                    {fileInputRef.current?.files?.[0] && (
                       <div className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                         <FileText size={12} /> {fileInputRef.current.files[0].name}
                       </div>
                    )}
                 </div>
               ) : (
                 <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                       <span>YAML 定义代码</span>
                       <span className="text-blue-500 lowercase font-mono">schema: environment/v1</span>
                    </label>
                    <div className="relative group flex-1">
                       <Terminal size={20} className="absolute top-4 left-4 text-slate-700 z-10" />
                       <textarea 
                         rows={10}
                         placeholder="# Paste your environment YAML configuration here..."
                         className="w-full pl-12 pr-6 py-6 bg-slate-900 rounded-[2rem] border-none outline-none focus:ring-8 ring-blue-500/5 font-mono text-xs text-blue-100 transition-all resize-none min-h-[300px]"
                         value={newTemplate.content}
                         onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                       />
                    </div>
                 </div>
               )}
            </div>

            <div className="p-10 pt-6 border-t border-slate-50 shrink-0 bg-slate-50/50 flex gap-4">
              <button 
                type="button"
                onClick={() => { setIsUploadModalOpen(false); resetUploadForm(); }}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95"
              >
                取消
              </button>
              <button 
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                确认并创建模版
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
